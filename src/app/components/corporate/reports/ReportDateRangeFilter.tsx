import { useLanguage } from "../../../i18n/LanguageContext";
import type { DateRangePreset } from "../../../lib/reportMappers";
import { DateInput } from "../../ui/DateInput";

import { pickLang } from "../../../i18n/pickLang";
interface ReportDateRangeFilterProps {
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  className?: string;
  includeYear?: boolean;
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
}: ReportDateRangeFilterProps) {
  const { language } = useLanguage();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={preset}
        onChange={(e) => onPresetChange(e.target.value as DateRangePreset)}
        className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
      >
        <option value="week">{pt("This Week", "Bu Həftə")}</option>
        <option value="month">{pt("This Month", "Bu Ay")}</option>
        <option value="quarter">{pt("This Quarter", "Bu Rüb")}</option>
        {includeYear && <option value="year">{pt("This Year", "Bu İl")}</option>}
        <option value="custom">{pt("Custom Range", "Xüsusi Aralıq")}</option>
      </select>
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
