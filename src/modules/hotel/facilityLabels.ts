/** Known facility keys → display labels (AZ / EN). */
const FACILITY_LABELS: Record<string, { az: string; en: string }> = {
  smoking: { az: "Siqaret", en: "Smoking" },
  balcony: { az: "Balkon", en: "Balcony" },
  sea_view: { az: "Dəniz mənzərəsi", en: "Sea view" },
  wifi: { az: "Wi‑Fi", en: "Wi‑Fi" },
  ac: { az: "Kondisioner", en: "AC" },
  mini_bar: { az: "Mini bar", en: "Mini bar" },
  bathtub: { az: "Vanna", en: "Bathtub" },
};

/** Fallback: sea_view → "Sea view" */
function humanizeKey(key: string): string {
  return key
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function facilityLabel(key: string, language: string): string {
  const known = FACILITY_LABELS[key];
  if (known) return language === "az" ? known.az : known.en;
  return humanizeKey(key);
}
