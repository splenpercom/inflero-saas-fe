import { useState, useEffect, useCallback } from "react";
import {
  Search,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  Check,
  ArrowUpDown,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchLowStockProducts,
  fetchCategories,
  deleteProduct,
  type ProductListItem,
  type CategoryRecord,
} from "../../api/inventory";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { ModernSelect } from "../ui/ModernSelect";
import { ProductImage } from "../ui/ProductImage";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";

interface StockItem {
  id: string;
  productImage: string;
  productName: string;
  category: string;
  sku: string;
  qty: number;
  qtyAlert: number;
}

function mapProduct(row: ProductListItem): StockItem {
  return {
    id: row.id,
    productImage: row.image,
    productName: row.name,
    category: row.category,
    sku: row.sku,
    qty: row.quantity,
    qtyAlert: row.quantityAlert ?? 0,
  };
}

export function LowStocks() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortColumn, setSortColumn] = useState<keyof StockItem | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [items, setItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
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
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setCategories([]);
      return;
    }
    fetchCategories()
      .then(setCategories)
      .catch((err) =>
        notifyFromError(err, tr("Kateqoriyaları yükləmək alınmadı", "Failed to load categories")),
      );
  }, [isDemo, isAuthenticated, canView, language, branchRevision]);

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
      const data = await fetchLowStockProducts({
        page: currentPage,
        pageSize: itemsPerPage,
        search: debouncedSearch.trim() || undefined,
        categoryId: selectedCategory !== "all" ? selectedCategory : undefined,
      });
      setItems(data.items.map(mapProduct));
      setTotalItems(data.total);
      setTotalPages(Math.max(1, data.totalPages || 1));
      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setCurrentPage(data.totalPages);
      }
    } catch (err) {
      notifyFromError(err, tr("Az ehtiyatlı məhsulları yükləmək alınmadı", "Failed to load low stock products"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, currentPage, debouncedSearch, selectedCategory, language, branchRevision, itemsPerPage]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const sortedItems = [...items].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortDirection === "asc"
      ? (aValue as number) - (bValue as number)
      : (bValue as number) - (aValue as number);
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Low Stocks Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${formatNowDateTime(language)}`, 14, 28);

    const tableData = sortedItems.map((item) => [
      item.sku,
      item.productName,
      item.category,
      item.qty.toString(),
      item.qtyAlert.toString(),
    ]);

    autoTable(doc, {
      head: [["SKU", "Product Name", "Category", "Qty", "Qty Alert"]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: { fontSize: 9, textColor: [50, 50, 50] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 35 },
    });

    doc.save(`low-stocks-${new Date().getTime()}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = ["SKU", "Product Name", "Category", "Qty", "Qty Alert"];
    const rows = sortedItems.map((item) => [
      item.sku,
      item.productName,
      item.category,
      item.qty.toString(),
      item.qtyAlert.toString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `low-stocks-${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadItems().finally(() => setIsRefreshing(false));
  };

  const handleSort = (column: keyof StockItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleView = (id: string) => {
    navigate(`/dashboard/inventory/products/${id}`);
  };

  const handleEdit = (id: string) => {
    navigate(`/dashboard/inventory/products/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu məhsulu silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this item?"),
      variant: "danger",
    }))) {
      return;
    }
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteProduct(id);
      notifySuccess(tr("Məhsul silindi", "Product deleted"));
      void loadItems();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const categoryOptions: SelectOption[] = [
    { value: "all", label: tr("Bütün Kateqoriyalar", "All Categories") },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Az Ehtiyatlı Məhsullar", "Low Stocks")}
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Məhsul axtar...", "Search products...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <ModernSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={categoryOptions}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("CSV İxrac Et", "Export CSV")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <div
          className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-opacity duration-300 ${
            isRefreshing ? "opacity-50" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort("sku")}
                  >
                    SKU
                    {sortColumn === "sku" && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort("productName")}
                  >
                    {tr("MƏHSULUN ADI", "PRODUCT NAME")}
                    {sortColumn === "productName" && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort("category")}
                  >
                    {tr("KATEQORİYA", "CATEGORY")}
                    {sortColumn === "category" && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort("qty")}
                  >
                    {tr("MİQDAR", "QTY")}
                    {sortColumn === "qty" && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer"
                    onClick={() => handleSort("qtyAlert")}
                  >
                    {tr("MİQDAR XƏBƏRDARLIQ", "QTY ALERT")}
                    {sortColumn === "qtyAlert" && (
                      <ArrowUpDown className={`w-3.5 h-3.5 ml-1 inline ${sortDirection === "asc" ? "rotate-180" : ""}`} />
                    )}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      {tr("Məhsul tapılmadı", "No products found")}
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.sku}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <ProductImage image={item.productImage} />
                          <span className="text-xs text-gray-900 dark:text-white">{item.productName}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-300 dark:border-yellow-700">
                          {item.qty}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700">
                          {item.qtyAlert}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleView(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {canEdit && (
                          <button
                            onClick={() => handleEdit(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          )}
                          {canDelete && (
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
    </div>
  );
}
