import { useCallback, useEffect, useState } from "react";
import {
  fetchExpenseCategories,
  fetchIncomeCategories,
  type FinanceCategory,
} from "../api/finance";
import { useAuth } from "../context/AuthContext";

export function useExpenseCategories(enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setCategories([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchExpenseCategories();
      setCategories(rows);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  return { categories, loading, reload: load };
}

export function useIncomeCategories(enabled = true) {
  const { isDemo, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled || !(isAuthenticated || isDemo)) {
      setCategories([]);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchIncomeCategories();
      setCategories(rows);
    } catch {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, isDemo, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  return { categories, loading, reload: load };
}
