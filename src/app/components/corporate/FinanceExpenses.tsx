import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  FolderTree,
  Edit2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";
import { AddExpenseModal, type ExpenseFormData } from "./AddExpenseModal";
import { ViewExpenseModal } from "./ViewExpenseModal";
import { DateInput } from "../ui/DateInput";
import { ManageExpenseCategoriesModal } from "./ManageExpenseCategoriesModal";
import {
  createExpense,
  deleteExpense,
  fetchExpenses,
  patchExpenseStatus,
  updateExpense,
  type ExpenseListRow,
} from "../../api/finance";
import {
  dateInputToIso,
  formatFinanceDate,
  mapExpenseStatusLabel,
  parseFinanceMoney,
} from "../../lib/financeMappers";
import { useExpenseCategories } from "../../hooks/useFinanceCategories";
import { useFinanceBankAccounts } from "../../hooks/useFinanceBankAccounts";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { useServerPagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function FinanceExpenses() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Finances");
  const askConfirm = useConfirm();
  const { categories, reload: reloadCategories } = useExpenseCategories();
  const { accounts: bankAccounts } = useFinanceBankAccounts(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expenses, setExpenses] = useState<ExpenseListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isManageCategoriesModalOpen, setIsManageCategoriesModalOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseListRow | null>(null);
  const [viewExpense, setViewExpense] = useState<ExpenseListRow | null>(null);
  const {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage,
    setTotals,
    resetToFirstPage,
  } = useServerPagination(DEFAULT_LIST_PAGE_SIZE);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    resetToFirstPage();
  }, [debouncedSearch, selectedCategory, selectedStatus, dateFrom, dateTo, resetToFirstPage]);

  const loadExpenses = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setExpenses([]);
      setTotals(0, 1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchExpenses({
        search: debouncedSearch.trim() || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
        status: selectedStatus,
        dateFrom: dateFrom ? dateInputToIso(dateFrom) : undefined,
        dateTo: dateTo ? dateInputToIso(dateTo) : undefined,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setExpenses(Array.isArray(result.items) ? result.items : []);
      setTotals(result.total ?? 0, result.totalPages);
    } catch (err) {
      notifyFromError(err, tr("Xərcləri yükləmək alınmadı", "Failed to load expenses"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, debouncedSearch, selectedCategory, selectedStatus, dateFrom, dateTo, currentPage, itemsPerPage, setTotals]);

  useEffect(() => {
    void loadExpenses();
  }, [loadExpenses]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadExpenses();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveExpense = async (data: ExpenseFormData) => {
    if (isDemo) return;
    const body = {
      expenseName: data.expenseName,
      description: data.description || null,
      categoryId: data.categoryId,
      accountId: data.accountId || null,
      date: dateInputToIso(data.date),
      amount: parseFloat(data.amount).toFixed(2),
      reference: data.reference || null,
    };
    if (editExpense) {
      await updateExpense(editExpense.id, body);
      notifySuccess(tr("Xərc yeniləndi", "Expense updated"));
    } else {
      const createStatus = data.status === "APPROVED" ? "PENDING" : data.status;
      const created = await createExpense({ ...body, status: createStatus });
      if (data.status === "APPROVED") {
        await patchExpenseStatus(created.id, "APPROVED");
      }
      notifySuccess(
        tr(
          `Xərc əlavə edildi (${mapExpenseStatusLabel(data.status, tr)})`,
          `Expense added (${mapExpenseStatusLabel(data.status, tr)})`,
        ),
      );
    }
    setEditExpense(null);
    await loadExpenses();
  };

  const handleApprove = async (expense: ExpenseListRow) => {
    if (!canEdit || isDemo) return;
    setViewExpense(null);
    if (
      !(await askConfirm({
        title: tr("Təsdiq", "Approve"),
        message: tr("Bu xərci təsdiqləmək istəyirsiniz?", "Approve this expense?"),
        variant: "default",
      }))
    ) {
      return;
    }
    try {
      await patchExpenseStatus(expense.id, "APPROVED");
      notifySuccess(tr("Xərc təsdiqləndi", "Expense approved"));
      await loadExpenses();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleReject = async (expense: ExpenseListRow) => {
    if (!canEdit || isDemo) return;
    setViewExpense(null);
    if (
      !(await askConfirm({
        title: tr("Rədd et", "Reject"),
        message: tr("Bu xərci rədd etmək istəyirsiniz?", "Reject this expense?"),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await patchExpenseStatus(expense.id, "REJECTED");
      notifySuccess(tr("Xərc rədd edildi", "Expense rejected"));
      await loadExpenses();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleDelete = async (expense: ExpenseListRow) => {
    if (!canDelete || isDemo) return;
    setViewExpense(null);
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr("Bu xərci silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this expense?"),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteExpense(expense.id);
      notifySuccess(tr("Xərc silindi", "Expense deleted"));
      await loadExpenses();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const exportRows = expenses.map((item) => [
    item.reference ?? "—",
    item.expenseName,
    item.category,
    item.description,
    formatFinanceDate(item.date),
    `${parseFinanceMoney(item.amount).toFixed(2)} AZN`,
    mapExpenseStatusLabel(item.status, tr),
  ]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tr("Xərclər Hesabatı", "Expenses Report"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [[tr("İstinad", "Reference"), tr("Xərc Adı", "Expense Name"), tr("Kateqoriya", "Category"), tr("Təsvir", "Description"), tr("Tarix", "Date"), tr("Məbləğ", "Amount"), tr("Status", "Status")]],
      body: exportRows,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: "bold" },
    });
    doc.save(`expenses-${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [tr("İstinad", "Reference"), tr("Xərc Adı", "Expense Name"), tr("Kateqoriya", "Category"), tr("Təsvir", "Description"), tr("Tarix", "Date"), tr("Məbləğ", "Amount"), tr("Status", "Status")];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...exportRows]);
    XLSX.utils.book_append_sheet(wb, ws, tr("Xərclər", "Expenses"));
    XLSX.writeFile(wb, `expenses-${Date.now()}.xlsx`);
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">{tr("Xərclər", "Expenses")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr("Xərclərinizi idarə edin", "Manage Your Expenses")}</p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={handleExportPDF} disabled={!expenses.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("PDF İxrac Et", "Export PDF")}><FileText className="w-3.5 h-3.5 text-red-500" /></button>
          <button onClick={handleExportExcel} disabled={!expenses.length} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("Excel İxrac Et", "Export Excel")}><FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /></button>
          <button onClick={() => void handleRefresh()} disabled={isRefreshing} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Yenilə", "Refresh")}><RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} /></button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><ChevronUp className="w-3.5 h-3.5" /></button>
          {(canCreate || canEdit) && !isDemo && (
            <button onClick={() => setIsManageCategoriesModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <FolderTree className="w-3.5 h-3.5" /><span>{tr("Kateqoriyaları İdarə Et", "Manage Categories")}</span>
            </button>
          )}
          {canCreate && !isDemo && (
            <button onClick={() => { setEditExpense(null); setIsAddExpenseModalOpen(true); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" /><span>{tr("Xərc Əlavə Et", "Add Expense")}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-wrap">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={tr("Axtar...", "Search...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
            </div>
            <div className="flex gap-2 ml-auto flex-wrap">
              <DateInput value={dateFrom} onChange={setDateFrom} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <DateInput value={dateTo} onChange={setDateTo} className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
              <div className="relative">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer">
                  <option value="all">{tr("Kateqoriya", "Category")}</option>
                  {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer">
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="approved">{tr("Təsdiqləndi", "Approved")}</option>
                  <option value="pending">{tr("Gözləyir", "Pending")}</option>
                  <option value="rejected">{tr("Rədd Edildi", "Rejected")}</option>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("İSTİNAD", "REFERENCE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("XƏRC ADI", "EXPENSE NAME")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("KATEQORİYA", "CATEGORY")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("TƏSVIR", "DESCRIPTION")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("TARİX", "DATE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("MƏBLƏĞ", "AMOUNT")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td></tr>
                ) : expenses.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Xərc tapılmadı", "No expenses found")}</td></tr>
                ) : (
                  expenses.map((expense, index) => (
                    <tr key={expense.id} className={cn("border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors", index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10")}>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{expense.reference ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{expense.expenseName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{expense.category}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[180px] truncate">{expense.description}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatFinanceDate(expense.date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{parseFinanceMoney(expense.amount).toFixed(2)} AZN</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium", getStatusBadgeColor(expense.status))}>{mapExpenseStatusLabel(expense.status, tr)}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {canView && (
                            <button
                              onClick={() => setViewExpense(expense)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Bax", "View")}
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          {canEdit && !isDemo && expense.status === "PENDING" && (
                            <button
                              onClick={() => { setEditExpense(expense); setIsAddExpenseModalOpen(true); }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Redaktə Et", "Edit")}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={dataPaginationShowText(tr)}
            />
          </div>
        </div>
      </div>

      <ViewExpenseModal
        expense={viewExpense}
        bankAccounts={bankAccounts}
        onClose={() => setViewExpense(null)}
        onEdit={(expense) => {
          setViewExpense(null);
          setEditExpense(expense);
          setIsAddExpenseModalOpen(true);
        }}
        onApprove={(expense) => void handleApprove(expense)}
        onReject={(expense) => void handleReject(expense)}
        onDelete={(expense) => void handleDelete(expense)}
        canEdit={canEdit && !isDemo}
        canDelete={canDelete && !isDemo}
      />
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => { setIsAddExpenseModalOpen(false); setEditExpense(null); }}
        onSave={handleSaveExpense}
        categories={categories}
        bankAccounts={bankAccounts}
        editExpense={editExpense}
        onManageCategories={() => setIsManageCategoriesModalOpen(true)}
      />
      <ManageExpenseCategoriesModal
        isOpen={isManageCategoriesModalOpen}
        onClose={() => setIsManageCategoriesModalOpen(false)}
        onChanged={() => void reloadCategories()}
      />
    </div>
  );
}
