import { TENANT_RBAC_MODULES } from "./rbacModules";

export interface RolePermission {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export function defaultPermissionMatrix(): RolePermission[] {
  return TENANT_RBAC_MODULES.map((module) => ({
    module,
    view: false,
    create: false,
    edit: false,
    delete: false,
  }));
}

export function mergeApiPermissions(apiPerms: RolePermission[]): RolePermission[] {
  const byModule = new Map(apiPerms.map((p) => [p.module, p]));
  return TENANT_RBAC_MODULES.map((module) => {
    const existing = byModule.get(module);
    return existing
      ? { module, view: existing.view, create: existing.create, edit: existing.edit, delete: existing.delete }
      : { module, view: false, create: false, edit: false, delete: false };
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
    }));
}
