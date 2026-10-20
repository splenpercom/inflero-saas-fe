import React, { useState, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, Plane, Users, FileText,
  AlertTriangle, CheckCircle, Clock, Star,
  ArrowUpRight, ArrowDownRight, MapPin, Wallet,
  CreditCard, Building2, ChevronRight, BadgeCheck,
  BarChart2, Filter,
} from "lucide-react";
import { useLanguage } from "../../../app/i18n/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "3m" | "6m" | "12m" | "ytd";

// ─── Seed Data ────────────────────────────────────────────────────────────────

const MONTHLY_DATA = [
  { month: "Jan", invoiced: 0,     collected: 0,     deals: 0,  clients: 0  },
  { month: "Feb", invoiced: 0,     collected: 0,     deals: 0,  clients: 0  },
  { month: "Mar", invoiced: 0,     collected: 0,     deals: 0,  clients: 0  },
  { month: "Apr", invoiced: 7550,  collected: 4500,  deals: 3,  clients: 3  },
  { month: "May", invoiced: 21200, collected: 14200, deals: 7,  clients: 5  },
  { month: "Jun", invoiced: 8550,  collected: 6050,  deals: 4,  clients: 3  },
  { month: "Jul", invoiced: 16500, collected: 8600,  deals: 5,  clients: 4  },
  { month: "Aug", invoiced: 23410, collected: 18680, deals: 8,  clients: 6  },
  { month: "Sep", invoiced: 26290, collected: 11020, deals: 6,  clients: 5  },
  { month: "Oct", invoiced: 40590, collected: 26850, deals: 9,  clients: 7  },
  { month: "Nov", invoiced: 0,     collected: 0,     deals: 0,  clients: 0  },
  { month: "Dec", invoiced: 0,     collected: 0,     deals: 0,  clients: 0  },
];

const CLIENTS = [
  { id: "TC001", name: "Anar Həsənov",    status: "vip",      trips: 14, totalInvoiced: 14040, totalPaid: 8500,  country: "AZ", deals: 3, lastDeal: "2026-09" },
  { id: "TC002", name: "Leyla Əliyeva",   status: "active",   trips: 7,  totalInvoiced: 17170, totalPaid: 13970, country: "AZ", deals: 4, lastDeal: "2026-07" },
  { id: "TC003", name: "Rauf Quliyev",    status: "active",   trips: 3,  totalInvoiced: 7900,  totalPaid: 2500,  country: "AZ", deals: 2, lastDeal: "2026-10" },
  { id: "TC004", name: "Nigar Babayeva",  status: "vip",      trips: 21, totalInvoiced: 35020, totalPaid: 26870, country: "TR", deals: 6, lastDeal: "2026-10" },
  { id: "TC005", name: "Elçin Nəsirov",   status: "inactive", trips: 1,  totalInvoiced: 4600,  totalPaid: 700,   country: "AZ", deals: 2, lastDeal: "2026-10" },
  { id: "TC006", name: "Sevinc Əhmədova", status: "active",   trips: 9,  totalInvoiced: 12850, totalPaid: 12450, country: "GE", deals: 3, lastDeal: "2026-10" },
  { id: "TC007", name: "Aysel Cafarova",  status: "active",   trips: 5,  totalInvoiced: 9700,  totalPaid: 6500,  country: "AZ", deals: 2, lastDeal: "2026-10" },
  { id: "TC008", name: "Farid Gasimov",   status: "active",   trips: 4,  totalInvoiced: 16600, totalPaid: 16600, country: "AZ", deals: 2, lastDeal: "2026-10" },
];

