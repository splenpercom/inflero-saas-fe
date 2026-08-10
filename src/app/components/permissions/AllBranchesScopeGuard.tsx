import { useEffect, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { isAllBranchesAllowedPath } from "../../lib/allBranchesNav";

export function AllBranchesScopeGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { isGlobalMode } = useBranch();

  useEffect(() => {
    if (isLoading || !user?.isTenantOwner || !isGlobalMode) return;
    if (!isAllBranchesAllowedPath(location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [isLoading, user?.isTenantOwner, isGlobalMode, location.pathname, navigate]);

  return <>{children}</>;
}
