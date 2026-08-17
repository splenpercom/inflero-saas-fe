import type { PlatformUser } from "../api/auth";
import type { SalesBillerRow } from "../api/sales";

export function userDisplayName(user: PlatformUser | null): string {
  if (!user) return "";
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.email;
}

export function pickCurrentUserBillerId(
  billers: SalesBillerRow[],
  user: PlatformUser | null,
): string {
  if (!user || billers.length === 0) return "";

  const email = user.email?.trim().toLowerCase();
  if (email) {
    const byEmail = billers.find((b) => b.email?.trim().toLowerCase() === email);
    if (byEmail) return byEmail.id;
  }

  const name = userDisplayName(user).toLowerCase();
  if (name) {
    const byName = billers.find((b) => b.name.trim().toLowerCase() === name);
    if (byName) return byName.id;
  }

  return "";
}

export function pickDefaultBillerId(billers: SalesBillerRow[], user: PlatformUser | null): string {
  return pickCurrentUserBillerId(billers, user) || billers[0]?.id || "";
}
