import { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import { Download, TrendingUp, Award, Target, RefreshCw } from "lucide-react";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { fetchAnnualReport, fetchProfitLoss } from "../../../api/reports";
import { useReportDateRange } from "../../../hooks/useReportDateRange";
import { ReportDateRangeFilter } from "./ReportDateRangeFilter";
import {
  aggregateQuarters,
  formatReportCurrency,
  mapAnnualRowsToMonthly,
  mapProfitLossToFinanceUI,
  yearOptions,
} from "../../../lib/reportMappers";
import { notifyFromError } from "../../../lib/toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { pickLang } from "../../../i18n/pickLang";
export function AnnualReport() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView } = useModulePermissions("Reports");
  const branchRevision = useBranchRevision();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const currentYear = new Date().getUTCFullYear();
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
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [monthlyData, setMonthlyData] = useState<ReturnType<typeof mapAnnualRowsToMonthly>>([]);
  const [yoyData, setYoyData] = useState<{ year: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (value: number) => formatReportCurrency(value);
  const formatChartCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M ₼`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k ₼`;
    return `${value} ₼`;
  };

  const years = useMemo(() => yearOptions(currentYear), [currentYear]);

  const loadReport = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setMonthlyData([]);
      setYoyData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (dateRange === "year") {
        const y = selectedYear;
        const [current, prior1, prior2] = await Promise.all([
          fetchAnnualReport({ year: y }),
          fetchAnnualReport({ year: y - 1 }).catch(() => null),
          fetchAnnualReport({ year: y - 2 }).catch(() => null),
        ]);

        const monthly = mapAnnualRowsToMonthly(current.rows ?? [], current.monthLabels ?? []);
        setMonthlyData(monthly);

        const yoy: { year: string; revenue: number }[] = [];
        for (const report of [prior2, prior1, current]) {
          if (!report) continue;
          const md = mapAnnualRowsToMonthly(report.rows ?? [], report.monthLabels ?? []);
          const rev = md.reduce((s, m) => s + m.revenue, 0);
          yoy.push({ year: String(report.year), revenue: rev });
        }
        setYoyData(yoy);
      } else {
        const pl = await fetchProfitLoss({ dateFrom, dateTo });
        const monthly = mapProfitLossToFinanceUI(Array.isArray(pl.items) ? pl.items : []);
        setMonthlyData(monthly);
        setYoyData([]);
      }
    } catch (err) {
      notifyFromError(err, pt("İllik hesabatı yükləmək alınmadı", "Failed to load annual report"));
      setMonthlyData([]);
      setYoyData([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, dateRange, selectedYear, dateFrom, dateTo, branchRevision]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const totalRevenue = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
  const totalProfit = monthlyData.reduce((sum, m) => sum + m.profit, 0);
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : "—";
  const avgMonthlyRevenue = monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;

  const priorYearRevenue = useMemo(() => {
    const prior = yoyData.find((y) => y.year === String(selectedYear - 1));
    return prior?.revenue ?? 0;
  }, [yoyData, selectedYear]);

  const yoyGrowth =
    priorYearRevenue > 0 ? (((totalRevenue - priorYearRevenue) / priorYearRevenue) * 100).toFixed(1) : null;

  const quarterlyData = useMemo(() => aggregateQuarters(monthlyData), [monthlyData]);

  const summaryCards = [
    {
      title: pt("Annual Revenue", "İllik Gəlir"),
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: pt("Total Profit", "Ümumi Mənfəət"),
      value: formatCurrency(totalProfit),
      sub: profitMargin !== "—" ? `${profitMargin}% ${pt("margin", "marja")}` : undefined,
      icon: Award,
      color: "text-[#14b8a6] dark:text-[#14b8a6]",
      bgColor: "bg-[#14b8a6]/5 dark:bg-[#14b8a6]/20",
    },
    {
      title: pt("Avg Monthly Revenue", "Orta Aylıq Gəlir"),
      value: formatCurrency(avgMonthlyRevenue),
      icon: Target,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
    {
      title: pt("YoY Growth", "İldən-İlə Artım"),
      value: yoyGrowth != null ? `${yoyGrowth}%` : pt("N/A", "Yoxdur"),
      sub: priorYearRevenue > 0 ? `vs ${selectedYear - 1}` : undefined,
      icon: TrendingUp,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
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
    doc.text(`${pt("Annual Report", "İllik Hesabat")} ${selectedYear}`, 14, 15);
    autoTable(doc, {
      head: [[pt("Month", "Ay"), pt("Revenue", "Gəlir"), pt("Expenses", "Xərclər"), pt("Profit", "Mənfəət"), pt("Margin", "Marja")]],
      body: rows,
      startY: 22,
      styles: { fontSize: 8 },
    });
    doc.save(`annual-report-${selectedYear}.pdf`);
    const ws = XLSX.utils.aoa_to_sheet([
      [pt("Month", "Ay"), pt("Revenue", "Gəlir"), pt("Expenses", "Xərclər"), pt("Profit", "Mənfəət"), pt("Margin", "Marja")],
      ...rows,
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, String(selectedYear));
    XLSX.writeFile(wb, `annual-report-${selectedYear}.xlsx`);
  };

  const empty = !loading && monthlyData.length === 0;

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Annual Report", "İllik Hesabat")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {pt("Comprehensive annual performance summary", "Ətraflı illik performans xülasəsi")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ReportDateRangeFilter
            preset={dateRange}
            onPresetChange={setDateRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
          {dateRange === "year" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          )}
          <button type="button" onClick={() => void loadReport()} disabled={loading} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button type="button" onClick={handleExport} disabled={!monthlyData.length} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0f766e] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
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
                {card.sub && <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{card.sub}</span>}
              </div>
              <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{card.title}</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            </div>
          );
        })}
      </div>

      {empty ? (
        <div className="glass-card p-8 rounded-xl border border-white/20 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
          {pt("No annual data for this year", "Bu il üçün məlumat yoxdur")}
        </div>
      ) : (
        <>
          <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Monthly Performance", "Aylıq Performans")}</h2>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name={pt("Revenue", "Gəlir")} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorProfit)" name={pt("Profit", "Mənfəət")} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Quarterly Performance", "Rüblük Performans")}</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                  <XAxis dataKey="quarter" stroke="#6b7280" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Bar dataKey="revenue" fill="#14b8a6" name={pt("Revenue", "Gəlir")} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{pt("Year over Year Growth", "İldən İlə Artım")}</h2>
              {yoyData.length < 2 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-24">{pt("Insufficient prior-year data", "Əvvəlki illər üçün kifayət qədər məlumat yoxdur")}</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={yoyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis dataKey="year" stroke="#6b7280" tick={{ fontSize: 10 }} />
                    <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={formatChartCurrency} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name={pt("Revenue", "Gəlir")} dot={{ fill: "#10b981", r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
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
                  {monthlyData.map((row, index) => {
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
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 font-semibold">
                    <td className="py-2 px-3 text-xs text-gray-900 dark:text-white">{pt("Total", "Cəmi")}</td>
                    <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{formatCurrency(totalRevenue)}</td>
                    <td className="py-2 px-3 text-xs text-right text-red-600 dark:text-red-400">{formatCurrency(totalExpenses)}</td>
                    <td className="py-2 px-3 text-xs text-right text-green-600 dark:text-green-400">{formatCurrency(totalProfit)}</td>
                    <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{profitMargin === "—" ? profitMargin : `${profitMargin}%`}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
