import { useCallback, useEffect, useState } from "react";
import { fetchDashboardSummary, type DashboardPeriod, type DashboardSummary } from "../api/dashboard";
import { fetchPendingReservationCount, fetchReservations } from "../api/reservations";
import type { ReservationRecord } from "../api/reservations";
import { todayRangeIso } from "../lib/dashboardMappers";
import { useAuth } from "../context/AuthContext";
import { useBranchRevision } from "./useBranchRevision";

export function useDashboardData(period: DashboardPeriod) {
  const { isAuthenticated, isDemo } = useAuth();
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
    try {
      const { dateFrom, dateTo } = todayRangeIso();
      const [main, today, reservations, pending] = await Promise.all([
        fetchDashboardSummary(period),
        fetchDashboardSummary("1D"),
        fetchReservations({ dateFrom, dateTo, limit: 50 }),
        fetchPendingReservationCount(),
      ]);
      setSummary(main);
      setTodaySummary(today);
      setTodayReservations(reservations ?? []);
      setPendingReservationCount(pending);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [enabled, period]);

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
