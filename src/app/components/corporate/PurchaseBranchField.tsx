import { useLanguage } from "../../i18n/LanguageContext";
import { useBranch } from "../../context/BranchContext";

import { pickLang } from "../../i18n/pickLang";
interface PurchaseBranchFieldProps {
  value: string;
  onChange: (storeId: string) => void;
  /** When true, show required indicator and validation hint for Received / stock booking */
  required?: boolean;
  /** Existing branch on record (read-only when branch is locked to sidebar) */
  existingStoreName?: string | null;
}

export function PurchaseBranchField({
  value,
  onChange,
  required = true,
  existingStoreName,
}: PurchaseBranchFieldProps) {
  const { language } = useLanguage();
  const { branches, branchId, selectedBranch, isGlobalMode, isBranchLocked } = useBranch();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  if (!isGlobalMode && branchId && selectedBranch) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Filial", "Branch")}
        </label>
        <p className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
          {selectedBranch.name}
        </p>
      </div>
    );
  }

  if (!isGlobalMode && existingStoreName) {
    return (
      <div>
        <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
          {tr("Filial", "Branch")}
        </label>
        <p className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
          {existingStoreName}
        </p>
      </div>
    );
  }

  return (
    <div>
      <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
        {tr("Filial", "Branch")} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isBranchLocked && !!branchId}
        className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
      >
        <option value="">{tr("Filial seçin", "Select branch")}</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      <p className="mt-1 text-[10px] text-amber-700 dark:text-amber-400">
        {tr(
          "Qəbul edilmiş satınalmalar stoka yazılır — filial mütləqdir.",
          "Received purchases update stock — a branch is required.",
        )}
      </p>
    </div>
  );
}

/** Resolve storeId to send to API from sidebar + modal selection */
export function resolvePurchaseStoreIdForApi(
  isGlobalMode: boolean,
  sidebarBranchId: string | null,
  modalStoreId: string,
): string | null {
  if (!isGlobalMode && sidebarBranchId) return sidebarBranchId;
  return modalStoreId.trim() || null;
}
