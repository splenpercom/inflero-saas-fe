import type { SalesReportItem } from "../api/reports";
import type { ProfitLossItem, AnnualReportRow } from "../api/reports";
import type { ExpenseReportItem } from "../api/reports";

export type DateRangePreset = "week" | "month" | "quarter" | "year" | "custom";

export function isoDateInputToRange(dateFrom: string, dateTo: string): { dateFrom: string; dateTo: string } {
  const parseYmd = (ymd: string) => {
    const [y, m, d] = ymd.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  };
  const from = dateFrom ? startOfDayUtc(parseYmd(dateFrom)) : startOfDayUtc(new Date());
  const to = dateTo ? endOfDayUtc(parseYmd(dateTo)) : endOfDayUtc(new Date());
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

export function resolveReportDateRange(
  preset: DateRangePreset,
  customFrom?: string,
  customTo?: string,
): { dateFrom: string; dateTo: string } {
  if (preset === "custom" && customFrom && customTo) {
    return isoDateInputToRange(customFrom, customTo);
  }
  return dateRangePreset(preset === "custom" ? "month" : preset);
}

export function parseReportMoney(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatReportCurrency(value: number | null | undefined, suffix = " ₼"): string {
  const n = typeof value === "number" && Number.isFinite(value) ? value : 0;
  return `${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${suffix}`;
}

function startOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function endOfDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function dateRangePreset(preset: DateRangePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to = endOfDayUtc(now);
  let from: Date;
  switch (preset) {
    case "week":
      from = startOfDayUtc(new Date(now.getTime() - 6 * 24 * 3600 * 1000));
      break;
    case "quarter": {
      const qStartMonth = Math.floor(now.getUTCMonth() / 3) * 3;
      from = new Date(Date.UTC(now.getUTCFullYear(), qStartMonth, 1, 0, 0, 0, 0));
      break;
    }
    case "year":
      from = new Date(Date.UTC(now.getUTCFullYear(), 0, 1, 0, 0, 0, 0));
      break;
    case "month":
    default:
      from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
      break;
  }
  return { dateFrom: from.toISOString(), dateTo: to.toISOString() };
}

export function aggregateCategoriesFromSalesItems(items: SalesReportItem[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    const cat = item.category || "—";
    map.set(cat, (map.get(cat) ?? 0) + parseReportMoney(item.soldAmount));
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  return Array.from(map.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: total > 0 ? Math.round((value / total) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function topProductsByAmount(items: SalesReportItem[], limit = 10) {
  return [...items]
    .sort((a, b) => parseReportMoney(b.soldAmount) - parseReportMoney(a.soldAmount))
    .slice(0, limit)
    .map((p) => ({
      name: p.productName.length > 18 ? `${p.productName.slice(0, 18)}…` : p.productName,
      sales: parseReportMoney(p.soldAmount),
    }));
}

export function topProductsByQty(items: SalesReportItem[], limit = 10) {
  return [...items]
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, limit)
    .map((p) => ({
      name: p.productName.length > 18 ? `${p.productName.slice(0, 18)}…` : p.productName,
      qty: p.soldQty,
    }));
}

export function topCategoriesBar(items: SalesReportItem[], limit = 6) {
  return aggregateCategoriesFromSalesItems(items)
    .slice(0, limit)
    .map((c) => ({ category: c.category, sales: c.value }));
}

export type FinanceMonthlyRow = { month: string; revenue: number; expenses: number; profit: number };

export function mapProfitLossToFinanceUI(items: ProfitLossItem[]): FinanceMonthlyRow[] {
  return items.map((m) => ({
    month: m.month,
    revenue: (m.sales ?? 0) + (m.service ?? 0),
    expenses: m.totalExpense ?? 0,
    profit: m.netProfit ?? 0,
  }));
}

const PIE_COLORS = ["#0026f6", "#0026f6", "#5c85ff", "#85a3ff", "#adc2ff", "#94a3b8", "#64748b"];

export function aggregateExpensesByCategory(items: ExpenseReportItem[]) {
  const approved = items.filter((i) => i.status === "APPROVED");
  const map = new Map<string, number>();
  for (const item of approved) {
    const cat = item.category || "—";
    map.set(cat, (map.get(cat) ?? 0) + parseReportMoney(item.amount));
  }
  const total = Array.from(map.values()).reduce((s, v) => s + v, 0);
  return Array.from(map.entries())
    .map(([name, amount], index) => ({
      name,
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
      amount,
      color: PIE_COLORS[index % PIE_COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type AnnualMonthlyRow = { month: string; revenue: number; expenses: number; profit: number };

export function mapAnnualRowsToMonthly(rows: AnnualReportRow[], monthLabels: string[]): AnnualMonthlyRow[] {
  const sales = rows.find((r) => r.key === "sales")?.amounts ?? [];
  const otherIncome = rows.find((r) => r.key === "otherIncome")?.amounts ?? [];
  const expenses = rows.find((r) => r.key === "expenses")?.amounts ?? [];
  const netProfit = rows.find((r) => r.key === "netProfit")?.amounts ?? [];
  return monthLabels.map((month, i) => ({
    month,
    revenue: (sales[i] ?? 0) + (otherIncome[i] ?? 0),
    expenses: expenses[i] ?? 0,
    profit: netProfit[i] ?? 0,
  }));
}

export function aggregateQuarters(monthlyData: AnnualMonthlyRow[]) {
  const quarters = [
    { quarter: "Q1", revenue: 0 },
    { quarter: "Q2", revenue: 0 },
    { quarter: "Q3", revenue: 0 },
    { quarter: "Q4", revenue: 0 },
  ];
  monthlyData.forEach((m, i) => {
    const q = Math.floor(i / 3);
    if (q < 4) quarters[q].revenue += m.revenue;
  });
  return quarters;
}

export function stockStatusFromQty(qty: number, lowThreshold = 10): "healthy" | "low" | "critical" {
  if (qty <= 0) return "critical";
  if (qty <= lowThreshold) return "low";
  return "healthy";
}

export function yearOptions(centerYear = new Date().getUTCFullYear(), span = 3): number[] {
  const years: number[] = [];
  for (let y = centerYear - span; y <= centerYear + 1; y++) {
    if (y >= 2000 && y <= 2100) years.push(y);
  }
  return years.sort((a, b) => b - a);
}
