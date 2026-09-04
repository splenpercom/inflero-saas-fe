import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

export type DiningTable = {
  id: string;
  number: number;
  name: string;
  seats: number;
  area: string | null;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED";
  storeId: string;
  updatedAt: string;
};

export type DiningMenuProduct = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  status: string;
  productDescription: string | null;
  image: string | null;
  onMenu: boolean;
  sortOrder: number;
  available: boolean;
  description: string | null;
  imageUrl: string | null;
};

export type DiningMenuCategory = {
  id: string;
  name: string;
  products: DiningMenuProduct[];
};

export type KotOrder = {
  id: string;
  reference: string | null;
  documentNo: string | null;
  source: string;
  status: string;
  paymentStatus: string;
  grandTotal: number;
  kotStatus: "PENDING" | "PREPARING" | "READY" | "SERVED" | null;
  kotSentAt: string | null;
  kotUpdatedAt: string | null;
  table: { id: string; number: number; name: string } | null;
  items: { name: string; qty: number; price: number }[];
  createdAt: string;
};

export async function fetchDiningTables() {
  const res = await apiGet<{ success: true; data: DiningTable[] }>("/tenant/dining/tables");
  return res.data;
}

export async function createDiningTable(body: {
  number: number;
  name: string;
  seats?: number;
  area?: string | null;
  status?: DiningTable["status"];
}) {
  const res = await apiPost<{ success: true; data: DiningTable }>("/tenant/dining/tables", body);
  return res.data;
}

export async function updateDiningTable(id: string, body: Partial<{
  number: number;
  name: string;
  seats: number;
  area: string | null;
  status: DiningTable["status"];
}>) {
  const res = await apiPatch<{ success: true; data: DiningTable }>(`/tenant/dining/tables/${id}`, body);
  return res.data;
}

export async function deleteDiningTable(id: string) {
  await apiDelete(`/tenant/dining/tables/${id}`);
}

export async function fetchDiningMenu() {
  const res = await apiGet<{ success: true; data: { storeId: string; categories: DiningMenuCategory[] } }>(
    "/tenant/dining/menu",
  );
  return res.data;
}

export async function upsertDiningMenu(items: Array<{
  productId: string;
  onMenu: boolean;
  sortOrder?: number;
  available?: boolean;
  description?: string | null;
  imageUrl?: string | null;
}>) {
  const res = await apiPut<{ success: true; data: { storeId: string; categories: DiningMenuCategory[] } }>(
    "/tenant/dining/menu",
    { items },
  );
  return res.data;
}

export async function fetchDiningRestaurantInfo() {
  const res = await apiGet<{ success: true; data: Record<string, unknown> }>("/tenant/dining/restaurant-info");
  return res.data;
}

export async function upsertDiningRestaurantInfo(body: Record<string, unknown>) {
  const res = await apiPut<{ success: true; data: Record<string, unknown> }>(
    "/tenant/dining/restaurant-info",
    body,
  );
  return res.data;
}

export async function fetchDiningBookings(query?: { status?: string; search?: string }) {
  const qs = new URLSearchParams();
  if (query?.status && query.status !== "all") qs.set("status", query.status);
  if (query?.search) qs.set("search", query.search);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await apiGet<{ success: true; data: unknown[] }>(`/tenant/dining/bookings${suffix}`);
  return res.data;
}

export async function createDiningBooking(body: Record<string, unknown>) {
  const res = await apiPost<{ success: true; data: unknown }>("/tenant/dining/bookings", body);
  return res.data;
}

export async function updateDiningBooking(id: string, body: Record<string, unknown>) {
  const res = await apiPatch<{ success: true; data: unknown }>(`/tenant/dining/bookings/${id}`, body);
  return res.data;
}

export async function fetchDiningBookingSettings() {
  const res = await apiGet<{ success: true; data: Record<string, unknown> }>(
    "/tenant/settings/dining/bookings",
  );
  return res.data;
}

export async function upsertDiningBookingSettings(body: Record<string, unknown>) {
  const res = await apiPut<{ success: true; data: Record<string, unknown> }>(
    "/tenant/settings/dining/bookings",
    body,
  );
  return res.data;
}

export async function fetchKotOrders(includeServed = false) {
  const qs = includeServed ? "?includeServed=true" : "";
  const res = await apiGet<{ success: true; data: KotOrder[] }>(`/tenant/dining/kot${qs}`);
  return res.data;
}

export async function patchKotStatus(
  orderId: string,
  body: { kotStatus: KotOrder["kotStatus"]; expectedKotStatus?: KotOrder["kotStatus"] },
) {
  const res = await apiPatch<{ success: true; data: KotOrder }>(`/tenant/dining/kot/${orderId}`, body);
  return res.data;
}
