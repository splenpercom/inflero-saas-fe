/**
 * Shared Omni line allocation for CARD sale/refund documents.
 *
 * OmniCashier (code 614 "invalid total sum in one item") requires
 *   itemSum === round(itemPrice × itemQuantity)
 * on every line. Some device firmwares also mishandle non-zero per-line
 * `discount` on discounted Inflero orders, so we bake order discount /
 * partial-payment scaling into unit price and keep `discount` at 0 except
 * for ≤0.02 rounding residuals.
 */

import { sanitizeOmniItemName } from "./charset";

export type OmniAllocLineIn = {
  productName: string;
  sku?: string | null;
  quantity: number;
  /** Catalog / list unit price (before order-level discount). */
  unitPrice: string | number;
};

export type OmniAllocItem = {
  itemName: string;
  itemCodeType: number;
  itemCode: string;
  itemQuantityType: number;
  itemQuantity: number;
  itemPrice: number;
  itemSum: number;
  itemVatPercent: number;
  discount: number;
};

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function round3(n: number): number {
  return Math.round((n + Number.EPSILON) * 1000) / 1000;
}

/** Omni-style fixed-point: price cents × qty milli → money (2 dp). */
export function omniPriceQtySum(price: number, qty: number): number {
  const cents = Math.round(round2(price) * 100);
  const milli = Math.round(round3(qty) * 1000);
  return Math.round((cents * milli) / 1000) / 100;
}

function lineNet(it: OmniAllocItem): number {
  return round2(it.itemSum - it.discount);
}

/**
 * Force a line to a target net while keeping itemSum === price×qty.
 * Prefer adjusting unit price (discount ≈ 0) — avoids Omni 614 on discounted slips.
 */
export function setLineToNet(it: OmniAllocItem, targetNet: number): void {
  const want = round2(Math.max(0, targetNet));
  const qty = round3(it.itemQuantity);

  if (!(qty > 0)) {
    it.itemQuantity = 1;
    it.itemPrice = want;
    it.itemSum = want;
    it.discount = 0;
    return;
  }

  it.itemQuantity = qty;

  // Derive unit price from desired net so discounted orders don't need line discount.
  let price = round2(want / qty);
  let sum = omniPriceQtySum(price, qty);

  // If fixed-point sum undershoots, bump price by 0.01 until sum >= want (or closest).
  let guard = 0;
  while (sum + 0.001 < want && guard++ < 1000) {
    price = round2(price + 0.01);
    sum = omniPriceQtySum(price, qty);
  }

  // If we overshot by more than a cent, try one step down when it still covers want.
  if (sum > want + 0.011) {
    const lower = round2(price - 0.01);
    if (lower > 0) {
      const lowerSum = omniPriceQtySum(lower, qty);
      if (lowerSum + 0.001 >= want) {
        price = lower;
        sum = lowerSum;
      }
    }
  }

  it.itemPrice = price;
  it.itemSum = sum;
  // Residual only (normally 0). Never leave sum ≠ price×qty.
  it.discount = Math.max(0, round2(sum - want));
  if (it.discount > it.itemSum) it.discount = it.itemSum;
}

/** Final repair: every line must satisfy Omni 614 invariant. */
export function assertOmniLineSums(items: OmniAllocItem[]): void {
  for (const it of items) {
    const expect = omniPriceQtySum(it.itemPrice, it.itemQuantity);
    if (Math.abs(expect - it.itemSum) > 0.001) {
      it.itemSum = expect;
    }
    if (it.discount > it.itemSum) it.discount = it.itemSum;
    if (it.discount < 0) it.discount = 0;
  }
}

/**
 * Eliminate residual per-line `discount` (even ≤¢2) by moving cents to a
 * neighbor line, or collapsing the line to qty=1 @ net. Keeps 614 invariant.
 */
export function zeroLineDiscounts(items: OmniAllocItem[]): void {
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    const residual = round2(it.discount);
    if (!(residual > 0)) {
      it.discount = 0;
      continue;
    }

    const wantNet = round2(it.itemSum - residual);
    let moved = false;
    for (let j = items.length - 1; j >= 0; j--) {
      if (j === i) continue;
      const other = items[j]!;
      const otherNet = lineNet(other);
      if (otherNet > residual + 0.009) {
        it.discount = 0; // keep full price×qty on this line
        setLineToNet(other, round2(otherNet - residual));
        moved = true;
        break;
      }
    }
    if (!moved) {
      // Single-line or neighbors too small — exact net via qty 1.
      it.itemQuantity = 1;
      it.itemQuantityType = 0;
      it.itemPrice = wantNet;
      it.itemSum = wantNet;
      it.discount = 0;
    }
  }

  // setLineToNet on neighbors can recreate tiny residuals — force clean.
  for (const it of items) {
    if (!(it.discount > 0)) {
      it.discount = 0;
      continue;
    }
    const wantNet = lineNet(it);
    it.itemQuantity = 1;
    it.itemQuantityType = 0;
    it.itemPrice = wantNet;
    it.itemSum = wantNet;
    it.discount = 0;
  }
}

