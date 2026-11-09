import { SCALE_PROFILES, type ProfileDef } from "./profiles";

export function ean13CheckDigit(payload12: string): string {
  if (!/^\d{12}$/.test(payload12)) throw new Error("bad EAN payload");
  const sum = [...payload12].reduce(
    (t, ch, i) => t + Number(ch) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return String((10 - (sum % 10)) % 10);
}

/** Strip scanner Enter/Tab suffix; keep leading zeros. */
export function normalizeScan(raw: string): string {
  return raw.replace(/[\r\n\t]+$/g, "").trim();
}

export type DecodeOk = {
  ok: true;
  profile: number;
  itemCode: string;
  grams?: number;
  priceMinor?: number;
  raw: string;
};

export type DecodeFail = {
  ok: false;
  reason:
    | "not_scale_barcode"
    | "bad_length"
    | "bad_checksum"
    | "profile_disabled"
    | "zero_weight";
  raw: string;
};

export type DecodeResult = DecodeOk | DecodeFail;

function findProfileByPrefix(raw: string): ProfileDef | undefined {
  return Object.values(SCALE_PROFILES).find(
    (p) => p.length === raw.length && p.prefix && raw.startsWith(p.prefix),
  );
}

/**
 * Decode a Rongta/EAN scale label. Non-scale codes return `not_scale_barcode`
 * so callers fall through to normal SKU/barcode lookup.
 */
export function decodeScaleBarcode(
  rawInput: string,
  enabledProfiles: number[],
): DecodeResult {
  const raw = normalizeScan(rawInput);
  if (!/^\d+$/.test(raw)) return { ok: false, reason: "not_scale_barcode", raw };

  const def = findProfileByPrefix(raw);
  if (!def) return { ok: false, reason: "not_scale_barcode", raw };
  if (!enabledProfiles.includes(def.id)) {
    return { ok: false, reason: "profile_disabled", raw };
  }
  if (raw.length !== def.length) {
    return { ok: false, reason: "bad_length", raw };
  }

  if (def.checksum === "ean13") {
    if (raw.length < 13) return { ok: false, reason: "bad_length", raw };
    try {
      if (ean13CheckDigit(raw.slice(0, 12)) !== raw[12]) {
        return { ok: false, reason: "bad_checksum", raw };
      }
    } catch {
      return { ok: false, reason: "bad_checksum", raw };
    }
  }

  const itemCode = raw.slice(...def.item); // STRING — never Number()
  const out: DecodeOk = { ok: true, profile: def.id, itemCode, raw };

  if (def.weightGrams) {
    const digits = raw.slice(...def.weightGrams.range);
    if (!/^\d+$/.test(digits)) return { ok: false, reason: "zero_weight", raw };
    const g = Number(digits) * def.weightGrams.multiplier;
    if (!Number.isFinite(g) || g <= 0) {
      return { ok: false, reason: "zero_weight", raw };
    }
    out.grams = g;
  }
  if (def.priceMinor) {
    const digits = raw.slice(...def.priceMinor.range);
    if (/^\d+$/.test(digits)) out.priceMinor = Number(digits);
  }
  return out;
}
