import type { TenantModuleKey } from "../api/auth";
import { TENANT_RBAC_MODULES } from "./rbacModules";

export interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  /** Extra action — e.g. Orders: manage payments on POS Orders. */
  manage: boolean;
}

/** Modules that use the Manage flag (order payment actions). Others ignore it. */
export const RBAC_MANAGE_MODULES = ["Orders"] as const;

export function moduleSupportsManage(module: string): boolean {
  return (RBAC_MANAGE_MODULES as readonly string[]).includes(module);
}

/** RBAC rows annotated as unavailable when the matching tenant module is off. */
const RBAC_MODULE_TENANT_GATE: Partial<Record<(typeof TENANT_RBAC_MODULES)[number], TenantModuleKey>> = {
  Stock: "STOCK",
  Reservations: "RESERVATIONS",
  Menu: "DINING",
  Tables: "DINING",
  Bookings: "DINING",
  POS: "POS",
  Loyalty: "LOYALTY",
  "My Website": "WEB_EDITOR",
  Offers: "TRAVEL",
};

export function isRbacModuleVisible(
  module: string,
  hasModule: (key: TenantModuleKey) => boolean,
): boolean {
  const gate = RBAC_MODULE_TENANT_GATE[module as keyof typeof RBAC_MODULE_TENANT_GATE];
  if (!gate) return true;
  return hasModule(gate);
}

export function defaultPermissionMatrix(
  _hasModule?: (key: TenantModuleKey) => boolean,
): RolePermission[] {
  return TENANT_RBAC_MODULES.map((module) => ({
    module,
    view: false,
    create: false,
    edit: false,
    delete: false,
    manage: false,
  }));
}

export function mergeApiPermissions(
  apiPerms: RolePermission[],
  _hasModule?: (key: TenantModuleKey) => boolean,
): RolePermission[] {
  const byModule = new Map(apiPerms.map((p) => [p.module, p]));
  return TENANT_RBAC_MODULES.map((module) => {
    const existing = byModule.get(module);
    return existing
      ? {
          module,
          view: existing.view,
          create: existing.create,
          edit: existing.edit,
          delete: existing.delete,
          manage: existing.manage ?? false,
        }
      : { module, view: false, create: false, edit: false, delete: false, manage: false };
  });
}

export function toApiPermissions(formRows: RolePermission[]): RolePermission[] {
  const canonical = new Set<string>(TENANT_RBAC_MODULES);
  return formRows
    .filter((p) => canonical.has(p.module))
    .map((p) => ({
      module: p.module,
      view: p.view,
      create: p.create,
      edit: p.edit,
      delete: p.delete,
      manage: moduleSupportsManage(p.module) ? (p.manage ?? false) : false,
    }));
}

/**
 * When editing a role, keep existing grants for modules currently hidden by
 * tenant entitlements so re-enabling a module does not wipe those permissions.
 */
export function toApiPermissionsPreservingHidden(
  formRows: RolePermission[],
  existing: RolePermission[] | null | undefined,
  hasModule: (key: TenantModuleKey) => boolean,
): RolePermission[] {
  const visible = toApiPermissions(formRows);
  const preserved = (existing ?? []).filter(
    (p) =>
      TENANT_RBAC_MODULES.includes(p.module as (typeof TENANT_RBAC_MODULES)[number]) &&
      !isRbacModuleVisible(p.module, hasModule),
  );
  const byModule = new Map<string, RolePermission>();
  for (const row of [...preserved, ...visible]) {
    byModule.set(row.module, {
      module: row.module,
      view: row.view,
      create: row.create,
      edit: row.edit,
      delete: row.delete,
      manage: row.manage ?? false,
    });
  }
  return TENANT_RBAC_MODULES.filter((module) => byModule.has(module)).map(
    (module) => byModule.get(module)!,
  );
}
