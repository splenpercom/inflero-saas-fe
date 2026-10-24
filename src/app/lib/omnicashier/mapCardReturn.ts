/**
 * Map SalesReturn + parent fiscal sale ids → OmniCashier money_back (check_type 100).
 */

import { sanitizeOmniItemName } from "./charset";

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
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

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

  const raw = (input.items ?? []).filter((it) => Number(it.quantity) > 0);
  let items: Array<{
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

  if (raw.length === 0) {
    items = [
      {
        itemName: sanitizeOmniItemName("Refund"),
        itemCodeType: 3,
        itemCode: "REF",
        itemQuantityType: 0,
        itemQuantity: 1,
        itemPrice: pay,
        itemSum: pay,
        itemVatPercent: vatPercent,
        discount: 0,
      },
    ];
  } else {
    const full = raw.map((it) => {
      const qty = Number(it.quantity);
      const price = round2(Number(it.unitPrice));
      return {
        name: it.productName || "Item",
        sku: String(it.sku || "").slice(0, 32),
        qty,
        lineSum: round2(price * qty),
      };
    });
    const fullSum = round2(full.reduce((a, r) => a + r.lineSum, 0)) || pay;
    items = [];
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
      items = [
        {
          itemName: sanitizeOmniItemName("Refund"),
          itemCodeType: 3,
          itemCode: "REF",
          itemQuantityType: 0,
          itemQuantity: 1,
          itemPrice: pay,
          itemSum: pay,
          itemVatPercent: vatPercent,
          discount: 0,
        },
      ];
    }
    const sumNow = round2(items.reduce((a, it) => a + it.itemSum, 0));
    const drift = round2(pay - sumNow);
    if (Math.abs(drift) >= 0.01) {
      const last = items[items.length - 1]!;
      last.itemSum = round2(last.itemSum + drift);
      if (last.itemQuantity > 0) {
        last.itemPrice = round2(last.itemSum / last.itemQuantity);
        last.itemSum = round2(last.itemPrice * last.itemQuantity);
      }
    }
  }

  const sum = round2(items.reduce((a, it) => a + it.itemSum, 0));

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
