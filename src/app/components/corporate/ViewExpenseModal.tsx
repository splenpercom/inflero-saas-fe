import { X, Check, XCircle, Edit2, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { cn } from "../ui/utils";
import type { BankAccountRow, ExpenseListRow } from "../../api/finance";
import { formatFinanceDate, mapExpenseStatusLabel, parseFinanceMoney } from "../../lib/financeMappers";

import { pickLang } from "../../i18n/pickLang";
interface ViewExpenseModalProps {
  expense: ExpenseListRow | null;
  bankAccounts: BankAccountRow[];
  onClose: () => void;
  onEdit?: (expense: ExpenseListRow) => void;
  onApprove?: (expense: ExpenseListRow) => void;
  onReject?: (expense: ExpenseListRow) => void;
  onDelete?: (expense: ExpenseListRow) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function ViewExpenseModal({
  expense,
  bankAccounts,
  onClose,
  onEdit,
  onApprove,
  onReject,
  onDelete,
  canEdit,
  canDelete,
}: ViewExpenseModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  if (!expense) return null;

  const bankAccount = bankAccounts.find((a) => a.id === expense.accountId);
  const bankLabel = bankAccount
    ? `${bankAccount.accountHolderName} (${bankAccount.accountNo})`
    : "—";

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "PENDING":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "REJECTED":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const detail = (label: string, value: string) => (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value || "—"}</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Xərc Məlumatları", "Expense Details")}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr("Xərc", "Expense")}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{expense.expenseName}</p>
            </div>
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium shrink-0",
                getStatusBadgeColor(expense.status),
              )}
            >
              {mapExpenseStatusLabel(expense.status, tr)}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 grid grid-cols-2 gap-3">
            {detail(tr("İstinad", "Reference"), expense.reference ?? "—")}
            {detail(tr("Kateqoriya", "Category"), expense.category)}
            {detail(tr("Tarix", "Date"), formatFinanceDate(expense.date))}
            {detail(tr("Məbləğ", "Amount"), `${parseFinanceMoney(expense.amount).toFixed(2)} AZN`)}
            {detail(tr("Bank Hesabı", "Bank Account"), bankLabel)}
          </div>

          {expense.description && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr("Təsvir", "Description")}</p>
              <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{expense.description}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          {canDelete && expense.status !== "APPROVED" && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="w-3 h-3" />
              {tr("Sil", "Delete")}
            </button>
          )}
          {canEdit && expense.status === "PENDING" && onReject && (
            <button
              type="button"
              onClick={() => onReject(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-3 h-3" />
              {tr("Rədd et", "Reject")}
            </button>
          )}
          {canEdit && expense.status === "PENDING" && onApprove && (
            <button
              type="button"
              onClick={() => onApprove(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <Check className="w-3 h-3" />
              {tr("Təsdiqlə", "Approve")}
            </button>
          )}
          {canEdit && expense.status === "PENDING" && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(expense)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Edit2 className="w-3 h-3" />
              {tr("Redaktə", "Edit")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
