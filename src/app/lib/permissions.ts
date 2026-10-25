import {
  type TenantRbacModule,
  RBAC_DINING_CHILDREN,
  RBAC_FINANCE_CHILDREN,
  RBAC_INVENTORY_CHILDREN,
  RBAC_SALES_CHILDREN,
} from "./rbacModules";

export type { TenantRbacModule } from "./rbacModules";
export type PermissionAction = "view" | "create" | "edit" | "delete";

export interface RoutePermission {
  module: TenantRbacModule;
  action: PermissionAction;
}

type PrefixRule = {
  /** Path prefix; matches exact path or prefix + "/" (never bare string prefix). */
  prefix: string;
  module: TenantRbacModule;
  action: PermissionAction;
};

/**
 * Boundary-safe match: `/dashboard/sales/pos` matches itself and `/dashboard/sales/pos/...`
 * but NOT `/dashboard/sales/pos-orders`.
 */
export function matchesPathPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/**
 * Prefix rules are sorted longest-first at module load so order in this list
 * cannot cause shadowing bugs (e.g. `pos` vs `pos-orders`).
 */
const PREFIX_RULES: PrefixRule[] = (
  [
    { prefix: "/dashboard/inventory/products", module: "Products", action: "view" },
    { prefix: "/dashboard/inventory/services", module: "Products", action: "view" },
    { prefix: "/dashboard/inventory/category", module: "Categories", action: "view" },
    { prefix: "/dashboard/inventory/sub-category", module: "Sub Categories", action: "view" },
    { prefix: "/dashboard/inventory/brands", module: "Brands", action: "view" },
    { prefix: "/dashboard/inventory/units", module: "Units", action: "view" },
    { prefix: "/dashboard/inventory/variant-attributes", module: "Products", action: "view" },
    { prefix: "/dashboard/inventory/warranties", module: "Products", action: "view" },
    { prefix: "/dashboard/inventory", module: "Products", action: "view" },
    { prefix: "/dashboard/stock", module: "Stock", action: "view" },
    { prefix: "/dashboard/sales/pos-orders", module: "Orders", action: "view" },
    { prefix: "/dashboard/sales/pos", module: "POS", action: "view" },
    { prefix: "/dashboard/sales/return", module: "Sales Returns", action: "view" },
    { prefix: "/dashboard/sales/invoices", module: "Orders", action: "view" },
    { prefix: "/dashboard/sales", module: "Orders", action: "view" },
    { prefix: "/dashboard/orders", module: "Orders", action: "view" },
    { prefix: "/dashboard/purchases", module: "Purchases", action: "view" },
    { prefix: "/dashboard/finances/expenses", module: "Expenses", action: "view" },
    { prefix: "/dashboard/finances/income", module: "Income", action: "view" },
    { prefix: "/dashboard/finances/payments", module: "Payments", action: "view" },
    { prefix: "/dashboard/finances", module: "Expenses", action: "view" },
    { prefix: "/dashboard/people/customers", module: "Customers", action: "view" },
    { prefix: "/dashboard/people/suppliers", module: "Purchases", action: "view" },
    { prefix: "/dashboard/people/warehouses", module: "Stock", action: "view" },
    { prefix: "/dashboard/people", module: "Customers", action: "view" },
    { prefix: "/dashboard/user-management", module: "User Management", action: "view" },
    { prefix: "/dashboard/reports", module: "Reports", action: "view" },
    { prefix: "/dashboard/tasks", module: "Tasks", action: "view" },
    { prefix: "/dashboard/offers", module: "Offers", action: "view" },
    { prefix: "/dashboard/travel-reports", module: "Travel Reports", action: "view" },
    { prefix: "/dashboard/commissions", module: "Commissions", action: "view" },
    { prefix: "/dashboard/invoices-travel", module: "Travel Invoices", action: "view" },
    { prefix: "/dashboard/travel-calendar", module: "Travel Calendar", action: "view" },
    { prefix: "/dashboard/reservations", module: "Reservations", action: "view" },
    { prefix: "/dashboard/restaurant/menu", module: "Menu", action: "view" },
    { prefix: "/dashboard/restaurant/tables", module: "Tables", action: "view" },
    { prefix: "/dashboard/restaurant/bookings", module: "Bookings", action: "view" },
    { prefix: "/dashboard/restaurant/kot", module: "Menu", action: "view" },
    { prefix: "/dashboard/restaurant", module: "Menu", action: "view" },
    { prefix: "/dashboard/hotel/rooms", module: "Hotel Rooms", action: "view" },
    { prefix: "/dashboard/hotel/reservations", module: "Hotel Reservations", action: "view" },
    { prefix: "/dashboard/loyalty", module: "Loyalty", action: "view" },
    { prefix: "/dashboard/my-website", module: "My Website", action: "view" },
    { prefix: "/dashboard/settings", module: "Settings", action: "view" },
  ] satisfies PrefixRule[]
).slice().sort((a, b) => b.prefix.length - a.prefix.length);

const ALWAYS_ALLOWED_PREFIXES = ["/dashboard/profile"];

const DASHBOARD_HOME = new Set(["/dashboard", "/dashboard/home", "/dashboard/new-dashboard"]);

export function resolveRoutePermission(pathname: string): RoutePermission | null {
  const path = pathname.replace(/\/+$/, "") || "/dashboard";
  if (ALWAYS_ALLOWED_PREFIXES.some((prefix) => matchesPathPrefix(path, prefix))) {
    return null;
  }

  // Action-specific product routes (more specific than Products view).
  if (path === "/dashboard/inventory/products/create") {
    return { module: "Products", action: "create" };
  }
  if (/^\/dashboard\/inventory\/products\/[^/]+\/edit$/.test(path)) {
    return { module: "Products", action: "edit" };
  }

  if (DASHBOARD_HOME.has(path)) {
    return { module: "Dashboard", action: "view" };
  }

  for (const rule of PREFIX_RULES) {
    if (matchesPathPrefix(path, rule.prefix)) {
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
  // Strip query for path-based checks (sidebar POS uses ?fresh=1).
  const bare = path.split("?")[0] ?? path;
  if (overrides?.permissionModule || overrides?.permissionAction) {
    return {
      module: overrides.permissionModule ?? parentModule,
      action: overrides.permissionAction ?? "view",
    };
  }
  if (bare === "/dashboard/inventory/products/create") {
    return { module: "Products", action: "create" };
  }
  if (matchesPathPrefix(bare, "/dashboard/user-management")) {
    return { module: "User Management", action: "view" };
  }
  return { module: parentModule, action: "view" };
}

export {
  RBAC_DINING_CHILDREN,
  RBAC_FINANCE_CHILDREN,
  RBAC_INVENTORY_CHILDREN,
  RBAC_SALES_CHILDREN,
};
