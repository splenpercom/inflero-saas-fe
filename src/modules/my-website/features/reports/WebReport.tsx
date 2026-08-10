import { useState } from "react";
import { cn } from "../../ui";
import {
  TrendingUp, ShoppingBag, CreditCard,
  Users, Package, ArrowUpRight, ArrowDownRight, FileText, RefreshCw,
  Globe, RotateCcw, Download,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { useTr } from "../../i18n";

import {
  type Period,
  DAILY_REVENUE,
  WEEKLY_REVENUE_AZ,
  WEEKLY_REVENUE_EN,
  MONTHLY_REVENUE_AZ,
  MONTHLY_REVENUE_EN,
  STATUS_BREAKDOWN_AZ,
  STATUS_BREAKDOWN_EN,
  PAYMENT_BREAKDOWN,
  TOP_PRODUCTS,
  RECENT_ORDERS,
  STATUS_COLORS,
  STATUS_LABELS_AZ,
  STATUS_LABELS_EN,
} from "./data";

function fmt(n: number) {
  return `${n.toLocaleString("az-AZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₼`;
}
function fmtK(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k ₼` : `${n} ₼`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2.5 shadow-xl text-xs">
      <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {typeof p.value === "number" &&
            (String(p.name).toLowerCase().includes("gəlir") ||
              String(p.name).toLowerCase().includes("revenue"))
              ? fmt(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

function StatCard({
  icon: Icon,
  label,
  value,
  change,
  positive,
  color,
  bg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", bg)}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
            positive
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
          )}
        >
          {positive ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
          {change}
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">{label}</p>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export function WebReport() {
  const tr = useTr();
  const [period, setPeriod] = useState<Period>("daily");

  const isAz = tr("az", "en") === "az";
  const statusBreakdown = isAz ? STATUS_BREAKDOWN_AZ : STATUS_BREAKDOWN_EN;
  const statusLabels = isAz ? STATUS_LABELS_AZ : STATUS_LABELS_EN;

  const revenueData =
    period === "daily"
      ? DAILY_REVENUE
      : period === "weekly"
        ? (isAz ? WEEKLY_REVENUE_AZ : WEEKLY_REVENUE_EN)
        : (isAz ? MONTHLY_REVENUE_AZ : MONTHLY_REVENUE_EN);

  const periodLabel =
    period === "daily"
      ? tr("Bu gün", "Today")
      : period === "weekly"
        ? tr("Bu həftə", "This week")
        : tr("Bu ay", "This month");

  const stats =
    period === "daily"
      ? { revenue: "3 490,00", orders: 29, customers: 24, avgOrder: "120,34", convRate: "3.2", returnRate: "1.8" }
      : period === "weekly"
        ? { revenue: "23 140,00", orders: 186, customers: 154, avgOrder: "124,41", convRate: "4.1", returnRate: "2.3" }
        : { revenue: "34 800,00", orders: 281, customers: 233, avgOrder: "123,84", convRate: "3.9", returnRate: "2.1" };

  const TABS: { key: Period; label: string }[] = [
    { key: "daily", label: tr("Günlük", "Daily") },
    { key: "weekly", label: tr("Həftəlik", "Weekly") },
    { key: "monthly", label: tr("Aylıq", "Monthly") },
  ];

  const chartRevenueName = tr("Gəlir", "Revenue");
  const chartOrdersName = tr("Sifarişlər", "Orders");

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 xl:p-6 2xl:px-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg xl:text-xl font-semibold text-gray-900 dark:text-white">
              {tr("Veb Hesabat", "Web Report")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Sayt satışlarının ətraflı analizi", "Detailed analysis of website sales")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" />
              {tr("Yenilə", "Refresh")}
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              {tr("İxrac Et", "Export")}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1 w-fit">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setPeriod(t.key)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium rounded-lg transition-all",
                period === t.key
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-3">
          <StatCard
            icon={CreditCard}
            label={`${periodLabel} ${tr("Gəlir", "Revenue")}`}
            value={`${stats.revenue} ₼`}
            change="+18.4%"
            positive
            color="text-green-600 dark:text-green-400"
            bg="bg-green-50 dark:bg-green-900/20"
          />
          <StatCard
            icon={ShoppingBag}
            label={`${periodLabel} ${tr("Sifarişlər", "Orders")}`}
            value={String(stats.orders)}
            change="+11.2%"
            positive
            color="text-blue-600 dark:text-blue-400"
            bg="bg-blue-50 dark:bg-blue-900/20"
          />
          <StatCard
            icon={Users}
            label={tr("Unikal Müştəri", "Unique Customers")}
            value={String(stats.customers)}
            change="+9.7%"
            positive
            color="text-purple-600 dark:text-purple-400"
            bg="bg-purple-50 dark:bg-purple-900/20"
          />
          <StatCard
            icon={Package}
            label={tr("Ort. Sifariş Dəyəri", "Avg. Order Value")}
            value={`${stats.avgOrder} ₼`}
            change="+2.1%"
            positive
            color="text-orange-600 dark:text-orange-400"
            bg="bg-orange-50 dark:bg-orange-900/20"
          />
          <StatCard
            icon={Globe}
            label={tr("Çevrilmə Dərəcəsi", "Conversion Rate")}
            value={`${stats.convRate}%`}
            change="+0.4%"
            positive
            color="text-teal-600 dark:text-teal-400"
            bg="bg-teal-50 dark:bg-teal-900/20"
          />
          <StatCard
            icon={RotateCcw}
            label={tr("Qaytarma Dərəcəsi", "Return Rate")}
            value={`${stats.returnRate}%`}
            change="-0.3%"
            positive
            color="text-rose-600 dark:text-rose-400"
            bg="bg-rose-50 dark:bg-rose-900/20"
          />
        </div>

        <Section
          title={`${tr("Gəlir Dinamikası", "Revenue Trend")} — ${periodLabel}`}
          action={
            <span className="text-[10px] text-gray-400 font-medium">
              {period === "daily"
                ? tr("Saatlıq", "Hourly")
                : period === "weekly"
                  ? tr("Gündəlik", "Daily")
                  : tr("Aylıq", "Monthly")}
            </span>
          }
        >
          <div className="px-2 py-4" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.6} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={fmtK} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name={chartRevenueName}
                  stroke="#22c55e"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#22c55e" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <Section title={tr("Sifariş Sayı", "Order Count")}>
              <div className="px-2 py-4" style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={revenueData}
                    margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                    barSize={period === "monthly" ? 14 : 20}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" strokeOpacity={0.6} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="orders" name={chartOrdersName} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Section>
          </div>

          <Section title={tr("Status Paylanması", "Status Breakdown")}>
            <div className="px-4 py-4" style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    cx="50%"
                    cy="45%"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusBreakdown.map((e, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v}%`, ""]}
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1 -mt-2">
                {statusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                      <span className="text-[10px] text-gray-600 dark:text-gray-400">{s.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-300">{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Section>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <Section title={tr("Ən Çox Satan Məhsullar", "Top Selling Products")}>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {TOP_PRODUCTS.map((p, i) => (
                  <div key={p.name} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center flex-shrink-0",
                        i === 0
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : i === 1
                            ? "bg-gray-100 dark:bg-gray-800 text-gray-500"
                            : "bg-gray-50 dark:bg-gray-800/50 text-gray-400",
                      )}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {p.orders} {tr("sifariş", "orders")}
                      </p>
                    </div>
                    <div className="w-24 hidden sm:block">
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-400"
                          style={{ width: `${(p.revenue / TOP_PRODUCTS[0].revenue) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 min-w-[72px]">
                      <p className="text-xs font-bold text-gray-900 dark:text-white">{fmt(p.revenue)}</p>
                      <p
                        className={cn(
                          "text-[9px] font-semibold flex items-center justify-end gap-0.5",
                          p.trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-500",
                        )}
                      >
                        {p.trend > 0 ? (
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        ) : (
                          <ArrowDownRight className="w-2.5 h-2.5" />
                        )}
                        {Math.abs(p.trend)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <Section title={tr("Ödəniş Üsulları", "Payment Methods")}>
            <div className="p-4 space-y-4">
              <div className="flex justify-center" style={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PAYMENT_BREAKDOWN}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={62}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {PAYMENT_BREAKDOWN.map((e, i) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, ""]}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {PAYMENT_BREAKDOWN.map((p) => (
                <div
                  key={p.name}
                  className={cn("flex items-center justify-between p-3 rounded-xl", "bg-gray-50 dark:bg-gray-800/50")}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">{p.name}</span>
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white">{p.value}%</span>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section
          title={tr("Son Sifarişlər", "Recent Orders")}
          action={
            <a
              href="/dashboard/my-website/orders"
              className="text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              {tr("Hamısına bax →", "View all →")}
            </a>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  {[
                    tr("Sifariş", "Order"),
                    tr("Müştəri", "Customer"),
                    tr("Məbləğ", "Amount"),
                    tr("Status", "Status"),
                    tr("Vaxt", "Time"),
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-2.5 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_ORDERS.map((o, i) => (
                  <tr
                    key={o.ref}
                    className={cn(
                      "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                      i % 2 === 0 ? "" : "bg-gray-50/30 dark:bg-gray-800/10",
                    )}
                  >
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{o.ref}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs text-gray-700 dark:text-gray-300">{o.customer}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{fmt(o.total)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium",
                          STATUS_COLORS[o.status],
                        )}
                      >
                        {statusLabels[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] text-gray-400">{o.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {period === "daily" && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-xl p-5 text-white border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">{tr("Günün Sonu Hesabatı", "End of Day Report")}</p>
                <p className="text-[10px] text-gray-400">25 {tr("İyul", "Jul")} 2026</p>
              </div>
              <button className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-white/10 hover:bg-white/20 rounded-lg transition-colors">
                <Download className="w-3 h-3" /> {tr("PDF İxrac", "Export PDF")}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: tr("Ümumi Gəlir", "Total Revenue"),
                  value: "3 490,00 ₼",
                  icon: CreditCard,
                  color: "text-green-400",
                },
                {
                  label: tr("Sifariş Sayı", "Order Count"),
                  value: "29",
                  icon: ShoppingBag,
                  color: "text-blue-400",
                },
                {
                  label: tr("Unikal Ziyarət", "Unique Visits"),
                  value: "748",
                  icon: Globe,
                  color: "text-purple-400",
                },
                {
                  label: tr("Çevrilmə", "Conversion"),
                  value: "3.2%",
                  icon: TrendingUp,
                  color: "text-orange-400",
                },
              ].map((s) => (
                <div key={s.label} className="bg-white/5 rounded-xl p-3">
                  <s.icon className={cn("w-4 h-4 mb-2", s.color)} />
                  <p className="text-lg font-bold">{s.value}</p>
                  <p className="text-[10px] text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {[
                {
                  label: tr("Ən çox satan", "Best seller"),
                  value: tr(
                    "Wireless Headphones · 47 ₼ · 14 ədəd",
                    "Wireless Headphones · 47 ₼ · 14 units",
                  ),
                },
                {
                  label: tr("Pik saat", "Peak hours"),
                  value: tr(
                    "18:00 – 21:00 arası · 2 760 ₼ gəlir",
                    "18:00 – 21:00 · 2 760 ₼ revenue",
                  ),
                },
                {
                  label: tr("Ödəniş bölgüsü", "Payment split"),
                  value: tr("Epoint 68% · Nağd 32%", "Epoint 68% · Cash 32%"),
                },
              ].map((r) => (
                <div key={r.label} className="bg-white/5 rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-0.5">{r.label}</p>
                  <p className="text-[11px] font-semibold text-white leading-snug">{r.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
