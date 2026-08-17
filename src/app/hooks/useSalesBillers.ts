import { useEffect, useState } from "react";
import { fetchSalesBillers, type SalesBillerRow } from "../api/sales";
import { useAuth } from "../context/AuthContext";
import { pickDefaultBillerId } from "../lib/salesBiller";

export function useSalesBillers(enabled: boolean) {
  const { user, isDemo, isAuthenticated } = useAuth();
  const [billers, setBillers] = useState<SalesBillerRow[]>([]);
  const [defaultBillerId, setDefaultBillerId] = useState("");
  const [loading, setLoading] = useState(false);
  const userId = user?.id ?? null;
  const userEmail = user?.email ?? null;

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
    // Key off stable identity fields — a fresh /auth/me object must not refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- user is read for default pick only
  }, [enabled, isAuthenticated, isDemo, userId, userEmail]);

  return { billers, defaultBillerId, loading };
}
