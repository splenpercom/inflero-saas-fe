import { apiGet, apiPut } from "./client";
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

export async function fetchTenantWebsiteConfig(): Promise<TenantWebsiteConfigResponse> {
  const res = await apiGet<{ success: true; data: TenantWebsiteConfigResponse }>("/tenant/website");
  return res.data;
}

export async function saveTenantWebsiteConfig(config: WebsiteConfig): Promise<TenantWebsiteConfigResponse> {
  const res = await apiPut<{ success: true; data: TenantWebsiteConfigResponse }>("/tenant/website", { config });
  return res.data;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

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
