import type { Language } from "../i18n/translations";
import type { RolePermission } from "./rolePermissions";
import { formatDate } from "./dateFormat";

export type UiUserStatus = "Active" | "Inactive";

export function userStatusToUi(status: string): UiUserStatus {
  return status === "ACTIVE" || status === "Active" ? "Active" : "Inactive";
}

export function uiUserStatusToApi(status: UiUserStatus): "ACTIVE" | "INACTIVE" {
  return status === "Active" ? "ACTIVE" : "INACTIVE";
}

function formatDisplayDate(iso: string | null | undefined, language?: Language): string {
  if (!iso) return "—";
  return formatDate(iso, language);
}

function userDisplayName(firstName: string | null, lastName: string | null, email: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || email;
}

function userInitials(firstName: string | null, lastName: string | null, email: string): string {
  const f = firstName?.[0] ?? "";
  const l = lastName?.[0] ?? "";
  const initials = (f + l).toUpperCase();
  return initials || email[0]?.toUpperCase() || "?";
}

export interface RawTenantUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  employeeId: string | null;
  status: string;
  team: string | null;
  department: string | null;
  departmentId: string | null;
  departmentDept?: { id: string; name: string } | null;
  dateOfJoin: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  shift: string | null;
  bloodGroup: string | null;
  about: string | null;
  bankName: string | null;
  accountNo: string | null;
  ifsc: string | null;
  isTenantOwner?: boolean;
  storeId: string | null;
  store: { id: string; name: string; code: string } | null;
  branchesAsManager?: { id: string; name: string; code: string }[];
  role: { id: string; name: string } | null;
}

export interface TenantUserRow {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  avatar: string;
  phone: string;
  roleId: string;
  role: string;
  status: UiUserStatus;
  team: string;
  dateOfJoin: string;
  dateOfJoinIso: string;
  birthday: string;
  dateOfBirthIso: string;
  branch: string;
  storeId: string | null;
  isTenantOwner: boolean;
  about: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
  employeeId: string;
  address: string;
  shift: string;
  bloodGroup: string;
  gender: string;
}

export interface RawTenantRole {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  permissions: RolePermission[];
}

export interface TenantRoleRow {
  id: string;
  name: string;
  createdDate: string;
  status: UiUserStatus;
  permissions: RolePermission[];
}

function toIsoDateOnly(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function mapTenantUser(raw: RawTenantUser, language?: Language): TenantUserRow {
  return {
    id: raw.id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    name: userDisplayName(raw.firstName, raw.lastName, raw.email),
    avatar: userInitials(raw.firstName, raw.lastName, raw.email),
    phone: raw.phone ?? "—",
    roleId: raw.role?.id ?? "",
    role: raw.role?.name ?? "—",
    status: userStatusToUi(raw.status),
    team: raw.team ?? "—",
    dateOfJoin: formatDisplayDate(raw.dateOfJoin, language),
    dateOfJoinIso: toIsoDateOnly(raw.dateOfJoin),
    birthday: formatDisplayDate(raw.dateOfBirth, language),
    dateOfBirthIso: toIsoDateOnly(raw.dateOfBirth),
    branch: raw.store?.name ?? "—",
    storeId: raw.storeId,
    isTenantOwner: raw.isTenantOwner === true,
    about: raw.about ?? "",
    bankName: raw.bankName ?? "",
    accountNo: raw.accountNo ?? "",
    ifsc: raw.ifsc ?? "",
    employeeId: raw.employeeId ?? "",
    address: raw.address ?? "",
    shift: raw.shift ?? "",
    bloodGroup: raw.bloodGroup ?? "",
    gender: raw.gender ?? "",
  };
}

export function mapTenantRole(raw: RawTenantRole, language?: Language): TenantRoleRow {
  return {
    id: raw.id,
    name: raw.name,
    createdDate: formatDisplayDate(raw.createdAt, language),
    status: userStatusToUi(raw.status),
    permissions: raw.permissions,
  };
}
