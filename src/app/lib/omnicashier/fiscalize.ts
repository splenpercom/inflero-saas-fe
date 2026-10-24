/**
 * Non-blocking OmniCashier fiscalization for CARD Payments (sale + money_back).
 * Never throws to callers in a way that should roll back Inflero payments — callers
 * should still catch and toast. Returns a result describing skip / ok / failed.
 */

import type { PosOrderDetail, PosOrderPaymentRow, SalesReturnDetail } from "../../api/sales";
import { patchPaymentFiscal, type PaymentFiscalPatchBody } from "../../api/sales";
import {
  isOmnicashierConfigured,
  loadOmnicashierSettings,
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

export function isCardPaymentMethod(method: string | null | undefined): boolean {
  return method != null && CARD_METHODS.has(method);
}

export function findUnfiscalizedCardPayments(
  payments: PosOrderPaymentRow[] | undefined,
): PosOrderPaymentRow[] {
  return (payments ?? []).filter(
    (p) =>
      isCardPaymentMethod(p.method) &&
      p.fiscalStatus !== "OK" &&
      Number(p.allocatedAmount) > 0,
  );
}

export function findParentFiscalFromOrderPayments(
  payments: PosOrderPaymentRow[] | undefined,
): { longId: string; shortId: string; documentNumber: string | number } | null {
  const ok = (payments ?? []).filter(
    (p) =>
      isCardPaymentMethod(p.method) &&
      p.fiscalStatus === "OK" &&
      p.fiscalLongId &&
      p.fiscalShortId &&
      p.fiscalDocumentNumber != null,
  );
  if (ok.length === 0) return null;
  // Prefer earliest OK fiscal sale as parent for money_back
  const first = ok[0]!;
  return {
    longId: first.fiscalLongId!,
    shortId: first.fiscalShortId!,
    documentNumber: first.fiscalDocumentNumber!,
  };
}

async function persistFiscal(
  paymentId: string,
  body: PaymentFiscalPatchBody,
): Promise<void> {
  await patchPaymentFiscal(paymentId, body);
}

function fiscalToPatch(
  status: "OK" | "FAILED" | "PENDING",
  fiscal?: OmnicashierFiscalResult,
  error?: string,
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
  };
}

/**
 * Fiscalize one CARD payment on a POS order (sale). Idempotent if already OK.
 */
export async function fiscalizeCardSalePayment(
  order: PosOrderDetail,
  payment: PosOrderPaymentRow,
  opts?: { silentSkip?: boolean },
): Promise<FiscalizeOutcome> {
  const settings = loadOmnicashierSettings();
  if (!isOmnicashierConfigured(settings)) {
    return { status: "skipped", reason: "OmniCashier disabled or not configured" };
  }
  if (!isCardPaymentMethod(payment.method)) {
    return { status: "skipped", reason: "Not a card payment" };
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

  try {
    await persistFiscal(payment.paymentId, fiscalToPatch("PENDING"));
  } catch {
    // continue — device call still useful
  }

  try {
    const { token, prevDocNumber } = await ensureOmnicashierSession(settings);
    const mapped = mapCardSaleToOmni({
      paymentAmount: amount,
      orderGrandTotal: Number(order.grandTotal),
      items: (order.items ?? []).map((it) => ({
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        price: it.price,
      })),
      cashier: order.billerName || "Cashier",
      defaultVatPercent: settings.defaultVatPercent,
      orderTaxPercent: order.taxPercent != null ? Number(order.taxPercent) : null,
      intRef: `${order.id}:${payment.paymentId}`,
      prevDocNumber,
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
      // Timeout / unknown: try get last document recovery
      if (
        err instanceof OmnicashierError &&
        (err.code === -2 || err.code === -3)
      ) {
        try {
          const last = await omniGetLastDocument(token, settings);
          if (last.long_id) {
            fiscal = last;
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
}

/**
 * After order detail is returned from checkout/payment — fiscalize all pending CARD payments.
 */
export async function fiscalizeCardPaymentsOnOrder(
  order: PosOrderDetail,
): Promise<FiscalizeOutcome[]> {
  if (!isOmnicashierConfigured()) return [{ status: "skipped", reason: "disabled" }];
  const pending = findUnfiscalizedCardPayments(order.payments);
  const out: FiscalizeOutcome[] = [];
  for (const p of pending) {
    out.push(await fiscalizeCardSalePayment(order, p));
  }
  return out;
}

/**
 * Fiscalize CARD refund payment on a sales return (money_back).
 */
export async function fiscalizeCardReturnPayment(
  ret: SalesReturnDetail,
  payment: PosOrderPaymentRow,
  parentOrderPayments: PosOrderPaymentRow[] | undefined,
  opts?: { silentSkip?: boolean },
): Promise<FiscalizeOutcome> {
  const settings = loadOmnicashierSettings();
  if (!isOmnicashierConfigured(settings)) {
    return { status: "skipped", reason: "OmniCashier disabled or not configured" };
  }
  if (!isCardPaymentMethod(payment.method)) {
    return { status: "skipped", reason: "Not a card refund" };
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

  const parent = findParentFiscalFromOrderPayments(parentOrderPayments);
  if (!parent) {
    const reason = "Parent order has no fiscalized card sale — skipping OmniCashier money back";
    if (!opts?.silentSkip) notifyWarning(reason);
    return { status: "skipped", reason };
  }

  const amount = Number(payment.allocatedAmount);
  if (!(amount > 0)) {
    return { status: "skipped", reason: "Zero refund amount" };
  }

  try {
    await persistFiscal(payment.paymentId, fiscalToPatch("PENDING"));
  } catch {
    // continue
  }

  try {
    const { token, prevDocNumber } = await ensureOmnicashierSession(settings);
    const mapped = mapCardReturnToOmni({
      refundAmount: amount,
      items: (ret.items ?? []).map((it) => ({
        productName: it.productName,
        sku: it.sku,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      cashier: "Cashier",
      defaultVatPercent: settings.defaultVatPercent,
      vatPercent: settings.defaultVatPercent,
      parent,
      prevDocNumber,
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
}

export async function fiscalizeCardPaymentsOnReturn(
  ret: SalesReturnDetail,
  parentOrder: PosOrderDetail | null,
): Promise<FiscalizeOutcome[]> {
  if (!isOmnicashierConfigured()) return [{ status: "skipped", reason: "disabled" }];
  const pending = findUnfiscalizedCardPayments(ret.payments);
  const out: FiscalizeOutcome[] = [];
  for (const p of pending) {
    out.push(await fiscalizeCardReturnPayment(ret, p, parentOrder?.payments));
  }
  return out;
}

/** Explicit retry for a FAILED/NONE card sale payment. */
export async function retryFiscalizeCardSale(
  order: PosOrderDetail,
  paymentId: string,
): Promise<FiscalizeOutcome> {
  const payment = (order.payments ?? []).find((p) => p.paymentId === paymentId);
  if (!payment) return { status: "skipped", reason: "Payment not found" };
  return fiscalizeCardSalePayment(order, payment);
}
