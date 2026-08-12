import type { ReservationRecord } from "../api/reservations";

export type ReservationStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface ReservationUi {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  date: string;
  time: string;
  notes: string;
  status: ReservationStatus;
  source: "internal" | "customer_site";
  createdAt: string;
  branchName?: string | null;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

export function splitScheduledAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  return { date, time };
}

export function combineScheduledAt(date: string, time: string): string {
  const [y, mo, day] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return new Date(y, mo - 1, day, h, mi, 0, 0).toISOString();
}

export function apiReservationToUi(row: ReservationRecord): ReservationUi {
  const { date, time } = splitScheduledAt(row.scheduledAt);

  return {
    id: row.id,
    customerId: row.customerId ?? "",
    customerName: row.customerName ?? row.guestName ?? "—",
    customerPhone: row.guestPhone ?? "",
    serviceType: row.serviceType,
    date,
    time,
    notes: row.notes ?? "",
    status: row.status,
    source: row.source,
    createdAt: row.createdAt.split("T")[0],
    branchName: row.branchName ?? null,
  };
}
