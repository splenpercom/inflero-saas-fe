import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { AddSalesReturnModal } from "./AddSalesReturnModal";
import { SalesReturnDetailModal } from "./SalesReturnDetailModal";
import {
  fetchSalesReturns,
  deleteSalesReturn,
  type SalesReturnListRow,
} from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

import { pickLang } from "../../i18n/pickLang";
export function SalesReturn() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Sales");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [sortBy, setSortBy] = useState("last7days");
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [detailReturnId, setDetailReturnId] = useState<string | null>(null);
  const [returns, setReturns] = useState<SalesReturnListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const { customers } = useSalesCustomers("", (isAuthenticated || isDemo));

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCustomer, selectedStatus, selectedPaymentStatus, sortBy]);

  const loadReturns = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setReturns([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchSalesReturns({
        search: debouncedSearch.trim() || undefined,
        customerId: selectedCustomer !== "all" ? selectedCustomer : undefined,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        sortBy,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setReturns(data.items ?? []);
      setTotalItems(data.total ?? 0);
      const pages = Math.max(1, data.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(err, tr("Qaytarmaları yükləmək alınmadı", "Failed to load returns"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedCustomer,
    selectedStatus,
    selectedPaymentStatus,
    sortBy,
    branchRevision,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadReturns();
  }, [loadReturns]);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "ordered":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "overdue":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "partial":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      case "unpaid":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      Received: tr("Qəbul edildi", "Received"),
      Pending: tr("Gözləyir", "Pending"),
      Ordered: tr("Sifariş edildi", "Ordered"),
    };
    return statusMap[status] || status;
  };

  const translatePaymentStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      Paid: tr("Ödənilib", "Paid"),
      Unpaid: tr("Ödənilməyib", "Unpaid"),
      Overdue: tr("Gecikmiş", "Overdue"),
      Partial: tr("Qismən", "Partial"),
    };
    return statusMap[status] || status;
  };

  const handleExportPDF = () => {
    alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"));
  };

  const handleExportExcel = () => {
    alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadReturns();
    setIsRefreshing(false);
  };

  const handleAddReturn = () => {
    if (!canCreate) return;
    setIsAddReturnModalOpen(true);
  };

  const handleView = (id: string) => {
    setDetailReturnId(id);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete || isDemo) return;
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu qaytarmanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this return?"),
      variant: "danger",
    }))) {
      return;
    }
    try {
      await deleteSalesReturn(id);
      notifySuccess(tr("Qaytarma silindi", "Return deleted"));
      void loadReturns();
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Satış Qaytarması", "Sales Return")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Qaytarmalarınızı idarə edin", "Manage your returns")}
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("PDF İxrac Et", "Export PDF")}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Excel İxrac Et", "Export Excel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>

          <button
            type="button"
            onClick={() => void handleRefresh()}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title={tr("Yenilə", "Refresh")}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={handleAddReturn}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Satış Qaytarması Əlavə Et", "Add Sales Return")}</span>
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
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div className="flex gap-2 ml-auto flex-wrap">
              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="all">{tr("Müştəri", "Customer")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="ordered">{tr("Sifariş edildi", "Ordered")}</option>
                  <option value="pending">{tr("Gözləyir", "Pending")}</option>
                  <option value="received">{tr("Qəbul edildi", "Received")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="all">{tr("Ödəniş statusu", "Payment status")}</option>
                  <option value="paid">{tr("Ödənilib", "Paid")}</option>
                  <option value="partial">{tr("Qismən", "Partial")}</option>
                  <option value="overdue">{tr("Gecikmiş", "Overdue")}</option>
                  <option value="unpaid">{tr("Ödənilməyib", "Unpaid")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="last7days">{tr("Son 7 gün", "Last 7 days")}</option>
                  <option value="last30days">{tr("Son 30 gün", "Last 30 days")}</option>
                  <option value="last90days">{tr("Son 90 gün", "Last 90 days")}</option>
                  <option value="thisyear">{tr("Bu il", "This year")}</option>
                  <option value="all">{tr("Hamısı", "All")}</option>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("MƏHSUL", "PRODUCT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("MÜŞTƏRİ", "CUSTOMER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("CƏMİ", "TOTAL")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÖDƏNİLİB", "PAID")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BORC", "DUE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÖDƏNİŞ STATUSU", "PAYMENT STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Qaytarma tapılmadı", "No returns found")}
                    </td>
                  </tr>
                ) : (
                  returns.map((returnItem, index) => (
                    <tr
                      key={returnItem.id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50/30 dark:bg-gray-800/10"
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-sm border border-gray-300 dark:border-gray-700">
                            {returnItem.productIcon}
                          </div>
                          <span className="text-xs text-gray-900 dark:text-white font-medium">
                            {returnItem.productName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatSalesDate(returnItem.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-900 dark:text-white font-medium">
                          {returnItem.customerName}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium",
                            getStatusBadgeColor(returnItem.status),
                          )}
                        >
                          {translateStatus(returnItem.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.total.toFixed(2)} ₼
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.paid.toFixed(2)} ₼
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.due.toFixed(2)} ₼
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium",
                            getPaymentStatusBadgeColor(returnItem.paymentStatus),
                          )}
                        >
                          {translatePaymentStatus(returnItem.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleView(returnItem.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Bax", "View")}
                          >
                            <Eye className="w-3 h-3" />
                          </button>

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(returnItem.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              title={tr("Sil", "Delete")}
                            >
                              <Trash2 className="w-3 h-3" />
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

      <AddSalesReturnModal
        isOpen={isAddReturnModalOpen}
        onClose={() => setIsAddReturnModalOpen(false)}
        onSaved={() => void loadReturns()}
      />

      <SalesReturnDetailModal
        returnId={detailReturnId}
        canEdit={canEdit}
        onClose={() => setDetailReturnId(null)}
        onChanged={() => void loadReturns()}
      />
    </div>
  );
}
