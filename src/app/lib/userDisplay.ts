interface UserNameFields {
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export function getUserDisplayName(
  user: UserNameFields | null,
  demoLabel = "Demo User",
): string {
  if (!user) return demoLabel;
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function getUserInitials(displayName: string, email?: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.length >= 2) return email.slice(0, 2).toUpperCase();
  return "??";
}

import type { Language } from "../i18n/translations";
import { formatDateLong } from "./dateFormat";

export function formatMemberSince(iso: string | null | undefined, language: Language = "en"): string {
  if (!iso) return "—";
  try {
    return formatDateLong(iso, language);
  } catch {
    return "—";
  }
}

interface TenantLogoFields {
  companyLogoUrl?: string | null;
  companyDarkLogoUrl?: string | null;
}

export function getCompanyLogoUrl(
  tenant: TenantLogoFields | null | undefined,
  darkMode = false,
): string | null {
  if (!tenant) return null;
  if (darkMode && tenant.companyDarkLogoUrl) return tenant.companyDarkLogoUrl;
  return tenant.companyLogoUrl ?? null;
}
