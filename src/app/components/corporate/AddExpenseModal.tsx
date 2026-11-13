import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import type { FinanceCategory } from "../../api/finance";
import type { BankAccountRow } from "../../api/finance";
import type { ExpenseListRow } from "../../api/finance";
import type { ExpenseStatusApi } from "../../lib/financeMappers";
import { mapExpenseStatusLabel } from "../../lib/financeMappers";
import { notifyFromError } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";
import { ModernSelect } from "../ui/ModernSelect";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { usePurchaseSuppliers } from "../../hooks/usePurchaseSuppliers";

import { pickLang } from "../../i18n/pickLang";

export type ExpensePartyType = "none" | "customer" | "supplier";

export interface ExpenseFormData {
  expenseName: string;
  description: string;
  categoryId: string;
  accountId: string;
  userId: string;
  customerId: string;
  supplierId: string;
  date: string;
  amount: string;
  reference?: string;
  status: ExpenseStatusApi;
}

export type ExpenseEmployeeOption = { id: string; name: string };

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expenseData: ExpenseFormData) => Promise<void>;
  categories: FinanceCategory[];
  bankAccounts: BankAccountRow[];
  employees?: ExpenseEmployeeOption[];
  editExpense?: ExpenseListRow | null;
  onManageCategories?: () => void;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  onSave,
  categories,
  bankAccounts,
  employees = [],
  editExpense,
  onManageCategories,
}: AddExpenseModalProps) {
  const { language } = useLanguage();
  const [expense, setExpense] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [userId, setUserId] = useState("");
  const [partyType, setPartyType] = useState<ExpensePartyType>("none");
  const [customerId, setCustomerId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [loadedCustomerName, setLoadedCustomerName] = useState("");
  const [loadedSupplierName, setLoadedSupplierName] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [status, setStatus] = useState<ExpenseStatusApi>("PENDING");
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const isEdit = !!editExpense;

  const { customers, loading: customersLoading } = useSalesCustomers(
    customerSearch,
    isOpen && partyType === "customer",
  );
  const { suppliers, loading: suppliersLoading } = usePurchaseSuppliers(
    supplierSearch,
    isOpen && partyType === "supplier",
  );

  useEffect(() => {
    if (!isOpen) {
      setExpense("");
      setDescription("");
      setCategoryId("");
      setAccountId("");
      setUserId("");
      setPartyType("none");
      setCustomerId("");
      setSupplierId("");
      setCustomerSearch("");
      setSupplierSearch("");
      setLoadedCustomerName("");
      setLoadedSupplierName("");
      setDate("");
      setAmount("");
      setReference("");
      setStatus("PENDING");
      setSaving(false);
      return;
    }
    if (editExpense) {
      setExpense(editExpense.expenseName);
      setDescription(editExpense.description);
      setCategoryId(editExpense.categoryId ?? "");
      setAccountId(editExpense.accountId ?? "");
      setUserId(editExpense.userId ?? "");
      setDate(editExpense.date.slice(0, 10));
      setAmount(editExpense.amount);
      setReference(editExpense.reference ?? "");
      setStatus(editExpense.status);
      if (editExpense.customerId) {
        setPartyType("customer");
        setCustomerId(editExpense.customerId);
        setLoadedCustomerName(editExpense.customerName ?? "");
        setSupplierId("");
        setLoadedSupplierName("");
      } else if (editExpense.supplierId) {
        setPartyType("supplier");
        setSupplierId(editExpense.supplierId);
        setLoadedSupplierName(editExpense.supplierName ?? "");
        setCustomerId("");
        setLoadedCustomerName("");
      } else {
        setPartyType("none");
        setCustomerId("");
        setSupplierId("");
        setLoadedCustomerName("");
        setLoadedSupplierName("");
      }
    }
  }, [isOpen, editExpense]);

  const activeCategories = categories.filter((c) => c.isActive);

  const customerOptions = useMemo(() => {
    const opts = [
      { value: "", label: tr("Seçin (opsional)", "Select (optional)") },
      ...customers.map((c) => ({ value: c.id, label: c.name })),
    ];
    if (
      customerId &&
      loadedCustomerName &&
      !customers.some((c) => c.id === customerId)
    ) {
      opts.push({ value: customerId, label: loadedCustomerName });
    }
    return opts;
  }, [customers, customerId, loadedCustomerName, language]);

  const supplierOptions = useMemo(() => {
    const opts = [
      { value: "", label: tr("Seçin (opsional)", "Select (optional)") },
      ...suppliers.map((s) => ({ value: s.id, label: s.name })),
    ];
    if (
      supplierId &&
      loadedSupplierName &&
      !suppliers.some((s) => s.id === supplierId)
    ) {
      opts.push({ value: supplierId, label: loadedSupplierName });
    }
    return opts;
  }, [suppliers, supplierId, loadedSupplierName, language]);

  const handlePartyTypeChange = (next: ExpensePartyType) => {
    setPartyType(next);
    if (next !== "customer") {
      setCustomerId("");
      setCustomerSearch("");
    }
    if (next !== "supplier") {
      setSupplierId("");
      setSupplierSearch("");
    }
  };

  const handleSave = async () => {
    if (!expense.trim() || !categoryId || !date || !amount || parseFloat(amount) <= 0) {
      notifyFromError(
        new Error(tr("Zəhmət olmasa bütün tələb olunan sahələri doldurun", "Please fill all required fields")),
      );
      return;
    }
    setSaving(true);
    try {
      await onSave({
        expenseName: expense.trim(),
        description: description.trim(),
        categoryId,
        accountId,
        userId,
        customerId: partyType === "customer" ? customerId : "",
        supplierId: partyType === "supplier" ? supplierId : "",
        date,
        amount,
        reference: reference.trim() || undefined,
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
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col border border-gray-200 dark:border-gray-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {isEdit ? tr("Xərci Redaktə Et", "Edit Expense") : tr("Xərc Əlavə Et", "Add Expense")}
          </h2>
          <button onClick={onClose} disabled={saving} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Xərc", "Expense")} <span className="text-red-500">*</span></label>
            <input type="text" value={expense} onChange={(e) => setExpense(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("İstinad", "Reference")}</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Təsvir", "Description")}</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Kateqoriya", "Category")} <span className="text-red-500">*</span></label>
              <ModernSelect
                value={categoryId}
                onChange={setCategoryId}
                className="w-full"
                placeholder={tr("Seçin", "Select")}
                options={[
                  { value: "", label: tr("Seçin", "Select") },
                  ...activeCategories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
              {activeCategories.length === 0 && (
                <div className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400">
                  <p>
                    {tr(
                      "Kateqoriya xərcin növüdür (məs. Kommunal, İcarə, Marketinq). Əvvəlcə kateqoriya əlavə edin.",
                      "A category classifies the expense (e.g. Utilities, Rent, Marketing). Add categories before creating expenses.",
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
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Tarix", "Date")} <span className="text-red-500">*</span></label>
              <DateInput value={date} onChange={setDate} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Məbləğ", "Amount")} <span className="text-red-500">*</span></label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Status", "Status")} <span className="text-red-500">*</span></label>
              <ModernSelect
                value={status}
                onChange={(value) => setStatus(value as ExpenseStatusApi)}
                className="w-full"
                options={[
                  { value: "PENDING", label: mapExpenseStatusLabel("PENDING", tr) },
                  { value: "APPROVED", label: mapExpenseStatusLabel("APPROVED", tr) },
                  { value: "REJECTED", label: mapExpenseStatusLabel("REJECTED", tr) },
                ]}
                buttonClassName="px-2.5 py-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Bank Hesabı", "Bank Account")}</label>
            <ModernSelect
              value={accountId}
              onChange={setAccountId}
              className="w-full"
              placeholder={tr("Seçin (opsional)", "Select (optional)")}
              options={[
                { value: "", label: tr("Seçin (opsional)", "Select (optional)") },
                ...bankAccounts
                  .filter((a) => a.status === "ACTIVE")
                  .map((a) => ({
                    value: a.id,
                    label: `${a.accountHolderName} (${a.accountNo})`,
                  })),
              ]}
            />
            {!isEdit && status === "APPROVED" && (
              <p className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400">
                {tr(
                  "Təsdiqlənmiş xərclər bank hesabından çıxılır. Bank hesabı seçin.",
                  "Approved expenses are debited from the bank account. Select a bank account.",
                )}
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("İşçi", "Employee")}{" "}
              <span className="text-gray-400 font-normal">({tr("opsional", "optional")})</span>
            </label>
            <ModernSelect
              value={userId}
              onChange={setUserId}
              className="w-full"
              placeholder={tr("Seçin (opsional)", "Select (optional)")}
              options={[
                { value: "", label: tr("Seçin (opsional)", "Select (optional)") },
                ...employees.map((e) => ({ value: e.id, label: e.name })),
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Təyinat", "Assign to")}{" "}
              <span className="text-gray-400 font-normal">({tr("opsional", "optional")})</span>
            </label>
            <ModernSelect
              value={partyType}
              onChange={(v) => handlePartyTypeChange(v as ExpensePartyType)}
              className="w-full"
              options={[
                { value: "none", label: tr("Yoxdur", "None") },
                { value: "customer", label: tr("Müştəri / Client", "Client") },
                { value: "supplier", label: tr("Təchizatçı", "Supplier") },
              ]}
            />
          </div>

          {partyType === "customer" && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Müştəri", "Client")}
              </label>
              <ModernSelect
                value={customerId}
                onChange={(id) => {
                  setCustomerId(id);
                  const name = customers.find((c) => c.id === id)?.name;
                  if (name) setLoadedCustomerName(name);
                }}
                className="w-full"
                searchable
                searchPlaceholder={tr("Müştəri axtar...", "Search client...")}
                onSearchChange={setCustomerSearch}
                placeholder={
                  customersLoading ? tr("Yüklənir...", "Loading...") : tr("Seçin", "Select")
                }
                options={customerOptions}
              />
            </div>
          )}

          {partyType === "supplier" && (
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Təchizatçı", "Supplier")}
              </label>
              <ModernSelect
                value={supplierId}
                onChange={(id) => {
                  setSupplierId(id);
                  const name = suppliers.find((s) => s.id === id)?.name;
                  if (name) setLoadedSupplierName(name);
                }}
                className="w-full"
                searchable
                searchPlaceholder={tr("Təchizatçı axtar...", "Search supplier...")}
                onSearchChange={setSupplierSearch}
                placeholder={
                  suppliersLoading ? tr("Yüklənir...", "Loading...") : tr("Seçin", "Select")
                }
                options={supplierOptions}
              />
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 shrink-0">
          <button onClick={onClose} disabled={saving} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">{tr("Ləğv Et", "Cancel")}</button>
          <button onClick={() => void handleSave()} disabled={saving || !expense || !categoryId || !date || !amount} className="px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? tr("Saxlanılır...", "Saving...") : isEdit ? tr("Yadda Saxla", "Save") : tr("Xərc Əlavə Et", "Add Expense")}
          </button>
        </div>
      </div>
    </div>
  );
}
