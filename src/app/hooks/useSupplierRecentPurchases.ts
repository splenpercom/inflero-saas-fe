import { useCallback, useEffect, useState } from "react";
import { fetchPurchases, type PurchaseListRow } from "../api/purchases";
import { useAuth } from "../context/AuthContext";

export function useSupplierRecentPurchases(supplierId: string, enabled: boolean) {
  const { isDemo, isAuthenticated } = useAuth();
  const [purchases, setPurchases] = useState<PurchaseListRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !supplierId || !(isAuthenticated || isDemo)) {
      setPurchases([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchPurchases({
        supplierId,
        status: "all",
        paymentStatus: "all",
        sortBy: "all",
        page: 1,
        pageSize: 5,
      });
      setPurchases(rows.items ?? []);
    } catch {
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, supplierId]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 200);
    return () => clearTimeout(timer);
  }, [load]);

  return { purchases, loading, reload: load };
}
