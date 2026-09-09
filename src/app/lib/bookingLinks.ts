/** Public storefront + customer booking URL helpers */

const RESERVED_STORE_SLUGS = new Set([
  "login",
  "dashboard",
  "api",
  "assets",
  "static",
  "favicon.ico",
  "customer-landing",
  "res",
  "menu",
  "book",
  "reset-password",
  "forgot-password",
]);

export function isReservedStoreSlug(slug: string): boolean {
  return RESERVED_STORE_SLUGS.has(slug.trim().toLowerCase());
}

/** Ecommerce / My Store storefront: `/{company-slug}` */
export function storePath(companySlug: string): string {
  return `/${encodeURIComponent(companySlug.trim())}`;
}

export function storeUrl(
  companySlug: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
): string {
  return `${origin}${storePath(companySlug)}`;
}

/** Customer booking page: `/res/{tenantSlug}[/{branchSlug}]` */
export function customerBookingPath(tenantSlug: string, branchSlug?: string | null): string {
  const base = `/res/${encodeURIComponent(tenantSlug.trim())}`;
  if (branchSlug?.trim()) {
    return `${base}/${encodeURIComponent(branchSlug.trim())}`;
  }
  return base;
}

export function customerBookingUrl(
  tenantSlug: string,
  origin = typeof window !== "undefined" ? window.location.origin : "",
  branchSlug?: string | null,
): string {
  return `${origin}${customerBookingPath(tenantSlug, branchSlug)}`;
}
