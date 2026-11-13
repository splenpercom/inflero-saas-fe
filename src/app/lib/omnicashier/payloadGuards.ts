/**
 * OmniCashier payload guards.
 * Firmware returns code 1023 when unsigned Integer fields (e.g. prev_doc_number) are negative.
 */

/** Only emit prev_doc_number when it is a safe positive integer (Omni samples use ≥ 1). */
export function omniPrevDocNumberField(
  n?: number | null,
): { prev_doc_number: number } | Record<string, never> {
  if (n == null) return {};
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return {};
  return { prev_doc_number: Math.trunc(v) };
}
