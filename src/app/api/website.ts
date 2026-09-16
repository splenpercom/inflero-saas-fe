import { apiGet, apiPut, apiPost, apiPatch } from "./client";
import type { WebsiteConfig } from "../../modules/my-website/features/builder/types";

export interface TenantWebsiteConfigResponse {
  config: WebsiteConfig | null;
  updatedAt: string;
}

export interface PublicStorefrontBranch {
  storeId: string;
  code: string;
  name: string;
  address: string | null;
}

export interface PublicStorefrontResponse {
  slug: string;
  storeName: string;
  config: WebsiteConfig;
  catalog?: {
    categories: { id: string; name: string }[];
    products: {
      id: string;
      name: string;
      price: number;
      image: string | null;
      categoryId: string | null;
    }[];
  };
  branchSellingMode?: boolean;
  enabledBranches?: PublicStorefrontBranch[];
  selectedBranch?: PublicStorefrontBranch | null;
  updatedAt: string;
}

export type WebOrderDto = {
  id: string;
  reference: string;
  date: string;
  status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "refunded";
  paymentMethod: "epoint" | "cod";
  grandTotal: number;
  customer: { name: string; email: string; phone: string };
  shipping: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    notes?: string;
  };
  items: { name: string; qty: number; price: number }[];
};

export async function fetchTenantWebsiteConfig(): Promise<TenantWebsiteConfigResponse> {
  const res = await apiGet<{ success: true; data: TenantWebsiteConfigResponse }>("/tenant/website");
  return res.data;
}

export async function saveTenantWebsiteConfig(config: WebsiteConfig): Promise<TenantWebsiteConfigResponse> {
  const res = await apiPut<{ success: true; data: TenantWebsiteConfigResponse }>("/tenant/website", {
    config,
  });
  return res.data;
}

export async function fetchWebOrders(opts?: { page?: number; pageSize?: number }) {
  const qs = new URLSearchParams();
  if (opts?.page) qs.set("page", String(opts.page));
  if (opts?.pageSize) qs.set("pageSize", String(opts.pageSize));
  const suffix = qs.toString() ? `?${qs}` : "";
  const res = await apiGet<{
    success: true;
    data: { items: WebOrderDto[]; total: number; page: number; pageSize: number };
  }>(`/tenant/website/orders${suffix}`);
  return res.data;
}

export async function updateWebOrderApi(
  id: string,
  body: { status?: WebOrderDto["status"]; paymentStatus?: WebOrderDto["paymentStatus"] },
) {
  const res = await apiPatch<{ success: true; data: WebOrderDto }>(`/tenant/website/orders/${id}`, body);
  return res.data;
}

import { resolveApiBaseUrl } from "./apiBase";

const API_URL = resolveApiBaseUrl();

export async function fetchPublicStorefront(
  slug: string,
  branch?: string | null,
): Promise<PublicStorefrontResponse | null> {
  const qs = branch?.trim() ? `?branch=${encodeURIComponent(branch.trim())}` : "";
  const url = `${API_URL}/public/tenants/${encodeURIComponent(slug)}/storefront${qs}`;
  const res = await fetch(url, { credentials: "omit" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body?.message === "string" ? body.message : "Failed to load storefront");
  }
  const json = (await res.json()) as { success: true; data: PublicStorefrontResponse };
  return json.data;
}

export async function createPublicWebOrder(
  slug: string,
  body: {
    branch?: string | null;
    paymentMethod: "epoint" | "cod";
    customer: { name: string; email?: string; phone: string };
    shipping: {
      address: string;
      city?: string;
      country?: string;
      postalCode?: string;
      notes?: string;
    };
    items: { productId: string; quantity: number }[];
  },
): Promise<WebOrderDto> {
  const res = await apiPost<{ success: true; data: WebOrderDto }>(
    `/public/tenants/${encodeURIComponent(slug)}/storefront/orders`,
    body,
    { skipAuth: true, skipBranch: true },
  );
  return res.data;
}
