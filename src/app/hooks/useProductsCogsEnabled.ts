import { useEffect, useState } from "react";
import { fetchTenantSettings } from "../api/tenantSettings";
import { useBranchRevision } from "./useBranchRevision";

/** True when Cost (COGS) should appear in the products UI (default on). */
export function useProductsCogsEnabled(): boolean {
  const branchRevision = useBranchRevision();
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetchTenantSettings()
      .then((s) => {
        if (!cancelled) setEnabled(s.productsCogsEnabled !== false);
      })
      .catch(() => {
        if (!cancelled) setEnabled(true);
      });
    return () => {
      cancelled = true;
    };
  }, [branchRevision]);

  return enabled;
}
