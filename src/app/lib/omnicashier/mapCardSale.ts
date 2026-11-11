/**
 * Map Inflero PosOrder + CASH/CARD Payment amount → OmniCashier sale document body.
 *
 * Order discount / partial payments are baked into unit prices
 * (discount = 0) so every line satisfies itemSum === price×qty (Omni 614).
 */

import {
  allocateCatalogLinesToPayment,
  round2,
  sumOmniItemNets,
} from "./allocatePaymentLines";

export type OmniSaleLineIn = {
  productName: string;
  sku?: string | null;
  quantity: number;
  price: string | number;
};

export type MapCardSaleInput = {
  paymentAmount: number;
  /** Inflero grand total (after discount; may include shipping/service). */
  orderGrandTotal: number;
  orderDiscount?: number | null;
  shipping?: number | null;
  serviceFee?: number | null;
  hourlyCharge?: number | null;
  items: OmniSaleLineIn[];
  cashier: string;
  defaultVatPercent: number;
  orderTaxPercent?: number | null;
  intRef: string;
  prevDocNumber?: number | null;
  /** CASH → cashSum; CARD/CREDIT/DEBIT → cashlessSum. */
  tender?: "CASH" | "CARD";
};

export type OmnicashierSaleMapped = {
  int_ref: string;
  prev_doc_number?: number;
  data: {
    cashier: string;
    currency: "AZN";
    items: Array<{
      itemName: string;
      itemCodeType: number;
      itemCode: string;
      itemQuantityType: number;
      itemQuantity: number;
      itemPrice: number;
      itemSum: number;
      itemVatPercent: number;
      discount: number;
    }>;
    sum: number;
    cashSum: number;
    cashlessSum: number;
    prepaymentSum: number;
    creditSum: number;
    bonusSum: number;
    incomingSum: number;
    vatAmounts: Array<{ vatPercent: number; vatSum: number }>;
  };
};

export function mapCardSaleToOmni(input: MapCardSaleInput): OmnicashierSaleMapped {
  const pay = round2(Math.max(0, input.paymentAmount));
  if (pay <= 0) throw new Error("Payment amount must be positive for fiscal sale");

  const vatPercent =
    input.orderTaxPercent != null && Number.isFinite(Number(input.orderTaxPercent))
      ? Number(input.orderTaxPercent)
      : input.defaultVatPercent;

  const items = allocateCatalogLinesToPayment({
    paymentAmount: pay,
    orderGrandTotal: input.orderGrandTotal,
    orderDiscount: input.orderDiscount,
    shipping: input.shipping,
    serviceFee: input.serviceFee,
    hourlyCharge: input.hourlyCharge,
    vatPercent,
    items: (input.items ?? []).map((it) => ({
      productName: it.productName,
      sku: it.sku,
      quantity: it.quantity,
      unitPrice: it.price,
    })),
    emptyLabel: "Payment",
    emptyCode: "PAY",
    feeLabel: "Service",
    feeCode: "FEE",
  });

  const sum = sumOmniItemNets(items);
  const isCash = input.tender === "CASH";

  return {
    int_ref: input.intRef.slice(0, 128),
    ...(input.prevDocNumber != null ? { prev_doc_number: input.prevDocNumber } : {}),
    data: {
      cashier: (input.cashier || "Cashier").slice(0, 64),
      currency: "AZN",
      items,
      sum,
      cashSum: isCash ? sum : 0,
      cashlessSum: isCash ? 0 : sum,
      prepaymentSum: 0,
      creditSum: 0,
      bonusSum: 0,
      incomingSum: 0,
      // Device prints S.V.% from vatPercent; keep prior shape (vatSum = document sum).
      vatAmounts: [{ vatPercent, vatSum: sum }],
    },
  };
}
