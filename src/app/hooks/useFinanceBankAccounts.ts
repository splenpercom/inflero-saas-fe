import { useCallback, useEffect, useState } from "react";
import { fetchBankAccounts, type BankAccountRow } from "../api/finance";
import { useAuth } from "../context/AuthContext";

export function useFinanceBankAccounts(activeOnly = false, enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [accounts, setAccounts] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setAccounts([]);
      return;
    }
    setLoading(true);
    try {
      const result = await fetchBankAccounts({ pageSize: 200, status: activeOnly ? "active" : undefined });
      setAccounts(Array.isArray(result.items) ? result.items : []);
    } catch {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated, activeOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  return { accounts, loading, reload: load };
}
