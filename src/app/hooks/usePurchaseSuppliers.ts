import { useCallback, useEffect, useState } from "react";
import { fetchSuppliers, type PeopleSupplier } from "../api/people";
import { useAuth } from "../context/AuthContext";

export function usePurchaseSuppliers(search: string, enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [suppliers, setSuppliers] = useState<PeopleSupplier[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setSuppliers([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchSuppliers({ search: search.trim() || undefined, status: "active" });
      setSuppliers(rows.slice(0, 30));
    } catch {
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { suppliers, loading, reload: load };
}
