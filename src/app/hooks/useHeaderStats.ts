import { useState, useEffect } from "react";
import { fetchDashboardSummary } from "../api/dashboard";
import { useAuth } from "../context/AuthContext";
import { useBranchRevision } from "./useBranchRevision";

const POLL_MS = 60000;

export function useHeaderStats() {
  const { isAuthenticated, isDemo } = useAuth();
  const branchRevision = useBranchRevision();
  const [productCount, setProductCount] = useState(0);
  const [todayOrdersCount, setTodayOrdersCount] = useState(0);

  useEffect(() => {
    if (!(isAuthenticated || isDemo)) {
      setProductCount(0);
      setTodayOrdersCount(0);
      return;
    }

    const load = async () => {
      try {
        const summary = await fetchDashboardSummary("1D");
        const counts = summary.counts;
        setProductCount(typeof counts?.products === "number" ? counts.products : 0);
        setTodayOrdersCount(typeof counts?.posOrders === "number" ? counts.posOrders : 0);
      } catch {
        /* ignore poll errors */
      }
    };

    void load();
    const interval = setInterval(() => void load(), POLL_MS);
    return () => clearInterval(interval);
  }, [isDemo, isAuthenticated, branchRevision]);

  return { productCount, todayOrdersCount };
}
