/**
 * Non-blocking OmniCashier fiscalization for CASH + CARD Payments (sale + money_back).
 * Never throws to callers in a way that should roll back Inflero payments — callers
 * should still catch and toast. Returns a result describing skip / ok / failed.
 */

import type { PosOrderDetail, PosOrderPaymentRow, SalesReturnDetail } from "../../api/sales";
import { patchPaymentFiscal, type PaymentFiscalPatchBody } from "../../api/sales";
import {
  isOmnicashierConfigured,
  loadOmnicashierSettings,
  needsOmniLanBridge,
  probeOmniLanBridge,
  type OmnicashierSettings,
} from "../omnicashierSettings";
import { notifyWarning } from "../toast";
import {
  OmnicashierError,
  omniCreateSale,
  omniGetLastDocument,
  omniMoneyBack,
  type OmnicashierFiscalResult,
} from "./client";
import { mapCardReturnToOmni } from "./mapCardReturn";
import { mapCardSaleToOmni } from "./mapCardSale";
import { ensureOmnicashierSession, rememberLastDocNumber } from "./session";

export type FiscalizeOutcome =
  | { status: "skipped"; reason: string }
  | { status: "ok"; paymentId: string; fiscal: OmnicashierFiscalResult }
  | { status: "failed"; paymentId: string; error: string };

const CARD_METHODS = new Set(["CARD", "CREDIT_CARD", "DEBIT_CARD"]);
const FISCAL_METHODS = new Set(["CASH", "CARD", "CREDIT_CARD", "DEBIT_CARD"]);

/** In-tab mutex — blocks double-click / parallel retries on the same payment. */
const inFlightFiscal = new Set<string>();

export function isCardPaymentMethod(method: string | null | undefined): boolean {
  return method != null && CARD_METHODS.has(method);
}

export function isCashPaymentMethod(method: string | null | undefined): boolean {
  return method === "CASH";
}

/** Payments that OmniCashier fiscalizes (CASH + CARD family). */
export function isOmniFiscalPaymentMethod(method: string | null | undefined): boolean {
  return method != null && FISCAL_METHODS.has(method);
}

export function omniTenderForMethod(method: string | null | undefined): "CASH" | "CARD" {
  return method === "CASH" ? "CASH" : "CARD";
}

export function findUnfiscalizedOmniPayments(
  payments: PosOrderPaymentRow[] | undefined,
): PosOrderPaymentRow[] {
  return (payments ?? []).filter(
    (p) =>
      isOmniFiscalPaymentMethod(p.method) &&
      p.fiscalStatus !== "OK" &&
      Number(p.allocatedAmount) > 0,
  );
}

/** @deprecated alias — includes CASH now via findUnfiscalizedOmniPayments */
export function findUnfiscalizedCardPayments(
  payments: PosOrderPaymentRow[] | undefined,
): PosOrderPaymentRow[] {
  return findUnfiscalizedOmniPayments(payments);
}

export function findParentFiscalFromOrderPayments(
  payments: PosOrderPaymentRow[] | undefined,
  preferredMethod?: string | null,
): { longId: string; shortId: string; documentNumber: string | number } | null {
  const ok = (payments ?? []).filter(
    (p) =>
      isOmniFiscalPaymentMethod(p.method) &&
      p.fiscalStatus === "OK" &&
      p.fiscalLongId &&
      p.fiscalShortId &&
      p.fiscalDocumentNumber != null,
  );
  if (ok.length === 0) return null;
  const preferred =
    preferredMethod != null
      ? ok.find((p) => p.method === preferredMethod) ??
        (preferredMethod === "CASH"
          ? ok.find((p) => isCashPaymentMethod(p.method))
          : ok.find((p) => isCardPaymentMethod(p.method)))
      : undefined;
  const first = preferred ?? ok[0]!;
  return {
    longId: first.fiscalLongId!,
    shortId: first.fiscalShortId!,
    documentNumber: first.fiscalDocumentNumber!,
  };
}

