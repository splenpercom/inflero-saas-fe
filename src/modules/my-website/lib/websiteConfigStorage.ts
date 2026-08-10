import type { WebsiteConfig } from "../features/builder/types";

const BY_TENANT_PREFIX = "inflero-website-config:";
const BY_SLUG_PREFIX = "inflero-website-slug:";

export function websiteConfigKeyForTenant(tenantId: string): string {
  return `${BY_TENANT_PREFIX}${tenantId}`;
}

export function websiteConfigKeyForSlug(slug: string): string {
  return `${BY_SLUG_PREFIX}${slug.trim().toLowerCase()}`;
}

export function loadWebsiteConfigByTenant(tenantId: string): WebsiteConfig | null {
  if (typeof window === "undefined" || !tenantId) return null;
  try {
    const raw = localStorage.getItem(websiteConfigKeyForTenant(tenantId));
    if (!raw) return null;
    return JSON.parse(raw) as WebsiteConfig;
  } catch {
    return null;
  }
}

export function loadWebsiteConfigBySlug(slug: string): WebsiteConfig | null {
  if (typeof window === "undefined" || !slug.trim()) return null;
  try {
    const raw = localStorage.getItem(websiteConfigKeyForSlug(slug));
    if (!raw) return null;
    return JSON.parse(raw) as WebsiteConfig;
  } catch {
    return null;
  }
}

export function saveWebsiteConfig(opts: {
  config: WebsiteConfig;
  tenantId?: string | null;
  companySlug?: string | null;
}): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify(opts.config);
  try {
    if (opts.tenantId) {
      localStorage.setItem(websiteConfigKeyForTenant(opts.tenantId), payload);
    }
    if (opts.companySlug?.trim()) {
      localStorage.setItem(websiteConfigKeyForSlug(opts.companySlug), payload);
    }
  } catch {
    /* quota / private mode */
  }
}
