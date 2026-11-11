import assert from "node:assert/strict";
import test from "node:test";
import {
  allocateCatalogLinesToPayment,
  omniPriceQtySum,
  round2,
} from "./allocatePaymentLines";

function assertNo614(
  items: ReturnType<typeof allocateCatalogLinesToPayment>,
  pay: number,
) {
  for (const it of items) {
    const expect = omniPriceQtySum(it.itemPrice, it.itemQuantity);
    assert.ok(
      Math.abs(expect - it.itemSum) < 0.001,
      `614 risk: ${it.itemName} sum=${it.itemSum} expect=${expect} price=${it.itemPrice} qty=${it.itemQuantity}`,
    );
    assert.ok(it.discount <= it.itemSum + 0.001);
    assert.equal(it.discount, 0, `residual discount on ${it.itemName}: ${it.discount}`);
  }
  const net = round2(items.reduce((a, it) => a + it.itemSum - it.discount, 0));
  assert.ok(Math.abs(net - pay) < 0.02, `net ${net} != pay ${pay}`);
}

test("discounted order: itemSum === price×qty (Omni 614)", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 75,
    orderGrandTotal: 75,
    orderDiscount: 25,
    vatPercent: 18,
    items: [
      { productName: "A", sku: "A", quantity: 2, unitPrice: 25 },
      { productName: "B", sku: "B", quantity: 1, unitPrice: 50 },
    ],
  });
  assertNo614(items, 75);
});

test("single-line discount 100→75", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 75,
    orderGrandTotal: 75,
    orderDiscount: 25,
    vatPercent: 0,
    items: [{ productName: "X", sku: "X", quantity: 1, unitPrice: 100 }],
  });
  assert.equal(items.length, 1);
  assertNo614(items, 75);
});

test("skips free/zero price lines", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 75,
    orderGrandTotal: 75,
    orderDiscount: 0,
    vatPercent: 0,
    items: [
      { productName: "Soda", sku: "S", quantity: 5, unitPrice: 15 },
      { productName: "Free fries", sku: "F", quantity: 1, unitPrice: 0 },
    ],
  });
  assert.equal(items.length, 1);
  assertNo614(items, 75);
});

test("partial card payment on discounted order", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 30,
    orderGrandTotal: 75,
    orderDiscount: 25,
    vatPercent: 0,
    items: [
      { productName: "A", sku: "A", quantity: 2, unitPrice: 25 },
      { productName: "B", sku: "B", quantity: 1, unitPrice: 50 },
    ],
  });
  assertNo614(items, 30);
});

test("fractional kg with discount", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 40,
    orderGrandTotal: 40,
    orderDiscount: 10,
    vatPercent: 0,
    items: [{ productName: "Chicken", sku: "C", quantity: 0.75, unitPrice: 66.67 }],
  });
  assertNo614(items, 40);
});

test("partial return must not invent fee from oversized grandTotal", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 30,
    // Correct: return total (= returned merch), not parent POS GT 75
    orderGrandTotal: 50,
    orderDiscount: 0,
    vatPercent: 0,
    items: [{ productName: "A", sku: "A", quantity: 1, unitPrice: 50 }],
  });
  assert.equal(items.some((it) => it.itemCodeType === 3), false);
  assertNo614(items, 30);
});

test("taxed discounted order scales into baked prices", () => {
  const items = allocateCatalogLinesToPayment({
    paymentAmount: 106.2,
    orderGrandTotal: 106.2,
    orderDiscount: 10,
    vatPercent: 18,
    items: [{ productName: "A", sku: "A", quantity: 1, unitPrice: 100 }],
  });
  assertNo614(items, 106.2);
});