async function persistFiscal(
  paymentId: string,
  body: PaymentFiscalPatchBody,
): Promise<Awaited<ReturnType<typeof patchPaymentFiscal>>> {
  return patchPaymentFiscal(paymentId, body);
}

function fiscalToPatch(
  status: "OK" | "FAILED" | "PENDING",
  fiscal?: OmnicashierFiscalResult,
  error?: string,
  claim?: { claim: true; forceClaim?: boolean },
): PaymentFiscalPatchBody {
  return {
    fiscalStatus: status,
    fiscalLongId: fiscal?.long_id ?? null,
    fiscalShortId: fiscal?.short_id ?? null,
    fiscalDocumentNumber:
      fiscal?.document_number != null ? String(fiscal.document_number) : null,
    fiscalShiftDocNumber:
      fiscal?.shift_document_number != null ? String(fiscal.shift_document_number) : null,
    fiscalError: error ?? null,
    ...(claim ?? {}),
  };
}

/**
 * Soft ops check — only when production HTTPS needs the LAN bridge.
 * Direct / Vite-proxy setups are unchanged (no extra probes).
 */
async function softBridgePreflight(
  settings: OmnicashierSettings,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!needsOmniLanBridge(settings)) return { ok: true };
  const probe = await probeOmniLanBridge();
  if (probe.ok) return { ok: true };
  return { ok: false, reason: probe.detail };
}

/**
 * Timeout recovery: only accept last device document when it looks like *our*
 * sale advanced the counter (document_number > prev we sent). Never attach an
 * unrelated prior slip.
 */
async function recoverSaleAfterTimeout(
  token: string,
  settings: OmnicashierSettings,
  prevDocNumber: number | null | undefined,
  intRef: string,
): Promise<OmnicashierFiscalResult | null> {
  const last = await omniGetLastDocument(token, settings);
  if (!last.long_id) return null;
  const prev = prevDocNumber != null && Number.isFinite(Number(prevDocNumber)) ? Number(prevDocNumber) : null;
  if (prev != null && last.document_number > prev) {
    return last;
  }
  // Some firmwares echo int_ref on get-last — accept only exact match.
  if (last.int_ref && last.int_ref === intRef) {
    return last;
  }
  return null;
}

/**
 * Fiscalize one CASH/CARD payment on a POS order (sale). Idempotent if already OK.
 */
