/** Half-up rounding to integer minor units (qəpik). */
export function roundHalfUp(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.sign(n) * Math.floor(Math.abs(n) + 0.5);
}

/**
 * Line total in minor units: grams × unitPriceMinorPerKg / 1000.
 * Example: 1250 g × 480 qəpik/kg / 1000 = 600 → 6.00 AZN.
 */
export function scaleLineTotalMinor(
  grams: number,
  unitPriceMinorPerKg: number,
): number {
  return roundHalfUp((grams * unitPriceMinorPerKg) / 1000);
}

/** Convert major currency (AZN) to integer qəpik. */
export function toMinorUnits(major: number): number {
  return roundHalfUp(major * 100);
}

/** Convert qəpik to major AZN string with 2 decimals. */
export function fromMinorUnits(minor: number): string {
  return (minor / 100).toFixed(2);
}

/** Grams → kg quantity with 3 decimal places (matches POS Decimal(12,3)). */
export function gramsToKgQuantity(grams: number): number {
  return Math.round(grams) / 1000;
}
