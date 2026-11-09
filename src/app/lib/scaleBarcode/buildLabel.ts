import { ean13CheckDigit } from "./decode";

/**
 * Build a profile-17 EAN-13 for client/UAT testing without a physical scale.
 * itemCode: 1–5 digits (left-padded to 5). grams: 1–99999.
 *
 * Example: buildProfile17Barcode("123", 1250) → "2700123012505"
 * Paste into POS search and press Enter (with Scale label scan enabled).
 */
export function normalizeScaleItemCodeInput(raw: string): string | null {
  const digits = String(raw ?? "").trim().replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length > 5) return digits.slice(-5);
  return digits.padStart(5, "0");
}

export function buildProfile17Barcode(itemCodeRaw: string, grams: number): string {
  const item = normalizeScaleItemCodeInput(itemCodeRaw);
  if (!item || !/^\d{5}$/.test(item)) {
    throw new Error("itemCode must be 1–5 digits");
  }
  const g = Math.round(Number(grams));
  if (!Number.isFinite(g) || g <= 0 || g > 99999) {
    throw new Error("grams must be 1–99999");
  }
  const weight = String(g).padStart(5, "0");
  const payload12 = `27${item}${weight}`;
  return payload12 + ean13CheckDigit(payload12);
}
