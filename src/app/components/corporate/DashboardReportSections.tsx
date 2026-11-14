import { Fragment, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Banknote,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Package,
  Search,
  ShoppingCart,
  Target,
  type LucideIcon,
} from "lucide-react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import type { BillerReportItem, ReportsOverview, SalesReportItem } from "../../api/reports";
import { ModernSelect } from "../ui/ModernSelect";
import { parseMoney } from "../../lib/dashboardMappers";
import { formatReportCurrency } from "../../lib/reportMappers";

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
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4"
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

function PaymentTypePie({
  cash,
  card,
  cashLabel,
  cardLabel,
}: {
  cash: number;
  card: number;
  cashLabel: string;
  cardLabel: string;
}) {
  const data = [
    { name: cashLabel, value: cash || 0, color: "#14b8a6" },
    { name: cardLabel, value: card || 0, color: "#f97316" },
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
      <div className="text-[10px] text-gray-500 dark:text-gray-400 space-y-0.5">
        <p>
          {cashLabel} {cash}%
        </p>
        <p>
          {cardLabel} {card}%
        </p>
      </div>
    </div>
  );
}

type Props = {
  overview: ReportsOverview;
  products: SalesReportItem[];
  employees: BillerReportItem[];
  categories: Array<{ id: string; name: string }>;
  posEnabled: boolean;
};

/** Report-accurate blocks merged into Dashboard (orders/payments, purchases, products, billers). */
export function DashboardReportSections({
  overview,
  products,
  employees,
  categories,
  posEnabled,
}: Props) {
  const { language } = useLanguage();
  const pt = (en: string, az: string, ru?: string) => pickLang(language, az, en, ru);
  const [productSearch, setProductSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    return Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort();
  }, [products]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <MetricCards
        cols="xl:grid-cols-4"
        cards={[
          {
            label: pt("Total Orders", "Ümumi Sifarişlər"),
            value: String(Math.max(0, Math.round(Number(overview.totalOrders) || 0))),
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
              <PaymentTypePie
                cash={overview.paymentType.cash}
                card={overview.paymentType.card}
                cashLabel={pt("Cash", "Nağd")}
                cardLabel={pt("Card", "Kart")}
              />
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

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {pt("Products", "Məhsullar")}
          </h2>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={pt("Search products…", "Məhsul axtar…")}
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg w-full sm:w-44"
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
          <table className="w-full text-sm min-w-[480px]">
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
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{moneyLabel(p.soldAmount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {posEnabled && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
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
                                    className="flex justify-between gap-2 rounded-lg bg-white dark:bg-gray-900 px-3 py-2 border border-gray-100 dark:border-gray-800"
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

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 sm:p-5 w-full sm:max-w-sm">
        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-3">
          <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>
        <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
          {pt("Avg Monthly Revenue", "Orta aylıq gəlir")}
        </p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white break-all">
          {overview.avgMonthlyRevenue != null ? moneyLabel(overview.avgMonthlyRevenue) : "N/A"}
        </p>
      </div>
    </div>
  );
}
