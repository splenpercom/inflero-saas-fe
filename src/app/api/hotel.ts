import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type HotelBedConfigItem = { type: string; count: number };

export type HotelRoom = {
  id: string;
  number: number | null;
  name: string;
  weekdayPrice: number | null;
  weekendPrice: number | null;
  facilities: string[];
  maxGuests: number | null;
  bedConfig: HotelBedConfigItem[] | null;
  status: "active" | "inactive";
  storeId: string;
  updatedAt: string;
};

export type HotelReservationStatus = "RESERVED" | "BOOKED" | "CANCELLED";

export type HotelReservation = {
  id: string;
  storeId: string;
  roomId: string | null;
  customerId: string | null;
  guestName: string | null;
  guestPhone: string | null;
  assigneeUserId: string | null;
  checkInAt: string | null;
  checkOutAt: string | null;
  status: HotelReservationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  room: { id: string; name: string; number: number | null } | null;
  customer: { id: string; name: string; phone: string | null } | null;
  assignee: { id: string; name: string; email: string } | null;
};

export type CreateHotelRoomBody = {
  name: string;
  number?: number | null;
  weekdayPrice?: number | null;
  weekendPrice?: number | null;
  facilities?: string[];
  maxGuests?: number | null;
  bedConfig?: HotelBedConfigItem[] | null;
  status?: "ACTIVE" | "INACTIVE";
};

export type CreateHotelReservationBody = {
  roomId?: string | null;
  customerId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
  assigneeUserId?: string | null;
  checkInAt?: string | null;
  checkOutAt?: string | null;
  status?: HotelReservationStatus;
  notes?: string | null;
};

export async function fetchHotelRooms() {
  const res = await apiGet<{ success: true; data: HotelRoom[] }>("/tenant/hotel/rooms");
  return res.data;
}

export async function createHotelRoom(body: CreateHotelRoomBody) {
  const res = await apiPost<{ success: true; data: HotelRoom }>("/tenant/hotel/rooms", body);
  return res.data;
}

export async function updateHotelRoom(id: string, body: Partial<CreateHotelRoomBody>) {
  const res = await apiPatch<{ success: true; data: HotelRoom }>(`/tenant/hotel/rooms/${id}`, body);
  return res.data;
}

export async function deleteHotelRoom(id: string) {
  await apiDelete<{ success: true; message: string }>(`/tenant/hotel/rooms/${id}`);
}

export async function fetchHotelReservations(params?: {
  status?: "all" | HotelReservationStatus;
  search?: string;
  customerId?: string;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.status) q.set("status", params.status);
  if (params?.search) q.set("search", params.search);
  if (params?.customerId) q.set("customerId", params.customerId);
  if (params?.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  const res = await apiGet<{ success: true; data: HotelReservation[] }>(
    `/tenant/hotel/reservations${qs ? `?${qs}` : ""}`,
  );
  return res.data;
}

export async function createHotelReservation(body: CreateHotelReservationBody) {
  const res = await apiPost<{ success: true; data: HotelReservation }>(
    "/tenant/hotel/reservations",
    body,
  );
  return res.data;
}

export async function updateHotelReservation(id: string, body: Partial<CreateHotelReservationBody>) {
  const res = await apiPatch<{ success: true; data: HotelReservation }>(
    `/tenant/hotel/reservations/${id}`,
    body,
  );
  return res.data;
}