export async function fiscalizeCardSalePayment(
  order: PosOrderDetail,
  payment: PosOrderPaymentRow,
  opts?: { silentSkip?: boolean; forceClaim?: boolean },
): Promise<FiscalizeOutcome> {
  const settings = loadOmnicashierSettings();
  if (!isOmnicashierConfigured(settings)) {
    return { status: "skipped", reason: "OmniCashier disabled or not configured" };
  }
  if (!isOmniFiscalPaymentMethod(payment.method)) {
    return { status: "skipped", reason: "Not a CASH/CARD payment" };
  }
  if (payment.fiscalStatus === "OK" && payment.fiscalLongId) {
    return {
      status: "ok",
      paymentId: payment.paymentId,
      fiscal: {
        long_id: payment.fiscalLongId,
        short_id: payment.fiscalShortId ?? "",
        document_number: Number(payment.fiscalDocumentNumber ?? 0),
        shift_document_number: Number(payment.fiscalShiftDocNumber ?? 0),
      },
    };
  }

  const amount = Number(payment.allocatedAmount);
  if (!(amount > 0)) {
    return { status: "skipped", reason: "Zero payment amount" };
  }

  if (inFlightFiscal.has(payment.paymentId)) {
    return { status: "skipped", reason: "Fiscalization already in progress" };
  }
  inFlightFiscal.add(payment.paymentId);

  try {
    const bridge = await softBridgePreflight(settings);
    if (!bridge.ok) {
      if (!opts?.silentSkip) notifyWarning(bridge.reason.slice(0, 160));
      return { status: "skipped", reason: bridge.reason };
    }

    // Atomic claim — prevents two cashiers printing the same payment.
    try {
      const claimed = await persistFiscal(
        payment.paymentId,
        fiscalToPatch("PENDING", undefined, undefined, {
          claim: true,
          forceClaim: opts?.forceClaim === true,
        }),
      );
      if (claimed.claimed === false) {
        if (claimed.fiscalStatus === "OK" && claimed.fiscalLongId) {
          return {
            status: "ok",
            paymentId: payment.paymentId,
            fiscal: {
              long_id: claimed.fiscalLongId,
              short_id: claimed.fiscalShortId ?? "",
              document_number: Number(claimed.fiscalDocumentNumber ?? 0),
              shift_document_number: Number(claimed.fiscalShiftDocNumber ?? 0),
            },
          };
        }
        return {
          status: "skipped",
          reason: claimed.claimReason === "in_progress"
            ? "Fiscalization already in progress"
            : "Could not claim payment for fiscalization",
        };
      }
    } catch {
      // Older backend without claim support — fall back to plain PENDING (existing behavior).
      try {
        await persistFiscal(payment.paymentId, fiscalToPatch("PENDING"));
      } catch {
        // continue — device call still useful
      }
    }

    try {
      const { token, prevDocNumber } = await ensureOmnicashierSession(settings);
      const intRef = `${order.id}:${payment.paymentId}`;
      const mapped = mapCardSaleToOmni({
        paymentAmount: amount,
        orderGrandTotal: Number(order.grandTotal),
        orderDiscount: order.discount != null ? Number(order.discount) : null,
        shipping: order.shipping != null ? Number(order.shipping) : null,
        serviceFee: order.serviceFee != null ? Number(order.serviceFee) : null,
        hourlyCharge: order.tableHourlyCharge != null ? Number(order.tableHourlyCharge) : null,
        items: (order.items ?? [])
          .filter((it) => it.isLoyaltyFree !== true && Number(it.price) > 0 && Number(it.quantity) > 0)
          .map((it) => ({
            productName: it.productName,
            sku: it.sku,
            quantity: it.quantity,
            price: it.price,
          })),
        cashier: order.billerName || "Cashier",
        defaultVatPercent: settings.defaultVatPercent,
        orderTaxPercent: order.taxPercent != null ? Number(order.taxPercent) : null,
        intRef,
        prevDocNumber,
        tender: omniTenderForMethod(payment.method),
      });

      let fiscal: OmnicashierFiscalResult;
      try {
        fiscal = await omniCreateSale(
          token,
          {
            int_ref: mapped.int_ref,
            prev_doc_number: mapped.prev_doc_number,
            data: mapped.data,
          },
          settings,
        );
      } catch (err) {
        if (err instanceof OmnicashierError && (err.code === -2 || err.code === -3)) {
          try {
            const recovered = await recoverSaleAfterTimeout(
              token,
              settings,
              prevDocNumber,
              intRef,
            );
            if (recovered) {
              fiscal = recovered;
            } else {
              throw err;
            }
          } catch {
            throw err;
          }
        } else if (err instanceof OmnicashierError && err.code === 401) {
          const { token: t2, prevDocNumber: p2 } = await ensureOmnicashierSession(settings);
          const mapped2 = { ...mapped, prev_doc_number: p2 ?? mapped.prev_doc_number };
          fiscal = await omniCreateSale(
            t2,
            {
              int_ref: mapped2.int_ref,
              prev_doc_number: mapped2.prev_doc_number,
              data: mapped2.data,
            },
            settings,
          );
        } else {
          throw err;
        }
      }

      if (fiscal.document_number) rememberLastDocNumber(fiscal.document_number);
      await persistFiscal(payment.paymentId, fiscalToPatch("OK", fiscal));
      return { status: "ok", paymentId: payment.paymentId, fiscal };
    } catch (err) {
      const message =
        err instanceof OmnicashierError
          ? `${err.message}${err.code ? ` (${err.code})` : ""}`
          : err instanceof Error
            ? err.message
            : String(err);
      try {
        await persistFiscal(payment.paymentId, fiscalToPatch("FAILED", undefined, message.slice(0, 500)));
      } catch {
        // ignore
      }
      if (!opts?.silentSkip) {
        notifyWarning(
          message.slice(0, 160) || "OmniCashier fiscalization failed — payment kept in Inflero",
        );
      }
      return { status: "failed", paymentId: payment.paymentId, error: message };
    }
  } finally {
    inFlightFiscal.delete(payment.paymentId);
  }
}

