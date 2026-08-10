import { useMemo, useState } from "react";
import { resolveReportDateRange, type DateRangePreset } from "../lib/reportMappers";

export function useReportDateRange(defaultPreset: DateRangePreset = "month") {
  const [preset, setPreset] = useState<DateRangePreset>(defaultPreset);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const { dateFrom, dateTo } = useMemo(
    () => resolveReportDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  return {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
  };
}
