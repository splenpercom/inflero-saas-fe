import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { resolveRoutePermission } from "../../lib/permissions";
import { NoAccessPanel } from "./NoAccessPanel";

export function DashboardPermissionGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-[#0026f6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rule = resolveRoutePermission(location.pathname);
  if (rule && !hasPermission(rule.module, rule.action)) {
    return <NoAccessPanel />;
  }

  return <>{children}</>;
}
