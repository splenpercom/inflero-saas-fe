import { useEffect } from "react";
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
}

export function StockLocationFields({ value, onChange, disabled = false }: StockLocationFieldsProps) {
  const { language } = useLanguage();
  const { branches, loading, effectiveStoreId, branchSelected } = useStockLocations();

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (branchSelected && effectiveStoreId) {
      onChange({ storeId: effectiveStoreId });
    }
  }, [branchSelected, effectiveStoreId]);

  if (branchSelected) {
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
        placeholder={loading ? tr("Yüklənir...", "Loading...") : tr("Seçin", "Select")}
        options={branches.map((b) => ({ value: b.id, label: b.name }))}
        disabled={disabled || loading}
      />
      {!loading && branches.length === 0 && (
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
