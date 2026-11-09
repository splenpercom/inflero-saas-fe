import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeScaleBarcode, ean13CheckDigit, normalizeScan } from "./decode";
import { gramsToKgQuantity, scaleLineTotalMinor, toMinorUnits } from "./price";

describe("ean13CheckDigit", () => {
  it("matches worked profile-17 example", () => {
    assert.equal(ean13CheckDigit("270012301250"), "5");
  });
});

describe("normalizeScan", () => {
  it("strips CR/LF/Tab but keeps leading zeros", () => {
    assert.equal(normalizeScan("2700123012505\r\n"), "2700123012505");
    assert.equal(normalizeScan("00123"), "00123");
  });
});

describe("decodeScaleBarcode profile 17", () => {
  it("decodes item + grams", () => {
    const r = decodeScaleBarcode("2700123012505", [17]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.profile, 17);
    assert.equal(r.itemCode, "00123");
    assert.equal(r.grams, 1250);
  });

  it("rejects bad checksum", () => {
    const r = decodeScaleBarcode("2700123012504", [17]);
    assert.deepEqual(r, {
      ok: false,
      reason: "bad_checksum",
      raw: "2700123012504",
    });
  });

  it("accepts trailing CR/LF", () => {
    const r = decodeScaleBarcode("2700123012505\r\n", [17]);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.itemCode, "00123");
    assert.equal(r.grams, 1250);
  });

  it("profile_disabled when 17 not enabled", () => {
    const r = decodeScaleBarcode("2700123012505", [15]);
    assert.deepEqual(r, {
      ok: false,
      reason: "profile_disabled",
      raw: "2700123012505",
    });
  });

  it("normal EAN is not_scale_barcode (fallthrough)", () => {
    const r = decodeScaleBarcode("4006381333931", [17]);
    assert.deepEqual(r, {
      ok: false,
      reason: "not_scale_barcode",
      raw: "4006381333931",
    });
  });

  it("zero weight rejected", () => {
    // 27 + 00123 + 00000 + check
    const payload12 = "270012300000";
    const full = payload12 + ean13CheckDigit(payload12);
    const r = decodeScaleBarcode(full, [17]);
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "zero_weight");
  });

  it("alphanumeric SKU is not_scale_barcode", () => {
    const r = decodeScaleBarcode("SKU-ABC-1", [17]);
    assert.equal(r.ok, false);
    if (r.ok) return;
    assert.equal(r.reason, "not_scale_barcode");
  });
});

describe("scale price math", () => {
  it("1250g × 4.80 AZN/kg = 6.00 AZN", () => {
    const minor = scaleLineTotalMinor(1250, toMinorUnits(4.8));
    assert.equal(minor, 600);
    assert.equal(gramsToKgQuantity(1250), 1.25);
  });
});
