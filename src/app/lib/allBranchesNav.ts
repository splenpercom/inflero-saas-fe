import type { TenantRbacModule } from "./rbacModules";

/** Dashboard home paths allowed in tenant-owner all-branches mode. */
const DASHBOARD_HOME_PATHS = new Set(["/dashboard", "/dashboard/home", "/dashboard/new-dashboard"]);

/** Paths always reachable regardless of branch scope (e.g. profile). */
const ALWAYS_ALLOWED_PREFIXES = ["/dashboard/profile"];

export interface AllBranchesNavEntry {
  labelKey: string;
  path: string;
  permissionModule: TenantRbacModule;
}

/** Top-level sidebar entries for tenant owners in all-branches (global) mode. */
export const ALL_BRANCHES_NAV_ENTRIES: AllBranchesNavEntry[] = [
  { labelKey: "dashboard", path: "/dashboard", permissionModule: "Dashboard" },
  { labelKey: "userManagement", path: "/dashboard/user-management", permissionModule: "User Management" },
  { labelKey: "warehouses", path: "/dashboard/people/warehouses", permissionModule: "People" },
  { labelKey: "plugins", path: "/dashboard/plugins", permissionModule: "Settings" },
  { labelKey: "settings", path: "/dashboard/settings", permissionModule: "Settings" },
];

export function normalizeDashboardPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/dashboard";
}

export function isAllBranchesAllowedPath(pathname: string): boolean {
  const path = normalizeDashboardPath(pathname);

  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return true;
  }

  if (DASHBOARD_HOME_PATHS.has(path)) {
    return true;
  }

  if (path.startsWith("/dashboard/user-management")) {
    return true;
  }

  if (path === "/dashboard/people/warehouses" || path.startsWith("/dashboard/people/warehouses/")) {
    return true;
  }

  if (path.startsWith("/dashboard/settings")) {
    return true;
  }

  if (path.startsWith("/dashboard/plugins")) {
    return true;
  }

  if (path.startsWith("/dashboard/my-website")) {
    return true;
  }

  return false;
}