/**
 * After order detail is returned from checkout/payment — fiscalize pending CASH/CARD payments.
 */
export async function fiscalizeCardPaymentsOnOrder(
  order: PosOrderDetail,
): Promise<FiscalizeOutcome[]> {
  if (!isOmnicashierConfigured()) return [{ status: "skipped", reason: "disabled" }];
  const pending = findUnfiscalizedOmniPayments(order.payments);
  const out: FiscalizeOutcome[] = [];
  for (const p of pending) {
    out.push(await fiscalizeCardSalePayment(order, p));
  }
  return out;
}

/**
 * Fiscalize CASH/CARD refund payment on a sales return (money_back).
 */
export async function fiscalizeCardReturnPayment(
  ret: SalesReturnDetail,
  payment: PosOrderPaymentRow,
  parentOrderPayments: PosOrderPaymentRow[] | undefined,
  opts?: {
    silentSkip?: boolean;
    /** Sales-return total (not parent POS grandTotal). */
    orderGrandTotal?: number | null;
    orderTaxPercent?: number | null;
    forceClaim?: boolean;
  },
): Promise<FiscalizeOutcome> {
  const settings = loadOmnicashierSettings();
  if (!isOmnicashierConfigured(settings)) {
    return { status: "skipped", reason: "OmniCashier disabled or not configured" };
  }
  if (!isOmniFiscalPaymentMethod(payment.method)) {
    return { status: "skipped", reason: "Not a CASH/CARD refund" };
  }
  if (payment.fiscalStatus === "OK" && payment.fiscalLongId) {
    return {
      status: "ok",
      paymentId: payment.paymentId,
      fiscal: {
        long_id: payment.fiscalLongId,
        short_id: payment.fiscalShortId ?? "",
        document_number: Number(payment.fiscalDocumentNumber ?? 0),
        shift_document_number: Number(payment.fiscalShiftDocNumber ?? 0),
      },
    };
  }

  const parent = findParentFiscalFromOrderPayments(parentOrderPayments, payment.method);
  if (!parent) {
    const reason =
      "Parent order has no fiscalized CASH/CARD sale — skipping OmniCashier money back";
    if (!opts?.silentSkip) notifyWarning(reason);
    return { status: "skipped", reason };
  }

  const amount = Number(payment.allocatedAmount);
  if (!(amount > 0)) {
    return { status: "skipped", reason: "Zero refund amount" };
  }

  if (inFlightFiscal.has(payment.paymentId)) {
    return { status: "skipped", reason: "Fiscalization already in progress" };
  }
  inFlightFiscal.add(payment.paymentId);

  try {
    const bridge = await softBridgePreflight(settings);
    if (!bridge.ok) {
      if (!opts?.silentSkip) notifyWarning(bridge.reason.slice(0, 160));
      return { status: "skipped", reason: bridge.reason };
    }

    try {
      const claimed = await persistFiscal(
        payment.paymentId,
        fiscalToPatch("PENDING", undefined, undefined, {
          claim: true,
          forceClaim: opts?.forceClaim === true,
        }),
      );
      if (claimed.claimed === false) {
        if (claimed.fiscalStatus === "OK" && claimed.fiscalLongId) {
          return {
            status: "ok",
            paymentId: payment.paymentId,
            fiscal: {
              long_id: claimed.fiscalLongId,
              short_id: claimed.fiscalShortId ?? "",
              document_number: Number(claimed.fiscalDocumentNumber ?? 0),
              shift_document_number: Number(claimed.fiscalShiftDocNumber ?? 0),
            },
          };
        }
        return {
          status: "skipped",
          reason: claimed.claimReason === "in_progress"
            ? "Fiscalization already in progress"
            : "Could not claim payment for fiscalization",
        };
      }
    } catch {
      try {
        await persistFiscal(payment.paymentId, fiscalToPatch("PENDING"));
      } catch {
        // continue
      }
    }

    try {
      const { token, prevDocNumber } = await ensureOmnicashierSession(settings);
      const mapped = mapCardReturnToOmni({
        refundAmount: amount,
        items: (ret.items ?? [])
          .filter((it) => Number(it.quantity) > 0 && Number(it.unitPrice) > 0)
          .map((it) => ({
            productName: it.productName,
            sku: it.sku,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
        cashier: "Cashier",
        defaultVatPercent: settings.defaultVatPercent,
        vatPercent:
          opts?.orderTaxPercent != null && Number.isFinite(Number(opts.orderTaxPercent))
            ? Number(opts.orderTaxPercent)
            : settings.defaultVatPercent,
        parent,
        prevDocNumber,
        orderGrandTotal:
          opts?.orderGrandTotal != null
            ? opts.orderGrandTotal
            : ret.total != null
              ? Number(ret.total)
              : null,
        orderDiscount: ret.discount != null ? Number(ret.discount) : null,
        shipping: ret.shipping != null ? Number(ret.shipping) : null,
        tender: omniTenderForMethod(payment.method),
      });

      const fiscal = await omniMoneyBack(
        token,
        {
          prev_doc_number: mapped.prev_doc_number,
          data: mapped.data,
        },
        settings,
      );

      if (fiscal.document_number) rememberLastDocNumber(fiscal.document_number);
      await persistFiscal(payment.paymentId, fiscalToPatch("OK", fiscal));
      return { status: "ok", paymentId: payment.paymentId, fiscal };
    } catch (err) {
      const message =
        err instanceof OmnicashierError
          ? `${err.message}${err.code ? ` (${err.code})` : ""}`
          : err instanceof Error
            ? err.message
            : String(err);
      try {
        await persistFiscal(payment.paymentId, fiscalToPatch("FAILED", undefined, message.slice(0, 500)));
      } catch {
        // ignore
      }
      if (!opts?.silentSkip) {
        notifyWarning(
          message.slice(0, 160) || "OmniCashier money back failed — return kept in Inflero",
        );
      }
      return { status: "failed", paymentId: payment.paymentId, error: message };
    }
  } finally {
    inFlightFiscal.delete(payment.paymentId);
  }
}

export async function fiscalizeCardPaymentsOnReturn(
  ret: SalesReturnDetail,
  parentOrder: PosOrderDetail | null,
): Promise<FiscalizeOutcome[]> {
  if (!isOmnicashierConfigured()) return [{ status: "skipped", reason: "disabled" }];
  const pending = findUnfiscalizedOmniPayments(ret.payments);
  const out: FiscalizeOutcome[] = [];
  for (const p of pending) {
    out.push(
      await fiscalizeCardReturnPayment(ret, p, parentOrder?.payments, {
        orderGrandTotal: ret.total != null ? Number(ret.total) : null,
        orderTaxPercent:
          parentOrder?.taxPercent != null ? Number(parentOrder.taxPercent) : null,
      }),
    );
  }
  return out;
}

/** Explicit retry for a FAILED/NONE/PENDING CASH or CARD sale payment. */
export async function retryFiscalizeCardSale(
  order: PosOrderDetail,
  paymentId: string,
): Promise<FiscalizeOutcome> {
  const payment = (order.payments ?? []).find((p) => p.paymentId === paymentId);
  if (!payment) return { status: "skipped", reason: "Payment not found" };
  return fiscalizeCardSalePayment(order, payment, { forceClaim: true });
}
