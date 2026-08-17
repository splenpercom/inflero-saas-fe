import { apiGet, apiPost } from "./client";
import type { ServiceTypeOption } from "../lib/serviceTypes";
import type { BookingPageMode } from "../lib/branchBooking";

export interface ReservationConfig {
  slotIntervalMinutes: number;
  capacityPerSlot: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  workingDays: number[];
  serviceTypes?: ServiceTypeOption[];
}

export interface PublicTenantBranding {
  name: string;
  slug: string | null;
  phone: string | null;
  companyEmail: string;
  address: string | null;
  website: string | null;
  companyLogoUrl: string | null;
  companyDarkLogoUrl: string | null;
  socialLinks: Record<string, string | null> | null;
  latitude: number | null;
  longitude: number | null;
}

export interface PublicBranchOption {
  storeId: string;
  slug: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export interface PublicReservationConfigResponse {
  mode: BookingPageMode;
  storeId?: string | null;
  branchSlug?: string | null;
  tenant: PublicTenantBranding;
  config?: ReservationConfig;
  branches?: PublicBranchOption[];
}

export interface SlotAvailability {
  time: string;
  available: number;
  capacity: number;
  booked: number;
}

export interface CreatePublicReservationBody {
  guestName: string;
  guestPhone: string;
  guestPlateSuffix?: string | null;
  carModel?: string | null;
  serviceType: string;
  scheduledAt: string;
  notes?: string | null;
  branchSlug?: string;
}

const publicOpts = { skipAuth: true as const, skipBranch: true as const };

function branchQuery(branchSlug?: string | null): string {
  if (!branchSlug?.trim()) return "";
  return `?branch=${encodeURIComponent(branchSlug.trim())}`;
}

export async function fetchPublicReservationConfig(slug: string, branchSlug?: string | null) {
  const res = await apiGet<{
    success: boolean;
    data: PublicReservationConfigResponse;
  }>(`/public/tenants/${encodeURIComponent(slug)}/reservation-config${branchQuery(branchSlug)}`, publicOpts);
  return res.data;
}

export async function fetchPublicReservationSlots(slug: string, date: string, branchSlug?: string | null) {
  const params = new URLSearchParams({ date });
  if (branchSlug?.trim()) params.set("branch", branchSlug.trim());
  const res = await apiGet<{ success: boolean; data: SlotAvailability[] }>(
    `/public/tenants/${encodeURIComponent(slug)}/reservation-slots?${params.toString()}`,
    publicOpts,
  );
  return res.data;
}

export async function createPublicReservation(
  slug: string,
  body: CreatePublicReservationBody,
  branchSlug?: string | null,
) {
  const res = await apiPost<{ success: boolean; data: { id: string } }>(
    `/public/tenants/${encodeURIComponent(slug)}/reservations${branchQuery(branchSlug)}`,
    body,
    publicOpts,
  );
  return res.data;
}