const DESTINATIONS = [
  { city: "Istanbul, TR",  flag: "🇹🇷", deals: 9,  revenue: 31020, clients: 5, avgDeal: 3447 },
  { city: "Dubai, UAE",    flag: "🇦🇪", deals: 6,  revenue: 29740, clients: 4, avgDeal: 4957 },
  { city: "Antalya, TR",   flag: "🇹🇷", deals: 5,  revenue: 18100, clients: 4, avgDeal: 3620 },
  { city: "London, UK",    flag: "🇬🇧", deals: 3,  revenue: 17400, clients: 2, avgDeal: 5800 },
  { city: "Rome, IT",      flag: "🇮🇹", deals: 2,  revenue: 12400, clients: 1, avgDeal: 6200 },
  { city: "Prague, CZ",    flag: "🇨🇿", deals: 2,  revenue: 8200,  clients: 2, avgDeal: 4100 },
  { city: "Cappadocia, TR",flag: "🇹🇷", deals: 2,  revenue: 7600,  clients: 2, avgDeal: 3800 },
  { city: "Malé, MV",      flag: "🇲🇻", deals: 2,  revenue: 24700, clients: 1, avgDeal: 12350},
  { city: "Tbilisi, GE",   flag: "🇬🇪", deals: 3,  revenue: 5350,  clients: 2, avgDeal: 1783 },
  { city: "Baku, AZ",      flag: "🇦🇿", deals: 4,  revenue: 5350,  clients: 3, avgDeal: 1338 },
];

const OFFERS_PIPELINE = [
  { status: "active",   label: "Active",   labelAz: "Aktiv",          count: 8,  value: 54200, color: "#22c55e" },
  { status: "sent",     label: "Sent",     labelAz: "Göndərildi",     count: 5,  value: 32800, color: "#3b82f6" },
  { status: "expired",  label: "Expired",  labelAz: "Vaxtı bitib",    count: 3,  value: 11400, color: "#ef4444" },
  { status: "inactive", label: "Inactive", labelAz: "Aktiv deyil",    count: 2,  value: 5600,  color: "#9ca3af" },
];

const PAYMENT_METHODS = [
  { method: "Cash",          methodAz: "Nağd",          icon: Wallet,      amount: 42300, pct: 34, color: "#3b82f6" },
  { method: "Bank Transfer", methodAz: "Bank Transferi", icon: Building2,   amount: 51800, pct: 42, color: "#14b8a6" },
  { method: "Card / POS",    methodAz: "Kart",           icon: CreditCard,  amount: 18100, pct: 15, color: "#f97316" },
  { method: "Online",        methodAz: "Online",         icon: BadgeCheck,  amount: 11200, pct: 9,  color: "#8b5cf6" },
];

const OUTSTANDING_DEBTS = [
  { clientId: "TC001", name: "Anar Həsənov",   invoiceId: "INV-010", offer: "Dubai Luxury Package",        amount: 10540, paid: 5000,  due: "2026-10-15", overdue: true  },
  { clientId: "TC005", name: "Elçin Nəsirov",  invoiceId: "INV-013", offer: "Baku City Tour Premium",      amount: 1400,  paid: 700,   due: "2026-10-20", overdue: false },
  { clientId: "TC003", name: "Rauf Quliyev",   invoiceId: "INV-011", offer: "Cappadocia Adventure",        amount: 3800,  paid: 0,     due: "2026-10-05", overdue: true  },
  { clientId: "TC007", name: "Aysel Cafarova", invoiceId: "INV-015", offer: "Rome & Venice Package",       amount: 6200,  paid: 3000,  due: "2026-10-28", overdue: false },
  { clientId: "TC002", name: "Leyla Əliyeva",  invoiceId: "INV-021", offer: "Sharm El Sheikh Resort",      amount: 3200,  paid: 0,     due: "2026-07-30", overdue: true  },
  { clientId: "TC004", name: "Nigar Babayeva", invoiceId: "INV-018", offer: "Maldives Honeymoon",          amount: 18500, paid: 0,     due: "2026-06-25", overdue: true  },
];

const EMPLOYEES = [
  { name: "Kamran Babayev",  role: "Senior Agent",    deals: 11, revenue: 72400, commission: 5248, target: 80000, pct: 90 },
  { name: "Sevinc Nəcəfova", role: "Travel Agent",    deals: 8,  revenue: 48200, commission: 3174, target: 60000, pct: 80 },
  { name: "Tural İsmayılov", role: "Junior Agent",    deals: 6,  revenue: 29800, commission: 1788, target: 50000, pct: 60 },
  { name: "Günay Rəsulova",  role: "Sales Manager",   deals: 14, revenue: 93600, commission: 8424, target: 100000, pct: 94},
];

