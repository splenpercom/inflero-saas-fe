import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranch } from "../../../context/BranchContext";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import { Download, DollarSign, CreditCard, Wallet, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchProfitLoss, fetchExpenseReport } from "../../../api/reports";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import {
  aggregateExpensesByCategory,
  formatReportCurrency,
  mapProfitLossToFinanceUI,
} from "../../../lib/reportMappers";
import { notifyFromError } from "../../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../../i18n/pickLang";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_REPORT_PAGE_SIZE } from "../../../hooks/usePagination";

export function FinanceReport() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView } = useModulePermissions("Reports");
  const { isGlobalMode } = useBranch();
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
  } = useReportDateRange("year");
  const [monthlyData, setMonthlyData] = useState<ReturnType<typeof mapProfitLossToFinanceUI>>([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ReturnType<typeof aggregateExpensesByCategory>>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => formatReportCurrency(value);
  const formatChartCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₼`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k ₼`;
    return `${value} ₼`;
  };

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setMonthlyData([]);
      setExpenseBreakdown([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [pl, exp] = await Promise.all([
        fetchProfitLoss({ dateFrom, dateTo }),
        fetchExpenseReport({ dateFrom, dateTo, status: "APPROVED", limit: 500 }),
      ]);
      const items = Array.isArray(pl.items) ? pl.items : [];
      setMonthlyData(mapProfitLossToFinanceUI(items));
      setExpenseBreakdown(aggregateExpensesByCategory(Array.isArray(exp.items) ? exp.items : []));
    } catch (err) {
      notifyFromError(err, pt("Maliyyə hesabatını yükləmək alınmadı", "Failed to load finance report"));
      setMonthlyData([]);
      setExpenseBreakdown([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateFrom, dateTo, branchRevision]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedMonthly,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: monthlyData,
    itemsPerPage: DEFAULT_REPORT_PAGE_SIZE,
    resetKey: `${dateFrom}|${dateTo}`,
  });

  const totals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => ({
        revenue: acc.revenue + m.revenue,
        expenses: acc.expenses + m.expenses,
        profit: acc.profit + m.profit,
      }),
      { revenue: 0, expenses: 0, profit: 0 },
    );
  }, [monthlyData]);

  const summaryCards = [
    {
      title: pt("Total Revenue", "Ümumi Gəlir"),
      value: formatCurrency(totals.revenue),
      icon: DollarSign,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: pt("Total Expenses", "Ümumi Xərclər"),
      value: formatCurrency(totals.expenses),
      icon: CreditCard,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: pt("Net Profit", "Xalis Mənfəət"),
      value: formatCurrency(totals.profit),
      icon: Wallet,
      color: "text-[#14b8a6] dark:text-[#14b8a6]",
      bgColor: "bg-[#14b8a6]/5 dark:bg-[#14b8a6]/20",
    },
  ];

  const handleExport = () => {
    const rows = monthlyData.map((r) => [
      r.month,
      r.revenue,
      r.expenses,
      r.profit,
      r.revenue > 0 ? ((r.profit / r.revenue) * 100).toFixed(1) + "%" : "—",
    ]);
    const doc = new jsPDF();
    doc.text(pt("Finance Report", "Maliyyə Hesabatı"), 14, 15);
    autoTable(doc, {
      head: [[pt("Month", "Ay"), pt("Revenue", "Gəlir"), pt("Expenses", "Xərclər"), pt("Profit", "Mənfəət"), pt("Margin", "Marja")]],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save("finance-report.pdf");
    const ws = XLSX.utils.aoa_to_sheet([
      [pt("Month", "Ay"), pt("Revenue", "Gəlir"), pt("Expenses", "Xərclər"), pt("Profit", "Mənfəət"), pt("Margin", "Marja")],
      ...rows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Finance");
    XLSX.writeFile(wb, "finance-report.xlsx");
  };

  const empty = !loading && monthlyData.length === 0;

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Finance Report", "Maliyyə Hesabatı")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("Profit & loss and expense breakdown", "Mənfəət-zərər və xərc bölgüsü")}
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
          <button type="button" onClick={handleExport} disabled={!monthlyData.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0f766e] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pt("Export", "İxrac")}</span>
          </button>
        </div>
      </div>

      {!isGlobalMode && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {pt("Profit & loss reflects the selected branch. Expense breakdown is tenant-wide.", "Mənfəət-zərər seçilmiş filial üzrədir. Xərc bölgüsü bütün tenant üzrədir.")}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          {pt("No financial data in this period", "Bu dövrdə maliyyə məlumatı yoxdur")}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Revenue vs Expenses", "Gəlir və Xərclər")}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="revenue" fill="#14b8a6" name={pt("Revenue", "Gəlir")} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" name={pt("Expenses", "Xərclər")} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Expense Breakdown", "Xərc Bölgüsü")}</h2>
              {expenseBreakdown.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-16">{pt("No approved expenses", "Təsdiqlənmiş xərc yoxdur")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={expenseBreakdown} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                      {expenseBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, _n, props: { payload?: { name: string; amount: number } }) => `${props.payload?.name}: ${formatCurrency(props.payload?.amount ?? 0)} (${value}%)`} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Profit Trend", "Mənfəət Tendensiyası")}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name={pt("Profit", "Mənfəət")} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Monthly Breakdown", "Aylıq Təfsilatlar")}</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Month", "Ay")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Revenue", "Gəlir")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Expenses", "Xərclər")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Profit", "Mənfəət")}</th>
                    <th className="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">{pt("Margin", "Marja")}</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMonthly.map((row, index) => {
                    const margin = row.revenue > 0 ? ((row.profit / row.revenue) * 100).toFixed(1) : "—";
                    return (
                      <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="py-2 px-3 text-xs font-medium text-gray-900 dark:text-white">{row.month}</td>
                        <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                        <td className="py-2 px-3 text-xs text-right text-red-600 dark:text-red-400">{formatCurrency(row.expenses)}</td>
                        <td className="py-2 px-3 text-xs text-right text-green-600 dark:text-green-400 font-semibold">{formatCurrency(row.profit)}</td>
                        <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{margin === "—" ? margin : `${margin}%`}</td>
                      </tr>
                    );
                  })}
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
