/**
 * Map Inflero PosOrder + CARD Payment amount → OmniCashier sale document body.
 * Partial payments: proportional line split so Σ itemSum === paymentAmount.
 */

import { sanitizeOmniItemName } from "./charset";

export type OmniSaleLineIn = {
  productName: string;
  sku?: string | null;
  quantity: number;
  price: string | number;
};

export type MapCardSaleInput = {
  paymentAmount: number;
  orderGrandTotal: number;
  items: OmniSaleLineIn[];
  cashier: string;
  defaultVatPercent: number;
  orderTaxPercent?: number | null;
  intRef: string;
  prevDocNumber?: number | null;
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

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/**
 * Keep Σ itemSum === payment after 2dp price×qty rounding.
 * Prefer qty≈1 lines so itemPrice*itemQuantity stays exact; never recompute
 * itemSum from rounded price×qty after applying drift (that reintroduces ±0.01/0.02).
 */
function absorbLineDrift(
  items: OmnicashierSaleMapped["data"]["items"],
  drift: number,
): void {
  if (Math.abs(drift) < 0.01 || items.length === 0) return;

  const tryApply = (idx: number, d: number): boolean => {
    const it = items[idx]!;
    const newSum = round2(it.itemSum + d);
    if (!(newSum > 0)) return false;
    const qty = it.itemQuantity;
    if (!(qty > 0)) return false;
    if (Math.abs(qty - 1) < 0.0005) {
      it.itemSum = newSum;
      it.itemPrice = newSum;
      return true;
    }
    const newPrice = round2(newSum / qty);
    if (round2(newPrice * qty) !== newSum) return false;
    it.itemSum = newSum;
    it.itemPrice = newPrice;
    return true;
  };

  for (let i = items.length - 1; i >= 0; i--) {
    if (Math.abs(items[i]!.itemQuantity - 1) < 0.0005 && tryApply(i, drift)) return;
  }
  for (let i = items.length - 1; i >= 0; i--) {
    if (Math.abs(items[i]!.itemQuantity - 1) >= 0.0005 && tryApply(i, drift)) return;
  }

  // Last resort: document total wins; do not rebuild itemSum from price×qty.
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]!;
    const newSum = round2(it.itemSum + drift);
    if (!(newSum > 0)) continue;
    it.itemSum = newSum;
    it.itemPrice = it.itemQuantity > 0 ? round2(newSum / it.itemQuantity) : newSum;
    return;
  }
}

function singleServiceLine(
  pay: number,
  vatPercent: number,
  cashier: string,
  intRef: string,
  prevDocNumber?: number | null,
): OmnicashierSaleMapped {
  return {
    int_ref: intRef.slice(0, 128),
    ...(prevDocNumber != null ? { prev_doc_number: prevDocNumber } : {}),
    data: {
      cashier: (cashier || "Cashier").slice(0, 64),
      currency: "AZN",
      items: [
        {
          itemName: sanitizeOmniItemName("Payment"),
          itemCodeType: 3,
          itemCode: "PAY",
          itemQuantityType: 0,
          itemQuantity: 1,
          itemPrice: pay,
          itemSum: pay,
          itemVatPercent: vatPercent,
          discount: 0,
        },
      ],
      sum: pay,
      cashSum: 0,
      cashlessSum: pay,
      prepaymentSum: 0,
      creditSum: 0,
      bonusSum: 0,
      incomingSum: 0,
      vatAmounts: [{ vatPercent, vatSum: pay }],
    },
  };
}

export function mapCardSaleToOmni(input: MapCardSaleInput): OmnicashierSaleMapped {
  const pay = round2(Math.max(0, input.paymentAmount));
  if (pay <= 0) throw new Error("Payment amount must be positive for fiscal sale");

  const vatPercent =
    input.orderTaxPercent != null && Number.isFinite(Number(input.orderTaxPercent))
      ? Number(input.orderTaxPercent)
      : input.defaultVatPercent;

  const rawLines = (input.items ?? []).filter((it) => Number(it.quantity) > 0);
  if (rawLines.length === 0) {
    return singleServiceLine(pay, vatPercent, input.cashier, input.intRef, input.prevDocNumber);
  }

  const full = rawLines.map((it) => {
    const qty = Number(it.quantity);
    const price = round2(Number(it.price));
    return {
      name: it.productName || "Item",
      sku: String(it.sku || "").slice(0, 32),
      qty,
      lineSum: round2(price * qty),
    };
  });
  const fullSum = round2(full.reduce((a, r) => a + r.lineSum, 0));
  if (fullSum <= 0) {
    return singleServiceLine(pay, vatPercent, input.cashier, input.intRef, input.prevDocNumber);
  }

  const items: OmnicashierSaleMapped["data"]["items"] = [];
  let allocated = 0;
  for (let i = 0; i < full.length; i++) {
    const row = full[i]!;
    const isLast = i === full.length - 1;
    const share = isLast ? round2(pay - allocated) : round2((row.lineSum / fullSum) * pay);
    if (!isLast) allocated = round2(allocated + share);
    if (share <= 0) continue;

    const qty = round3(row.qty);
    const itemPrice = qty > 0 ? round2(share / qty) : share;
    const itemSum = round2(itemPrice * qty);
    items.push({
      itemName: sanitizeOmniItemName(row.name),
      itemCodeType: 0,
      itemCode: row.sku || "0",
      itemQuantityType: 0,
      itemQuantity: qty,
      itemPrice,
      itemSum,
      itemVatPercent: vatPercent,
      discount: 0,
    });
  }

  if (items.length === 0) {
    return singleServiceLine(pay, vatPercent, input.cashier, input.intRef, input.prevDocNumber);
  }

  // Absorb residual so Σ itemSum === pay (prefer unit-qty line; see absorbLineDrift)
  absorbLineDrift(
    items,
    round2(pay - round2(items.reduce((a, it) => a + it.itemSum, 0))),
  );

  const sum = round2(items.reduce((a, it) => a + it.itemSum, 0));

  return {
    int_ref: input.intRef.slice(0, 128),
    ...(input.prevDocNumber != null ? { prev_doc_number: input.prevDocNumber } : {}),
    data: {
      cashier: (input.cashier || "Cashier").slice(0, 64),
      currency: "AZN",
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