/**
 * Adjust nets so Σ(itemSum − discount) === target. Prefer rewriting price
 * (setLineToNet) over growing line discounts — safer for Omni 614.
 */
export function absorbNetDrift(items: OmniAllocItem[], drift: number): void {
  if (Math.abs(drift) < 0.01 || items.length === 0) return;

  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]!;
    const target = round2(lineNet(it) + drift);
    if (!(target > 0)) continue;
    setLineToNet(it, target);
    return;
  }
}

function singlePaymentLine(
  pay: number,
  vatPercent: number,
  label: string,
  code: string,
): OmniAllocItem[] {
  return [
    {
      itemName: sanitizeOmniItemName(label),
      itemCodeType: 3,
      itemCode: code,
      itemQuantityType: 0,
      itemQuantity: 1,
      itemPrice: pay,
      itemSum: pay,
      itemVatPercent: vatPercent,
      discount: 0,
    },
  ];
}

type BasisRow = {
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
  gross: number;
  codeType: number;
};

/**
 * Build Omni items for a CARD sale/refund document totaling exactly `paymentAmount`.
 *
 * 1) Build the full-order net basket (catalog prices − order discount + fee lines).
 * 2) Scale that basket so Σ net === this payment (full or partial CARD).
 * 3) Emit lines with unit prices baked to those nets (discount≈0) so Omni 614 passes.
 */
