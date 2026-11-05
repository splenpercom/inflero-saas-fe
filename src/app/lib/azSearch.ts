/**
 * Fold Azerbaijani letters so Latin search matches diacritics:
 * U↔ü, E↔ə, G↔ğ, O↔ö, i↔ı (and İ/I).
 * Applied to both needle and haystack before substring match.
 */
const AZ_SEARCH_FROM = "ÜüƏəĞğÖöİIı";
const AZ_SEARCH_TO = "UuEeGgOoiii";

export function foldAzForSearch(input: string): string {
  let out = "";
  for (const ch of input) {
    const i = AZ_SEARCH_FROM.indexOf(ch);
    out += i >= 0 ? AZ_SEARCH_TO[i]! : ch;
  }
  return out.toLocaleLowerCase("en-US");
}

/** True when folded haystack contains folded needle (empty needle → true). */
export function matchesAzSearch(haystack: string, needle: string): boolean {
  const q = foldAzForSearch(needle.trim());
  if (!q) return true;
  return foldAzForSearch(haystack).includes(q);
}

/** True when any haystack matches the needle under AZ folding. */
export function anyMatchesAzSearch(
  haystacks: Array<string | null | undefined>,
  needle: string,
): boolean {
  const q = foldAzForSearch(needle.trim());
  if (!q) return true;
  return haystacks.some(
    (h) => h != null && h !== "" && foldAzForSearch(h).includes(q),
  );
}
