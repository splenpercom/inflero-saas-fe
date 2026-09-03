import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import { Download, DollarSign, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchSalesReport, type SalesReportItem } from "../../../api/reports";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import {
  aggregateCategoriesFromSalesItems,
  formatReportCurrency,
  parseReportMoney,
  topCategoriesBar,
  topProductsByAmount,
  topProductsByQty,
} from "../../../lib/reportMappers";
import { notifyFromError } from "../../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../../i18n/pickLang";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";

export function SalesReport() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
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
  const [items, setItems] = useState<SalesReportItem[]>([]);
  const [totals, setTotals] = useState({ totalPaid: 0, totalDue: 0, totalUnpaid: 0, purchase: 0 });
  const [loading, setLoading] = useState(true);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedItems,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: items,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${dateFrom}|${dateTo}`,
  });

  const formatCurrency = (value: number) => formatReportCurrency(value);
  const formatChartCurrency = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k ₼`;
    return `${value} ₼`;
  };

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setItems([]);
      setTotals({ totalPaid: 0, totalDue: 0, totalUnpaid: 0, purchase: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchSalesReport({ dateFrom, dateTo, limit: 200 });
      setItems(Array.isArray(result.items) ? result.items : []);
      setTotals({
        totalPaid: parseReportMoney(result.totals?.totalPaid),
        totalDue: parseReportMoney(result.totals?.totalDue),
        totalUnpaid: parseReportMoney(result.totals?.totalUnpaid),
        purchase: parseReportMoney(result.totals?.purchase),
      });
    } catch (err) {
      notifyFromError(err, pt("Satış hesabatını yükləmək alınmadı", "Failed to load sales report"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateFrom, dateTo, branchRevision]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const topByAmount = useMemo(() => topProductsByAmount(items), [items]);
  const topByQty = useMemo(() => topProductsByQty(items), [items]);
  const categoryBars = useMemo(() => topCategoriesBar(items), [items]);
  const categoryBreakdown = useMemo(() => aggregateCategoriesFromSalesItems(items), [items]);

  const summaryCards = [
    {
      title: pt("Total Sales", "Ümumi Satışlar"),
      value: formatCurrency(totals.purchase),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: pt("Paid", "Ödənilib"),
      value: formatCurrency(totals.totalPaid),
      icon: DollarSign,
      color: "text-[#14b8a6] dark:text-[#14b8a6]",
      bgColor: "bg-[#14b8a6]/5 dark:bg-[#14b8a6]/20",
    },
    {
      title: pt("Partial Due", "Qismən Borc"),
      value: formatCurrency(totals.totalDue),
      icon: CreditCard,
      color: "text-yellow-600 dark:text-yellow-400",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
    },
    {
      title: pt("Unpaid", "Ödənilməyib"),
      value: formatCurrency(totals.totalUnpaid),
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
  ];

  const handleExport = () => {
    const rows = items.map((r) => [
      r.productName,
      r.category,
      r.soldQty,
      parseReportMoney(r.soldAmount),
      r.instockQty,
    ]);
    const doc = new jsPDF();
    doc.text(pt("Sales Report", "Satış Hesabatı"), 14, 15);
    autoTable(doc, {
      head: [[pt("Product", "Məhsul"), pt("Category", "Kateqoriya"), pt("Sold Qty", "Satılan"), pt("Amount", "Məbləğ"), pt("In Stock", "Stok")]],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save("sales-report.pdf");
    const ws = XLSX.utils.aoa_to_sheet([
      [pt("Product", "Məhsul"), pt("Category", "Kateqoriya"), pt("Sold Qty", "Satılan"), pt("Amount", "Məbləğ"), pt("In Stock", "Stok")],
      ...rows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales");
    XLSX.writeFile(wb, "sales-report.xlsx");
  };

  const empty = !loading && items.length === 0;

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Sales Report", "Satış Hesabatı")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("Product sales and payment breakdown", "Məhsul satışları və ödəniş təfərrüatı")}
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
          <button
            type="button"
            onClick={() => void loadReport()}
            disabled={loading}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            title={pt("Yenilə", "Refresh")}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!items.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0f766e] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
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

      {empty ? (
        <div className="glass-card p-8 rounded-xl border border-white/20 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
          {pt("No sales in this period", "Bu dövrdə satış yoxdur")}
        </div>
      ) : (
        <>
          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {pt("Top Products by Revenue", "Gəlir üzrə Ən Yaxşı Məhsullar")}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={topByAmount}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Area type="monotone" dataKey="sales" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" name={pt("Sales", "Satış")} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {pt("Sales by Category", "Kateqoriya üzrə Satışlar")}
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryBars}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="category" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="sales" fill="#14b8a6" name={pt("Sales", "Satış")} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {pt("Top Products by Quantity", "Miqdar üzrə Ən Yaxşı Məhsullar")}
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={topByQty}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Line type="monotone" dataKey="qty" stroke="#10b981" strokeWidth={2} name={pt("Quantity", "Miqdar")} dot={{ fill: "#10b981", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {pt("Sales by Category", "Kateqoriya üzrə Satışlar")}
            </h2>
            <div className="space-y-3">
              {categoryBreakdown.map((category, index) => (
                <div key={index} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-900 dark:text-white">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 dark:text-gray-400">{formatCurrency(category.value)}</span>
                      <span className="text-[#14b8a6] dark:text-[#14b8a6] font-semibold w-10 text-right">{category.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#14b8a6] to-[#14b8a6] rounded-full transition-all duration-500" style={{ width: `${category.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {pt("Product Breakdown", "Məhsul Təfsilatı")}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Product", "Məhsul")}</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Category", "Kateqoriya")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Sold Qty", "Satılan")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Amount", "Məbləğ")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("In Stock", "Stok")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((row) => (
                    <tr key={row.productId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-2 px-3 text-xs font-medium text-gray-900 dark:text-white">{row.productName}</td>
                      <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{row.category}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{row.soldQty}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(parseReportMoney(row.soldAmount))}</td>
                      <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{row.instockQty}</td>
                    </tr>
                  ))}
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
        </>
      )}
    </div>
  );
}
