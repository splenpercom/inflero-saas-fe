import { useMemo, useState } from "react";
import {
  TrendingUp,
  Users,
  Calendar,
  CalendarDays,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Shield,
  Zap,
  Banknote,
  CreditCard,
  ArrowUpRight,
  ReceiptText,
  Package,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import type { DashboardPeriod } from "../../api/dashboard";
import { useDashboardData } from "../../hooks/useDashboardData";
import { formatDate, localizeMonthLabel } from "../../lib/dateFormat";
import {
  activityIsCompleted,
  buildHeatmapGrid,
  formatMoney,
  formatShortDate,
  getInitials,
  heatColor,
  mapTodayReservations,
  mapTopCategoriesPie,
  parseMoney,
  profitMarginPercent,
  expenseRatioPercent,
  sliceLastMonths,
} from "../../lib/dashboardMappers";

import { pickLang } from "../../i18n/pickLang";
type ChartRange = "1M" | "3M" | "6M";

function chartRangeToPeriod(range: ChartRange): DashboardPeriod {
  if (range === "1M") return "1M";
  if (range === "3M") return "1Y";
  return "1Y";
}

function chartMonthCount(range: ChartRange): number {
  if (range === "1M") return 6;
  if (range === "3M") return 3;
  return 6;
}

export function NewDashboard() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, hasModule, hasPermission } = useAuth();
  const reservationsEnabled =
    hasModule("RESERVATIONS") && hasPermission("Reservations", "view");
  const stockEnabled = hasModule("STOCK") && hasPermission("Inventory", "view");
  const posEnabled = hasModule("POS") && hasPermission("Sales", "view");
  const [selectedPeriod, setSelectedPeriod] = useState<ChartRange>("1M");
  const [finPeriod, setFinPeriod] = useState<ChartRange>("1M");
  const [txTab, setTxTab] = useState<"all" | "completed" | "pending">("all");

  const period = chartRangeToPeriod(selectedPeriod);
  const { loading, error, summary, todaySummary, todayReservations, pendingReservationCount, reload } =
    useDashboardData(period);

  const tr = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const heatDayLabel = (day: string) => {
    const map: Record<string, { az: string; ru: string }> = {
      Mon: { az: "B.e.", ru: "Пн" },
      Tue: { az: "Ç.a.", ru: "Вт" },
      Wed: { az: "Ç.", ru: "Ср" },
      Thu: { az: "C.a.", ru: "Чт" },
      Fri: { az: "C.", ru: "Пт" },
      Sat: { az: "Ş.", ru: "Сб" },
      Sun: { az: "B.", ru: "Вс" },
    };
    const row = map[day];
    if (!row) return day;
    return pickLang(language, row.az, day, row.ru);
  };

  const displayName = useMemo(() => {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return name || user?.tenant?.name || tr("Admin", "Admin");
  }, [user, language]);

  const todayRes = useMemo(
    () => mapTodayReservations(todayReservations, language),
    [todayReservations, language],
  );

  const todayResPending = todayRes.filter((r) => r.status === "pending").length;

  const revenueChartData = useMemo(() => {
    if (!summary) return [];
    const months = sliceLastMonths(summary.charts.salesAnalyticsMonthly, chartMonthCount(selectedPeriod));
    const purchases = sliceLastMonths(summary.charts.salesPurchaseByMonth, chartMonthCount(selectedPeriod));
    return months.map((row, i) => ({
      month: localizeMonthLabel(row.month, language),
      revenue: row.sales,
      purchases: purchases[i]?.purchase ?? 0,
    }));
  }, [summary, selectedPeriod, language]);

  const financeChartData = useMemo(() => {
    if (!summary) return [];
    return sliceLastMonths(summary.charts.salesStatsMonthly, chartMonthCount(finPeriod)).map((row) => ({
      month: localizeMonthLabel(row.month, language),
      revenue: row.revenue,
      expenses: row.expense,
      profit: Math.max(0, row.revenue - row.expense),
    }));
  }, [summary, finPeriod, language]);

  const servicesData = useMemo(
    () => (summary ? mapTopCategoriesPie(summary.widgets.topCategories) : []),
    [summary],
  );

  const topCustomers = useMemo(
    () =>
      (summary?.widgets.topCustomers ?? []).slice(0, 5).map((c) => ({
        name: c.name,
        visits: c.ordersCount,
        spent: parseMoney(c.amount),
        initials: getInitials(c.name),
      })),
    [summary],
  );

  const transactions = useMemo(() => {
    return (summary?.recent.activity ?? [])
      .filter((row) => posEnabled || row.kind !== "POS")
      .map((row) => ({
      id: row.subtitle || row.id,
      date: formatShortDate(row.at, language),
      customer: row.title.replace(/^POS — |^Purchase — /, ""),
      service: row.kind === "POS" ? tr("POS Sale", "POS Satış") : tr("Purchase", "Satınalma"),
      amount: parseMoney(row.amount),
      status: activityIsCompleted(row) ? ("completed" as const) : ("pending" as const),
    }));
  }, [summary, language, posEnabled]);

  const filteredTx =
    txTab === "all" ? transactions : transactions.filter((t) => t.status === txTab);

  const lowStock = summary?.widgets.lowStock ?? [];

  const heatmap = useMemo(
    () => buildHeatmapGrid(summary?.charts.orderHeatmap ?? []),
    [summary],
  );

  const topSelling = summary?.widgets.topSelling ?? [];

  const totals = summary?.totals;
  const revenueNum = parseMoney(totals?.salesPaid);
  const expensesNum = parseMoney(totals?.approvedExpenses);
  const profitNum = parseMoney(totals?.profitApprox);

  const financeStats = [
    {
      label: tr("Total Revenue", "Ümumi Gəlir"),
      value: formatMoney(totals?.salesPaid),
      sub: tr("Selected period", "Seçilmiş dövr"),
      trend: "up" as const,
      icon: Banknote,
      color: "from-green-500 to-green-600",
    },
    {
      label: tr("Total Expenses", "Ümumi Xərclər"),
      value: formatMoney(totals?.approvedExpenses),
      sub: tr("Approved expenses", "Təsdiqlənmiş xərclər"),
      trend: "up" as const,
      icon: CreditCard,
      color: "from-red-500 to-red-600",
    },
    {
      label: tr("Net Profit", "Xalis Mənfəət"),
      value: formatMoney(totals?.profitApprox),
      sub: tr("Sales − purchases − expenses", "Satış − satınalma − xərc"),
      trend: "up" as const,
      icon: TrendingUp,
      color: "from-[#14b8a6] to-[#0d9488]",
    },
    {
      label: tr("Invoice Due", "Ödəniləcək Faktura"),
      value: formatMoney(totals?.unpaidInvoiceTotal),
      sub: tr("Unpaid invoice balance", "Ödənilməmiş faktura"),
      trend: "warn" as const,
      icon: ReceiptText,
      color: "from-orange-500 to-orange-600",
    },
  ];

  const categoryBreakdown = useMemo(() => {
    const cats = summary?.widgets.topCategories ?? [];
    const total = cats.reduce((s, c) => s + c.value, 0) || 1;
    const colors = ["#14b8a6", "#f97316", "#0ea5e9", "#10b981", "#a78bfa"];
    return cats.slice(0, 5).map((c, i) => ({
      name: c.name,
      amount: c.value,
      pct: Math.round((c.value / total) * 100),
      color: colors[i % colors.length],
    }));
  }, [summary]);

  const todayDateLabel = formatDate(new Date(), language);

  if (loading && !summary) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[320px] bg-gray-50 dark:bg-gray-950">
        <Loader2 className="w-8 h-8 animate-spin text-[#14b8a6] dark:text-[#14b8a6]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-5 flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">
          <span>{error}</span>
          <button type="button" onClick={() => void reload()} className="flex items-center gap-1 text-xs font-semibold underline">
            <RefreshCw className="w-3.5 h-3.5" /> {tr("Retry", "Yenidən")}
          </button>
        </div>
      )}

      {/* Welcome */}
      <div className="relative bg-[#14b8a6] rounded-2xl p-5 overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-0.5">
              {tr("Welcome back", "Xoş gəldiniz")}, {displayName} 👋
            </h1>
            {reservationsEnabled && <p className="text-sm text-white/70">
              {tr("You have", "Bugün")}{" "}
              <span className="text-white font-semibold">
                {todayRes.length} {tr("bookings today", "rezervasiyanız var")}
              </span>
              {todayResPending > 0 && (
                <>
                  {" "}— {todayResPending} {tr("pending confirmation", "gözləyir")}.
                </>
              )}
              {pendingReservationCount > 0 && (
                <>
                  {" "}
                  ({pendingReservationCount} {tr("pending total", "ümumi gözləyən")})
                </>
              )}
            </p>}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs">
              <Calendar className="w-3.5 h-3.5 text-white/70" />
              <span className="text-white/80">{todayDateLabel}</span>
            </div>
            {reservationsEnabled && <button
              type="button"
              onClick={() => navigate("/dashboard/reservations")}
              className="flex items-center gap-1.5 bg-white text-[#14b8a6] rounded-xl px-3 py-2 text-xs font-bold hover:bg-white/90 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              {tr("View Bookings", "Rezervasiyalar")}
            </button>}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ...(reservationsEnabled ? [{
            label: tr("Today's Bookings", "Bugünkü Rezervasiyalar"),
            value: String(todayRes.length),
            sub: `${todayResPending} ${tr("pending", "gözləyir")}`,
            icon: CalendarDays,
            iconBg: "bg-[#ccfbf1] dark:bg-[#14b8a6]/25",
            iconColor: "text-[#14b8a6] dark:text-[#14b8a6]",
          }] : []),
          {
            label: tr("Total Customers", "Ümumi Müştərilər"),
            value: String(summary?.counts.customers ?? 0),
            sub: stockEnabled
              ? `${summary?.counts.suppliers ?? 0} ${tr("suppliers", "təchizatçı")}`
              : tr("Active directory", "Aktiv müştəri bazası"),
            icon: Users,
            iconBg: "bg-orange-50 dark:bg-orange-900/20",
            iconColor: "text-orange-500",
          },
          ...(posEnabled ? [{
            label: tr("Today's Orders", "Bugünkü Sifarişlər"),
            value: String(todaySummary?.counts.posOrders ?? 0),
            sub: `${summary?.counts.products ?? 0} ${tr("products", "məhsul")}`,
            icon: Package,
            iconBg: "bg-teal-50 dark:bg-teal-900/20",
            iconColor: "text-teal-600 dark:text-teal-400",
          }] : []),
          {
            label: tr("Period Revenue", "Dövr Gəliri"),
            value: formatMoney(totals?.salesPaid),
            sub: tr("Paid sales", "Ödənilmiş satışlar"),
            icon: DollarSign,
            iconBg: "bg-green-50 dark:bg-green-900/20",
            iconColor: "text-green-600 dark:text-green-400",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl ${card.iconBg} flex items-center justify-center flex-shrink-0`}>
                <card.icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-none mb-1">{card.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Sales & Purchases", "Satışlar & Satınalmalar")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tr("Monthly overview", "Aylıq icmal")}</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              {(["1M", "3M", "6M"] as ChartRange[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setSelectedPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${selectedPeriod === p ? "bg-white dark:bg-gray-900 text-[#14b8a6] dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(v: number, n) => [
                  n === "revenue" || n === "purchases" ? formatMoney(v) : v,
                  n === "revenue" ? tr("Sales", "Satış") : tr("Purchases", "Satınalma"),
                ]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="purchases" stroke="#f97316" strokeWidth={2} fill="url(#purGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {tr("Sales by Category", "Kateqoriya üzrə satış")}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {servicesData.reduce((s, c) => s + c.raw, 0)} {tr("units sold", "satılan vahid")}
          </p>
          {servicesData.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">{tr("No category data yet", "Hələ məlumat yoxdur")}</p>
          ) : (
            <>
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={servicesData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                      {servicesData.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, ""]} contentStyle={{ fontSize: "11px", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {servicesData.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{s.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Today's schedule + top customers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {reservationsEnabled && (
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#14b8a6]" />
              {tr("Today's Schedule", "Bugünkü Cədvəl")}
            </h3>
            <button
              type="button"
              onClick={() => navigate("/dashboard/reservations")}
              className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline flex items-center gap-1"
            >
              {tr("View All", "Hamısını Gör")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {todayRes.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{tr("No bookings today", "Bu gün rezervasiya yoxdur")}</p>
          ) : (
            <div className="space-y-2">
              {todayRes.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60">
                  <div className="flex-shrink-0 text-center w-12">
                    <p className="text-xs font-bold text-[#14b8a6] dark:text-[#14b8a6]">{r.time}</p>
                  </div>
                  <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{r.customer}</p>
                    <p className="text-[10px] text-gray-400 truncate mt-0.5">{r.service}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span
                      className={`inline-flex mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium ${r.status === "confirmed" ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}
                    >
                      {r.status === "confirmed" ? tr("Confirmed", "Təsdiqlənib") : tr("Pending", "Gözləyir")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" />
              {tr("Top Customers", "Ən Yaxşı Müştərilər")}
            </h3>
            <button
              type="button"
              onClick={() => navigate("/dashboard/people/customers")}
              className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline flex items-center gap-1"
            >
              {tr("View All", "Hamısını Gör")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{tr("No customer data yet", "Hələ məlumat yoxdur")}</p>
          ) : (
            <div className="space-y-3">
              {topCustomers.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#14b8a6] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {c.visits} {tr("orders", "sifariş")}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white flex-shrink-0">{formatMoney(c.spent)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Transactions + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Recent Activity", "Son Fəaliyyət")}</h3>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              {(["all", "completed", "pending"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTxTab(tab)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors ${txTab === tab ? "bg-white dark:bg-gray-900 text-[#14b8a6] dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {tab === "all" ? tr("All", "Hamısı") : tab === "completed" ? tr("Done", "Tamamlandı") : tr("Pending", "Gözləyir")}
                </button>
              ))}
            </div>
          </div>
          {filteredTx.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{tr("No transactions yet", "Əməliyyat yoxdur")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    {[tr("ID", "ID"), tr("Customer", "Müştəri"), tr("Type", "Növ"), tr("Amount", "Məbləğ"), tr("Status", "Status")].map((h) => (
                      <th key={h} className="text-left text-[10px] font-medium text-gray-400 uppercase tracking-wide pb-2">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800/60">
                  {filteredTx.map((tx) => (
                    <tr key={tx.id + tx.date} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-2.5 text-[10px] text-gray-400 font-mono">{tx.id}</td>
                      <td className="py-2.5">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{tx.customer}</p>
                        <p className="text-[10px] text-gray-400">{tx.date}</p>
                      </td>
                      <td className="py-2.5 text-xs text-gray-600 dark:text-gray-400">{tx.service}</td>
                      <td className="py-2.5 text-xs font-semibold text-gray-900 dark:text-white">
                        {tx.amount > 0 ? formatMoney(tx.amount) : "—"}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-medium ${tx.status === "completed" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"}`}
                        >
                          {tx.status === "completed" ? tr("Done", "Tamamlandı") : tr("Pending", "Gözləyir")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {stockEnabled && <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              {tr("Low Stock", "Az Stok")}
            </h3>
            <button
              type="button"
              onClick={() => navigate("/dashboard/inventory/products/low-stocks")}
              className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline flex items-center gap-1"
            >
              {tr("View All", "Hamısını Gör")} <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{tr("Stock levels OK", "Stok səviyyəsi normaldır")}</p>
          ) : (
            <div className="space-y-2.5">
              {lowStock.map((p) => (
                <div key={p.productId} className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white leading-tight">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.sku}</p>
                    </div>
                    <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                      {p.quantity} {tr("left", "qaldı")}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full"
                      style={{ width: `${Math.min(100, p.quantityAlert > 0 ? (p.quantity / p.quantityAlert) * 100 : 0)}%` }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">
                    {tr("Min", "Min")}: {p.quantityAlert}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>}
      </div>

      {/* Order heatmap */}
      {posEnabled && <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Order Activity Heatmap", "Sifariş Aktivliyi")}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{tr("Busiest time slots this week", "Bu həftə ən məşğul slotlar")}</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="flex mb-1">
              <div className="w-10 flex-shrink-0" />
              {heatmap.hours.map((h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-gray-400">
                  {h}
                </div>
              ))}
            </div>
            {heatmap.days.map((day) => (
              <div key={day} className="flex items-center gap-1 mb-1">
                <div className="w-10 flex-shrink-0 text-[10px] text-gray-400 font-medium">{heatDayLabel(day)}</div>
                {heatmap.hours.map((hour) => {
                  const v = heatmap.map[`${day}-${hour}`] ?? 0;
                  return (
                    <div
                      key={hour}
                      title={`${heatDayLabel(day)} ${hour}: ${v}`}
                      className={`flex-1 h-7 rounded-md ${heatColor(v, heatmap.max)}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Top selling */}
      {posEnabled && topSelling.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {topSelling.slice(0, 4).map((p, i) => {
            const icons = [Shield, Zap, Package, TrendingUp];
            const Icon = icons[i % icons.length];
            const colors = [
              { color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/20" },
              { color: "text-[#14b8a6] dark:text-[#14b8a6]", bg: "bg-[#ccfbf1] dark:bg-[#14b8a6]/20" },
              { color: "text-sky-600", bg: "bg-sky-50 dark:bg-sky-900/20" },
              { color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/20" },
            ][i % 4];
            return (
              <div key={p.productId} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${colors.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-none">{p.quantitySold}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">{p.name}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Finance */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#14b8a6] rounded-full" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{tr("Financial Overview", "Maliyyə İcmalı")}</h2>
        </div>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        <button
          type="button"
          onClick={() => navigate("/dashboard/finances/expenses")}
          className="text-xs text-[#14b8a6] dark:text-[#14b8a6] hover:underline flex items-center gap-1"
        >
          {tr("View Finances", "Maliyyəyə Bax")} <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {financeStats.map((f) => (
          <div key={f.label} className={`bg-gradient-to-br ${f.color} rounded-xl p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-3">
              <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                <f.icon className="w-4 h-4" />
              </div>
              <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                {f.trend === "warn" ? "!" : <ArrowUpRight className="w-3 h-3" />}
              </span>
            </div>
            <p className="text-xl font-extrabold leading-none mb-1">{f.value}</p>
            <p className="text-[10px] text-white/70">{f.label}</p>
            <p className="text-[10px] text-white/50 mt-0.5">{f.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Revenue vs Expenses", "Gəlir vs Xərclər")}</h3>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 gap-0.5">
              {(["1M", "3M", "6M"] as ChartRange[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFinPeriod(p)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${finPeriod === p ? "bg-white dark:bg-gray-900 text-[#14b8a6] dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financeChartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip
                contentStyle={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "12px" }}
                formatter={(v: number, n) => [
                  formatMoney(v),
                  n === "revenue" ? tr("Revenue", "Gəlir") : n === "expenses" ? tr("Expenses", "Xərclər") : tr("Profit", "Mənfəət"),
                ]}
              />
              <Bar dataKey="revenue" fill="#14b8a6" radius={[5, 5, 0, 0]} />
              <Bar dataKey="expenses" fill="#f97316" radius={[5, 5, 0, 0]} />
              <Bar dataKey="profit" fill="#10b981" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{tr("Category Performance", "Kateqoriya Performansı")}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {formatMoney(revenueNum)} {tr("period sales", "dövr satışı")}
          </p>
          {categoryBreakdown.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">{tr("No data", "Məlumat yoxdur")}</p>
          ) : (
            <>
              <div className="space-y-3">
                {categoryBreakdown.map((e) => (
                  <div key={e.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{e.name}</span>
                      <span className="text-[10px] text-gray-400">{e.pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${e.pct}%`, backgroundColor: e.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">{tr("Profit Margin", "Mənfəət Marjası")}</p>
                  <p className="text-lg font-extrabold text-green-700 dark:text-green-400 mt-0.5">
                    {profitMarginPercent(revenueNum, profitNum)}
                  </p>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3">
                  <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium">{tr("Expense Ratio", "Xərc Nisbəti")}</p>
                  <p className="text-lg font-extrabold text-orange-700 dark:text-orange-400 mt-0.5">
                    {expenseRatioPercent(revenueNum, expensesNum)}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
