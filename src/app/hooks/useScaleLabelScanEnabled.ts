import { useEffect, useState } from "react";
import { fetchTenantSettings } from "../api/tenantSettings";
import { useBranchRevision } from "./useBranchRevision";

/**
 * True when Settings → Add-ons → Rongta weighing scale (POS labels) is ON
 * for the active branch (falls back to tenant defaults).
 */
export function useScaleLabelScanEnabled(): boolean {
  const branchRevision = useBranchRevision();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchTenantSettings()
      .then((s) => {
        if (!cancelled) setEnabled(s.scaleLabelScanEnabled === true);
      })
      .catch(() => {
        if (!cancelled) setEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [branchRevision]);

  return enabled;
}
