import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useBranch } from "../../context/BranchContext";
import { AddPurchaseModal } from "./AddPurchaseModal";
import { PurchaseDetailModal } from "./PurchaseDetailModal";
import { EditPurchaseModal } from "./EditPurchaseModal";
import { fetchPurchases, deletePurchase, type PurchaseListRow } from "../../api/purchases";
import { formatPurchaseDate } from "../../lib/purchaseMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function Purchase() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Purchases");
  const branchRevision = useBranchRevision();
  const { branches, isGlobalMode } = useBranch();
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("all");
  const [isAddPurchaseModalOpen, setIsAddPurchaseModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<PurchaseListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const branchLabel = (storeId: string | null) => {
    if (!storeId) return tr("Filialsız", "No branch");
    return branches.find((b) => b.id === storeId)?.name ?? tr("Filial", "Branch");
  };

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedStatus, selectedPaymentStatus, sortBy]);

  const loadPurchases = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setPurchases([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPurchases({
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        sortBy,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setPurchases(data.items ?? []);
      setTotalItems(data.total ?? 0);
      const pages = Math.max(1, data.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(err, tr("Satınalmaları yükləmək alınmadı", "Failed to load purchases"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedStatus,
    selectedPaymentStatus,
    sortBy,
    branchRevision,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-[#e8ebff] dark:bg-[#0026f6]/20 text-[#0026f6] dark:text-[#0026f6]";
      case "ordered":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400";
      case "overdue":
        return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400";
      case "partial":
        return "bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400";
      case "unpaid":
        return "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      Received: tr("Qəbul Edildi", "Received"),
      Pending: tr("Gözləyir", "Pending"),
      Ordered: tr("Sifariş Edildi", "Ordered"),
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

  const loadExportRows = async () => {
    const data = await fetchPurchases({
      search: debouncedSearch.trim() || undefined,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      sortBy,
      page: 1,
      pageSize: 200,
    });
    return data.items ?? [];
  };

  const handleExportPDF = async () => {
    try {
      const rows = await loadExportRows();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(tr("Satınalmalar Hesabatı", "Purchases Report"), 14, 20);
      doc.setFontSize(10);
      doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);

      const tableData = rows.map((item) => [
        item.supplierName,
        item.reference,
        formatPurchaseDate(item.date),
        translateStatus(item.status),
        `${item.total} AZN`,
        `${item.paid} AZN`,
        `${item.due.toFixed(2)} AZN`,
        translatePaymentStatus(item.paymentStatus),
      ]);

      autoTable(doc, {
        startY: 35,
        head: [[
          tr("Təchizatçı", "Supplier"),
          tr("İstinad", "Reference"),
          tr("Tarix", "Date"),
          tr("Status", "Status"),
          tr("Cəmi", "Total"),
          tr("Ödənilib", "Paid"),
          tr("Borc", "Due"),
          tr("Ödəniş", "Payment"),
        ]],
        body: tableData,
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { top: 35 },
      });

      doc.save(`${tr("Satınalmalar", "purchases")}-${new Date().getTime()}.pdf`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const items = await loadExportRows();
      const headers = [
        tr("Təchizatçı Adı", "Supplier Name"),
        tr("İstinad", "Reference"),
        tr("Tarix", "Date"),
        tr("Status", "Status"),
        tr("Cəmi", "Total"),
        tr("Ödənilib", "Paid"),
        tr("Borc", "Due"),
        tr("Ödəniş Statusu", "Payment Status"),
      ];
      const rows = items.map((item) => [
        item.supplierName,
        item.reference,
        formatPurchaseDate(item.date),
        translateStatus(item.status),
        item.total,
        item.paid,
        item.due,
        translatePaymentStatus(item.paymentStatus),
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, tr("Satınalmalar", "Purchases"));
      XLSX.writeFile(wb, `${tr("Satınalmalar", "purchases")}-${new Date().getTime()}.xlsx`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadPurchases();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete || isDemo) return;
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu Satınalmanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this purchase?"),
      variant: "danger",
    }))) {
      return;
    }
    try {
      await deletePurchase(id);
      notifySuccess(tr("Satınalma silindi", "Purchase deleted"));
      void loadPurchases();
    } catch (err) {
      notifyFromError(err, tr("Satınalma silinə bilmədi", "Failed to delete purchase"));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Satınalma", "Purchase")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Satınalmalarınızı idarə edin", "Manage your purchases")}
          </p>
        </div>

        {isGlobalMode && (
          <div className="mb-4 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
            {tr(
              "Bütün filiallar görünüşü aktivdir. Yeni satınalmalar üçün filial seçin. Filialsız sifarişlər yalnız bu görünüşdə görünür — filial təyin edilməyən satınalmaları redaktə edib filial əlavə edin.",
              "All branches view is active. Select a branch when creating purchases. Purchases without a branch only appear here — edit them to assign a branch before switching to a single branch.",
            )}
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Tarix: Hamısı", "Date: All")}</option>
                  <option value="thisyear">{tr("Bu il", "This Year")}</option>
                  <option value="last90days">{tr("Son 90 gün", "Last 90 Days")}</option>
                  <option value="last30days">{tr("Son 30 gün", "Last 30 Days")}</option>
                  <option value="last7days">{tr("Son 7 gün", "Last 7 Days")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Ödəniş Statusu", "Payment Status")}</option>
                  <option value="paid">{tr("Ödənilib", "Paid")}</option>
                  <option value="partial">{tr("Qismən", "Partial")}</option>
                  <option value="overdue">{tr("Gecikmiş", "Overdue")}</option>
                  <option value="unpaid">{tr("Ödənilməyib", "Unpaid")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="received">{tr("Qəbul Edildi", "Received")}</option>
                  <option value="pending">{tr("Gözləyir", "Pending")}</option>
                  <option value="ordered">{tr("Sifariş Edildi", "Ordered")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={purchases.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={handleExportCSV}
                disabled={purchases.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("CSV İxrac Et", "Export CSV")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>
              {canCreate && (
                <button
                  onClick={() => setIsAddPurchaseModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Satınalma Əlavə Et", "Add Purchase")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {isGlobalMode && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                      {tr("FİLİAL", "BRANCH")}
                    </th>
                  )}
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TƏCHİZATÇI ADI", "SUPPLIER NAME")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("İSTİNAD", "REFERENCE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("CƏMI", "TOTAL")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ÖDƏNİLİB", "PAID")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("BORC", "DUE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ÖDƏNİŞ STATUSU", "PAYMENT STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={isGlobalMode ? 10 : 9} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={isGlobalMode ? 10 : 9} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Satınalma tapılmadı", "No purchases found")}
                    </td>
                  </tr>
                ) : (
                  purchases.map((purchase, index) => (
                    <tr
                      key={purchase.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      {isGlobalMode && (
                        <td className="px-3 py-2 text-xs whitespace-nowrap">
                          <span
                            className={cn(
                              !purchase.storeId &&
                                "text-amber-700 dark:text-amber-400 font-medium",
                              purchase.storeId && "text-gray-600 dark:text-gray-400",
                            )}
                          >
                            {branchLabel(purchase.storeId)}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {purchase.supplierName}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {purchase.reference}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatPurchaseDate(purchase.date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                            getStatusBadgeColor(purchase.status),
                          )}
                        >
                          {translateStatus(purchase.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {purchase.total} ₼
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {purchase.paid} ₼
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {purchase.due.toFixed(2)} ₼
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                            getPaymentStatusBadgeColor(purchase.paymentStatus),
                          )}
                        >
                          {translatePaymentStatus(purchase.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPurchaseId(purchase.id);
                              setIsDetailModalOpen(true);
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title={tr("Bax", "View")}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setSelectedPurchaseId(purchase.id);
                                setIsEditModalOpen(true);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Redaktə Et", "Edit")}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => void handleDelete(purchase.id)}
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

      <AddPurchaseModal
        isOpen={isAddPurchaseModalOpen}
        onClose={() => setIsAddPurchaseModalOpen(false)}
        onSaved={() => void loadPurchases()}
      />

      <PurchaseDetailModal
        purchaseId={selectedPurchaseId}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedPurchaseId(null);
        }}
      />

      <EditPurchaseModal
        purchaseId={selectedPurchaseId}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedPurchaseId(null);
        }}
        onSaved={() => void loadPurchases()}
      />
    </div>
  );
}
