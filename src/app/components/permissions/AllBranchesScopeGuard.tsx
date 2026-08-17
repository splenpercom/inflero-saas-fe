import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { isAllBranchesAllowedPath } from "../../lib/allBranchesNav";

export function AllBranchesScopeGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, isLoading } = useAuth();
  const { isGlobalMode, ready } = useBranch();

  if (!isLoading && ready && user?.isTenantOwner && isGlobalMode && !isAllBranchesAllowedPath(location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
