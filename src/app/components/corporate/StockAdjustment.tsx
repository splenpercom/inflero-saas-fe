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
import { useBranch } from "../../context/BranchContext";
import { useStockLocations } from "../../hooks/useStockLocations";
import { AddAdjustmentModal } from "./AddAdjustmentModal";
import { ViewAdjustmentModal } from "./ViewAdjustmentModal";
import { ModernSelect } from "../ui/ModernSelect";
import {
  fetchStockAdjustments,
  deleteStockAdjustment,
  type StockAdjustmentRow,
} from "../../api/stock";
import { formatStockDate, branchLabel, locationLabel } from "../../lib/stockMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";

export function StockAdjustment() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canDelete } = useModulePermissions("Stock");
  const branchRevision = useBranchRevision();
  const { isGlobalMode } = useBranch();
  const { branches } = useStockLocations();
  const askConfirm = useConfirm();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddAdjustmentModalOpen, setIsAddAdjustmentModalOpen] = useState(false);
  const [viewAdjustmentData, setViewAdjustmentData] = useState<StockAdjustmentRow | null>(null);
  const [items, setItems] = useState<StockAdjustmentRow[]>([]);
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
  }, [debouncedSearch, selectedBranch]);

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
      const data = await fetchStockAdjustments({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearch.trim() || undefined,
        storeId:
          isGlobalMode && selectedBranch !== "all" ? selectedBranch : undefined,
      });
      setItems(data.items);
      setTotalItems(data.total);
      setTotalPages(Math.max(1, data.totalPages || 1));
      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setCurrentPage(data.totalPages);
      }
    } catch (err) {
      notifyFromError(err, tr("Tənzimləmələri yükləmək alınmadı", "Failed to load adjustments"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    currentPage,
    debouncedSearch,
    selectedBranch,
    isGlobalMode,
    branchRevision,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(tr("Ehtiyat Tənzimləmələri", "Stock Adjustments"), 14, 15);
    autoTable(doc, {
      head: [
        [
          tr("Filial", "Branch"),
          tr("Məhsul", "Product"),
          tr("Tarix", "Date"),
          tr("Şəxs", "Person"),
          tr("Tənzimləmə", "Adjustment"),
        ],
      ],
      body: items.map((item) => [
        branchLabel(item.store),
        item.productName,
        formatStockDate(item.date),
        item.personName,
        `${item.qty > 0 ? "+" : ""}${item.qty}`,
      ]),
      startY: 22,
      theme: "grid",
      headStyles: { fillColor: [20, 184, 166], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    });
    doc.save(`stock_adjustments_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [
      tr("Yer", "Location"),
      tr("Məhsul", "Product"),
      tr("Tarix", "Date"),
      tr("Şəxs", "Person"),
      tr("Tənzimləmə", "Adjustment"),
    ];
    const rows = items.map((item) => [
      locationLabel(item.warehouse, item.store),
      item.productName,
      formatStockDate(item.date),
      item.personName,
      item.qty,
    ]);
    let csvContent = headers.join(";") + "\n";
    rows.forEach((row) => {
      csvContent += row.join(";") + "\n";
    });
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stock_adjustments_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    if (!canDelete || isDemo) return;
    const confirmed = await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr(
        "Bu tənzimləməni silmək istəyirsiniz? Bu, audit qeydini gizlədir; ehtiyat miqdarı geri qaytarılmır.",
        "Delete this adjustment? This soft-deletes the audit record; stock quantity is not reversed.",
      ),
      variant: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStockAdjustment(id);
      notifySuccess(tr("Tənzimləmə silindi", "Adjustment deleted"));
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
            {tr("Ehtiyat Tənzimlənməsi", "Stock Adjustment")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Ehtiyat tənzimlənməsini idarə edin", "Manage your stock adjustment")}
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

            {isGlobalMode && (
              <ModernSelect
                value={selectedBranch}
                onChange={setSelectedBranch}
                options={branchOptions}
                placeholder={tr("Filial", "Branch")}
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={items.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={items.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={() => setIsAddAdjustmentModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Tənzimləmə Əlavə Et", "Add Adjustment")}</span>
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
                    {tr("FİLİAL", "BRANCH")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("MƏHSUL", "PRODUCT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("ŞƏXS", "PERSON")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("TƏNZİMLƏMƏ", "ADJUSTMENT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Tənzimləmə tapılmadı", "No adjustments found")}
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
                        {locationLabel(item.warehouse, item.store)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                        {item.productName}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatStockDate(item.date)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.personName || "—"}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            item.qty > 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400",
                          )}
                        >
                          {item.qty > 0 ? "+" : ""}
                          {item.qty}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setViewAdjustmentData(item)}
                            className="flex items-center px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.id)}
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

      <AddAdjustmentModal
        isOpen={isAddAdjustmentModalOpen}
        onClose={() => setIsAddAdjustmentModalOpen(false)}
        onSaved={() => void loadItems()}
      />
      <ViewAdjustmentModal
        adjustment={viewAdjustmentData}
        onClose={() => setViewAdjustmentData(null)}
      />
    </div>
  );
}
