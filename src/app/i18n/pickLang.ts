import type { Language } from "./translations";
import inlineRuMap from "./inlineRuMap";

const ruLookup = inlineRuMap as Record<string, string>;

/** Resolve Russian for an English UI string (inline helpers + map). */
export function ruFor(en: string, ru?: string): string {
  if (ru != null && ru !== "") return ru;
  return ruLookup[en] ?? en;
}

/** Pick localized string. Argument order matches existing helpers: (az, en, ru?). */
export function pickLang(language: Language, az: string, en: string, ru?: string): string {
  if (language === "az") return az;
  if (language === "ru") return ruFor(en, ru);
  return en;
}

/** Resolve a local { en, az, ru? } row for the active language (RU via map when unset). */
export function mapLang(
  language: Language,
  row: { en: string; az: string; ru?: string } | undefined,
  fallbackKey?: string,
): string {
  if (!row) return fallbackKey ?? "";
  return pickLang(language, row.az, row.en, row.ru);
}
