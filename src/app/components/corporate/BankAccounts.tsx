import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Edit2,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useConfirm } from "../../context/ConfirmContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useAuth } from "../../context/AuthContext";
import {
  createBankAccount,
  deleteBankAccount,
  fetchBankAccounts,
  updateBankAccount,
  type BankAccountRow,
} from "../../api/finance";
import {
  mapBankAccountStatusLabel,
  mapBankAccountTypeLabel,
  parseFinanceMoney,
} from "../../lib/financeMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { CreateBankAccountModal, type BankAccountFormData } from "./CreateBankAccountModal";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function BankAccounts() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Finances");
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSort, setSelectedSort] = useState<"latest" | "oldest" | "name">("latest");
  const [activeTab, setActiveTab] = useState("bank");
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<BankAccountRow | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus, selectedSort]);

  const loadAccounts = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setAccounts([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchBankAccounts({
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus,
        sort: selectedSort,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setAccounts(Array.isArray(result.items) ? result.items : []);
      setTotalItems(result.total ?? 0);
      const pages = Math.max(1, result.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(err, tr("Bank hesablarını yükləmək alınmadı", "Failed to load bank accounts"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedStatus,
    selectedSort,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "CLOSED":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "SUSPENDED":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAccounts();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSaveAccount = async (data: BankAccountFormData) => {
    if (isDemo) return;
    if (editAccount) {
      await updateBankAccount(editAccount.id, {
        accountHolderName: data.holderName,
        accountNo: data.accountNumber,
        type: data.accountType,
        notes: data.description || null,
        status: data.status,
      });
      notifySuccess(tr("Hesab yeniləndi", "Account updated"));
    } else {
      await createBankAccount({
        accountHolderName: data.holderName,
        accountNo: data.accountNumber,
        type: data.accountType,
        openingBalance: data.openingBalance,
        notes: data.description || null,
        status: data.status,
      });
      notifySuccess(tr("Bank hesabı yaradıldı", "Bank account created"));
    }
    await loadAccounts();
  };

  const handleDelete = async (account: BankAccountRow) => {
    if (!canDelete || isDemo) return;
    setOpenMenuId(null);
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr(
          "Bu hesabı silmək istədiyinizə əminsiniz?",
          "Are you sure you want to delete this account?",
        ),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteBankAccount(account.id);
      notifySuccess(tr("Hesab silindi", "Account deleted"));
      await loadAccounts();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const loadExportRows = async () => {
    const result = await fetchBankAccounts({
      search: debouncedSearch.trim() || undefined,
      status: selectedStatus,
      sort: selectedSort,
      page: 1,
      pageSize: 200,
    });
    return (result.items ?? []).map((a) => [
      a.accountHolderName,
      a.accountNo,
      mapBankAccountTypeLabel(a.type, tr),
      parseFinanceMoney(a.openingBalance).toFixed(2),
      parseFinanceMoney(a.currentBalance).toFixed(2),
      a.notes,
      mapBankAccountStatusLabel(a.status, tr),
    ]);
  };

  const handleExportPDF = async () => {
    try {
      const body = await loadExportRows();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(tr("Bank Hesabları", "Bank Accounts"), 14, 20);
      doc.setFontSize(10);
      doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);
      autoTable(doc, {
        startY: 35,
        head: [[
          tr("Hesab Sahibi", "Holder"),
          tr("Hesab No", "Account No"),
          tr("Növ", "Type"),
          tr("Açılış", "Opening"),
          tr("Cari", "Current"),
          tr("Qeydlər", "Notes"),
          tr("Status", "Status"),
        ]],
        body,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [0, 38, 246], textColor: [255, 255, 255], fontStyle: "bold" },
      });
      doc.save(`bank-accounts-${Date.now()}.pdf`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const body = await loadExportRows();
      const headers = [
        tr("Hesab Sahibi", "Holder"),
        tr("Hesab No", "Account No"),
        tr("Növ", "Type"),
        tr("Açılış Balansı", "Opening Balance"),
        tr("Cari Balans", "Current Balance"),
        tr("Qeydlər", "Notes"),
        tr("Status", "Status"),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...body]);
      XLSX.utils.book_append_sheet(wb, ws, tr("Bank", "Bank"));
      XLSX.writeFile(wb, `bank-accounts-${Date.now()}.xlsx`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setActiveTab("bank")}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-colors",
                activeTab === "bank"
                  ? "bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white"
                  : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300",
              )}
            >
              {tr("Bank Hesabları", "Bank Accounts")}
            </button>
          </div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Bank Hesabları", "Bank Accounts")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Hesablar siyahısını idarə edin", "Manage your Accounts List")}
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => void handleExportPDF()} disabled={!totalItems} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("PDF İxrac Et", "Export PDF")}>
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button onClick={() => void handleExportExcel()} disabled={!totalItems} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50" title={tr("Excel İxrac Et", "Export Excel")}>
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          <button onClick={() => void handleRefresh()} disabled={isRefreshing} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Yenilə", "Refresh")}>
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>
          <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          {canCreate && !isDemo && (
            <button
              onClick={() => {
                setEditAccount(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Hesab Əlavə Et", "Add Account")}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="active">{tr("Aktiv", "Active")}</option>
                  <option value="inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
                  <option value="closed">{tr("Bağlı", "Closed")}</option>
                  <option value="suspended">{tr("Dayandırılıb", "Suspended")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={selectedSort}
                  onChange={(e) =>
                    setSelectedSort(e.target.value as "latest" | "oldest" | "name")
                  }
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="latest">{tr("Sırala : Ən Yeni", "Sort By : Latest")}</option>
                  <option value="oldest">{tr("Sırala : Ən Köhnə", "Sort By : Oldest")}</option>
                  <option value="name">{tr("Sırala : Ad", "Sort By : Name")}</option>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("HESAB SAHİBİNİN ADI", "ACCOUNT HOLDER NAME")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("HESAB NÖMRƏSI", "ACCOUNT NO")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("NÖV", "TYPE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("AÇILIŞ BALANSI", "OPENING BALANCE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("CARİ BALANS", "CURRENT BALANCE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("QEYDLƏR", "NOTES")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td>
                  </tr>
                ) : accounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-gray-500">{tr("Hesab tapılmadı", "No accounts found")}</td>
                  </tr>
                ) : (
                  accounts.map((account, index) => (
                    <tr
                      key={account.id}
                      className={cn(
                        "border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10",
                      )}
                    >
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{account.accountHolderName}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{account.accountNo}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{mapBankAccountTypeLabel(account.type, tr)}</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{parseFinanceMoney(account.openingBalance).toFixed(2)} AZN</td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">{parseFinanceMoney(account.currentBalance).toFixed(2)} AZN</td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[200px] truncate">{account.notes}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium", getStatusBadgeColor(account.status))}>
                          {mapBankAccountStatusLabel(account.status, tr)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap relative">
                        {(canEdit || canDelete) && !isDemo && (
                          <>
                            <button
                              onClick={() => setOpenMenuId(openMenuId === account.id ? null : account.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                            </button>
                            {openMenuId === account.id && (
                              <div className="absolute right-4 top-full z-10 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                                {canEdit && (
                                  <button
                                    onClick={() => {
                                      setEditAccount(account);
                                      setIsModalOpen(true);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                    {tr("Redaktə", "Edit")}
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => void handleDelete(account)}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    {tr("Sil", "Delete")}
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
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

      <CreateBankAccountModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditAccount(null);
        }}
        onSave={handleSaveAccount}
        editAccount={editAccount}
        isEdit={!!editAccount}
      />
    </div>
  );
}
