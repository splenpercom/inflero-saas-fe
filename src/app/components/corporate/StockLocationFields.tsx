import { useEffect, useMemo } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useStockLocations } from "../../hooks/useStockLocations";
import { ModernSelect } from "../ui/ModernSelect";

import { pickLang } from "../../i18n/pickLang";
export interface StockLocationValue {
  storeId: string | null;
}

interface StockLocationFieldsProps {
  value: StockLocationValue;
  onChange: (value: StockLocationValue) => void;
  disabled?: boolean;
  /**
   * When a branch is selected in the header, lock this field to that store
   * (adjustments / transfer "from"). Set false for transfer "to" so another
   * branch can be chosen.
   */
  lockToSelectedBranch?: boolean;
  /** Hide these store ids from the dropdown (e.g. exclude the transfer source). */
  excludeStoreIds?: Array<string | null | undefined>;
}

export function StockLocationFields({
  value,
  onChange,
  disabled = false,
  lockToSelectedBranch = true,
  excludeStoreIds,
}: StockLocationFieldsProps) {
  const { language } = useLanguage();
  const { branches, loading, effectiveStoreId, branchSelected } = useStockLocations();

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const locked = lockToSelectedBranch && branchSelected && !!effectiveStoreId;

  useEffect(() => {
    if (!locked || !effectiveStoreId) return;
    if (value.storeId === effectiveStoreId) return;
    onChange({ storeId: effectiveStoreId });
  }, [locked, effectiveStoreId, value.storeId, onChange]);

  const exclude = useMemo(() => {
    const ids = new Set<string>();
    for (const id of excludeStoreIds ?? []) {
      if (id) ids.add(id);
    }
    return ids;
  }, [excludeStoreIds]);

  const options = useMemo(
    () =>
      branches
        .filter((b) => !exclude.has(b.id))
        .map((b) => ({ value: b.id, label: b.name })),
    [branches, exclude],
  );

  if (locked) {
    const branchName =
      branches.find((b) => b.id === effectiveStoreId)?.name ??
      tr("Seçilmiş filial", "Selected branch");
    return (
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Filial", "Branch")}
        </label>
        <p className="text-xs text-gray-600 dark:text-gray-400 px-2.5 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          {branchName}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
        {tr("Filial", "Branch")} <span className="text-red-500">*</span>
      </label>
      <ModernSelect
        value={value.storeId ?? ""}
        onChange={(id) => onChange({ storeId: id || null })}
        className="w-full"
        placeholder={loading ? tr("Yüklənir...", "Loading...") : tr("Seçin", "Select")}
        options={options}
        disabled={disabled || loading}
      />
      {!loading && options.length === 0 && (
        <p className="text-[10px] text-gray-500 mt-1">
          {tr("Filial tapılmadı", "No branches found")}
        </p>
      )}
    </div>
  );
}

export function locationsEqual(a: StockLocationValue, b: StockLocationValue): boolean {
  return a.storeId === b.storeId;
}

export function isLocationValid(loc: StockLocationValue): boolean {
  return !!loc.storeId;
}
