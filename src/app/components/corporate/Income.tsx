import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  Edit2,
  Trash2,
  FolderTree,
  Building2,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useConfirm } from "../../context/ConfirmContext";
import { AddIncomeModal, type IncomeFormData } from "./AddIncomeModal";
import { DateInput } from "../ui/DateInput";
import { ManageIncomeCategoriesModal } from "./ManageIncomeCategoriesModal";
import { CreateBankAccountModal, type BankAccountFormData } from "./CreateBankAccountModal";
import {
  createBankAccount,
  createIncome,
  deleteIncome,
  fetchIncomes,
  updateIncome,
  type IncomeListRow,
} from "../../api/finance";
import {
  dateInputToIso,
  formatFinanceDate,
  monthEndIso,
  monthStartIso,
  parseFinanceMoney,
} from "../../lib/financeMappers";
import { useIncomeCategories } from "../../hooks/useFinanceCategories";
import { useFinanceBankAccounts } from "../../hooks/useFinanceBankAccounts";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function Income() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Finances");
  const { branches, isGlobalMode, branchId } = useBranch();
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const { categories, reload: reloadCategories } = useIncomeCategories();
  const { accounts: bankAccounts, reload: reloadBankAccounts } = useFinanceBankAccounts(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateFrom, setDateFrom] = useState(() => monthStartIso().slice(0, 10));
  const [dateTo, setDateTo] = useState(() => monthEndIso().slice(0, 10));
  const [incomes, setIncomes] = useState<IncomeListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddIncomeModalOpen, setIsAddIncomeModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [editIncome, setEditIncome] = useState<IncomeListRow | null>(null);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadIncomes = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setIncomes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchIncomes({
        search: debouncedSearch.trim() || undefined,
        storeId: selectedStore !== "all" ? selectedStore : undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        dateFrom: dateFrom ? dateInputToIso(dateFrom) : undefined,
        dateTo: dateTo ? dateInputToIso(dateTo) : undefined,
        pageSize: 200,
      });
      setIncomes(Array.isArray(result.items) ? result.items : []);
    } catch (err) {
      notifyFromError(err, tr("Gəlirləri yükləmək alınmadı", "Failed to load income"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedStore,
    selectedCategory,
    dateFrom,
    dateTo,
    branchRevision,
  ]);

  useEffect(() => {
    void loadIncomes();
  }, [loadIncomes]);

  const totalAmount = useMemo(
    () => incomes.reduce((sum, i) => sum + parseFinanceMoney(i.amount), 0),
    [incomes],
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadIncomes();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddIncome = () => {
    if (!canCreate || isDemo) return;
    if (isGlobalMode) {
      setEditIncome(null);
      setIsAddIncomeModalOpen(true);
      return;
    }
    setEditIncome(null);
    setIsAddIncomeModalOpen(true);
  };

  const handleSaveIncome = async (data: IncomeFormData) => {
    if (isDemo) return;
    if (editIncome) {
      await updateIncome(editIncome.id, {
        reference: data.reference || null,
        categoryId: data.categoryId,
        storeId: data.storeId,
        notes: data.notes || null,
        date: dateInputToIso(data.date),
      });
      notifySuccess(tr("Gəlir yeniləndi", "Income updated"));
    } else {
      await createIncome({
        reference: data.reference || null,
        categoryId: data.categoryId,
        storeId: data.storeId,
        accountId: data.accountId,
        notes: data.notes || null,
        date: dateInputToIso(data.date),
        amount: parseFloat(data.amount).toFixed(2),
      });
      notifySuccess(tr("Gəlir əlavə edildi", "Income added"));
    }
    setEditIncome(null);
    await loadIncomes();
  };

  const handleSaveAccount = async (data: BankAccountFormData) => {
    if (isDemo) return;
    await createBankAccount({
      accountHolderName: data.holderName,
      accountNo: data.accountNumber,
      type: data.accountType,
      openingBalance: data.openingBalance,
      notes: data.description || null,
      status: data.status,
    });
    notifySuccess(tr("Bank hesabı yaradıldı", "Bank account created"));
    await reloadBankAccounts();
  };

  const handleDelete = async (income: IncomeListRow) => {
    if (!canDelete || isDemo) return;
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr("Bu gəliri silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this income?"),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteIncome(income.id);
      notifySuccess(tr("Gəlir silindi", "Income deleted"));
      await loadIncomes();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const exportRows = incomes.map((item) => [
    formatFinanceDate(item.date),
    item.reference ?? "—",
    item.store,
    item.category,
    item.notes,
    `${parseFinanceMoney(item.amount).toFixed(2)} AZN`,
  ]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tr("Gəlirlər Hesabatı", "Income Report"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);
    doc.text(`${tr("Cəmi", "Total")}: ${totalAmount.toFixed(2)} AZN`, 14, 34);
    autoTable(doc, {
      startY: 40,
      head: [[tr("Tarix", "Date"), tr("İstinad", "Reference"), tr("Mağaza", "Store"), tr("Kateqoriya", "Category"), tr("Qeydlər", "Notes"), tr("Məbləğ", "Amount")]],
      body: exportRows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [0, 38, 246], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    doc.save(`income-${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [tr("Tarix", "Date"), tr("İstinad", "Reference"), tr("Mağaza", "Store"), tr("Kateqoriya", "Category"), tr("Qeydlər", "Notes"), tr("Məbləğ", "Amount")];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
    XLSX.utils.book_append_sheet(wb, ws, tr("Gəlirlər", "Income"));
    XLSX.writeFile(wb, `income-${Date.now()}.xlsx`);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">{tr("Gəlir", "Income")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr("Gəlirlərinizi idarə edin", "Manage your income")}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 max-w-lg">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3">
            <p className="text-[10px] text-gray-500 uppercase">{tr("Qeydlər", "Records")}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{incomes.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 col-span-1 sm:col-span-2">
            <p className="text-[10px] text-gray-500 uppercase">{tr("Cəmi Gəlir", "Total Income")}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">{totalAmount.toFixed(2)} AZN</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={handleExportPDF} disabled={!incomes.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("PDF İxrac Et", "Export PDF")}><FileText className="w-3.5 h-3.5 text-red-500" /></button>
          <button onClick={handleExportExcel} disabled={!incomes.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("Excel İxrac Et", "Export Excel")}><FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /></button>
          <button onClick={() => void handleRefresh()} disabled={isRefreshing} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} /></button>
          {(canCreate || canEdit) && !isDemo && (
            <button onClick={() => setIsManageCategoriesModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FolderTree className="w-3.5 h-3.5" /><span>{tr("Kateqoriyaları İdarə Et", "Manage Categories")}</span>
            </button>
          )}
          {canCreate && !isDemo && (
            <button onClick={() => setIsCreateAccountModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Building2 className="w-3.5 h-3.5" /><span>{tr("Hesab Yarat", "Create Account")}</span>
            </button>
          )}
          {canCreate && !isDemo && (
            <button onClick={handleAddIncome} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>{tr("Gəlir Əlavə Et", "Add Income")}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={tr("Axtar...", "Search...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]" />
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <DateInput value={dateFrom} onChange={setDateFrom} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <DateInput value={dateTo} onChange={setDateTo} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <div className="relative">
                <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer">
                  <option value="all">{tr("Mağaza", "Store")}</option>
                  {branches.map((b) => (<option key={b.id} value={b.id}>{b.name}</option>))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer">
                  <option value="all">{tr("Kateqoriya", "Category")}</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("TARİX", "DATE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("İSTİNAD", "REFERENCE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("MAĞAZA", "STORE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("KATEQORİYA", "CATEGORY")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("QEYDLƏR", "NOTES")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("MƏBLƏĞ", "AMOUNT")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td></tr>
                ) : incomes.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Gəlir tapılmadı", "No income found")}</td></tr>
                ) : (
                  incomes.map((income, index) => (
                    <tr key={income.id} className={cn("border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors", index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatFinanceDate(income.date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{income.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{income.store}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{income.category}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[200px] truncate">{income.notes}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{parseFinanceMoney(income.amount).toFixed(2)} AZN</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {canEdit && !isDemo && (
                            <button onClick={() => { setEditIncome(income); setIsAddIncomeModalOpen(true); }} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Redaktə Et", "Edit")}><Edit2 className="w-3 h-3" /></button>
                          )}
                          {canDelete && !isDemo && (
                            <button onClick={() => void handleDelete(income)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={tr("Sil", "Delete")}><Trash2 className="w-3 h-3" /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AddIncomeModal
        isOpen={isAddIncomeModalOpen}
        onClose={() => { setIsAddIncomeModalOpen(false); setEditIncome(null); }}
        onSave={handleSaveIncome}
        categories={categories}
        bankAccounts={bankAccounts}
        branches={branches}
        isGlobalMode={isGlobalMode}
        defaultStoreId={branchId}
        editIncome={editIncome}
        onManageCategories={() => setIsManageCategoriesModalOpen(true)}
      />
      <ManageIncomeCategoriesModal
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        onChanged={() => void reloadCategories()}
      />
      <CreateBankAccountModal
        isOpen={isCreateAccountModalOpen}
        onClose={() => setIsCreateAccountModalOpen(false)}
        onSave={handleSaveAccount}
      />
    </div>
  );
}
