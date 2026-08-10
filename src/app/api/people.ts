import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type UiPeopleStatus = "Active" | "Inactive";

export interface PeopleCustomer {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: UiPeopleStatus;
  vehicleCount: number;
  plates: string[];
}

export interface PeopleSupplier {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  company: string;
  status: UiPeopleStatus;
}

export interface CustomerVehicle {
  id: string;
  customerId: string;
  make: string;
  model: string;
  year: number | null;
  plate: string;
  mileage: number | null;
  vin: string;
  notes: string;
  status: UiPeopleStatus;
  createdAt?: string;
}

export type PeopleListQuery = {
  search?: string;
  status?: "active" | "inactive" | "all";
};

function peopleQueryString(q: PeopleListQuery = {}): string {
  const params = new URLSearchParams();
  if (q.search) params.set("search", q.search);
  if (q.status && q.status !== "all") params.set("status", q.status);
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function fetchCustomers(query: PeopleListQuery | string = {}) {
  const q =
    typeof query === "string"
      ? query
        ? `?search=${encodeURIComponent(query)}`
        : ""
      : peopleQueryString(query);
  const res = await apiGet<{ success: boolean; data: PeopleCustomer[] }>(
    `/tenant/people/customers${q}`,
  );
  return res.data;
}

export async function createCustomer(body: {
  name: string;
  code?: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  status?: UiPeopleStatus;
}) {
  const res = await apiPost<{ success: boolean; data: PeopleCustomer }>(
    "/tenant/people/customers",
    body,
  );
  return res.data;
}

export async function updateCustomer(
  id: string,
  body: Partial<{
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    status: UiPeopleStatus;
  }>,
) {
  const res = await apiPatch<{ success: boolean; data: PeopleCustomer }>(
    `/tenant/people/customers/${id}`,
    body,
  );
  return res.data;
}

export async function deleteCustomer(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/people/customers/${id}`);
}

export async function fetchSuppliers(query: PeopleListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PeopleSupplier[] }>(
    `/tenant/people/suppliers${peopleQueryString(query)}`,
  );
  return res.data;
}

export async function createSupplier(body: {
  name: string;
  code?: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  company?: string | null;
  status?: UiPeopleStatus;
}) {
  const res = await apiPost<{ success: boolean; data: PeopleSupplier }>(
    "/tenant/people/suppliers",
    body,
  );
  return res.data;
}

export async function updateSupplier(
  id: string,
  body: Partial<{
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    country: string | null;
    company: string | null;
    status: UiPeopleStatus;
  }>,
) {
  const res = await apiPatch<{ success: boolean; data: PeopleSupplier }>(
    `/tenant/people/suppliers/${id}`,
    body,
  );
  return res.data;
}

export async function deleteSupplier(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/people/suppliers/${id}`);
}

export async function fetchCustomerVehicles(customerId: string) {
  const res = await apiGet<{ success: boolean; data: CustomerVehicle[] }>(
    `/tenant/people/customers/${customerId}/vehicles`,
  );
  return res.data;
}

export interface PeopleBiller {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: UiPeopleStatus;
}

export async function fetchBillers(query: PeopleListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PeopleBiller[] }>(
    `/tenant/people/billers${peopleQueryString(query)}`,
  );
  return res.data;
}

export async function createCustomerVehicle(
  customerId: string,
  body: {
    make?: string | null;
    model?: string | null;
    year?: number | null;
    plate?: string | null;
    mileage?: number | null;
    vin?: string | null;
    notes?: string | null;
  },
) {
  const res = await apiPost<{ success: boolean; data: CustomerVehicle }>(
    `/tenant/people/customers/${customerId}/vehicles`,
    body,
  );
  return res.data;
}

export async function updateCustomerVehicle(
  customerId: string,
  vehicleId: string,
  body: Partial<{
    make: string | null;
    model: string | null;
    year: number | null;
    plate: string | null;
    mileage: number | null;
    vin: string | null;
    notes: string | null;
    status: UiPeopleStatus;
  }>,
) {
  const res = await apiPatch<{ success: boolean; data: CustomerVehicle }>(
    `/tenant/people/customers/${customerId}/vehicles/${vehicleId}`,
    body,
  );
  return res.data;
}

export async function deleteCustomerVehicle(customerId: string, vehicleId: string) {
  return apiDelete<{ success: boolean; message: string }>(
    `/tenant/people/customers/${customerId}/vehicles/${vehicleId}`,
  );
}
