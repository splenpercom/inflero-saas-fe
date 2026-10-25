import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../app/context/AuthContext";

function isHotelsBlockedPath(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (path.startsWith("/dashboard/inventory")) return true;
  if (path.startsWith("/dashboard/sales")) return true;
  if (path.startsWith("/dashboard/purchases")) return true;
  if (path.startsWith("/dashboard/stock")) return true;
  return false;
}

/**
 * When HOTELS is on, deep links to ERP inventory/sales/purchases/stock redirect to hotel reservations.
 * Dashboard/reports stay routable and render Coming Soon at the page level.
 */
export function HotelsErpBlock({ children }: { children: ReactNode }) {
  const { hasModule, modulesLoaded, isDemo } = useAuth();
  const { pathname } = useLocation();

  if (!modulesLoaded && !isDemo) return <>{children}</>;
  if (isDemo || !hasModule("HOTELS")) return <>{children}</>;
  if (isHotelsBlockedPath(pathname)) {
    return <Navigate to="/dashboard/hotel/reservations" replace />;
  }
  return <>{children}</>;
}
