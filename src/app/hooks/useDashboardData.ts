import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSummary, type DashboardPeriod, type DashboardSummary } from "../api/dashboard";
import { fetchPendingReservationCount, fetchReservations } from "../api/reservations";
import type { ReservationRecord } from "../api/reservations";
import { dateRangePreset, type DateRangePreset } from "../lib/reportMappers";
import { useAuth } from "../context/AuthContext";
import { useBranchRevision } from "./useBranchRevision";

/** Same local-calendar windows as Reports (not UTC midnight). */
function dashboardPeriodToReportPreset(period: DashboardPeriod): DateRangePreset {
  if (period === "1D") return "today";
  if (period === "1W") return "week";
  if (period === "1Y") return "year";
  return "month";
}

export function useDashboardData(period: DashboardPeriod) {
  const { isAuthenticated, isDemo, hasModule, hasPermission } = useAuth();
  const reservationsEnabled =
    hasModule("RESERVATIONS") && hasPermission("Reservations", "view");
  const branchRevision = useBranchRevision();
  const enabled = isAuthenticated || isDemo;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [todaySummary, setTodaySummary] = useState<DashboardSummary | null>(null);
  const [todayReservations, setTodayReservations] = useState<ReservationRecord[]>([]);
  const [pendingReservationCount, setPendingReservationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) {
      setSummary(null);
      setTodaySummary(null);
      setTodayReservations([]);
      setPendingReservationCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const periodRange = dateRangePreset(dashboardPeriodToReportPreset(period));
    const todayRange = dateRangePreset("today");
    const [main, today, reservations, pending] = await Promise.allSettled([
      fetchDashboardSummary(period, periodRange),
      fetchDashboardSummary("1D", todayRange),
      reservationsEnabled
        ? fetchReservations({
            dateFrom: todayRange.dateFrom,
            dateTo: todayRange.dateTo,
            limit: 50,
          })
        : Promise.resolve([]),
      reservationsEnabled ? fetchPendingReservationCount() : Promise.resolve(0),
    ]);
    setSummary(main.status === "fulfilled" ? main.value : null);
    setTodaySummary(today.status === "fulfilled" ? today.value : null);
    setTodayReservations(reservations.status === "fulfilled" ? reservations.value ?? [] : []);
    setPendingReservationCount(pending.status === "fulfilled" ? pending.value : 0);
    if (main.status === "rejected" && today.status === "rejected") {
      setError(main.reason instanceof Error ? main.reason.message : "Failed to load dashboard");
    }
    setLoading(false);
  }, [enabled, period, reservationsEnabled]);

  useEffect(() => {
    void load();
  }, [load, branchRevision]);

  return {
    loading,
    error,
    summary,
    todaySummary,
    todayReservations,
    pendingReservationCount,
    reload: load,
  };
}
