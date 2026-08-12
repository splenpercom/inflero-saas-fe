import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useBranch } from "../../context/BranchContext";
import { useStockLocations } from "../../hooks/useStockLocations";
import { EditStockModal } from "./EditStockModal";
import { ModernSelect } from "../ui/ModernSelect";
import { fetchStockLevels, type StockLevelRow } from "../../api/stock";
import { formatStockDate, branchLabel } from "../../lib/stockMappers";
import { notifyFromError } from "../../lib/toast";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";

export function ManageStock() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit } = useModulePermissions("Stock");
  const branchRevision = useBranchRevision();
  const { isGlobalMode } = useBranch();
  const { branches } = useStockLocations();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<StockLevelRow | null>(null);
  const [items, setItems] = useState<StockLevelRow[]>([]);
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
      const data = await fetchStockLevels({
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
      notifyFromError(err, tr("Ehtiyat siyahısını yükləmək alınmadı", "Failed to load stock levels"));
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
    doc.text(tr("Ehtiyat Siyahısı", "Stock List"), 14, 15);
    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDate(language)}`, 14, 22);
    autoTable(doc, {
      head: [
        [
          tr("Filial", "Branch"),
          tr("Məhsul", "Product"),
          tr("Tarix", "Date"),
          tr("Şəxs", "Person"),
          tr("Miqdar", "Qty"),
        ],
      ],
      body: items.map((item) => [
        branchLabel(item.store),
        item.productName,
        formatStockDate(item.date),
        item.personName,
        String(item.qty),
      ]),
      startY: 28,
      theme: "grid",
      headStyles: { fillColor: [0, 38, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
    });
    doc.save(`stock_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [
      tr("Filial", "Branch"),
      tr("Məhsul", "Product"),
      tr("Tarix", "Date"),
      tr("Şəxs", "Person"),
      tr("Miqdar", "Qty"),
    ];
    const rows = items.map((item) => [
      branchLabel(item.store),
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
    link.download = `stock_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const handleRecordAdjustment = () => {
    if (!canCreate) return;
    navigate("/dashboard/stock/adjustment");
  };

  const handleEdit = (item: StockLevelRow) => {
    if (!canEdit) return;
    setSelectedStockItem(item);
    setIsEditStockModalOpen(true);
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
            {tr("Ehtiyat İdarəsi", "Manage Stock")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Ehtiyatlarınızı idarə edin", "Manage your stock")}
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
                  onClick={handleRecordAdjustment}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Tənzimləmə qeyd et", "Record adjustment")}</span>
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
                    {tr("FİLİAL", "BRANCH")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("MƏHSUL", "PRODUCT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ŞƏXS", "PERSON")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("MİQDAR", "QTY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
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
                      {tr(
                        "Bu yerdə ehtiyat yoxdur. İnventarda məhsul yaradın və ya tənzimləmə qeyd edin.",
                        "No stock at this location. Create products in Inventory or record an adjustment.",
                      )}
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {branchLabel(item.store)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => navigate(`/dashboard/inventory/products/${item.productId}`)}
                          className="text-xs text-[#0026f6] dark:text-blue-400 hover:underline"
                        >
                          {item.productName}
                        </button>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatStockDate(item.date)}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.personName || "—"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {item.qty}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
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

        <EditStockModal
          isOpen={isEditStockModalOpen}
          onClose={() => {
            setIsEditStockModalOpen(false);
            setSelectedStockItem(null);
          }}
          onSaved={() => void loadItems()}
          stockItem={selectedStockItem}
        />
      </div>
    </div>
  );
}
