import { useCallback, useEffect, useState } from "react";
import { fetchCustomers, type PeopleCustomer } from "../api/people";
import { useAuth } from "../context/AuthContext";

export function useSalesCustomers(search: string, enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchCustomers({ search: search.trim() || undefined, status: "active" });
      setCustomers(rows.slice(0, 30));
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, search]);

  useEffect(() => {
    const timer = setTimeout(() => void load(), 300);
    return () => clearTimeout(timer);
  }, [load]);

  return { customers, loading };
}
