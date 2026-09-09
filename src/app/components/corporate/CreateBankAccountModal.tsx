import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { BankAccountRow } from "../../api/finance";
import {
  mapBankAccountStatusLabel,
  mapBankAccountTypeLabel,
  type BankAccountStatusApi,
  type BankAccountTypeApi,
} from "../../lib/financeMappers";
import { notifyFromError } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
export interface BankAccountFormData {
  holderName: string;
  accountNumber: string;
  accountType: BankAccountTypeApi;
  openingBalance: string;
  description: string;
  status: BankAccountStatusApi;
}

interface CreateBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountData: BankAccountFormData) => Promise<void>;
  editAccount?: BankAccountRow | null;
  isEdit?: boolean;
}

export function CreateBankAccountModal({
  isOpen,
  onClose,
  onSave,
  editAccount,
  isEdit = false,
}: CreateBankAccountModalProps) {
  const { language } = useLanguage();
  const [holderName, setHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState<BankAccountTypeApi | "">("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<BankAccountStatusApi>("ACTIVE");
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen) {
      setHolderName("");
      setAccountNumber("");
      setAccountType("");
      setOpeningBalance("");
      setDescription("");
      setStatus("ACTIVE");
      setSaving(false);
      return;
    }
    if (isEdit && editAccount) {
      setHolderName(editAccount.accountHolderName);
      setAccountNumber(editAccount.accountNo);
      setAccountType(editAccount.type);
      setOpeningBalance(editAccount.openingBalance);
      setDescription(editAccount.notes);
      setStatus(editAccount.status);
    }
  }, [isOpen, isEdit, editAccount]);

  const handleSave = async () => {
    if (!holderName.trim() || !accountNumber.trim() || !accountType) {
      notifyFromError(
        new Error(tr("Zəhmət olmasa bütün tələb olunan sahələri doldurun", "Please fill all required fields")),
      );
      return;
    }
    if (!isEdit && openingBalance === "") {
      notifyFromError(
        new Error(tr("Zəhmət olmasa bütün tələb olunan sahələri doldurun", "Please fill all required fields")),
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({
        holderName: holderName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        openingBalance: openingBalance || "0",
        description: description.trim(),
        status,
      });
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Hesabı Redaktə Et", "Edit Account") : tr("Hesab Yarat", "Create Account")}
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Hesab Sahibinin Adı", "Account Holder Name")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Hesab Nömrəsi", "Account Number")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Hesab Növü", "Account Type")} <span className="text-red-500">*</span>
            </label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value as BankAccountTypeApi)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              <option value="">{tr("Seçin", "Select")}</option>
              {(["SAVINGS", "CURRENT", "SALARY", "BUSINESS", "INVESTMENT"] as const).map((t) => (
                <option key={t} value={t}>
                  {mapBankAccountTypeLabel(t, tr)}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Başlanğıc Balansı", "Opening Balance")} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Təsvir", "Description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Hesab Statusu", "Account Status")} <span className="text-red-500">*</span>
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BankAccountStatusApi)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              {(["ACTIVE", "INACTIVE", "SUSPENDED", "CLOSED"] as const).map((s) => (
                <option key={s} value={s}>
                  {mapBankAccountStatusLabel(s, tr)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !holderName || !accountNumber || !accountType || (!isEdit && !openingBalance)}
            className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? tr("Saxlanılır...", "Saving...")
              : isEdit
                ? tr("Yadda Saxla", "Save")
                : tr("Hesab Əlavə Et", "Add Account")}
          </button>
        </div>
      </div>
    </div>
  );
}
