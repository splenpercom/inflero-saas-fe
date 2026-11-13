import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSummary, type DashboardPeriod, type DashboardSummary } from "../api/dashboard";
import { fetchPendingReservationCount, fetchReservations } from "../api/reservations";
import type { ReservationRecord } from "../api/reservations";
import {
  fetchBillerReport,
  fetchReportsOverview,
  fetchSalesReport,
  type BillerReportItem,
  type ReportsOverview,
  type SalesReportItem,
} from "../api/reports";
import { fetchCategories } from "../api/inventory";
import { dateRangePreset, type DateRangePreset } from "../lib/reportMappers";
import { useAuth } from "../context/AuthContext";
import { useBranchRevision } from "./useBranchRevision";

/** Same local-calendar windows as former Reports page (not UTC midnight). */
export function dashboardPeriodToReportPreset(period: DashboardPeriod): DateRangePreset {
  if (period === "1D") return "today";
  if (period === "1W") return "week";
  if (period === "1Y") return "year";
  return "month";
}

export function reportPresetToDashboardPeriod(preset: DateRangePreset): DashboardPeriod {
  if (preset === "today") return "1D";
  if (preset === "week") return "1W";
  if (preset === "year") return "1Y";
  return "1M";
}

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
  stockCogs: "0.00",
  avgMonthlyRevenue: null,
  yoyGrowthPercent: null,
};

export type DashboardDateRange = {
  dateFrom: string;
  dateTo: string;
};

export function useDashboardData(period: DashboardPeriod, range: DashboardDateRange) {
  const { isAuthenticated, isDemo, hasModule, hasPermission } = useAuth();
  const reservationsEnabled =
    hasModule("RESERVATIONS") && hasPermission("Reservations", "view");
  const branchRevision = useBranchRevision();
  const enabled = isAuthenticated || isDemo;
  const { dateFrom, dateTo } = range;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todaySummary, setTodaySummary] = useState<DashboardSummary | null>(null);
  const [todayReservations, setTodayReservations] = useState<ReservationRecord[]>([]);
  const [pendingReservationCount, setPendingReservationCount] = useState(0);
  const [overview, setOverview] = useState<ReportsOverview>(EMPTY_OVERVIEW);
  const [products, setProducts] = useState<SalesReportItem[]>([]);
  const [employees, setEmployees] = useState<BillerReportItem[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setSummary(null);
      setTodaySummary(null);
      setTodayReservations([]);
      setPendingReservationCount(0);
      setOverview(EMPTY_OVERVIEW);
      setProducts([]);
      setEmployees([]);
      setCategories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const todayRange = dateRangePreset("today");
    const [main, today, reservations, pending, ov, sales, billers, cats] = await Promise.allSettled([
      fetchDashboardSummary(period, { dateFrom, dateTo }),
      fetchDashboardSummary("1D", todayRange),
      reservationsEnabled
        ? fetchReservations({
            dateFrom: todayRange.dateFrom,
            dateTo: todayRange.dateTo,
            limit: 50,
          })
        : Promise.resolve([]),
      reservationsEnabled ? fetchPendingReservationCount() : Promise.resolve(0),
      fetchReportsOverview({ dateFrom, dateTo }),
      fetchSalesReport({ dateFrom, dateTo, limit: 200 }),
      fetchBillerReport({ dateFrom, dateTo, limit: 100 }),
      fetchCategories().catch(() => []),
    ]);

    setSummary(main.status === "fulfilled" ? main.value : null);
    setTodaySummary(today.status === "fulfilled" ? today.value : null);
    setTodayReservations(reservations.status === "fulfilled" ? reservations.value ?? [] : []);
    setPendingReservationCount(pending.status === "fulfilled" ? pending.value : 0);
    setOverview(ov.status === "fulfilled" ? ov.value : EMPTY_OVERVIEW);
    setProducts(sales.status === "fulfilled" ? sales.value.items ?? [] : []);
    setEmployees(billers.status === "fulfilled" ? billers.value.items ?? [] : []);
    setCategories(
      cats.status === "fulfilled"
        ? ((cats.value ?? []) as Array<{ id: string; name: string }>).map((c) => ({
            id: c.id,
            name: c.name,
          }))
        : [],
    );

    if (main.status === "rejected" && ov.status === "rejected") {
      setError(main.reason instanceof Error ? main.reason.message : "Failed to load dashboard");
    }
    setLoading(false);
  }, [enabled, period, dateFrom, dateTo, reservationsEnabled, branchRevision]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    loading,
    error,
    summary,
    todaySummary,
    todayReservations,
    pendingReservationCount,
    overview,
    products,
    employees,
    categories,
    reload: load,
  };
}
