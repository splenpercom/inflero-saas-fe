import { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import {
  Download,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { fetchBillerReport, type BillerReportItem } from "../../../api/reports";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import {
  formatReportCurrency,
} from "../../../lib/reportMappers";
import { formatDate } from "../../../lib/dateFormat";
import { notifyFromError } from "../../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../../i18n/pickLang";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";

const PIE_COLORS = ["#0026f6", "#0026f6", "#f97316", "#10b981", "#a78bfa", "#ec4899", "#0ea5e9", "#64748b"];

export function EmployeeSalesReport() {
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
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<BillerReportItem[]>([]);
  const [totals, setTotals] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalItemsSold: 0,
    activeBillers: 0,
  });
  const [period, setPeriod] = useState({ dateFrom: "", dateTo: "" });
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedBillerId, setSelectedBillerId] = useState<string | null>(null);

  const formatCurrency = (value: number) => formatReportCurrency(value);
  const formatChartCurrency = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k ₼`;
    return `${value} ₼`;
  };

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setItems([]);
      setTotals({ totalOrders: 0, totalRevenue: 0, totalItemsSold: 0, activeBillers: 0 });
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchBillerReport({
        dateFrom,
        dateTo,
        search: search.trim() || undefined,
        limit: 200,
      });
      setItems(Array.isArray(result.items) ? result.items : []);
      setTotals(result.totals ?? { totalOrders: 0, totalRevenue: 0, totalItemsSold: 0, activeBillers: 0 });
      setPeriod({ dateFrom: result.dateFrom, dateTo: result.dateTo });
    } catch (err) {
      notifyFromError(err, pt("İşçi satış hesabatını yükləmək alınmadı", "Failed to load employee sales report"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateFrom, dateTo, search, branchRevision]);

  useEffect(() => {
    if (items.length > 0) {
      const firstKey = items[0].billerId ?? "__none__";
      setSelectedBillerId((prev) => (prev && items.some((r) => (r.billerId ?? "__none__") === prev) ? prev : firstKey));
    }
  }, [items]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

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
    resetKey: `${dateFrom}|${dateTo}|${search}`,
  });

  const revenueChartData = useMemo(
    () =>
      items.map((row) => ({
        name: row.billerName.length > 14 ? `${row.billerName.slice(0, 14)}…` : row.billerName,
        revenue: row.totalRevenue,
        orders: row.orderCount,
        items: row.itemsSold,
      })),
    [items],
  );

  const selectedBiller = useMemo(
    () => items.find((r) => (r.billerId ?? "__none__") === selectedBillerId) ?? items[0],
    [items, selectedBillerId],
  );

  const categoryPieData = useMemo(() => {
    if (!selectedBiller) return [];
    return selectedBiller.categories.map((c, i) => ({
      name: c.category,
      value: c.soldAmount,
      qty: c.soldQty,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));
  }, [selectedBiller]);

  const periodLabel =
    period.dateFrom && period.dateTo
      ? `${formatDate(period.dateFrom, language)} — ${formatDate(period.dateTo, language)}`
      : "";

  const summaryCards = [
    {
      title: pt("Total Revenue", "Ümumi Gəlir"),
      value: formatCurrency(totals.totalRevenue),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: pt("Total Orders", "Ümumi Sifarişlər"),
      value: totals.totalOrders.toLocaleString(),
      icon: ShoppingBag,
      color: "text-[#0026f6] dark:text-[#0026f6]",
      bgColor: "bg-[#0026f6]/5 dark:bg-[#0026f6]/20",
    },
    {
      title: pt("Products Sold", "Satılan Məhsullar"),
      value: totals.totalItemsSold.toLocaleString(),
      icon: Package,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: pt("Active Employees", "Aktiv İşçilər"),
      value: totals.activeBillers.toLocaleString(),
      icon: Users,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleExport = () => {
    const rows = items.flatMap((row) => {
      const base = [
        row.billerName,
        row.billerCode,
        row.orderCount,
        row.totalRevenue,
        row.commissionAmount ?? 0,
        row.itemsSold,
        row.uniqueProducts,
        row.avgOrderValue,
        row.paidAmount,
        row.dueAmount,
      ];
      if (!row.categories.length) return [base];
      return row.categories.map((cat, idx) =>
        idx === 0
          ? [...base, cat.category, cat.soldQty, cat.soldAmount]
          : ["", "", "", "", "", "", "", "", "", "", cat.category, cat.soldQty, cat.soldAmount],
      );
    });

    const doc = new jsPDF();
    doc.text(pt("Employee Sales Report", "İşçi Satış Hesabatı"), 14, 15);
    if (periodLabel) doc.setFontSize(9).text(periodLabel, 14, 22);
    autoTable(doc, {
      head: [[
        pt("Employee", "İşçi"),
        pt("Code", "Kod"),
        pt("Orders", "Sifariş"),
        pt("Revenue", "Gəlir"),
        pt("Commission", "Komissiya"),
        pt("Qty Sold", "Satılan"),
        pt("Products", "Məhsul"),
        pt("Avg Order", "Orta Sifariş"),
        pt("Paid", "Ödənilib"),
        pt("Due", "Borc"),
        pt("Category", "Kateqoriya"),
        pt("Cat. Qty", "Kat. Miqdar"),
        pt("Cat. Amount", "Kat. Məbləğ"),
      ]],
      body: rows,
      startY: 28,
      styles: { fontSize: 7 },
    });
    doc.save("employee-sales-report.pdf");

    const ws = XLSX.utils.aoa_to_sheet([
      [
        pt("Employee", "İşçi"),
        pt("Code", "Kod"),
        pt("Orders", "Sifariş"),
        pt("Revenue", "Gəlir"),
        pt("Commission", "Komissiya"),
        pt("Qty Sold", "Satılan"),
        pt("Products", "Məhsul"),
        pt("Avg Order", "Orta Sifariş"),
        pt("Paid", "Ödənilib"),
        pt("Due", "Borc"),
        pt("Category", "Kateqoriya"),
        pt("Cat. Qty", "Kat. Miqdar"),
        pt("Cat. Amount", "Kat. Məbləğ"),
      ],
      ...rows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "employee-sales-report.xlsx");
  };

  const empty = !loading && items.length === 0;

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Employee Sales Report", "İşçi Satış Hesabatı")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("POS performance by employee — revenue, products, and categories", "İşçi üzrə POS performansı — gəlir, məhsul və kateqoriyalar")}
          </p>
          {periodLabel && (
            <p className="text-[10px] text-gray-400 mt-1">{periodLabel}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pt("Search employee...", "İşçi axtar...")}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] w-40"
            />
          </div>
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
            title={pt("Refresh", "Yenilə")}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!items.length}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0026f6] hover:bg-[#001db8] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
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
          {pt("No employee sales in this period", "Bu dövrdə işçi satışı yoxdur")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                {pt("Revenue by Employee", "İşçi üzrə Gəlir")}
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={(value: number, name: string) => [name === "revenue" ? formatCurrency(value) : value, name === "revenue" ? pt("Revenue", "Gəlir") : pt("Orders", "Sifariş")]} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#0026f6" name={pt("Revenue", "Gəlir")} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pt("Categories by Employee", "İşçi üzrə Kateqoriyalar")}
                </h2>
                <select
                  value={selectedBillerId ?? ""}
                  onChange={(e) => setSelectedBillerId(e.target.value)}
                  className="px-2 py-1 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                >
                  {items.map((row) => (
                    <option key={row.billerId ?? "__none__"} value={row.billerId ?? "__none__"}>
                      {row.billerName}
                    </option>
                  ))}
                </select>
              </div>
              {categoryPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-16">
                  {pt("No category data", "Kateqoriya məlumatı yoxdur")}
                </p>
              )}
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Employee Breakdown", "İşçi Təfərrüatı")}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 text-left">
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">{pt("Employee", "İşçi")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Orders", "Sifariş")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Revenue", "Gəlir")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Commission", "Komissiya")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Products Sold", "Satılan")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Unique Products", "Unikal")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Avg Order", "Orta")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Paid", "Ödənilib")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase text-right">{pt("Due", "Borc")}</th>
                    <th className="px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase w-10" />
                  </tr>
                </thead>
                <tbody>
                  {pagedItems.map((row) => {
                    const rowKey = row.billerId ?? "__none__";
                    const isOpen = expandedId === rowKey;
                    return (
                      <Fragment key={rowKey}>
                        <tr className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                          <td className="px-3 py-2.5">
                            <p className="text-xs font-medium text-gray-900 dark:text-white">{row.billerName}</p>
                            <p className="text-[10px] text-gray-400">{row.billerCode || "—"}</p>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-right text-gray-900 dark:text-white">{row.orderCount}</td>
                          <td className="px-3 py-2.5 text-xs text-right font-medium text-gray-900 dark:text-white">{formatCurrency(row.totalRevenue)}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(row.commissionAmount ?? 0)}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-gray-600 dark:text-gray-400">{row.itemsSold}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-gray-600 dark:text-gray-400">{row.uniqueProducts}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-gray-600 dark:text-gray-400">{formatCurrency(row.avgOrderValue)}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-green-600 dark:text-green-400">{formatCurrency(row.paidAmount)}</td>
                          <td className="px-3 py-2.5 text-xs text-right text-orange-600 dark:text-orange-400">{formatCurrency(row.dueAmount + row.unpaidAmount)}</td>
                          <td className="px-3 py-2.5 text-center">
                            {row.categories.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleExpanded(rowKey)}
                                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              >
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            )}
                          </td>
                        </tr>
                        {isOpen && row.categories.length > 0 && (
                          <tr className="bg-gray-50/80 dark:bg-gray-800/30">
                            <td colSpan={10} className="px-6 py-3">
                              <p className="text-[10px] font-semibold text-gray-500 uppercase mb-2">
                                {pt("Categories", "Kateqoriyalar")}
                              </p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {row.categories.map((cat) => (
                                  <div
                                    key={`${rowKey}-${cat.category}`}
                                    className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                  >
                                    <span className="text-xs text-gray-700 dark:text-gray-300">{cat.category}</span>
                                    <div className="text-right">
                                      <p className="text-xs font-medium text-gray-900 dark:text-white">{formatCurrency(cat.soldAmount)}</p>
                                      <p className="text-[10px] text-gray-400">{cat.soldQty} {pt("pcs", "ədəd")}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
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
