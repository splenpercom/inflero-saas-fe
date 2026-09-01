import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { generalStatusToUi, uiStatusToGeneral, type UiPeopleStatus } from "../lib/peopleMappers";

export interface BranchQuota {
  used: number;
  maxBranches: number | null;
  canAdd: boolean;
}

export interface StoreManagerCandidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roleName: string;
}

export interface BranchSwitcherStore {
  id: string;
  code: string;
  name: string;
  address: string | null;
}

export interface StoreRecord {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: UiPeopleStatus;
  branchManagerId: string | null;
  branchManager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

type RawStore = Omit<StoreRecord, "status"> & { status: string };

function mapStore(row: RawStore): StoreRecord {
  return { ...row, status: generalStatusToUi(row.status) };
}

export async function fetchBranchQuota() {
  const res = await apiGet<{ success: boolean; data: BranchQuota }>("/tenant/branch-quota");
  return res.data;
}

export async function fetchBranchSwitcherStores() {
  const res = await apiGet<{ success: boolean; data: BranchSwitcherStore[] }>("/tenant/stores", {
    skipBranch: true,
  });
  return res.data;
}

export async function fetchStores(opts?: { managed?: boolean }) {
  const qs = opts?.managed ? "?managed=true" : "";
  const res = await apiGet<{ success: boolean; data: RawStore[] }>(`/tenant/stores${qs}`, {
    skipBranch: true,
  });
  return res.data.map(mapStore);
}

export async function fetchNewStoreManagerCandidates() {
  const res = await apiGet<{ success: boolean; data: StoreManagerCandidate[] }>(
    "/tenant/branch-manager-candidates/new-store",
  );
  return res.data;
}

export async function createStore(body: {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  code?: string;
  status?: UiPeopleStatus;
  branchManagerUserId?: string;
}) {
  const res = await apiPost<{ success: boolean; data: RawStore }>("/tenant/stores", {
    name: body.name,
    email: body.email ?? null,
    phone: body.phone ?? null,
    address: body.address ?? null,
    code: body.code,
    status: body.status ? uiStatusToGeneral(body.status) : undefined,
    ...(body.branchManagerUserId ? { branchManagerUserId: body.branchManagerUserId } : {}),
  });
  return mapStore(res.data);
}

export async function updateStore(
  id: string,
  body: Partial<{
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    code: string;
    status: UiPeopleStatus;
  }>,
) {
  const res = await apiPatch<{ success: boolean; data: RawStore }>(`/tenant/stores/${id}`, {
    ...body,
    status: body.status !== undefined ? uiStatusToGeneral(body.status) : undefined,
  });
  return mapStore(res.data);
}

export async function deleteStore(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/stores/${id}`);
}
