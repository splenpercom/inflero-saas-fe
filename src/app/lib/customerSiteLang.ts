export type CustomerSiteLang = "en" | "az" | "tr";

export const CUSTOMER_SITE_LANGS: CustomerSiteLang[] = ["az", "en", "tr"];

export const CUSTOMER_SITE_LANG_OPTIONS: { code: CustomerSiteLang; label: string }[] = [
  { code: "az", label: "Azərbaycan" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
];

export function nextCustomerSiteLang(current: CustomerSiteLang): CustomerSiteLang {
  const index = CUSTOMER_SITE_LANGS.indexOf(current);
  return CUSTOMER_SITE_LANGS[(index + 1) % CUSTOMER_SITE_LANGS.length];
}

export const MONTHS: Record<CustomerSiteLang, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  az: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
};

export const DAY_SHORT: Record<CustomerSiteLang, string[]> = {
  en: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
  az: ["Bz", "Be", "Ça", "Çə", "Ca", "Cü", "Şb"],
  tr: ["Pz", "Pt", "Sa", "Ça", "Pe", "Cu", "Ct"],
};

export const WEEKDAYS: Record<CustomerSiteLang, string[]> = {
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  az: ["B.e", "Ça", "Çər", "Ca", "Cüm", "Şnb", "Baz"],
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
};

export function pickText(lang: CustomerSiteLang, en: string, az: string, tr: string): string {
  if (lang === "az") return az;
  if (lang === "tr") return tr;
  return en;
}

export interface LocalizedServiceOption {
  value: string;
  label: string;
  labelAz: string;
  labelTr?: string;
}

export function serviceOptionLabel(option: LocalizedServiceOption, lang: CustomerSiteLang): string {
  if (lang === "az") return option.labelAz;
  if (lang === "tr") return option.labelTr ?? option.label;
  return option.label;
}

export function otherServiceFallback(lang: CustomerSiteLang): string {
  return pickText(lang, "Other", "Digər", "Diğer");
}
