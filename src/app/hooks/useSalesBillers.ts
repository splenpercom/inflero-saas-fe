import { useEffect, useState } from "react";
import { fetchSalesBillers, type SalesBillerRow } from "../api/sales";
import { useAuth } from "../context/AuthContext";
import { pickDefaultBillerId } from "../lib/salesBiller";

export function useSalesBillers(enabled: boolean) {
  const { user, isDemo, isAuthenticated } = useAuth();
  const [billers, setBillers] = useState<SalesBillerRow[]>([]);
  const [defaultBillerId, setDefaultBillerId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setBillers([]);
      setDefaultBillerId("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchSalesBillers()
      .then((rows) => {
        if (cancelled) return;
        setBillers(rows);
        setDefaultBillerId(pickDefaultBillerId(rows, user));
      })
      .catch(() => {
        if (cancelled) return;
        setBillers([]);
        setDefaultBillerId("");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, isAuthenticated, isDemo, user]);

  return { billers, defaultBillerId, loading };
}
