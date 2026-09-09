import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import {
  mapTenantRole,
  mapTenantUser,
  type RawTenantRole,
  type RawTenantUser,
  type TenantRoleRow,
  type TenantUserRow,
  uiUserStatusToApi,
  type UiUserStatus,
} from "../lib/userManagementMappers";
import type { RolePermission } from "../lib/rolePermissions";

export type { RolePermission, TenantRoleRow, TenantUserRow, UiUserStatus };

export async function fetchTenantUsers(): Promise<TenantUserRow[]> {
  const res = await apiGet<{ success: boolean; data: RawTenantUser[] }>("/tenant/users");
  return res.data.map(mapTenantUser);
}

export async function createTenantUser(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  roleId: string;
  storeId?: string | null;
  team?: string | null;
  dateOfJoin?: string | null;
  dateOfBirth?: string | null;
}) {
  const res = await apiPost<{ success: boolean; data: RawTenantUser }>("/tenant/users", body);
  return mapTenantUser(res.data);
}

export async function updateTenantUser(
  id: string,
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    roleId?: string;
    storeId?: string | null;
    status?: UiUserStatus;
    team?: string | null;
    dateOfJoin?: string | null;
    dateOfBirth?: string | null;
    newPassword?: string | null;
  },
) {
  const payload: Record<string, unknown> = { ...body };
  if (body.status !== undefined) {
    payload.status = uiUserStatusToApi(body.status);
  }
  const res = await apiPatch<{ success: boolean; data: RawTenantUser }>(
    `/tenant/users/${id}`,
    payload,
  );
  return mapTenantUser(res.data);
}

export async function deleteTenantUser(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/users/${id}`);
}

export type UserCommissionRecord = {
  posOrderId: string;
  reference: string;
  date: string;
  customerName: string | null;
  grandTotal: string;
  commissionEnabled: boolean;
  commissionType: "FIXED" | "PERCENT" | null;
  commissionValue: string | null;
  commissionAmount: string | null;
};

export type UserCommissionDetail = {
  hasCommission: boolean;
  employeeCommissionEnabled: boolean;
  biller: {
    id: string;
    code: string;
    name: string;
    commissionType: "FIXED" | "PERCENT" | null;
    commissionValue: string | null;
  } | null;
  totals: {
    saleCount: number;
    totalCommission: string;
    totalSales: string;
  };
  records: UserCommissionRecord[];
};

export async function fetchTenantUserCommission(userId: string): Promise<UserCommissionDetail> {
  const res = await apiGet<{ success: boolean; data: UserCommissionDetail }>(
    `/tenant/users/${userId}/commission`,
  );
  return res.data;
}

export async function fetchTenantRoles(): Promise<TenantRoleRow[]> {
  const res = await apiGet<{ success: boolean; data: RawTenantRole[] }>("/tenant/roles");
  return res.data.map(mapTenantRole);
}

export async function createTenantRole(body: { name: string; permissions: RolePermission[] }) {
  const res = await apiPost<{ success: boolean; data: RawTenantRole }>("/tenant/roles", body);
  return mapTenantRole(res.data);
}

export async function updateTenantRole(
  id: string,
  body: { name?: string; permissions?: RolePermission[] },
) {
  const res = await apiPatch<{ success: boolean; data: RawTenantRole }>(
    `/tenant/roles/${id}`,
    body,
  );
  return mapTenantRole(res.data);
}

export async function deleteTenantRole(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/roles/${id}`);
}
