import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import { Download, Search, Package, TrendingUp, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  fetchProductReport,
  fetchProductQuantityAlert,
  type ProductReportItem,
  type ProductQuantityAlertItem,
} from "../../../api/reports";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import {
  formatReportCurrency,
  stockStatusFromQty,
} from "../../../lib/reportMappers";
import { notifyFromError } from "../../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../../i18n/pickLang";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";

export function ProductReport() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { canView } = useModulePermissions("Reports");
  const branchRevision = useBranchRevision();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const {
    preset: dateRange,
    setPreset: setDateRange,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
  } = useReportDateRange("month");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [items, setItems] = useState<ProductReportItem[]>([]);
  const [alerts, setAlerts] = useState<ProductQuantityAlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => formatReportCurrency(value);

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setItems([]);
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [productResult, alertItems] = await Promise.all([
        fetchProductReport({ dateFrom, dateTo, limit: 200 }),
        stockEnabled ? fetchProductQuantityAlert({ limit: 500 }) : Promise.resolve([]),
      ]);
      setItems(Array.isArray(productResult.items) ? productResult.items : []);
      setAlerts(Array.isArray(alertItems) ? alertItems : []);
    } catch (err) {
      notifyFromError(err, pt("Məhsul hesabatını yükləmək alınmadı", "Failed to load product report"));
      setItems([]);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateFrom, dateTo, branchRevision, stockEnabled]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const alertCounts = useMemo(() => {
    let low = 0;
    let out = 0;
    for (const a of alerts) {
      if (a.totalQuantity <= 0) out++;
      else if (a.alertQuantity > 0 && a.totalQuantity <= a.alertQuantity) low++;
    }
    return { low, out };
  }, [alerts]);

  const totalUnitsSold = useMemo(
    () => items.reduce((s, i) => s + (i.totalOrdered ?? 0), 0),
    [items],
  );

  const topByOrdered = useMemo(
    () =>
      [...items]
        .sort((a, b) => (b.totalOrdered ?? 0) - (a.totalOrdered ?? 0))
        .slice(0, 10)
        .map((p) => ({
          name: p.productName.length > 16 ? `${p.productName.slice(0, 16)}…` : p.productName,
          sold: p.totalOrdered ?? 0,
        })),
    [items],
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return items.filter((product) => {
      const matchesSearch =
        !q ||
        product.productName.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, categoryFilter]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedProducts,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: filteredProducts,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${dateFrom}|${dateTo}|${searchTerm}|${categoryFilter}`,
  });

  const summaryCards = [
    {
      title: pt("Total Products", "Ümumi Məhsullar"),
      value: items.length.toLocaleString(),
      icon: Package,
      color: "text-[#0026f6] dark:text-[#0026f6]",
      bgColor: "bg-[#0026f6]/5 dark:bg-[#0026f6]/20",
    },
    {
      title: pt("Total Units Sold", "Satılan Vahidlər"),
      value: totalUnitsSold.toLocaleString(),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: pt("Low Stock Items", "Az Stoklu Məhsullar"),
      value: alertCounts.low.toLocaleString(),
      icon: AlertTriangle,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: pt("Out of Stock", "Stokda Yoxdur"),
      value: alertCounts.out.toLocaleString(),
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ].filter((_, index) => stockEnabled || index < 2);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-full">
            <CheckCircle className="w-3 h-3" />
            {pt("Healthy", "Sağlam")}
          </span>
        );
      case "low":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {pt("Low Stock", "Az Stok")}
          </span>
        );
      case "critical":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            {pt("Out of Stock", "Stokda Yoxdur")}
          </span>
        );
      default:
        return null;
    }
  };

  const handleExport = () => {
    const rows = filteredProducts.map((p) => [
      p.productName,
      p.category,
      p.totalOrdered ?? 0,
      p.revenue ?? 0,
      ...(stockEnabled ? [p.qty ?? 0, stockStatusFromQty(p.qty ?? 0)] : []),
    ]);
    const doc = new jsPDF();
    doc.text(pt("Product Report", "Məhsul Hesabatı"), 14, 15);
    autoTable(doc, {
      head: [[pt("Product", "Məhsul"), pt("Category", "Kateqoriya"), pt("Sold", "Satılan"), pt("Revenue", "Gəlir"), ...(stockEnabled ? [pt("Stock", "Stok"), pt("Status", "Status")] : [])]],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save("product-report.pdf");
    const ws = XLSX.utils.aoa_to_sheet([
      [pt("Product", "Məhsul"), pt("Category", "Kateqoriya"), pt("Sold", "Satılan"), pt("Revenue", "Gəlir"), ...(stockEnabled ? [pt("Stock", "Stok"), pt("Status", "Status")] : [])],
      ...rows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "product-report.xlsx");
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Product Report", "Məhsul Hesabatı")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("Product sales and inventory status", "Məhsul satışları və inventar statusu")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportDateRangeFilter
            preset={dateRange}
            onPresetChange={setDateRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          <button type="button" onClick={() => void loadReport()} disabled={loading} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={handleExport} disabled={!filteredProducts.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0026f6] hover:bg-[#001db8] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pt("Export", "İxrac")}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
              </div>
              <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{card.title}</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stockEnabled && <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {pt("Top Products by Units Sold", "Satılan Vahid üzrə Ən Yaxşı Məhsullar")}
          </h2>
          {topByOrdered.length === 0 ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-16">{pt("No sales data", "Satış məlumatı yoxdur")}</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topByOrdered} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 9 }} width={90} />
                <Tooltip />
                <Bar dataKey="sold" fill="#0026f6" name={pt("Units Sold", "Satılan")} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>}

        <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {pt("Restock Activity", "Yenidən Stok Fəaliyyəti")}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-24">
            {pt("Restock time-series is not available from the API.", "Yenidən stok zaman sırası API-dən mövcud deyil.")}
          </p>
        </div>
      </div>

      <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{pt("Products", "Məhsullar")}</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={pt("Search products...", "Məhsul axtar...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] w-48"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            >
              <option value="all">{pt("All Categories", "Bütün Kateqoriyalar")}</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Product", "Məhsul")}</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Category", "Kateqoriya")}</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Units Sold", "Satılan")}</th>
                <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Revenue", "Gəlir")}</th>
                {stockEnabled && <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Stock", "Stok")}</th>}
                {stockEnabled && <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Status", "Status")}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={stockEnabled ? 6 : 4} className="py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {loading ? pt("Loading...", "Yüklənir...") : pt("No products found", "Məhsul tapılmadı")}
                  </td>
                </tr>
              ) : (
                pagedProducts.map((product) => (
                    <tr key={product.productId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-2 px-3 text-xs font-medium text-gray-900 dark:text-white">{product.productName}</td>
                      <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{product.category}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{(product.totalOrdered ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(product.revenue ?? 0)}</td>
                      {stockEnabled && <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{product.qty ?? 0}</td>}
                      {stockEnabled && <td className="py-2 px-3 text-xs">{getStatusBadge(stockStatusFromQty(product.qty ?? 0))}</td>}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
          <DataPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            showText={{
              showing: pt("Showing", "Göstərilir"),
              to: pt("to", "-"),
              of: pt("of", "/"),
              results: pt("results", "nəticə"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
