import { type TenantRbacModule } from "./rbacModules";

export type { TenantRbacModule } from "./rbacModules";
export type PermissionAction = "view" | "create" | "edit" | "delete";

export interface RoutePermission {
  module: TenantRbacModule;
  action: PermissionAction;
}

/** Explicit route rules — longest / most specific matches are listed first. */
const ROUTE_RULES: { test: (path: string) => boolean; module: TenantRbacModule; action: PermissionAction }[] = [
  { test: (p) => p === "/dashboard/inventory/products/create", module: "Inventory", action: "create" },
  { test: (p) => /\/dashboard\/inventory\/products\/[^/]+\/edit$/.test(p), module: "Inventory", action: "edit" },
  { test: (p) => p.startsWith("/dashboard/user-management"), module: "User Management", action: "view" },
  { test: (p) => p.startsWith("/dashboard/inventory"), module: "Inventory", action: "view" },
  { test: (p) => p.startsWith("/dashboard/stock"), module: "Stock", action: "view" },
  { test: (p) => p.startsWith("/dashboard/sales"), module: "Sales", action: "view" },
  { test: (p) => p.startsWith("/dashboard/purchases"), module: "Purchases", action: "view" },
  { test: (p) => p.startsWith("/dashboard/finances"), module: "Finances", action: "view" },
  { test: (p) => p.startsWith("/dashboard/people"), module: "People", action: "view" },
  { test: (p) => p.startsWith("/dashboard/reports"), module: "Reports", action: "view" },
  { test: (p) => p.startsWith("/dashboard/reservations"), module: "Reservations", action: "view" },
  { test: (p) => p.startsWith("/dashboard/my-website"), module: "My Website", action: "view" },
  { test: (p) => p.startsWith("/dashboard/settings"), module: "Settings", action: "view" },
  { test: (p) => p === "/dashboard/orders", module: "Sales", action: "view" },
  {
    test: (p) =>
      p === "/dashboard" ||
      p === "/dashboard/home" ||
      p === "/dashboard/new-dashboard",
    module: "Dashboard",
    action: "view",
  },
];

const ALWAYS_ALLOWED_PREFIXES = ["/dashboard/profile"];

export function resolveRoutePermission(pathname: string): RoutePermission | null {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
    return null;
  }
  for (const rule of ROUTE_RULES) {
    if (rule.test(path)) {
      return { module: rule.module, action: rule.action };
    }
  }
  return null;
}

export function getNavPermission(
  path: string | undefined,
  parentModule: TenantRbacModule,
  overrides?: { permissionModule?: TenantRbacModule; permissionAction?: PermissionAction },
): RoutePermission | null {
  if (!path) return { module: parentModule, action: "view" };
  if (overrides?.permissionModule || overrides?.permissionAction) {
    return {
      module: overrides.permissionModule ?? parentModule,
      action: overrides.permissionAction ?? "view",
    };
  }
  if (path === "/dashboard/inventory/products/create") {
    return { module: "Inventory", action: "create" };
  }
  if (path.startsWith("/dashboard/user-management")) {
    return { module: "User Management", action: "view" };
  }
  return { module: parentModule, action: "view" };
}
