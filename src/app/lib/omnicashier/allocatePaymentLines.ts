/**
 * Shared Omni line allocation: keep catalog unit prices on the fiscal slip and
 * put any gap (order discount, partial payment, etc.) into the line `discount`
 * so Σ(itemSum − discount) === paymentAmount.
 *
 * Previously we rewrote itemPrice = share/qty which printed nonsense unit prices
 * whenever payment ≠ Σ(price×qty) (discounted orders, split card payments).
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

function lineNet(it: OmniAllocItem): number {
  return round2(it.itemSum - it.discount);
}

/**
 * OmniCashier rejects lines when itemSum ≠ round(itemPrice × itemQuantity)
 * ("invalid total sum in one item", code 614). Always keep that identity and
 * express the desired net via discount (sum − discount).
 */
export function setLineToNet(it: OmniAllocItem, targetNet: number): void {
  const want = round2(Math.max(0, targetNet));
  const qty = it.itemQuantity;

  if (!(qty > 0)) {
    it.itemPrice = want;
    it.itemSum = want;
    it.discount = 0;
    return;
  }

  let price = round2(it.itemPrice);
  let sum = round2(price * qty);

  // Need a higher gross than current catalog sum can provide.
  if (sum + 0.001 < want) {
    price = round2(want / qty);
    sum = round2(price * qty);
    // round2(price×qty) can land below want (e.g. 10/3 → 3.33×3 = 9.99).
    // Fractional qty may need several 0.01 bumps before round2(price×qty) moves.
    let guard = 0;
    while (sum + 0.001 < want && guard++ < 1000) {
      price = round2(price + 0.01);
      sum = round2(price * qty);
    }
  }

  it.itemPrice = price;
  it.itemSum = sum;
  it.discount = Math.max(0, round2(sum - want));
}

/**
 * Adjust discounts (preferred) so Σ(itemSum − discount) === targetNet.
 * Falls back to setLineToNet (keeps Omni itemSum === price×qty invariant).
 */
export function absorbNetDrift(items: OmniAllocItem[], drift: number): void {
  if (Math.abs(drift) < 0.01 || items.length === 0) return;

  const tryDiscount = (idx: number, d: number): boolean => {
    const it = items[idx]!;
    const nextDisc = round2(it.discount - d);
    // d>0 → need higher net → lower discount; d<0 → higher discount
    if (nextDisc < -0.001) return false;
    if (nextDisc > it.itemSum + 0.001) return false;
    it.discount = Math.max(0, nextDisc);
    return true;
  };

  for (let i = items.length - 1; i >= 0; i--) {
    if (tryDiscount(i, drift)) return;
  }

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
 * Catalog unit prices stay on product lines; gaps go into `discount`.
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
  const raw = (opts.items ?? []).filter((it) => Number(it.quantity) > 0);
  if (raw.length === 0) {
    return singlePaymentLine(pay, vatPercent, opts.emptyLabel || "Payment", opts.emptyCode || "PAY");
  }

  const products: BasisRow[] = raw.map((it) => {
    // Same qty sent to Omni (3 dp) — gross must use it so itemSum === price×qty.
    const qty = round3(Number(it.quantity));
    const unitPrice = round2(Number(it.unitPrice));
    return {
      name: it.productName || "Item",
      sku: String(it.sku || "").slice(0, 32),
      qty,
      unitPrice,
      gross: round2(unitPrice * qty),
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

  // Prefer explicit discount/fees; otherwise infer a single gap from grand total.
  let orderDiscount = explicitDiscount;
  let feeParts: { name: string; code: string; amount: number }[] = [];
  if (explicitFees > 0.009) {
    if (shipping > 0.009) feeParts.push({ name: "Shipping", code: "SHIP", amount: shipping });
    if (serviceFee > 0.009) feeParts.push({ name: "Service", code: "SERV", amount: serviceFee });
    if (hourly > 0.009) feeParts.push({ name: "Table time", code: "HOUR", amount: hourly });
  }
  if (orderDiscount == null) {
    if (orderGt > 0 && feeParts.length === 0) {
      // Infer: gap below merchandise → discount; gap above → one fee line.
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
      // merch - discount + fees ≈ grandTotal
      orderDiscount = round2(Math.max(0, merchSum + explicitFees - orderGt));
    } else {
      orderDiscount = 0;
    }
  }

  // Full-order product nets after proportional discount allocation.
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

  // Scale full-order nets → this payment (weights follow post-discount basket).
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
    if (net <= 0 && row.gross <= 0) continue;

    const qty = round3(row.qty);
    const draft: OmniAllocItem = {
      itemName: sanitizeOmniItemName(row.name),
      itemCodeType: row.codeType,
      itemCode: row.sku || "0",
      itemQuantityType: 0,
      itemQuantity: qty,
      itemPrice: row.unitPrice,
      itemSum: row.gross,
      itemVatPercent: vatPercent,
      discount: 0,
    };

    // Catalog path: keep unit price / gross when net ≤ gross; otherwise lift
    // price×qty via setLineToNet (never leave itemSum ≠ price×qty — Omni 614).
    if (draft.itemSum > 0 && net <= draft.itemSum + 0.001) {
      draft.discount = Math.max(0, round2(draft.itemSum - net));
    } else if (net > 0) {
      setLineToNet(draft, net);
    } else {
      continue;
    }

    if (draft.itemSum <= 0 && net <= 0) continue;
    items.push(draft);
  }

  if (items.length === 0) {
    return singlePaymentLine(pay, vatPercent, opts.emptyLabel || "Payment", opts.emptyCode || "PAY");
  }

  const netSum = round2(items.reduce((a, it) => a + lineNet(it), 0));
  absorbNetDrift(items, round2(pay - netSum));
  return items;
}

export function sumOmniItemNets(items: OmniAllocItem[]): number {
  return round2(items.reduce((a, it) => a + lineNet(it), 0));
}
