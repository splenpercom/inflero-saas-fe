import type { DashboardHeatmapPoint, DashboardSummary } from "../api/dashboard";
import type { ReservationRecord } from "../api/reservations";
import type { Language } from "../i18n/translations";
import { formatCurrency } from "../utils/currency";
import { formatShortDateTime, formatTime as formatLocalizedTime } from "./dateFormat";

export function parseMoney(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const n = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function formatMoney(value: string | number | null | undefined): string {
  return formatCurrency(parseMoney(value));
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? "??").toUpperCase();
}

export function formatShortDate(iso: string, locale: Language): string {
  try {
    return formatShortDateTime(iso, locale);
  } catch {
    return iso;
  }
}

export function formatTime(iso: string, locale: Language): string {
  try {
    return formatLocalizedTime(iso, locale);
  } catch {
    return "";
  }
}

export function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function todayRangeIso(): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { dateFrom: start.toISOString(), dateTo: end.toISOString() };
}

export function activityIsCompleted(row: { status: string; paymentStatus: string }): boolean {
  const status = row.status.toUpperCase();
  const payment = row.paymentStatus.toUpperCase();
  if (status === "CANCELLED" || status === "CANCELED") return false;
  // Dashboard Done/Pending reflects payment, not merely order workflow status.
  // POS checkout is COMPLETED even when payment is Pending/Unpaid.
  if (payment === "PAID" || payment === "PARTIAL") return true;
  if (payment === "UNPAID" || payment === "OVERDUE") return false;
  return status === "COMPLETED" || status === "RECEIVED";
}

export function buildHeatmapGrid(points: DashboardHeatmapPoint[]) {
  const map: Record<string, number> = {};
  const daySet = new Set<string>();
  const hourSet = new Set<string>();
  for (const p of points) {
    map[`${p.day}-${p.hour}`] = p.orders;
    daySet.add(p.day);
    hourSet.add(p.hour);
  }
  const defaultDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days = defaultDays.filter((d) => daySet.has(d));
  const hours = [...hourSet];
  return {
    map,
    days: days.length ? days : defaultDays.slice(0, 6),
    hours: hours.length ? hours : ["6 Am", "8 Am", "10 Am", "12 Pm", "2 Pm", "4 Pm", "6 Pm"],
    max: Math.max(0, ...points.map((p) => p.orders)),
  };
}

export function heatColor(value: number, max: number): string {
  if (value <= 0) return "bg-gray-100 dark:bg-gray-800";
  const ratio = max > 0 ? value / max : 0;
  if (ratio <= 0.25) return "bg-[#0026f6]/15 dark:bg-[#0026f6]/20";
  if (ratio <= 0.5) return "bg-[#0026f6]/30 dark:bg-[#0026f6]/35";
  if (ratio <= 0.75) return "bg-[#0026f6]/55 dark:bg-[#0026f6]/60";
  return "bg-[#0026f6] dark:bg-[#0026f6]";
}

const CATEGORY_COLORS = ["#f97316", "#0026f6", "#0ea5e9", "#10b981", "#a78bfa", "#ec4899"];

export function mapTopCategoriesPie(categories: DashboardSummary["widgets"]["topCategories"]) {
  const total = categories.reduce((s, c) => s + c.value, 0) || 1;
  return categories.slice(0, 5).map((c, i) => ({
    name: c.name,
    value: Math.round((c.value / total) * 100),
    raw: c.value,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));
}

export function sliceLastMonths<T>(rows: T[], count: number): T[] {
  if (rows.length <= count) return rows;
  return rows.slice(rows.length - count);
}

export function profitMarginPercent(revenue: number, profit: number): string {
  if (revenue <= 0) return "0%";
  return `${((profit / revenue) * 100).toFixed(1)}%`;
}

export function expenseRatioPercent(revenue: number, expenses: number): string {
  if (revenue <= 0) return "0%";
  return `${((expenses / revenue) * 100).toFixed(1)}%`;
}

export function mapTodayReservations(rows: ReservationRecord[], locale: Language) {
  return rows
    .filter((r) => isToday(r.scheduledAt) && r.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .map((r) => ({
      id: r.id,
      time: formatTime(r.scheduledAt, locale),
      customer: r.customerName ?? r.guestName ?? "—",
      service: r.serviceType,
      status: r.status === "confirmed" || r.status === "completed" ? "confirmed" as const : "pending" as const,
    }));
}
