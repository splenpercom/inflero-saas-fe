import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import type { TenantRbacModule } from "../lib/rbacModules";

export function useModulePermissions(module: TenantRbacModule) {
  const { hasPermission } = useAuth();

  return useMemo(
    () => ({
      canView: hasPermission(module, "view"),
      canCreate: hasPermission(module, "create"),
      canEdit: hasPermission(module, "edit"),
      canDelete: hasPermission(module, "delete"),
    }),
    [hasPermission, module],
  );
}