export function allocateCatalogLinesToPayment(opts: {
  paymentAmount: number;
  items: OmniAllocLineIn[];
  vatPercent: number;
  /** Inflero order grand total (fallback when discount/fees omitted). */
  orderGrandTotal?: number | null;
  /** Explicit order discount (preferred over inferring from grand total). */
  orderDiscount?: number | null;
  shipping?: number | null;
  serviceFee?: number | null;
  hourlyCharge?: number | null;
  emptyLabel?: string;
  emptyCode?: string;
  feeLabel?: string;
  feeCode?: string;
}): OmniAllocItem[] {
  const pay = round2(Math.max(0, opts.paymentAmount));
  if (!(pay > 0)) return [];

  const vatPercent = opts.vatPercent;
  const raw = (opts.items ?? []).filter((it) => {
    const qty = Number(it.quantity);
    const price = Number(it.unitPrice);
    // Skip free / zero lines — Omni rejects zero-sum items; BXGX free lines are $0.
    return qty > 0 && Number.isFinite(price) && price > 0;
  });
  if (raw.length === 0) {
    return singlePaymentLine(pay, vatPercent, opts.emptyLabel || "Payment", opts.emptyCode || "PAY");
  }

  const products: BasisRow[] = raw.map((it) => {
    const qty = round3(Number(it.quantity));
    const unitPrice = round2(Number(it.unitPrice));
    return {
      name: it.productName || "Item",
      sku: String(it.sku || "").slice(0, 32),
      qty,
      unitPrice,
      gross: omniPriceQtySum(unitPrice, qty),
      codeType: 0,
    };
  });
  const merchSum = round2(products.reduce((a, r) => a + r.gross, 0));
  if (!(merchSum > 0)) {
    return singlePaymentLine(pay, vatPercent, opts.emptyLabel || "Payment", opts.emptyCode || "PAY");
  }

  const orderGt =
    opts.orderGrandTotal != null && Number.isFinite(Number(opts.orderGrandTotal))
      ? round2(Math.max(0, Number(opts.orderGrandTotal)))
      : 0;

  const explicitDiscount =
    opts.orderDiscount != null && Number.isFinite(Number(opts.orderDiscount))
      ? round2(Math.max(0, Number(opts.orderDiscount)))
      : null;
  const shipping = round2(Math.max(0, Number(opts.shipping ?? 0) || 0));
  const serviceFee = round2(Math.max(0, Number(opts.serviceFee ?? 0) || 0));
  const hourly = round2(Math.max(0, Number(opts.hourlyCharge ?? 0) || 0));
  const explicitFees = round2(shipping + serviceFee + hourly);

  let orderDiscount = explicitDiscount;
  let feeParts: { name: string; code: string; amount: number }[] = [];
  if (explicitFees > 0.009) {
    if (shipping > 0.009) feeParts.push({ name: "Shipping", code: "SHIP", amount: shipping });
    if (serviceFee > 0.009) feeParts.push({ name: "Service", code: "SERV", amount: serviceFee });
    if (hourly > 0.009) feeParts.push({ name: "Table time", code: "HOUR", amount: hourly });
  }
  if (orderDiscount == null) {
    if (orderGt > 0 && feeParts.length === 0) {
      if (orderGt < merchSum - 0.009) orderDiscount = round2(merchSum - orderGt);
      else if (orderGt > merchSum + 0.009) {
        feeParts = [
          {
            name: opts.feeLabel || "Service",
            code: opts.feeCode || "FEE",
            amount: round2(orderGt - merchSum),
          },
        ];
        orderDiscount = 0;
      } else orderDiscount = 0;
    } else if (orderGt > 0 && feeParts.length > 0) {
      orderDiscount = round2(Math.max(0, merchSum + explicitFees - orderGt));
    } else {
      orderDiscount = 0;
    }
  }

  const productNets: number[] = [];
  let discAllocated = 0;
  const discTotal = Math.min(orderDiscount ?? 0, merchSum);
  for (let i = 0; i < products.length; i++) {
    const row = products[i]!;
    const isLast = i === products.length - 1;
    const lineDisc = isLast
      ? round2(discTotal - discAllocated)
      : round2((row.gross / merchSum) * discTotal);
    if (!isLast) discAllocated = round2(discAllocated + lineDisc);
    productNets.push(round2(Math.max(0, row.gross - lineDisc)));
  }

  type FullNetRow = BasisRow & { fullNet: number };
  const fullRows: FullNetRow[] = products.map((row, i) => ({
    ...row,
    fullNet: productNets[i]!,
  }));
  for (const fee of feeParts) {
    if (!(fee.amount > 0)) continue;
    fullRows.push({
      name: fee.name,
      sku: fee.code.slice(0, 32),
      qty: 1,
      unitPrice: fee.amount,
      gross: fee.amount,
      codeType: 3,
      fullNet: fee.amount,
    });
  }

  const fullNetSum = round2(fullRows.reduce((a, r) => a + r.fullNet, 0));

  const nets: number[] = [];
  let allocated = 0;
  for (let i = 0; i < fullRows.length; i++) {
    const row = fullRows[i]!;
    const isLast = i === fullRows.length - 1;
    const weight = fullNetSum > 0.009 ? row.fullNet / fullNetSum : row.gross / merchSum;
    const share = isLast ? round2(pay - allocated) : round2(weight * pay);
    if (!isLast) allocated = round2(allocated + share);
    nets.push(share);
  }

  const items: OmniAllocItem[] = [];
  for (let i = 0; i < fullRows.length; i++) {
    const row = fullRows[i]!;
    const net = nets[i]!;
    if (!(net > 0)) continue;

    const draft: OmniAllocItem = {
      itemName: sanitizeOmniItemName(row.name),
      itemCodeType: row.codeType,
      itemCode: row.sku || "0",
      itemQuantityType: 0,
      itemQuantity: round3(row.qty),
      itemPrice: row.unitPrice,
      itemSum: row.gross,
      itemVatPercent: vatPercent,
      discount: 0,
    };
    // Always bake net into unit price — avoids Omni 614 on discounted orders.
    setLineToNet(draft, net);
    if (draft.itemSum <= 0) continue;
    items.push(draft);
  }

  if (items.length === 0) {
    return singlePaymentLine(pay, vatPercent, opts.emptyLabel || "Payment", opts.emptyCode || "PAY");
  }

  const netSum = round2(items.reduce((a, it) => a + lineNet(it), 0));
  absorbNetDrift(items, round2(pay - netSum));
  assertOmniLineSums(items);

  // Eliminate residual line discounts (including ≤¢2), then re-pin payment total.
  for (let pass = 0; pass < 3; pass++) {
    zeroLineDiscounts(items);
    assertOmniLineSums(items);
    const nets = round2(items.reduce((a, it) => a + lineNet(it), 0));
    const drift = round2(pay - nets);
    if (Math.abs(drift) < 0.01) break;
    absorbNetDrift(items, drift);
    assertOmniLineSums(items);
  }
  zeroLineDiscounts(items);
  assertOmniLineSums(items);

  return items;
}

export function sumOmniItemNets(items: OmniAllocItem[]): number {
  return round2(items.reduce((a, it) => a + lineNet(it), 0));
}
