import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildProfile17Barcode, normalizeScaleItemCodeInput } from "./buildLabel";
import { decodeScaleBarcode } from "./decode";

describe("buildProfile17Barcode", () => {
  it("builds worked example 00123 / 1250g", () => {
    assert.equal(buildProfile17Barcode("123", 1250), "2700123012505");
    assert.equal(buildProfile17Barcode("00123", 1250), "2700123012505");
  });

  it("round-trips through decoder", () => {
    const code = buildProfile17Barcode("42", 250);
    const r = decodeScaleBarcode(code, [17]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.itemCode, "00042");
    assert.equal(r.grams, 250);
  });

  it("rejects invalid grams", () => {
    assert.throws(() => buildProfile17Barcode("1", 0));
    assert.throws(() => buildProfile17Barcode("1", 100000));
  });
});

describe("normalizeScaleItemCodeInput", () => {
  it("pads and trims", () => {
    assert.equal(normalizeScaleItemCodeInput("123"), "00123");
    assert.equal(normalizeScaleItemCodeInput("00123"), "00123");
    assert.equal(normalizeScaleItemCodeInput(""), null);
  });
});
