import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchBranchSwitcherStores, type BranchSwitcherStore } from "../api/stores";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";

export function useStockLocations() {
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isBranchLocked, isGlobalMode, hasBranches } = useBranch();
  const [branches, setBranches] = useState<BranchSwitcherStore[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setBranches([]);
      return;
    }
    setLoading(true);
    try {
      const brRows = await fetchBranchSwitcherStores();
      setBranches(brRows);
    } catch {
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const effectiveStoreId = useMemo(() => {
    if (isBranchLocked && branchId) return branchId;
    if (!isGlobalMode && branchId) return branchId;
    return null;
  }, [isBranchLocked, branchId, isGlobalMode]);

  const branchSelected = !!effectiveStoreId;

  return {
    branches,
    loading,
    effectiveStoreId,
    branchSelected,
    isBranchLocked,
    isGlobalMode,
    hasBranches,
    refresh: load,
  };
}
