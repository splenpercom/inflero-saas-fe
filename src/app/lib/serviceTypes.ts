export interface ServiceTypeOption {
  value: string;
  label: string;
  labelAz: string;
  labelTr?: string;
}

export const DEFAULT_SERVICE_TYPES: ServiceTypeOption[] = [
  { value: "oil-change", label: "Oil Change", labelAz: "Yağ dəyişimi", labelTr: "Yağ değişimi" },
  { value: "tire-change", label: "Tire Change", labelAz: "Şin dəyişimi", labelTr: "Lastik değişimi" },
  { value: "brake-service", label: "Brake Service", labelAz: "Əyləc xidməti", labelTr: "Fren servisi" },
  { value: "engine-diagnostics", label: "Engine Diagnostics", labelAz: "Mühərrik diaqnostikası", labelTr: "Motor diagnostiği" },
  { value: "ac-service", label: "A/C Service", labelAz: "Kondisioner xidməti", labelTr: "Klima servisi" },
  { value: "full-service", label: "Full Service", labelAz: "Tam texniki xidmət", labelTr: "Tam bakım" },
  { value: "inspection", label: "Inspection", labelAz: "Texniki baxış", labelTr: "Muayene" },
  { value: "other", label: "Other", labelAz: "Digər", labelTr: "Diğer" },
];

export function serviceLabelFor(
  value: string,
  language: "en" | "az" | "tr",
  options: ServiceTypeOption[] = DEFAULT_SERVICE_TYPES,
): string {
  const hit = options.find((s) => s.value === value);
  if (!hit) return value;
  if (language === "az") return hit.labelAz;
  if (language === "tr") return hit.labelTr ?? hit.label;
  return hit.label;
}

/** Map typed or selected label/value to the stored serviceType slug or custom text. */
export function resolveServiceType(
  input: string,
  options: ServiceTypeOption[] = DEFAULT_SERVICE_TYPES,
): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const lower = trimmed.toLowerCase();
  for (const s of options) {
    if (s.value === trimmed || s.value.toLowerCase() === lower) return s.value;
    if (s.label.toLowerCase() === lower || s.labelAz.toLowerCase() === lower || (s.labelTr?.toLowerCase() === lower)) return s.value;
  }
  return trimmed;
}
