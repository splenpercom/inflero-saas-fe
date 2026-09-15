import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { ModuleRouteGuard } from "../modules/ModuleRouteGuard";

/**
 * Branches management is owner-only and only while Superadmin (all-branches) mode is selected.
 */
export function OwnerBranchesRouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isGlobalMode, ready } = useBranch();

  if (isLoading || !ready) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#14b8a6] border-t-transparent" />
      </div>
    );
  }

  if (!user?.isTenantOwner || !isGlobalMode) {
    return <Navigate to="/dashboard" replace />;
  }

  return <ModuleRouteGuard module="BRANCH_MANAGEMENT">{children}</ModuleRouteGuard>;
}
