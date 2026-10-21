/** Canonical module keys for corporate RBAC — mirrors backend TENANT_RBAC_MODULES. */
export const TENANT_RBAC_MODULES = [
  "Dashboard",
  "Products",
  "Categories",
  "Sub Categories",
  "Brands",
  "Units",
  "Stock",
  "Orders",
  "Sales Returns",
  "POS",
  "Purchases",
  "Expenses",
  "Income",
  "Payments",
  "Customers",
  "Reservations",
  "Reports",
  "User Management",
  "Menu",
  "Tables",
  "Bookings",
  "Loyalty",
  "Settings",
  "My Website",
  "Tasks",
  "Offers",
] as const;

export type TenantRbacModule = (typeof TENANT_RBAC_MODULES)[number];

/** Inventory section children (sidebar parent OR-any-child). */
export const RBAC_INVENTORY_CHILDREN = [
  "Products",
  "Categories",
  "Sub Categories",
  "Brands",
  "Units",
] as const satisfies ReadonlyArray<TenantRbacModule>;

/** Sales section children. */
export const RBAC_SALES_CHILDREN = ["Orders", "Sales Returns", "POS"] as const satisfies ReadonlyArray<TenantRbacModule>;

/** Finance section children. */
export const RBAC_FINANCE_CHILDREN = ["Expenses", "Income", "Payments"] as const satisfies ReadonlyArray<TenantRbacModule>;

/** Dining section children. */
export const RBAC_DINING_CHILDREN = ["Menu", "Tables", "Bookings"] as const satisfies ReadonlyArray<TenantRbacModule>;

/** True if any listed module grants the action. */
export function hasAnyRbacPermission(
  hasPermission: (module: string, action?: "view" | "create" | "edit" | "delete" | "manage") => boolean,
  modules: readonly string[],
  action: "view" | "create" | "edit" | "delete" | "manage" = "view",
): boolean {
  return modules.some((m) => hasPermission(m, action));
}
