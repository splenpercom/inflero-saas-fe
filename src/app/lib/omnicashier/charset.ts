/**
 * OmniCashier §5.4 itemName allowlist.
 * Spaces appear in official examples though not listed in the charset table.
 */

const ALLOWED_SPECIAL = new Set(
  ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")", "_", "-", "+", "=", "/", ",", ".", "<", ">", "`", "~", " "].map(
    (c) => c,
  ),
);

function isAllowedChar(ch: string): boolean {
  if (ALLOWED_SPECIAL.has(ch)) return true;
  const code = ch.codePointAt(0);
  if (code == null) return false;
  // Digits
  if (code >= 0x30 && code <= 0x39) return true;
  // Latin A-Z a-z
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) return true;
  // Cyrillic А-Я а-я + Ё ё
  if ((code >= 0x410 && code <= 0x44f) || code === 0x401 || code === 0x451) return true;
  // Azerbaijani: Ə ə Ğ ğ İ ı Ö ö Ş ş Ü ü Ç ç
  const az = "ƏəĞğİıÖöŞşÜüÇç";
  if (az.includes(ch)) return true;
  return false;
}

/** Strip illegal characters; collapse whitespace; fallback if empty. */
export function sanitizeOmniItemName(raw: string, fallback = "Item"): string {
  const cleaned = [...(raw ?? "")]
    .filter((ch) => isAllowedChar(ch))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}
