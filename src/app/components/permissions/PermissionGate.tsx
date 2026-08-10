import type { ReactNode } from "react";
import { useAuth } from "../../context/AuthContext";
import type { PermissionAction, TenantRbacModule } from "../../lib/permissions";

interface PermissionGateProps {
  module: TenantRbacModule;
  action?: PermissionAction;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGate({
  module,
  action = "view",
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission } = useAuth();
  if (!hasPermission(module, action)) return <>{fallback}</>;
  return <>{children}</>;
}
