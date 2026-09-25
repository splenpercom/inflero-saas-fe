import { apiGet, apiPost } from "./client";

export async function fetchPublicDiningMenu(slug: string, opts?: { branch?: string; tableId?: string }) {
  const qs = new URLSearchParams();
  if (opts?.branch) qs.set("branch", opts.branch);
  if (opts?.tableId) qs.set("tableId", opts.tableId);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await apiGet<{ success: true; data: unknown }>(
    `/public/tenants/${encodeURIComponent(slug)}/dining/menu${suffix}`,
    { skipAuth: true, skipBranch: true },
  );
  return res.data;
}

export async function createPublicDiningOrder(
  slug: string,
  body: {
    tableId?: string | null;
    branch?: string | null;
    paymentMethod?: string;
    items: { productId: string; quantity: number }[];
  },
) {
  const res = await apiPost<{
    success: true;
    data: {
      id: string;
      reference: string | null;
      publicToken: string | null;
      status: string;
      grandTotal: number;
      kotStatus: string | null;
      table: { id: string; number: number; name: string } | null;
      items: { name: string; qty: number; price: number }[];
    };
  }>(`/public/tenants/${encodeURIComponent(slug)}/dining/orders`, body, {
    skipAuth: true,
    skipBranch: true,
  });
  return res.data;
}

export type PublicQrOrderGuestStatus =
  | "pending"
  | "accepted"
  | "in_kitchen"
  | "ready"
  | "served"
  | "cancelled";

export interface PublicQrOrderStatus {
  id: string;
  reference: string | null;
  status: PublicQrOrderGuestStatus;
  orderStatus: string;
  kotStatus: string | null;
  paymentStatus: string;
  grandTotal: number;
  table: { id: string; number: number; name: string } | null;
  items: { name: string; qty: number; price: number; lineTotal: number }[];
}

export async function fetchPublicDiningOrder(
  slug: string,
  orderId: string,
  token: string,
) {
  const qs = new URLSearchParams({ token });
  const res = await apiGet<{ success: true; data: PublicQrOrderStatus }>(
    `/public/tenants/${encodeURIComponent(slug)}/dining/orders/${encodeURIComponent(orderId)}?${qs}`,
    { skipAuth: true, skipBranch: true },
  );
  return res.data;
}

export async function fetchPublicDiningBookingConfig(
  slug: string,
  opts?: { branch?: string; tableId?: string },
) {
  const qs = new URLSearchParams();
  if (opts?.branch) qs.set("branch", opts.branch);
  if (opts?.tableId) qs.set("tableId", opts.tableId);
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await apiGet<{ success: true; data: unknown }>(
    `/public/tenants/${encodeURIComponent(slug)}/dining/booking-config${suffix}`,
    { skipAuth: true, skipBranch: true },
  );
  return res.data;
}

export async function createPublicDiningBooking(slug: string, body: Record<string, unknown>) {
  const res = await apiPost<{ success: true; data: unknown }>(
    `/public/tenants/${encodeURIComponent(slug)}/dining/bookings`,
    body,
    { skipAuth: true, skipBranch: true },
  );
  return res.data;
}
