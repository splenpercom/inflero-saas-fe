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
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useStockLocations } from "../../hooks/useStockLocations";
import { AddTransferModal } from "./AddTransferModal";
import { TransferDetailModal } from "./TransferDetailModal";
import { ModernSelect } from "../ui/ModernSelect";
import {
  fetchStockTransfers,
  deleteStockTransfer,
  type StockTransferRow,
} from "../../api/stock";
import { formatStockDate } from "../../lib/stockMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";

function statusLabel(status: string, tr: (az: string, en: string) => string): string {
  if (status === "PENDING") return tr("Gözləyir", "Pending");
  if (status === "APPROVED") return tr("Təsdiqlənib", "Approved");
  if (status === "REJECTED") return tr("Rədd edilib", "Rejected");
  return status;
}

export function StockTransfer() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canDelete } = useModulePermissions("Stock");
  const branchRevision = useBranchRevision();
  const { branches } = useStockLocations();
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromBranch, setFromBranch] = useState("all");
  const [toBranch, setToBranch] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [detailTransfer, setDetailTransfer] = useState<StockTransferRow | null>(null);
  const [items, setItems] = useState<StockTransferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, fromBranch, toBranch]);

  const loadItems = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setItems([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchStockTransfers({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearch.trim() || undefined,
        fromStoreId: fromBranch !== "all" ? fromBranch : undefined,
        toStoreId: toBranch !== "all" ? toBranch : undefined,
      });
      setItems(data.items);
      setTotalItems(data.total);
      setTotalPages(Math.max(1, data.totalPages || 1));
      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setCurrentPage(data.totalPages);
      }
    } catch (err) {
      notifyFromError(err, tr("Transferləri yükləmək alınmadı", "Failed to load transfers"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    currentPage,
    debouncedSearch,
    fromBranch,
    toBranch,
    branchRevision,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(tr("Ehtiyat Transferləri", "Stock Transfers"), 14, 15);
    autoTable(doc, {
      head: [
        [
          tr("Haradan filial", "From branch"),
          tr("Hədəf filial", "To branch"),
          tr("Məhsul sayı", "Products"),
          tr("Miqdar", "Qty"),
          tr("İstinad", "Ref"),
          tr("Tarix", "Date"),
        ],
      ],
      body: items.map((item) => [
        item.fromWarehouse,
        item.toWarehouse,
        String(item.noOfProducts),
        String(item.quantityTransferred),
        item.refNumber,
        formatStockDate(item.date),
      ]),
      startY: 22,
      theme: "grid",
      headStyles: { fillColor: [20, 184, 166], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    });
    doc.save(`stock_transfers_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [
      tr("Haradan", "From"),
      tr("Haraya", "To"),
      tr("Məhsul sayı", "Products"),
      tr("Miqdar", "Qty"),
      tr("İstinad", "Ref"),
      tr("Tarix", "Date"),
      tr("Depozit", "Deposited"),
      tr("Status", "Status"),
    ];
    const rows = items.map((item) => [
      item.fromWarehouse,
      item.toWarehouse,
      item.noOfProducts,
      item.quantityTransferred,
      item.refNumber,
      formatStockDate(item.date),
      item.isDeposited ? tr("Bəli", "Yes") : tr("Xeyr", "No"),
      item.isDeposited ? statusLabel(item.approvalStatus, tr) : "—",
    ]);
    let csvContent = headers.join(";") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(";") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_transfers_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const handleDelete = async (item: StockTransferRow) => {
    if (!canDelete || isDemo) return;
    if (item.isDeposited && item.approvalStatus === "PENDING") {
      notifyFromError(
        new Error(tr("Gözləyən depozit transferi buradan silinə bilməz", "Use detail view for pending deposited transfers")),
      );
      return;
    }
    const confirmed = await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr(
        "Bu transferi silmək istəyirsiniz? Bu, audit qeydini gizlədir.",
        "Delete this transfer? This soft-deletes the audit record.",
      ),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStockTransfer(item.id);
      notifySuccess(tr("Transfer silindi", "Transfer deleted"));
      void loadItems();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const branchOptions = [
    { value: "all", label: tr("Hamısı", "All") },
    ...branches.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Ehtiyat Transferi", "Stock Transfer")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Ehtiyat transferlərini idarə edin", "Manage stock transfers")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <ModernSelect
              value={fromBranch}
              onChange={setFromBranch}
              options={branchOptions}
              placeholder={tr("Haradan filial", "From branch")}
            />
            <ModernSelect
              value={toBranch}
              onChange={setToBranch}
              options={branchOptions}
              placeholder={tr("Hədəf filial", "To branch")}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={items.length === 0}
                className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={items.length === 0}
                className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Transfer Əlavə Et", "Add Transfer")}</span>
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
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("HARADAN FİLİAL", "FROM BRANCH")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("HƏDƏF FİLİAL", "TO BRANCH")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("MƏHSULLAR", "PRODUCTS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("MİQDAR", "QTY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("İSTİNAD", "REF")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Transfer tapılmadı", "No transfers found")}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.fromWarehouse}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.toWarehouse}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                        {item.noOfProducts}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                        {item.quantityTransferred}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.refNumber || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatStockDate(item.date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.isDeposited ? (
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded font-medium",
                              item.approvalStatus === "PENDING" && "bg-amber-100 text-amber-800",
                              item.approvalStatus === "APPROVED" && "bg-green-100 text-green-800",
                              item.approvalStatus === "REJECTED" && "bg-red-100 text-red-800",
                            )}
                          >
                            {statusLabel(item.approvalStatus, tr)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDetailTransfer(item)}
                            className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canDelete &&
                            !(item.isDeposited && item.approvalStatus === "PENDING") && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(item)}
                                className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-red-600"
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

      <AddTransferModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSaved={() => void loadItems()}
      />
      <TransferDetailModal
        transfer={detailTransfer}
        onClose={() => setDetailTransfer(null)}
        onChanged={() => void loadItems()}
      />
    </div>
  );
}
