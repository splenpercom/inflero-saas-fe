import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type { ServiceTypeOption } from "../lib/serviceTypes";
import type { BookingPageMode, BranchLandingPage } from "../lib/branchBooking";

export interface ReservationConfig {
  slotIntervalMinutes: number;
  capacityPerSlot: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  workingDays: number[];
  serviceTypes?: ServiceTypeOption[];
  bookingPageMode?: BookingPageMode;
  branchPages?: Record<string, BranchLandingPage>;
}

export interface ReservationRecord {
  id: string;
  storeId: string | null;
  customerId: string | null;
  vehicleId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  guestPlateSuffix: string | null;
  serviceType: string;
  scheduledAt: string;
  mileage: number | null;
  notes: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  source: "internal" | "customer_site";
  createdAt: string;
  customerName?: string;
  vehicleLabel?: string;
  branchName?: string | null;
}

export type ReservationListQuery = {
  status?: "all" | "pending" | "confirmed" | "completed" | "cancelled";
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
};

export type ReservationCreateBody = {
  storeId?: string | null;
  customerId?: string | null;
  vehicleId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestPlateSuffix?: string | null;
  serviceType: string;
  scheduledAt: string;
  mileage?: number | null;
  notes?: string | null;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
};

export type ReservationUpdateBody = Partial<ReservationCreateBody>;

function queryString(q: ReservationListQuery): string {
  const params = new URLSearchParams();
  if (q.status) params.set("status", q.status);
  if (q.dateFrom) params.set("dateFrom", q.dateFrom);
  if (q.dateTo) params.set("dateTo", q.dateTo);
  if (q.search) params.set("search", q.search);
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export async function fetchReservationSettings() {
  const res = await apiGet<{ success: boolean; data: ReservationConfig }>(
    "/tenant/settings/reservations",
  );
  return res.data;
}

export async function updateReservationSettings(body: ReservationConfig) {
  const res = await apiPatch<{ success: boolean; data: ReservationConfig }>(
    "/tenant/settings/reservations",
    body,
  );
  return res.data;
}

export async function fetchReservations(query: ReservationListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: ReservationRecord[] }>(
    `/tenant/reservations${queryString(query)}`,
  );
  return res.data ?? [];
}

export async function fetchPendingReservationCount() {
  const res = await apiGet<{ success: boolean; data: { count: number } }>(
    "/tenant/reservations/pending-count",
  );
  return res.data.count;
}

export async function createReservation(body: ReservationCreateBody) {
  const res = await apiPost<{ success: boolean; data: ReservationRecord }>(
    "/tenant/reservations",
    body,
  );
  return res.data;
}

export async function updateReservation(id: string, body: ReservationUpdateBody) {
  const res = await apiPatch<{ success: boolean; data: ReservationRecord }>(
    `/tenant/reservations/${id}`,
    body,
  );
  return res.data;
}

export async function deleteReservation(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/reservations/${id}`);
}