const INVOICE_STATUS_DATA = [
  { name: "Paid",    nameAz: "Ödənilib",     value: 9,  amount: 78680, color: "#22c55e" },
  { name: "Partial", nameAz: "Qismən",       value: 7,  amount: 32620, color: "#f97316" },
  { name: "Unpaid",  nameAz: "Ödənilməyib",  value: 5,  amount: 32900, color: "#ef4444" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
}
function fmtFull(n: number) {
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 }) + " ₼";
}
function pct(a: number, b: number) {
  if (!b) return "0%";
  return ((a / b) * 100).toFixed(1) + "%";
}

const STATUS_BADGE: Record<string, string> = {
  vip:      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  active:   "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  inactive: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl px-3 py-2.5 text-xs">
      <p className="font-semibold text-gray-900 dark:text-white mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-bold text-gray-900 dark:text-white">{fmtFull(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, iconBg, delta, deltaLabel, highlight,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; iconBg: string;
  delta?: number; deltaLabel?: string; highlight?: boolean;
}) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-xl p-4 flex flex-col gap-3 ${highlight ? "border-[#14b8a6] dark:border-[#14b8a6]/50 shadow-sm" : "border-gray-200 dark:border-gray-800"}`}>
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
        {delta !== undefined && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${up ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(delta)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
        {deltaLabel && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{deltaLabel}</p>}
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-7 h-7 rounded-lg bg-[#14b8a6]/10 dark:bg-[#14b8a6]/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-[#14b8a6] dark:text-[#14b8a6]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        {sub && <p className="text-[10px] text-gray-400 dark:text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TravelReports() {
  const { language } = useLanguage();
  const tr = (az: string, en: string) => language === "az" ? az : en;
  const [period, setPeriod] = useState<Period>("ytd");

  const PERIOD_OPTIONS: { id: Period; label: string }[] = [
    { id: "3m",  label: tr("Son 3 ay", "Last 3M")   },
    { id: "6m",  label: tr("Son 6 ay", "Last 6M")   },
    { id: "12m", label: tr("Son 12 ay","Last 12M")   },
    { id: "ytd", label: tr("İl ərzində","YTD")       },
  ];

  const chartData = useMemo(() => {
    const cutoff = { "3m": 7, "6m": 4, "12m": 0, "ytd": 0 }[period];
    return MONTHLY_DATA.slice(cutoff).filter(d => d.invoiced > 0 || d.collected > 0);
  }, [period]);

  // ── Aggregates ─────────────────────────────────────────────────────────────
  const totalInvoiced  = MONTHLY_DATA.reduce((s, d) => s + d.invoiced, 0);
  const totalCollected = MONTHLY_DATA.reduce((s, d) => s + d.collected, 0);
  const totalOutstanding = totalInvoiced - totalCollected;
  const totalDeals     = MONTHLY_DATA.reduce((s, d) => s + d.deals, 0);
  const totalClients   = CLIENTS.length;
  const vipClients     = CLIENTS.filter(c => c.status === "vip").length;
  const collectionRate = (totalCollected / totalInvoiced) * 100;
  const avgDealValue   = Math.round(totalInvoiced / totalDeals);

  const overdueAmount  = OUTSTANDING_DEBTS.filter(d => d.overdue).reduce((s, d) => s + (d.amount - d.paid), 0);
  const totalPipelineValue = OFFERS_PIPELINE.filter(o => o.status === "active" || o.status === "sent").reduce((s, o) => s + o.value, 0);

  const topClients = [...CLIENTS].sort((a, b) => b.totalInvoiced - a.totalInvoiced).slice(0, 6);
  const topDestinations = [...DESTINATIONS].sort((a, b) => b.revenue - a.revenue).slice(0, 6);

  const thCls = "text-left text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-2 whitespace-nowrap";
  const tdCls = "px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400";

  const PIE_COLORS = INVOICE_STATUS_DATA.map(d => d.color);

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="px-4 sm:px-6 xl:px-8 py-4 max-w-[1600px] mx-auto space-y-5">

        {/* ── Page header ────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg xl:text-xl font-semibold text-gray-900 dark:text-white">
              {tr("Səyahət Hesabatı", "Travel Reports")}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Bütün maliyyə göstəriciləri, müqavilələr və müştəri analitikası", "All financial metrics, deals and client analytics in one view")}
            </p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-0.5" />
            {PERIOD_OPTIONS.map(o => (
              <button
                key={o.id}
                onClick={() => setPeriod(o.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  period === o.id
                    ? "bg-[#14b8a6] text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── KPI Strip ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
          <KpiCard
            label={tr("Ümumi Faktura", "Total Invoiced")}
            value={fmtFull(totalInvoiced)} delta={18} deltaLabel={tr("əvvəlki ilə", "vs last year")}
            icon={FileText} iconBg="bg-blue-100 dark:bg-[#14b8a6]/20 text-blue-600 dark:text-[#14b8a6]" highlight
          />
          <KpiCard
            label={tr("Toplanıb", "Collected")}
            value={fmtFull(totalCollected)} sub={`${collectionRate.toFixed(0)}% collection`}
            icon={CheckCircle} iconBg="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" delta={12}
          />
          <KpiCard
            label={tr("Qalıq Borc", "Outstanding")}
            value={fmtFull(totalOutstanding)} sub={`${OUTSTANDING_DEBTS.length} invoices`}
            icon={Clock} iconBg="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" delta={-5}
          />
          <KpiCard
            label={tr("Vaxtı Keçmiş", "Overdue")}
            value={fmtFull(overdueAmount)} sub={`${OUTSTANDING_DEBTS.filter(d => d.overdue).length} clients`}
            icon={AlertTriangle} iconBg="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          />
          <KpiCard
            label={tr("Pipeline", "Pipeline")}
            value={fmtFull(totalPipelineValue)} sub={tr("aktiv + göndərilmiş", "active + sent offers")}
            icon={TrendingUp} iconBg="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" delta={22}
          />
          <KpiCard
            label={tr("Müştərilər", "Clients")}
            value={String(totalClients)} sub={`${vipClients} VIP`}
            icon={Users} iconBg="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" delta={8}
          />
          <KpiCard
            label={tr("Müqavilələr", "Total Deals")}
            value={String(totalDeals)} sub={tr("bu il", "this year")}
            icon={Plane} iconBg="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" delta={15}
          />
          <KpiCard
            label={tr("Orta Müqavilə", "Avg Deal Value")}
            value={fmtFull(avgDealValue)} sub={tr("fakturaya görə", "per invoice")}
            icon={BarChart2} iconBg="bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400" delta={6}
          />
        </div>

        {/* ── Revenue Chart + Invoice Status ─────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          {/* Revenue trend */}
          <div className="xl:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <SectionTitle
              icon={TrendingUp}
              title={tr("Gəlir Trendi", "Revenue Trend")}
              sub={tr("Faktura vs. Toplanmış (AZN)", "Invoiced vs. Collected (AZN)")}
            />
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradInv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradCol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} tickFormatter={v => fmt(v) + "₼"} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Area type="monotone" dataKey="invoiced" name={tr("Faktura", "Invoiced")} stroke="#14b8a6" strokeWidth={2} fill="url(#gradInv)" dot={false} activeDot={{ r: 4, fill: "#14b8a6" }} />
                  <Area type="monotone" dataKey="collected" name={tr("Toplanmış", "Collected")} stroke="#22c55e" strokeWidth={2} fill="url(#gradCol)" dot={false} activeDot={{ r: 4, fill: "#22c55e" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Invoice status donut */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <SectionTitle
              icon={FileText}
              title={tr("Faktura Statusu", "Invoice Status")}
              sub={tr("Ümumi 21 faktura", "Total 21 invoices")}
            />
            <div className="flex items-center gap-4">
              <div className="h-36 w-36 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={INVOICE_STATUS_DATA}
                      cx="50%" cy="50%"
                      innerRadius={40} outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {INVOICE_STATUS_DATA.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number, name: string) => [val + " invoices", name]}
                      contentStyle={{ fontSize: 11, borderRadius: 10, border: "1px solid #e5e7eb" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-3">
                {INVOICE_STATUS_DATA.map(d => (
                  <div key={d.name}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-gray-600 dark:text-gray-400">{language === "az" ? d.nameAz : d.name}</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                    <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(d.value / 21) * 100}%`, background: d.color }} />
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{fmtFull(d.amount)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Collection rate gauge */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-gray-500 dark:text-gray-400">{tr("Yığım nisbəti", "Collection rate")}</span>
                <span className="font-bold text-gray-900 dark:text-white">{collectionRate.toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all" style={{ width: `${collectionRate}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Deals + Payment Methods ────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Offer pipeline */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <SectionTitle icon={Plane} title={tr("Təklif Boru Kəməri", "Offer Pipeline")} sub={tr("Status üzrə təkliflər", "Offers by status")} />
            <div className="space-y-3">
              {OFFERS_PIPELINE.map(o => {
                const totalPipeline = OFFERS_PIPELINE.reduce((s, p) => s + p.value, 0);
                const w = (o.value / totalPipeline) * 100;
                return (
                  <div key={o.status}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: o.color }} />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{language === "az" ? o.labelAz : o.label}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">({o.count} {tr("təklif", "deals")})</span>
                      </div>
                      <span className="font-bold text-gray-900 dark:text-white">{fmtFull(o.value)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${w}%`, background: o.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pipeline bar chart */}
            <div className="h-32 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={OFFERS_PIPELINE} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                  <XAxis dataKey={language === "az" ? "labelAz" : "label"} tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(v: number) => [fmtFull(v), tr("Dəyər", "Value")]} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {OFFERS_PIPELINE.map((o, i) => <Cell key={i} fill={o.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <SectionTitle icon={CreditCard} title={tr("Ödəniş Üsulları", "Payment Methods")} sub={tr("Toplanmış məbləğ üzrə", "By collected amount")} />
            <div className="space-y-3">
              {PAYMENT_METHODS.map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.method} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: m.color + "20" }}>
                      <Icon className="w-4 h-4" style={{ color: m.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{language === "az" ? m.methodAz : m.method}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">{m.pct}%</span>
                          <span className="font-bold text-gray-900 dark:text-white">{fmtFull(m.amount)}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${m.pct}%`, background: m.color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Monthly deals count chart */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">{tr("Aylıq Müqavilə Sayı", "Monthly Deal Count")}</p>
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.06} vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: "currentColor", opacity: 0.5 }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip formatter={(v: number) => [v, tr("Müqavilə", "Deals")]} contentStyle={{ fontSize: 11, borderRadius: 10 }} />
                    <Bar dataKey="deals" name={tr("Müqavilə", "Deals")} fill="#14b8a6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Clients + Destinations ────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Top clients */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <SectionTitle icon={Users} title={tr("Ən Yaxşı Müştərilər", "Top Clients")} sub={tr("Faktura məbləğinə görə sıralanmış", "Ranked by invoiced amount")} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
                    <th className={thCls}>#</th>
                    <th className={thCls}>{tr("Müştəri", "Client")}</th>
                    <th className={thCls}>{tr("Faktura", "Invoiced")}</th>
                    <th className={thCls}>{tr("Toplanmış", "Collected")}</th>
                    <th className={thCls}>{tr("Qalıq", "Debt")}</th>
                    <th className={thCls}>{tr("Sərfər", "Trips")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((c, i) => {
                    const debt = c.totalInvoiced - c.totalPaid;
                    const rate = (c.totalPaid / c.totalInvoiced) * 100;
                    return (
                      <tr key={c.id} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"}`}>
                        <td className="px-3 py-2.5">
                          <span className={`text-[11px] font-bold ${i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-orange-400" : "text-gray-300 dark:text-gray-600"}`}>
                            {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-[9px] text-gray-700 dark:text-gray-200 font-bold">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2)}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-medium text-gray-900 dark:text-white">{c.name}</span>
                                {c.status === "vip" && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                              </div>
                              <span className={`inline-flex text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[c.status]}`}>{c.status.toUpperCase()}</span>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdCls} font-semibold text-gray-900 dark:text-white`}>{fmtFull(c.totalInvoiced)}</td>
                        <td className="px-3 py-2.5">
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">{fmtFull(c.totalPaid)}</span>
                          <div className="w-14 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{ width: `${rate}%` }} />
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`text-xs font-semibold ${debt > 0 ? "text-orange-500" : "text-gray-400"}`}>{debt > 0 ? fmtFull(debt) : "—"}</span>
                        </td>
                        <td className={`${tdCls} font-medium text-center`}>{c.trips}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top destinations */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <SectionTitle icon={MapPin} title={tr("Ən Çox Getilən Yerlər", "Top Destinations")} sub={tr("Gəlirə görə sıralanmış", "Ranked by revenue")} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
                    <th className={thCls}>{tr("Təyinat", "Destination")}</th>
                    <th className={thCls}>{tr("Müqavilə", "Deals")}</th>
                    <th className={thCls}>{tr("Gəlir", "Revenue")}</th>
                    <th className={thCls}>{tr("Orta", "Avg Deal")}</th>
                    <th className={`${thCls} hidden xl:table-cell`}>{tr("Müştərilər", "Clients")}</th>
                  </tr>
                </thead>
                <tbody>
                  {topDestinations.map((d, i) => {
                    const maxRev = topDestinations[0].revenue;
                    return (
                      <tr key={d.city} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"}`}>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg leading-none">{d.flag}</span>
                            <div>
                              <p className="text-xs font-medium text-gray-900 dark:text-white">{d.city}</p>
                              <div className="w-20 h-1 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
                                <div className="h-full rounded-full bg-[#14b8a6]" style={{ width: `${(d.revenue / maxRev) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className={`${tdCls} text-center font-semibold text-gray-900 dark:text-white`}>{d.deals}</td>
                        <td className={`${tdCls} font-semibold text-gray-900 dark:text-white`}>{fmtFull(d.revenue)}</td>
                        <td className={tdCls}>{fmtFull(d.avgDeal)}</td>
                        <td className={`${tdCls} text-center hidden xl:table-cell`}>{d.clients}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Employee Performance + Outstanding Debts ───────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Employee performance */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <SectionTitle icon={Users} title={tr("İşçi Performansı", "Employee Performance")} sub={tr("Satış agentləri üzrə", "By sales agents")} />
            <div className="space-y-4">
              {EMPLOYEES.map(emp => (
                <div key={emp.name} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] text-gray-700 dark:text-gray-200 font-bold">
                      {emp.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-0.5">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{emp.name}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">{emp.role}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-gray-400">{emp.deals} {tr("müqavilə", "deals")}</span>
                        <span className="font-bold text-gray-900 dark:text-white">{fmtFull(emp.revenue)}</span>
                      </div>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${emp.pct >= 90 ? "bg-green-500" : emp.pct >= 70 ? "bg-blue-500" : "bg-orange-500"}`}
                        style={{ width: `${emp.pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">
                        {tr("Komissiya", "Commission")}: <span className="font-semibold text-purple-600 dark:text-purple-400">{fmtFull(emp.commission)}</span>
                      </span>
                      <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">{emp.pct}% {tr("hədəf", "target")}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Outstanding debts */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 pt-4 pb-3">
              <SectionTitle
                icon={AlertTriangle}
                title={tr("Açıq Borçlar", "Outstanding Debts")}
                sub={tr(`${fmtFull(OUTSTANDING_DEBTS.reduce((s, d) => s + (d.amount - d.paid), 0))} ümumi qalıq`, `${fmtFull(OUTSTANDING_DEBTS.reduce((s, d) => s + (d.amount - d.paid), 0))} total remaining`)}
              />
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {OUTSTANDING_DEBTS.map(d => {
                const remaining = d.amount - d.paid;
                const paidPct = (d.paid / d.amount) * 100;
                return (
                  <div key={d.invoiceId} className={`px-4 py-3 flex items-center gap-3 ${d.overdue ? "bg-red-50/40 dark:bg-red-950/20" : ""}`}>
                    {/* Overdue indicator */}
                    <div className={`w-1.5 h-10 rounded-full flex-shrink-0 ${d.overdue ? "bg-red-500" : "bg-orange-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div>
                          <p className="text-xs font-semibold text-gray-900 dark:text-white">{d.name}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{d.offer}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-xs font-bold ${d.overdue ? "text-red-600 dark:text-red-400" : "text-orange-500"}`}>{fmtFull(remaining)}</p>
                          <p className="text-[10px] text-gray-400 dark:text-gray-500">{tr("Son tarix", "Due")}: {d.due}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${paidPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{pct(d.paid, d.amount)} {tr("ödənilib", "paid")}</span>
                        {d.overdue && (
                          <span className="flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {tr("Vaxtı bitib", "OVERDUE")}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const phone = "994" + Math.random().toString().slice(2, 12);
                        alert(tr(`${d.name} — WhatsApp xatırlatması göndərilir`, `Sending WhatsApp reminder to ${d.name}`));
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#25D366] hover:bg-[#1db954] transition-colors flex-shrink-0"
                      title="WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.126.555 4.12 1.527 5.851L.057 23.882l6.198-1.459A11.94 11.94 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.01-1.373l-.36-.214-3.678.865.93-3.584-.234-.368A9.818 9.818 0 1 1 12 21.818z"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Monthly Performance Table ─────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 pt-4 pb-3">
            <SectionTitle icon={BarChart2} title={tr("Aylıq Performans Cədvəli", "Monthly Performance Table")} sub={tr("Hər ay üçün tam maliyyə göstəriciləri", "Full financial breakdown per month")} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-y border-gray-100 dark:border-gray-800">
                  {[
                    tr("AY", "MONTH"), tr("FAKTURA", "INVOICED"), tr("TOPLANMIŞ", "COLLECTED"),
                    tr("QALIQ", "OUTSTANDING"), tr("YİĞIM %", "COLLECTION"), tr("MÜQAVİLƏ", "DEALS"),
                    tr("MÜŞTƏRİ", "CLIENTS"), tr("TREND", "TREND"),
                  ].map(h => <th key={h} className={thCls}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {MONTHLY_DATA.filter(d => d.invoiced > 0).map((d, i, arr) => {
                  const outstanding = d.invoiced - d.collected;
                  const rate = d.invoiced > 0 ? (d.collected / d.invoiced) * 100 : 0;
                  const prev = arr[i - 1];
                  const trend = prev ? d.invoiced - prev.invoiced : 0;
                  const isUp = trend >= 0;
                  return (
                    <tr key={d.month} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? "" : "bg-gray-50/50 dark:bg-gray-800/20"}`}>
                      <td className="px-3 py-2.5">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{d.month}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-gray-900 dark:text-white">{fmtFull(d.invoiced)}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold text-green-600 dark:text-green-400">{fmtFull(d.collected)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold ${outstanding > 0 ? "text-orange-500" : "text-gray-400"}`}>
                          {outstanding > 0 ? fmtFull(outstanding) : "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${rate >= 80 ? "bg-green-500" : rate >= 50 ? "bg-orange-400" : "bg-red-500"}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">{rate.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-center font-semibold text-gray-900 dark:text-white">{d.deals}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-gray-600 dark:text-gray-400">{d.clients}</td>
                      <td className="px-3 py-2.5">
                        {trend !== 0 && (
                          <div className={`flex items-center gap-1 text-[11px] font-semibold ${isUp ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {fmtFull(Math.abs(trend))}
                          </div>
                        )}
                        {trend === 0 && <span className="text-[10px] text-gray-300 dark:text-gray-600">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="bg-[#14b8a6]/5 dark:bg-[#14b8a6]/15 border-t-2 border-[#14b8a6]/20 dark:border-[#14b8a6]/40">
                  <td className="px-3 py-3 text-xs font-bold text-[#14b8a6] dark:text-[#14b8a6]">{tr("CƏMİ", "TOTAL")}</td>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-white">{fmtFull(totalInvoiced)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-green-600 dark:text-green-400">{fmtFull(totalCollected)}</td>
                  <td className="px-3 py-3 text-xs font-bold text-orange-500">{fmtFull(totalOutstanding)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-green-500" style={{ width: `${collectionRate}%` }} />
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">{collectionRate.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-white text-center">{totalDeals}</td>
                  <td className="px-3 py-3 text-xs font-bold text-gray-900 dark:text-white text-center">{totalClients}</td>
                  <td className="px-3 py-3" />
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom padding */}
        <div className="h-4" />

      </div>
    </div>
  );
}
