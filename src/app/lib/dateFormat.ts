import type { Language } from "../i18n/translations";
import { getStorageItem } from "./storageMigration";
import { STORAGE_KEYS } from "./storageKeys";

export const AZ_MONTHS_LONG = [
  "Yanvar",
  "Fevral",
  "Mart",
  "Aprel",
  "May",
  "İyun",
  "İyul",
  "Avqust",
  "Sentyabr",
  "Oktyabr",
  "Noyabr",
  "Dekabr",
] as const;

export const AZ_MONTHS_SHORT = [
  "Yan",
  "Fev",
  "Mar",
  "Apr",
  "May",
  "İyn",
  "İyl",
  "Avq",
  "Sen",
  "Okt",
  "Noy",
  "Dek",
] as const;

export const EN_MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export const EN_MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const RU_MONTHS_LONG = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
] as const;

export const RU_MONTHS_SHORT = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
] as const;

export const AZ_WEEKDAYS_LONG = [
  "Bazar",
  "Bazar ertəsi",
  "Çərşənbə axşamı",
  "Çərşənbə",
  "Cümə axşamı",
  "Cümə",
  "Şənbə",
] as const;

export const EN_WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const RU_WEEKDAYS_LONG = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
] as const;

export const AZ_WEEKDAYS_SHORT = ["B", "Be", "Ça", "Ç", "Ca", "C", "Ş"] as const;
export const EN_WEEKDAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"] as const;
export const RU_WEEKDAYS_SHORT = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] as const;

export function getAppLanguage(): Language {
  if (typeof window === "undefined") return "az";

  try {
    const saved = getStorageItem(localStorage, STORAGE_KEYS.language);
    return saved === "en" || saved === "az" || saved === "ru" ? saved : "az";
  } catch {
    return "az";
  }
}

function parseToDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const local = new Date(y, m - 1, d);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveLanguage(language?: Language): Language {
  return language ?? getAppLanguage();
}

function monthsShort(language: Language): readonly string[] {
  if (language === "az") return AZ_MONTHS_SHORT;
  if (language === "ru") return RU_MONTHS_SHORT;
  return EN_MONTHS_SHORT;
}

function monthsLong(language: Language): readonly string[] {
  if (language === "az") return AZ_MONTHS_LONG;
  if (language === "ru") return RU_MONTHS_LONG;
  return EN_MONTHS_LONG;
}

function weekdaysLong(language: Language): readonly string[] {
  if (language === "az") return AZ_WEEKDAYS_LONG;
  if (language === "ru") return RU_WEEKDAYS_LONG;
  return EN_WEEKDAYS_LONG;
}

/** e.g. 16 İyn 2026 / 16 Jun 2026 / 16 июн 2026 */
export function formatDate(value: string | Date, language?: Language): string {
  const lang = resolveLanguage(language);
  const d = parseToDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  const months = monthsShort(lang);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/** e.g. Çərşənbə, 16 İyun 2026 */
export function formatDateLong(value: string | Date, language?: Language): string {
  const lang = resolveLanguage(language);
  const d = parseToDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  const weekdays = weekdaysLong(lang);
  const months = monthsLong(lang);
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTime(value: string | Date, language?: Language): string {
  const d = parseToDate(value);
  if (!d) return "";
  const lang = resolveLanguage(language);
  const h = d.getHours();
  const m = d.getMinutes();
  const pad = (n: number) => String(n).padStart(2, "0");

  if (lang === "az" || lang === "ru") {
    return `${pad(h)}:${pad(m)}`;
  }

  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${pad(m)} ${period}`;
}

export function formatDateTime(value: string | Date, language?: Language): string {
  return `${formatDate(value, language)} ${formatTime(value, language)}`;
}

export function formatMonthYear(date: Date, language?: Language): string {
  const lang = resolveLanguage(language);
  const months = monthsLong(lang);
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatShortDateTime(value: string | Date, language?: Language): string {
  const lang = resolveLanguage(language);
  const d = parseToDate(value);
  if (!d) return typeof value === "string" ? value : "—";
  const months = monthsShort(lang);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${months[d.getMonth()]} ${d.getDate()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatNowDate(language?: Language): string {
  return formatDate(new Date(), language);
}

export function formatNowDateTime(language?: Language): string {
  return formatDateTime(new Date(), language);
}

const EN_TO_AZ_MONTH_SHORT: Record<string, string> = {
  Jan: "Yan",
  Feb: "Fev",
  Mar: "Mar",
  Apr: "Apr",
  May: "May",
  Jun: "İyn",
  Jul: "İyl",
  Aug: "Avq",
  Sep: "Sen",
  Oct: "Okt",
  Nov: "Noy",
  Dec: "Dek",
};

const EN_TO_AZ_MONTH_LONG: Record<string, string> = {
  January: "Yanvar",
  February: "Fevral",
  March: "Mart",
  April: "Aprel",
  May: "May",
  June: "İyun",
  July: "İyul",
  August: "Avqust",
  September: "Sentyabr",
  October: "Oktyabr",
  November: "Noyabr",
  December: "Dekabr",
};

const EN_TO_RU_MONTH_SHORT: Record<string, string> = {
  Jan: "янв",
  Feb: "фев",
  Mar: "мар",
  Apr: "апр",
  May: "май",
  Jun: "июн",
  Jul: "июл",
  Aug: "авг",
  Sep: "сен",
  Oct: "окт",
  Nov: "ноя",
  Dec: "дек",
};

const EN_TO_RU_MONTH_LONG: Record<string, string> = {
  January: "Январь",
  February: "Февраль",
  March: "Март",
  April: "Апрель",
  May: "Май",
  June: "Июнь",
  July: "Июль",
  August: "Август",
  September: "Сентябрь",
  October: "Октябрь",
  November: "Ноябрь",
  December: "Декабрь",
};

/** Localize API/chart month labels such as "Jan" or "Jan 2026". */
export function localizeMonthLabel(label: string, language?: Language): string {
  const lang = resolveLanguage(language);
  if (lang === "en") return label;

  const longMap = lang === "ru" ? EN_TO_RU_MONTH_LONG : EN_TO_AZ_MONTH_LONG;
  const shortMap = lang === "ru" ? EN_TO_RU_MONTH_SHORT : EN_TO_AZ_MONTH_SHORT;

  return label
    .replace(
      /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/g,
      (m) => longMap[m] ?? m,
    )
    .replace(
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g,
      (m) => shortMap[m] ?? m,
    );
}
