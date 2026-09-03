import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { FinanceCategory, BankAccountRow, IncomeListRow } from "../../api/finance";
import type { BranchSwitcherStore } from "../../api/stores";
import { notifyFromError } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
export interface IncomeFormData {
  date: string;
  categoryId: string;
  storeId: string;
  amount: string;
  accountId: string;
  notes: string;
  reference?: string;
}

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incomeData: IncomeFormData) => Promise<void>;
  categories: FinanceCategory[];
  bankAccounts: BankAccountRow[];
  branches: BranchSwitcherStore[];
  isGlobalMode: boolean;
  defaultStoreId?: string | null;
  editIncome?: IncomeListRow | null;
  onManageCategories?: () => void;
}

export function AddIncomeModal({
  isOpen,
  onClose,
  onSave,
  categories,
  bankAccounts,
  branches,
  isGlobalMode,
  defaultStoreId,
  editIncome,
  onManageCategories,
}: AddIncomeModalProps) {
  const { language } = useLanguage();
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [storeId, setStoreId] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [notes, setNotes] = useState("");
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = !!editIncome;
  const activeCategories = categories.filter((c) => c.isActive);
  const activeAccounts = bankAccounts.filter((a) => a.status === "ACTIVE");

  useEffect(() => {
    if (!isOpen) {
      setDate("");
      setCategoryId("");
      setStoreId("");
      setAmount("");
      setAccountId("");
      setNotes("");
      setReference("");
      setSaving(false);
      return;
    }
    if (editIncome) {
      setDate(editIncome.date.slice(0, 10));
      setCategoryId(editIncome.categoryId ?? "");
      setStoreId(editIncome.storeId ?? "");
      setAmount(editIncome.amount);
      setAccountId(editIncome.accountId ?? "");
      setNotes(editIncome.notes);
      setReference(editIncome.reference ?? "");
    } else if (!isGlobalMode && defaultStoreId) {
      setStoreId(defaultStoreId);
    }
  }, [isOpen, editIncome, isGlobalMode, defaultStoreId]);

  const handleSave = async () => {
    const resolvedStoreId = isGlobalMode ? storeId : (storeId || defaultStoreId || "");
    if (!date || !categoryId || !resolvedStoreId || (!isEdit && (!amount || parseFloat(amount) <= 0 || !accountId))) {
      notifyFromError(
        new Error(
          isGlobalMode && !resolvedStoreId
            ? tr("Zəhmət olmasa filial seçin", "Please select a branch")
            : tr("Zəhmət olmasa bütün tələb olunan sahələri doldurun", "Please fill all required fields"),
        ),
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({
        date,
        categoryId,
        storeId: resolvedStoreId,
        amount,
        accountId,
        notes: notes.trim(),
        reference: reference.trim() || undefined,
      });
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !saving) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{isEdit ? tr("Gəliri Redaktə Et", "Edit Income") : tr("Gəlir Əlavə Et", "Add Income")}</h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3">
          {isGlobalMode && !isEdit && (
            <p className="text-[10px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded">
              {tr("Bütün filiallar seçilib — gəlir üçün filial seçməlisiniz.", "All branches selected — you must pick a branch for income.")}
            </p>
          )}

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Tarix", "Date")} <span className="text-red-500">*</span></label>
            <DateInput value={date} onChange={setDate} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Kateqoriya", "Category")} <span className="text-red-500">*</span></label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer">
              <option value="">{tr("Seçin", "Select")}</option>
              {activeCategories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
            {activeCategories.length === 0 && (
              <div className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400">
                <p>
                  {tr(
                    "Kateqoriya gəlirin mənbəyini/növünü göstərir (məs. Xidmət haqqı, Satış). Əvvəlcə kateqoriya əlavə edin.",
                    "A category describes the income type (e.g. Service fees, Sales). Add categories before creating income.",
                  )}
                </p>
                {onManageCategories && (
                  <button
                    type="button"
                    onClick={onManageCategories}
                    className="mt-1 underline font-medium hover:text-amber-900 dark:hover:text-amber-300"
                  >
                    {tr("Kateqoriyaları idarə et", "Manage categories")}
                  </button>
                )}
              </div>
            )}
          </div>

          {(isGlobalMode || isEdit) && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Mağaza / Filial", "Store / Branch")} <span className="text-red-500">*</span></label>
              <select value={storeId} onChange={(e) => setStoreId(e.target.value)} disabled={isEdit} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer disabled:opacity-60">
                <option value="">{tr("Seçin", "Select")}</option>
                {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("İstinad", "Reference")}</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Məbləğ", "Amount")} {!isEdit && <span className="text-red-500">*</span>}</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isEdit} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] disabled:opacity-60" />
              {isEdit && <p className="text-[10px] text-gray-500 mt-0.5">{tr("Məbləği dəyişmək olmur", "Amount cannot be changed")}</p>}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Hesab", "Account")} {!isEdit && <span className="text-red-500">*</span>}</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} disabled={isEdit} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer disabled:opacity-60">
                <option value="">{tr("Seçin", "Select")}</option>
                {activeAccounts.map((a) => (<option key={a.id} value={a.id}>{a.accountHolderName}</option>))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Qeydlər", "Notes")}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={2000} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none" />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button onClick={onClose} disabled={saving} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button onClick={() => void handleSave()} disabled={saving} className="px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? tr("Saxlanılır...", "Saving...") : isEdit ? tr("Yadda Saxla", "Save") : tr("Gəlir Əlavə Et", "Add Income")}
          </button>
        </div>
      </div>
    </div>
  );
}
