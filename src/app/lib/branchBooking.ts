export type BookingPageMode = "shared" | "per_branch";

export interface BranchLandingPage {
  slug: string;
  enabled?: boolean;
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  socialLinks?: Record<string, string | null>;
}

export function slugifyBranchPage(value: string): string {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug.length >= 2 ? slug : "branch";
}
