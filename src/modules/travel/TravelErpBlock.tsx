import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../app/context/AuthContext";

const TRAVEL_BLOCKED_EXACT = new Set([
  "/dashboard/finances/income",
  "/dashboard/people/suppliers",
]);

function isTravelBlockedPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (path.startsWith("/dashboard/inventory")) return true;
  if (path.startsWith("/dashboard/sales")) return true;
  // ERP Reports only — keep /dashboard/travel-reports reachable.
  if (path === "/dashboard/reports" || path.startsWith("/dashboard/reports/")) return true;
  if (TRAVEL_BLOCKED_EXACT.has(path)) return true;
  return false;
}

/**
 * When TRAVEL is on, deep links to hidden ERP surfaces redirect to travel-reports.
 * Does not wrap children when TRAVEL is off (zero impact on existing tenants).
 */
export function TravelErpBlock({ children }: { children: ReactNode }) {
  const { hasModule, modulesLoaded, isDemo } = useAuth();
  const { pathname } = useLocation();

  if (!modulesLoaded && !isDemo) return <>{children}</>;
  // Demo treats all modules as on — never block ERP deep links there.
  if (isDemo || !hasModule("TRAVEL")) return <>{children}</>;
  if (isTravelBlockedPath(pathname)) {
    return <Navigate to="/dashboard/travel-reports" replace />;
  }
  return <>{children}</>;
}
