import { resolveHubApiBase } from "./hubApiBase";

export interface MarketplaceSpec {
  label: string;
  labelEn: string;
  value: string;
  valueEn?: string;
}

export interface MarketplaceProduct {
  id: string;
  hubId?: string;
  nameAz: string;
  nameEn: string;
  brand: string;
  model: string;
  category: string;
  categoryEn: string;
  shortDesc: string;
  shortDescEn: string;
  fullDesc: string;
  fullDescEn: string;
  badge?: string;
  badgeEn?: string;
  badgeColor?: string;
  condition?: string;
  price: number;
  stock?: number;
  inStock: boolean;
  imgs: string[];
  specs: MarketplaceSpec[];
  sourceUrl: string;
}

export interface MarketplaceOrderItem {
  productId: string;
  name: string;
  brand: string;
  model: string;
  price: number;
  qty: number;
  lineTotal: number;
}

export interface MarketplaceOrderPayload {
  name: string;
  phone: string;
  note?: string;
  lang: "EN" | "AZ";
  total: number;
  items: MarketplaceOrderItem[];
  sourcePath?: string;
}

type PublicList = { items: MarketplaceProduct[] };

async function hubFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${resolveHubApiBase()}${path}`, {
    credentials: "omit",
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { message?: string | string[] };
      if (typeof data.message === "string") message = data.message;
      else if (Array.isArray(data.message) && data.message[0]) message = data.message[0];
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export async function fetchMarketplaceProducts(): Promise<MarketplaceProduct[]> {
  const data = await hubFetch<PublicList>("/public/landing-products");
  return data.items ?? [];
}

export async function fetchMarketplaceProduct(id: string): Promise<MarketplaceProduct | null> {
  try {
    return await hubFetch<MarketplaceProduct>(`/public/landing-products/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof Error && /404/.test(err.message)) return null;
    throw err;
  }
}

export async function submitMarketplaceInquiry(payload: MarketplaceOrderPayload): Promise<void> {
  await hubFetch("/public/order-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function productName(p: MarketplaceProduct, lang: string): string {
  return lang === "en" ? p.nameEn : p.nameAz;
}

export function productShortDesc(p: MarketplaceProduct, lang: string): string {
  return lang === "en" ? p.shortDescEn : p.shortDesc;
}

export function productFullDesc(p: MarketplaceProduct, lang: string): string {
  return lang === "en" ? p.fullDescEn : p.fullDesc;
}

export function productCategory(p: MarketplaceProduct, lang: string): string {
  return lang === "en" ? p.categoryEn : p.category;
}

export function conditionLabel(condition: string | undefined, lang: string): string {
  if (!condition) return "";
  if (lang === "en") {
    if (condition === "İşlənmiş") return "Used";
    if (condition === "Yeni") return "New";
  }
  return condition;
}
