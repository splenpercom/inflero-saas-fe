import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { AddPurchaseReturnModal } from "./AddPurchaseReturnModal";
import { PurchaseReturnDetailModal } from "./PurchaseReturnDetailModal";
import { fetchPurchaseReturns, deletePurchaseReturn, type PurchaseReturnListRow } from "../../api/purchases";
import { formatPurchaseDate } from "../../lib/purchaseMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
export function PurchaseReturn() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Purchases");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [isAddReturnModalOpen, setIsAddReturnModalOpen] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);
  const [returns, setReturns] = useState<PurchaseReturnListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
  }, [debouncedSearch, selectedStatus, selectedPaymentStatus]);

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
      const data = await fetchPurchaseReturns({
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        sortBy: "all",
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
    selectedStatus,
    selectedPaymentStatus,
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
    const data = await fetchPurchaseReturns({
      search: debouncedSearch.trim() || undefined,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      sortBy: "all",
      page: 1,
      pageSize: 200,
    });
    return data.items ?? [];
  };

  const handleExportPDF = async () => {
    try {
      const items = await loadExportRows();
      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text(tr("Qaytarmalar Hesabatı", "Purchase Returns Report"), 14, 20);
      doc.setFontSize(10);
      doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);

      const tableData = items.map((item) => [
        formatPurchaseDate(item.date),
        item.supplierName,
        item.reference,
        translateStatus(item.status),
        `${item.total} AZN`,
        `${item.paid} AZN`,
        `${item.due.toFixed(2)} AZN`,
        translatePaymentStatus(item.paymentStatus),
      ]);

      autoTable(doc, {
        startY: 35,
        head: [[
          tr("Tarix", "Date"),
          tr("Təchizatçı", "Supplier"),
          tr("İstinad", "Reference"),
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

      doc.save(`purchase-returns-${Date.now()}.pdf`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const items = await loadExportRows();
      const headers = [
        tr("Tarix", "Date"),
        tr("Təchizatçı Adı", "Supplier Name"),
        tr("İstinad", "Reference"),
        tr("Status", "Status"),
        tr("Cəmi", "Total"),
        tr("Ödənilib", "Paid"),
        tr("Borc", "Due"),
        tr("Ödəniş Statusu", "Payment Status"),
      ];
      const rows = items.map((item) => [
        formatPurchaseDate(item.date),
        item.supplierName,
        item.reference,
        translateStatus(item.status),
        item.total,
        item.paid,
        item.due,
        translatePaymentStatus(item.paymentStatus),
      ]);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      ws["!cols"] = [{ wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, tr("Qaytarmalar", "Purchase Returns"));
      XLSX.writeFile(wb, `purchase-returns-${Date.now()}.xlsx`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadReturns();
    } finally {
      setIsRefreshing(false);
    }
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
      await deletePurchaseReturn(id);
      notifySuccess(tr("Qaytarma silindi", "Return deleted"));
      void loadReturns();
    } catch (err) {
      notifyFromError(err, tr("Qaytarma silinə bilmədi", "Failed to delete return"));
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Qaytarmalar", "Purchase Returns")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Qaytarmalarınızı idarə edin", "Manage your purchase returns")}
          </p>
        </div>

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

            <div className="flex gap-2">
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

              <div className="relative">
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Ödəniş Statusu", "Payment Status")}</option>
                  <option value="paid">{tr("Ödənilib", "Paid")}</option>
                  <option value="partial">{tr("Qismən", "Partial")}</option>
                  <option value="unpaid">{tr("Ödənilməyib", "Unpaid")}</option>
                  <option value="overdue">{tr("Gecikmiş", "Overdue")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={returns.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={handleExportCSV}
                disabled={returns.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Excel İxrac Et", "Export Excel")}
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
                  onClick={() => setIsAddReturnModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Qaytarma Əlavə Et", "Add Purchase Return")}</span>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TƏCHİZATÇI", "SUPPLIER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("İSTİNAD", "REFERENCE")}
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
                    <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Qaytarma tapılmadı", "No returns found")}
                    </td>
                  </tr>
                ) : (
                  returns.map((returnItem, index) => (
                    <tr
                      key={returnItem.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatPurchaseDate(returnItem.date)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {returnItem.supplierName}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {returnItem.reference}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                            getStatusBadgeColor(returnItem.status),
                          )}
                        >
                          {translateStatus(returnItem.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.total} ₼
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.paid} ₼
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {returnItem.due.toFixed(2)} ₼
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium",
                            getPaymentStatusBadgeColor(returnItem.paymentStatus),
                          )}
                        >
                          {translatePaymentStatus(returnItem.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              onClick={() => setSelectedReturnId(returnItem.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              title={tr("Redaktə Et", "Edit")}
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
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

      <AddPurchaseReturnModal
        isOpen={isAddReturnModalOpen}
        onClose={() => setIsAddReturnModalOpen(false)}
        onSaved={() => void loadReturns()}
      />

      {selectedReturnId && (
        <PurchaseReturnDetailModal
          returnId={selectedReturnId}
          canEdit={canEdit}
          onClose={() => setSelectedReturnId(null)}
          onChanged={() => void loadReturns()}
        />
      )}
    </div>
  );
}
