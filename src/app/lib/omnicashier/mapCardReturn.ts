/**
 * Map SalesReturn + parent fiscal sale ids → OmniCashier money_back (check_type 100).
 * Same catalog-price + discount allocation as sales so refund slips stay consistent.
 */

import {
  allocateCatalogLinesToPayment,
  round2,
  sumOmniItemNets,
} from "./allocatePaymentLines";

export type OmniReturnLineIn = {
  productName: string;
  sku?: string | null;
  quantity: number;
  unitPrice: string | number;
};

export type ParentFiscalIds = {
  longId: string;
  shortId: string;
  documentNumber: number | string;
};

export type MapCardReturnInput = {
  refundAmount: number;
  items: OmniReturnLineIn[];
  cashier: string;
  defaultVatPercent: number;
  /** Prefer parent sale VAT / terminal default — not return line tax 0. */
  vatPercent?: number | null;
  parent: ParentFiscalIds;
  prevDocNumber?: number | null;
  /** Original order grand total when known (helps fee/shipping lines). */
  orderGrandTotal?: number | null;
};

export function mapCardReturnToOmni(input: MapCardReturnInput): {
  prev_doc_number?: number;
  data: Record<string, unknown>;
} {
  const pay = round2(Math.max(0, input.refundAmount));
  if (pay <= 0) throw new Error("Refund amount must be positive for fiscal money back");
  if (!input.parent.longId || !input.parent.shortId) {
    throw new Error("Parent fiscal document ids are required for money back");
  }

  const vatPercent =
    input.vatPercent != null && Number.isFinite(Number(input.vatPercent))
      ? Number(input.vatPercent)
      : input.defaultVatPercent;

  const items = allocateCatalogLinesToPayment({
    paymentAmount: pay,
    orderGrandTotal: input.orderGrandTotal,
    vatPercent,
    items: (input.items ?? []).map((it) => ({
      productName: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    emptyLabel: "Refund",
    emptyCode: "REF",
    feeLabel: "Service",
    feeCode: "FEE",
  });

  const sum = sumOmniItemNets(items);

  return {
    ...(input.prevDocNumber != null ? { prev_doc_number: input.prevDocNumber } : {}),
    data: {
      cashier: (input.cashier || "Cashier").slice(0, 64),
      currency: "AZN",
      parentDocument: input.parent.longId,
      refund_document_number: String(input.parent.documentNumber),
      refund_short_document_id: input.parent.shortId,
      items,
      sum,
      cashSum: 0,
      cashlessSum: sum,
      prepaymentSum: 0,
      creditSum: 0,
      bonusSum: 0,
      incomingSum: 0,
      vatAmounts: [{ vatPercent, vatSum: sum }],
    },
  };
}
