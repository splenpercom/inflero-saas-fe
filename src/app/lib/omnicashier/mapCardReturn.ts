/**
 * Map SalesReturn + parent fiscal sale ids → OmniCashier money_back (check_type 100).
 * Same baked unit-price allocation as sales so refund slips stay Omni-614-safe.
 */

import {
  allocateCatalogLinesToPayment,
  round2,
  sumOmniItemNets,
} from "./allocatePaymentLines";
import { omniPrevDocNumberField } from "./payloadGuards";

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
  /**
   * Sales-return total (returned lines), NOT parent POS grandTotal.
   * Passing parent GT when merch < GT invents a phantom Omni fee line.
   */
  orderGrandTotal?: number | null;
  orderDiscount?: number | null;
  shipping?: number | null;
  /** CASH → cashSum; CARD-like → cashlessSum. */
  tender?: "CASH" | "CARD";
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
    orderDiscount: input.orderDiscount,
    shipping: input.shipping,
    vatPercent,
    items: (input.items ?? [])
      .filter((it) => Number(it.quantity) > 0 && Number(it.unitPrice) > 0)
      .map((it) => ({
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
  const isCash = input.tender === "CASH";

  return {
    ...omniPrevDocNumberField(input.prevDocNumber),
    data: {
      cashier: (input.cashier || "Cashier").slice(0, 64),
      currency: "AZN",
      parentDocument: input.parent.longId,
      refund_document_number: String(input.parent.documentNumber),
      refund_short_document_id: input.parent.shortId,
      items,
      sum,
      cashSum: isCash ? sum : 0,
      cashlessSum: isCash ? 0 : sum,
      prepaymentSum: 0,
      creditSum: 0,
      bonusSum: 0,
      // Same cash fix as sale — incomingSum must cover cashSum.
      incomingSum: isCash ? sum : 0,
      vatAmounts: [{ vatPercent, vatSum: sum }],
    },
  };
}
