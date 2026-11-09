/** Table-driven Rongta / EAN variable-measure barcode profiles. Only 17 is enabled for MVP. */

export interface ProfileDef {
  id: number;
  length: 13 | 18;
  /** Fixed prefix (e.g. profile 17 → "27"). */
  prefix?: string;
  /** [start, end) slice for item code digits — keep as string. */
  item: [number, number];
  weightGrams?: { range: [number, number]; multiplier: number };
  priceMinor?: { range: [number, number] };
  checksum: "ean13" | "none-verified";
}

/**
 * Profile 17 (MVP): `27` + 5-digit item + 5-digit weight grams + EAN-13 check.
 * Profiles 15/12 are documented stubs — do not enable without real label evidence.
 */
export const SCALE_PROFILES: Record<number, ProfileDef> = {
  17: {
    id: 17,
    length: 13,
    prefix: "27",
    item: [2, 7],
    weightGrams: { range: [7, 12], multiplier: 1 },
    checksum: "ean13",
  },
  // Disabled until Phase 0 confirms site labels:
  // 15: { id: 15, length: 13, prefix: "25", item: [2, 8], weightGrams: { range: [8, 12], multiplier: 1 }, checksum: "ean13" },
  // 12: { id: 12, length: 13, prefix: "22", item: [2, 7], priceMinor: { range: [7, 12] }, checksum: "ean13" },
};

export const DEFAULT_ENABLED_SCALE_PROFILES: number[] = [17];

/** Soft/hard weight bounds (grams). Warn below min; block above max / ≤0. */
export const SCALE_WEIGHT_BOUNDS = {
  /** RLS1000F min; warn only. */
  minGramsWarn: 40,
  /** RLS1100F max capacity; hard block. */
  maxGramsBlock: 30000,
} as const;
