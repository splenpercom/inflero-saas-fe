import { useCallback, useEffect, useMemo, useRef, useState, Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Download,
  Package,
  Search,
  ShoppingCart,
  Target,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas-pro";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useReportDateRange } from "../../hooks/useReportDateRange";
import {
  fetchBillerReport,
  fetchReportsOverview,
  fetchSalesReport,
  type BillerReportItem,
  type ReportsOverview,
  type SalesReportItem,
} from "../../api/reports";
import { fetchDashboardSummary, type DashboardPeriod, type DashboardSummary } from "../../api/dashboard";
import { fetchCategories } from "../../api/inventory";
import { DateInput } from "../ui/DateInput";
import { ModernSelect } from "../ui/ModernSelect";
import {
  buildHeatmapGrid,
  heatColor,
  mapTopCategoriesPie,
  parseMoney,
} from "../../lib/dashboardMappers";
import { formatReportCurrency, type DateRangePreset } from "../../lib/reportMappers";
import { notifyFromError } from "../../lib/toast";

const EMPTY_OVERVIEW: ReportsOverview = {
  dateFrom: "",
  dateTo: "",
  totalIncome: "0.00",
  totalExpenses: "0.00",
  profit: "0.00",
  totalOrders: "0.00",
  paid: "0.00",
  unpaid: "0.00",
  paymentType: { cash: 0, card: 0 },
  purchases: "0.00",
  purchasesPaid: "0.00",
  purchasesDebt: "0.00",
  avgMonthlyRevenue: null,
  yoyGrowthPercent: null,
};

function presetToDashboardPeriod(preset: DateRangePreset): DashboardPeriod {
  if (preset === "today") return "1D";
  if (preset === "week") return "1W";
  if (preset === "year") return "1Y";
  return "1M";
}

function moneyLabel(value: string | number | null | undefined): string {
  return formatReportCurrency(parseMoney(value));
}

type MetricCardItem = {
  label: string;
  value?: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  content?: ReactNode;
};

function MetricCards({ cards, cols }: { cards: MetricCardItem[]; cols?: string }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 ${cols ?? "lg:grid-cols-3"} gap-3`}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>
            <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{card.label}</h3>
            {card.content ?? (
              <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PaymentTypePie({ cash, card }: { cash: number; card: number }) {
  const data = [
    { name: "Cash", value: cash || 0, color: "#14b8a6" },
    { name: "Card", value: card || 0, color: "#f97316" },
  ].filter((d) => d.value > 0);
  const chartData = data.length ? data : [{ name: "—", value: 1, color: "#e5e7eb" }];
  return (
    <div className="flex items-center gap-3">
      <div className="w-16 h-16 flex-shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} dataKey="value" cx="50%" cy="50%" innerRadius={12} outerRadius={28} paddingAngle={1}>
              {chartData.map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[10px] text-gray-500 space-y-0.5">
        <p>Cash {cash}%</p>
        <p>Card {card}%</p>
      </div>
    </div>
  );
}

export function Reports() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const { canView } = useModulePermissions("Reports");
  const branchRevision = useBranchRevision();
  const stockEnabled = hasModule("STOCK");
  const posEnabled = hasModule("POS");
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);

  const {
    preset,
    setPreset,
    customFrom,
    setCustomFrom,
    customTo,
    setCustomTo,
    dateFrom,
    dateTo,
  } = useReportDateRange("today");

  const [overview, setOverview] = useState<ReportsOverview>(EMPTY_OVERVIEW);
  const [products, setProducts] = useState<SalesReportItem[]>([]);
  const [employees, setEmployees] = useState<BillerReportItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const reportPdfRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!canView || (!isDemo && !isAuthenticated)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const dashPeriod = presetToDashboardPeriod(preset);
      const [ov, sales, billers, dash, cats] = await Promise.all([
        fetchReportsOverview({ dateFrom, dateTo }),
        fetchSalesReport({ dateFrom, dateTo, limit: 200 }),
        fetchBillerReport({ dateFrom, dateTo, limit: 100 }),
        fetchDashboardSummary(dashPeriod),
        fetchCategories().catch(() => []),
      ]);
      setOverview(ov);
      setProducts(sales.items ?? []);
      setEmployees(billers.items ?? []);
      setSummary(dash);
      setCategories((cats ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })));
    } catch (err) {
      notifyFromError(err, pt("Failed to load reports", "Hesabatları yükləmək alınmadı"));
      setOverview(EMPTY_OVERVIEW);
      setProducts([]);
      setEmployees([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [canView, isDemo, isAuthenticated, dateFrom, dateTo, preset, branchRevision]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        p.productName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q)
      );
    });
  }, [products, productSearch, categoryFilter]);

  const productCategoryOptions = useMemo(() => {
    const names = Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
    return names;
  }, [products]);

  const heatmap = useMemo(() => {
    const points = summary?.charts.orderHeatmap ?? [];
    const built = buildHeatmapGrid(points);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const hours = ["6 Am", "8 Am", "10 Am", "12 Pm", "2 Pm", "4 Pm", "6 Pm"];
    return { map: built.map, days, hours, max: built.max };
  }, [summary]);

  const categoryPie = useMemo(
    () => (summary ? mapTopCategoriesPie(summary.widgets.topCategories) : []),
    [summary],
  );
  const categoryUnits = useMemo(
    () => (summary?.widgets.topCategories ?? []).reduce((s, c) => s + c.value, 0),
    [summary],
  );
  const lowStock = summary?.widgets.lowStock ?? [];

  const monthlyChart = useMemo(() => {
    const rows = summary?.charts.salesStatsMonthly ?? [];
    return rows.map((r) => ({
      month: r.month,
      revenue: r.revenue ?? 0,
      profit: Math.max(0, (r.revenue ?? 0) - (r.expense ?? 0)),
    }));
  }, [summary]);

  const periodLinks: Array<{ key: DateRangePreset; label: string }> = [
    { key: "today", label: pt("Today", "Bu Gün") },
    { key: "month", label: pt("This Month", "Bu Ay") },
    { key: "year", label: pt("This Year", "Bu İl") },
    { key: "custom", label: pt("Choose Date", "Tarix seç") },
  ];

  const periodLabel =
    periodLinks.find((p) => p.key === preset)?.label ??
    pt("This Month", "Bu Ay");

  const handleExportPdf = async () => {
    const el = reportPdfRef.current;
    if (!el || exporting || loading) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: Math.max(el.scrollWidth, 1100),
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8;
      const usableWidth = pageWidth - margin * 2;
      const usableHeight = pageHeight - margin * 2;
      const imgHeight = (canvas.height * usableWidth) / canvas.width;

      let heightLeft = imgHeight;
      let offsetY = margin;

      pdf.addImage(imgData, "PNG", margin, offsetY, usableWidth, imgHeight);
      heightLeft -= usableHeight;

      while (heightLeft > 0) {
        offsetY = margin - (imgHeight - heightLeft);
        pdf.addPage();
        pdf.addImage(imgData, "PNG", margin, offsetY, usableWidth, imgHeight);
        heightLeft -= usableHeight;
      }

      pdf.save("reports.pdf");
    } catch (err) {
      notifyFromError(err, pt("Failed to export PDF", "PDF ixracı alınmadı"));
    } finally {
      setExporting(false);
    }
  };

  if (!canView) {
    return (
      <div className="p-6 text-sm text-gray-500">
        {pt("You do not have permission to view reports.", "Hesabatları görmək üçün icazəniz yoxdur.")}
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 space-y-4 flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {pt("Reports", "Hesabatlar")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{periodLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-0.5 gap-0.5 shadow-sm">
            {periodLinks.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => setPreset(p.key)}
                className={
                  preset === p.key
                    ? "px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#14b8a6] text-white shadow-sm"
                    : "px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleExportPdf()}
            disabled={exporting || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0f766e] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {exporting ? pt("Exporting…", "İxrac olunur…") : pt("Export PDF", "PDF ixrac")}
            </span>
          </button>
        </div>
      </div>

      {preset === "custom" && (
        <div className="glass-card p-3 rounded-xl border border-white/20 dark:border-white/10 flex flex-wrap items-center gap-2">
          <DateInput value={customFrom} onChange={setCustomFrom} className="w-36" defaultYearsAgo={0} />
          <span className="text-xs text-gray-400">—</span>
          <DateInput value={customTo} onChange={setCustomTo} className="w-36" defaultYearsAgo={0} />
        </div>
      )}

      {loading ? (
        <div className="glass-card p-8 rounded-xl border border-white/20 dark:border-white/10 text-center text-sm text-gray-500 dark:text-gray-400">
          {pt("Loading…", "Yüklənir…")}
        </div>
      ) : (
        <div ref={reportPdfRef} className="space-y-4">
          <MetricCards
            cards={[
              {
                label: pt("Total Income", "Ümumi Gəlir"),
                value: moneyLabel(overview.totalIncome),
                icon: Banknote,
                color: "text-green-600 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-900/20",
              },
              {
                label: pt("Total Expenses", "Ümumi Xərclər"),
                value: moneyLabel(overview.totalExpenses),
                icon: CreditCard,
                color: "text-red-600 dark:text-red-400",
                bgColor: "bg-red-50 dark:bg-red-900/20",
              },
              {
                label: pt("Profit", "Mənfəət"),
                value: moneyLabel(overview.profit),
                icon: Wallet,
                color: "text-[#14b8a6]",
                bgColor: "bg-[#14b8a6]/10 dark:bg-[#14b8a6]/20",
              },
            ]}
          />
          <MetricCards
            cols="lg:grid-cols-4"
            cards={[
              {
                label: pt("Total Orders", "Ümumi Sifarişlər"),
                value: moneyLabel(overview.totalOrders),
                icon: Package,
                color: "text-teal-600 dark:text-teal-400",
                bgColor: "bg-teal-50 dark:bg-teal-900/20",
              },
              {
                label: pt("Paid", "Ödənilib"),
                value: moneyLabel(overview.paid),
                icon: Banknote,
                color: "text-green-600 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-900/20",
              },
              {
                label: pt("Unpaid", "Ödənilməyib"),
                value: moneyLabel(overview.unpaid),
                icon: AlertTriangle,
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-900/20",
              },
              {
                label: pt("Payment Type", "Ödəniş növü"),
                icon: CreditCard,
                color: "text-sky-600 dark:text-sky-400",
                bgColor: "bg-sky-50 dark:bg-sky-900/20",
                content: (
                  <PaymentTypePie cash={overview.paymentType.cash} card={overview.paymentType.card} />
                ),
              },
            ]}
          />
          <MetricCards
            cards={[
              {
                label: pt("Purchases", "Satınalmalar"),
                value: moneyLabel(overview.purchases),
                icon: ShoppingCart,
                color: "text-violet-600 dark:text-violet-400",
                bgColor: "bg-violet-50 dark:bg-violet-900/20",
              },
              {
                label: pt("Paid", "Ödənilib"),
                value: moneyLabel(overview.purchasesPaid),
                icon: Banknote,
                color: "text-green-600 dark:text-green-400",
                bgColor: "bg-green-50 dark:bg-green-900/20",
              },
              {
                label: pt("Debt", "Borc"),
                value: moneyLabel(overview.purchasesDebt),
                icon: AlertTriangle,
                color: "text-orange-600 dark:text-orange-400",
                bgColor: "bg-orange-50 dark:bg-orange-900/20",
              },
            ]}
          />

          {/* Block B — Products */}
          <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Products", "Məhsullar")}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder={pt("Search products…", "Məhsul axtar…")}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg w-44"
                  />
                </div>
                <ModernSelect
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  minWidth={140}
                  options={[
                    { value: "all", label: pt("All Categories", "Bütün kateqoriyalar") },
                    ...productCategoryOptions.map((n) => ({ value: n, label: n })),
                    ...categories
                      .filter((c) => !productCategoryOptions.includes(c.name))
                      .map((c) => ({ value: c.name, label: c.name })),
                  ]}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                    <th className="px-4 py-3 font-medium">{pt("Product", "Məhsul")}</th>
                    <th className="px-4 py-3 font-medium">{pt("Category", "Kateqoriya")}</th>
                    <th className="px-4 py-3 font-medium">{pt("Units Sold", "Satılan")}</th>
                    <th className="px-4 py-3 font-medium">{pt("Revenue", "Gəlir")}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-xs">
                        {pt("No products in this period", "Bu dövrdə məhsul yoxdur")}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.productId} className="border-b border-gray-50 dark:border-gray-800/80">
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{p.productName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.category}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">{p.soldQty}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {moneyLabel(p.soldAmount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
        </div>

          {/* Block B — Employee Breakdown */}
          {posEnabled && (
            <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {pt("Employee Breakdown", "İşçi bölgüsü")}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[900px]">
                  <thead>
                    <tr className="text-left text-[10px] uppercase tracking-wide text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="px-4 py-3 font-medium">{pt("Employee", "İşçi")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Orders", "Sifariş")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Revenue", "Gəlir")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Commission", "Komissiya")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Products Sold", "Satılan")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Unique Products", "Unikal")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Avg Order", "Orta")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Paid", "Ödənilib")}</th>
                      <th className="px-3 py-3 font-medium">{pt("Due", "Borc")}</th>
                      <th className="px-3 py-3 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-8 text-center text-gray-400 text-xs">
                          {pt("No employee sales in this period", "Bu dövrdə işçi satışı yoxdur")}
                        </td>
                      </tr>
                    ) : (
                      employees.map((e) => {
                        const id = e.billerId ?? e.billerCode;
                        const open = expandedId === id;
                        const due = e.dueAmount + e.unpaidAmount;
            return (
                          <Fragment key={id}>
                            <tr
                              className="border-b border-gray-50 dark:border-gray-800/80 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-800/40"
                              onClick={() => setExpandedId(open ? null : id)}
                            >
                              <td className="px-4 py-3">
                                <p className="font-medium text-gray-900 dark:text-white">{e.billerName}</p>
                                <p className="text-[10px] text-gray-400">{e.billerCode}</p>
                              </td>
                              <td className="px-3 py-3">{e.orderCount}</td>
                              <td className="px-3 py-3">{moneyLabel(e.totalRevenue)}</td>
                              <td className="px-3 py-3">{moneyLabel(e.commissionAmount ?? 0)}</td>
                              <td className="px-3 py-3">{e.itemsSold}</td>
                              <td className="px-3 py-3">{e.uniqueProducts}</td>
                              <td className="px-3 py-3">{moneyLabel(e.avgOrderValue)}</td>
                              <td className="px-3 py-3 text-green-600 dark:text-green-400 font-medium">
                                {moneyLabel(e.paidAmount)}
                              </td>
                              <td className="px-3 py-3 text-orange-600 dark:text-orange-400 font-medium">
                                {moneyLabel(due)}
                              </td>
                              <td className="px-3 py-3 text-gray-400">
                                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </td>
                            </tr>
                            {open && (
                              <tr className="bg-gray-50/70 dark:bg-gray-800/30">
                                <td colSpan={10} className="px-6 py-3">
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                                    {(e.categories ?? []).map((c) => (
                                      <div
                                        key={c.category}
                                        className="flex justify-between gap-2 rounded-lg glass-card px-3 py-2 border border-white/20 dark:border-white/10"
                                      >
                                        <span className="text-gray-600 dark:text-gray-400 truncate">{c.category}</span>
                                        <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
                                          {c.soldQty} · {moneyLabel(c.soldAmount)}
                                        </span>
                                      </div>
                                    ))}
                                    {(e.categories ?? []).length === 0 && (
                                      <p className="text-gray-400">{pt("No category breakdown", "Kateqoriya yoxdur")}</p>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Block C — Heatmap */}
          {posEnabled && (
            <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Order Activity Heatmap", "Sifariş Aktivliyi")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-5">
                {pt("Busiest time slots this week.", "Bu həftə ən məşğul slotlar.")}
              </p>
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
                    <div key={day} className="flex items-center gap-1.5 mb-1.5">
                      <div className="w-10 flex-shrink-0 text-[10px] text-gray-400 font-medium">{day}</div>
                      {heatmap.hours.map((hour) => {
                        const v = heatmap.map[`${day}-${hour}`] ?? 0;
                        return (
                          <div
                            key={hour}
                            title={`${day} ${hour}: ${v}`}
                            className={`flex-1 h-7 rounded-full ${heatColor(v, heatmap.max)}`}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Block D — Category | Low Stock */}
          <div className={`grid grid-cols-1 ${stockEnabled ? "lg:grid-cols-2" : ""} gap-4`}>
            <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {pt("Sales by Category", "Kateqoriya üzrə satış")}
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                {categoryUnits} {pt("units sold", "satılan vahid")}
              </p>
              {categoryPie.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-10">
                  {pt("No category data yet", "Hələ məlumat yoxdur")}
                </p>
              ) : (
                <>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={categoryPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={74}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryPie.map((e, i) => (
                            <Cell key={i} fill={e.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => [`${v}%`, ""]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 mt-2">
                    {categoryPie.map((s) => (
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

            {stockEnabled && (
              <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    {pt("Low Stock", "Az Stok")}
                  </h3>
                  <Link
                    to="/dashboard/inventory/products/low-stocks"
                    className="text-xs text-[#14b8a6] hover:underline"
                  >
                    {pt("View All", "Hamısını Gör")} →
                  </Link>
                </div>
                {lowStock.length === 0 ? (
                  <p className="text-xs text-gray-400 py-8 text-center">
                    {pt("Stock levels OK", "Stok səviyyəsi normaldır")}
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {lowStock.slice(0, 6).map((p) => (
                      <div
                        key={p.productId}
                        className="p-3 rounded-xl bg-white/60 dark:bg-gray-900/60 border border-white/30 dark:border-white/10 shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400">{p.sku}</p>
                          </div>
                          <span className="text-xs font-bold text-red-600 dark:text-red-400 whitespace-nowrap ml-2">
                            {p.quantity} {pt("left", "qaldı")}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${p.quantity <= 0 ? "bg-gray-300" : "bg-orange-500"}`}
                            style={{
                              width: `${Math.min(
                                100,
                                p.quantityAlert > 0 ? (p.quantity / p.quantityAlert) * 100 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1">
                          {pt("Min", "Min")}: {p.quantityAlert}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Block E — Avg / YoY + Monthly */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
              <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {pt("Avg Monthly Revenue", "Orta aylıq gəlir")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.avgMonthlyRevenue != null
                  ? moneyLabel(overview.avgMonthlyRevenue)
                  : "N/A"}
              </p>
            </div>
            <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
              <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3">
                <TrendingUp className="w-4 h-4 text-orange-500" />
              </div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {pt("YoY Growth", "İllik artım")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {overview.yoyGrowthPercent != null ? `${overview.yoyGrowthPercent}%` : "N/A"}
              </p>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-white/20 dark:border-white/10 p-5">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {pt("Monthly Performance", "Aylıq performans")}
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthlyChart}>
                <defs>
                  <linearGradient id="repRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="repProfitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#86efac" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#86efac" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    moneyLabel(v),
                    name === "revenue" ? pt("Revenue", "Gəlir") : pt("Profit", "Mənfəət"),
                  ]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Legend
                  verticalAlign="bottom"
                  formatter={(value) =>
                    value === "revenue" ? pt("Revenue", "Gəlir") : pt("Profit", "Mənfəət")
                  }
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fill="url(#repRevGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#86efac"
                  strokeWidth={2}
                  fill="url(#repProfitGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
