/** Canonical module keys for corporate RBAC — mirrors backend TENANT_RBAC_MODULES. */
export const TENANT_RBAC_MODULES = [
  "Dashboard",
  "Inventory",
  "Stock",
  "Sales",
  "Purchases",
  "Finances",
  "People",
  "Reservations",
  "Reports",
  "User Management",
  "Settings",
  "My Website",
] as const;

export type TenantRbacModule = (typeof TENANT_RBAC_MODULES)[number];
