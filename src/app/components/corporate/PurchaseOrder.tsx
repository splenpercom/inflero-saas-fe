import { useState, useEffect, useCallback, useMemo } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { fetchPurchaseOrderStats, type PurchaseOrderProductStat } from "../../api/purchases";
import { notifyFromError } from "../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../i18n/pickLang";
import { DataPagination } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

function productInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function PurchaseOrder() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView } = useModulePermissions("Purchases");
  const branchRevision = useBranchRevision();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("last7days");
  const [items, setItems] = useState<PurchaseOrderProductStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const loadItems = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPurchaseOrderStats({ sortBy, limit: 200 });
      setItems(data);
    } catch (err) {
      notifyFromError(err, tr("Əməliyyatları yükləmək alınmadı", "Failed to load purchase orders"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, sortBy, branchRevision]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.productName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q),
    );
  }, [items, searchQuery]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedItems,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: filteredItems,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${searchQuery}|${sortBy}`,
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(tr("Satınalma Əməliyyatları", "Purchase Order Stats"), 14, 20);
    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);

    const tableData = filteredItems.map((item) => [
      item.productName,
      item.sku,
      `${item.purchasedAmount} AZN`,
      String(item.purchasedQty),
      String(item.instockQty),
    ]);

    autoTable(doc, {
      startY: 35,
      head: [[
        tr("Məhsul", "Product"),
        "SKU",
        tr("Alış məbləği", "Purchased amount"),
        tr("Alış miqdarı", "Purchased qty"),
        tr("Stokda miqdar", "Instock qty"),
      ]],
      body: tableData,
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [20, 184, 166], textColor: [255, 255, 255], fontStyle: "bold" },
      margin: { top: 35 },
    });

    doc.save(`purchase-order-${Date.now()}.pdf`);
  };

  const handleExportExcel = () => {
    const headers = [
      tr("Məhsul", "Product"),
      "SKU",
      tr("Alış məbləği", "Purchased amount"),
      tr("Alış miqdarı", "Purchased qty"),
      tr("Stokda miqdar", "Instock qty"),
    ];
    const rows = filteredItems.map((item) => [
      item.productName,
      item.sku,
      item.purchasedAmount,
      item.purchasedQty,
      item.instockQty,
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws["!cols"] = [{ wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws, tr("Əməliyyatlar", "Orders"));
    XLSX.writeFile(wb, `purchase-order-${Date.now()}.xlsx`);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadItems();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Əməliyyatlar", "Purchase Order")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Əməliyyatlarınızı idarə edin", "Manage your purchase orders")}
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
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] cursor-pointer"
                >
                  <option value="last7days">{tr("Sırala : Son 7 Gün", "Sort By : Last 7 Days")}</option>
                  <option value="last30days">{tr("Sırala : Son 30 Gün", "Sort By : Last 30 Days")}</option>
                  <option value="last90days">{tr("Sırala : Son 90 Gün", "Sort By : Last 90 Days")}</option>
                  <option value="thisyear">{tr("Sırala : Bu İl", "Sort By : This Year")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                disabled={filteredItems.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button
                onClick={handleExportExcel}
                disabled={filteredItems.length === 0}
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
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("MƏHSUL", "PRODUCT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ALIŞ MƏBLƏĞİ", "PURCHASED AMOUNT")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ALIŞ MİQDARI", "PURCHASED QTY")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("STOKDA MİQDAR", "INSTOCK QTY")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Məlumat tapılmadı", "No data found")}
                    </td>
                  </tr>
                ) : (
                  pagedItems.map((item, index) => (
                    <tr
                      key={item.productId}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[#14b8a6] flex items-center justify-center text-[10px] font-semibold text-white border border-gray-300 dark:border-gray-700">
                            {productInitials(item.productName)}
                          </div>
                          <div>
                            <span className="text-xs text-gray-900 dark:text-white block">
                              {item.productName}
                            </span>
                            <span className="text-[10px] text-gray-500">{item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {item.purchasedAmount} ₼
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {item.purchasedQty}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {item.instockQty}
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
              showText={{
                showing: tr("Göstərilir", "Showing"),
                to: tr("-", "to"),
                of: tr("/", "of"),
                results: tr("nəticə", "results"),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
