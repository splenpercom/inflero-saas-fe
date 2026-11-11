import { useLanguage } from "../../../i18n/LanguageContext";
import type { DateRangePreset } from "../../../lib/reportMappers";
import { DateInput } from "../../ui/DateInput";
import { ModernSelect } from "../../ui/ModernSelect";

import { pickLang } from "../../../i18n/pickLang";
/** Extended preset used by list pages that also need an unbounded “All” window. */
export type ListDateRangePreset = DateRangePreset | "all";

interface ReportDateRangeFilterProps {
  preset: ListDateRangePreset;
  onPresetChange: (preset: ListDateRangePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  className?: string;
  includeYear?: boolean;
  /** When false, hides quarter (e.g. Today / Week / Month / Custom only). */
  includeQuarter?: boolean;
  /** Adds “All” (no date bound) — Purchases list, etc. */
  includeAll?: boolean;
  minWidth?: number;
}

export function ReportDateRangeFilter({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  className = "",
  includeYear = true,
  includeQuarter = true,
  includeAll = false,
  minWidth = 140,
}: ReportDateRangeFilterProps) {
  const { language } = useLanguage();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <ModernSelect
        value={preset}
        onChange={(value) => onPresetChange(value as ListDateRangePreset)}
        minWidth={minWidth}
        options={[
          ...(includeAll
            ? [{ value: "all", label: pt("Date: All", "Tarix: Hamısı") }]
            : []),
          { value: "today", label: pt("Today", "Bu Gün") },
          { value: "week", label: pt("This Week", "Bu Həftə") },
          { value: "month", label: pt("This Month", "Bu Ay") },
          ...(includeQuarter
            ? [{ value: "quarter", label: pt("This Quarter", "Bu Rüb") }]
            : []),
          ...(includeYear
            ? [{ value: "year", label: pt("This Year", "Bu İl") }]
            : []),
          { value: "custom", label: pt("Custom Range", "Xüsusi Aralıq") },
        ]}
      />
      {preset === "custom" && (
        <>
          <DateInput value={customFrom} onChange={onCustomFromChange} className="w-32" />
          <span className="text-xs text-gray-400">—</span>
          <DateInput value={customTo} onChange={onCustomToChange} className="w-32" />
        </>
      )}
    </div>
  );
}
