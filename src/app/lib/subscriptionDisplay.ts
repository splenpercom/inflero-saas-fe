export type SubscriptionCycle = "monthly" | "annual";

export interface TenantSubscriptionInfo {
  cycle: SubscriptionCycle;
  expiringOn: string;
  daysLeft: number;
  monthsLeft: number;
  label: string;
  shortLabel: string;
}

export function computeSubscriptionRemaining(
  expiringOn: string | Date,
  billingCycle?: string | null,
): TenantSubscriptionInfo {
  const expiry = typeof expiringOn === "string" ? new Date(expiringOn) : expiringOn;
  const now = new Date();
  const msLeft = expiry.getTime() - now.getTime();
  const daysLeft = msLeft > 0 ? Math.ceil(msLeft / (1000 * 60 * 60 * 24)) : 0;

  const monthsLeftRaw =
    (expiry.getFullYear() - now.getFullYear()) * 12 + (expiry.getMonth() - now.getMonth());
  const hasPartialMonthRemaining =
    expiry.getDate() > now.getDate() ||
    (expiry.getDate() === now.getDate() &&
      (expiry.getHours() > now.getHours() ||
        (expiry.getHours() === now.getHours() &&
          (expiry.getMinutes() > now.getMinutes() ||
            (expiry.getMinutes() === now.getMinutes() && expiry.getSeconds() > now.getSeconds())))));
  const monthsLeft = msLeft > 0 ? Math.max(1, monthsLeftRaw + (hasPartialMonthRemaining ? 1 : 0)) : 0;

  const normalizedCycle = (billingCycle ?? "").toLowerCase();
  const cycle: SubscriptionCycle =
    normalizedCycle === "annual" || normalizedCycle === "yearly" ? "annual" : "monthly";

  return {
    cycle,
    expiringOn: expiry.toISOString(),
    daysLeft,
    monthsLeft,
    label: cycle === "annual" ? `${monthsLeft} months left` : `${daysLeft} days left`,
    shortLabel: cycle === "annual" ? `${monthsLeft}mo` : `${daysLeft}d`,
  };
}

export type SubscriptionUrgency = "success" | "warning" | "danger";

export function subscriptionUrgency(info: TenantSubscriptionInfo): SubscriptionUrgency {
  if (info.cycle === "annual") {
    if (info.monthsLeft <= 0) return "danger";
    if (info.monthsLeft > 2) return "success";
    if (info.monthsLeft > 1) return "warning";
    return "danger";
  }
  if (info.daysLeft <= 0) return "danger";
  if (info.daysLeft > 7) return "success";
  if (info.daysLeft > 3) return "warning";
  return "danger";
}

export function subscriptionDisplayLabels(
  info: TenantSubscriptionInfo,
  t: (en: string, az: string) => string,
): { full: string; short: string } {
  if (info.cycle === "annual") {
    if (info.monthsLeft <= 0) {
      return { full: t("Expired", "Vaxtı bitib"), short: t("Exp", "Bitib") };
    }
    return {
      full: `${info.monthsLeft} ${t("months left", "ay qalıb")}`,
      short: `${info.monthsLeft}mo`,
    };
  }
  if (info.daysLeft <= 0) {
    return { full: t("Expired", "Vaxtı bitib"), short: t("Exp", "Bitib") };
  }
  return {
    full: `${info.daysLeft} ${t("days left", "gün qalıb")}`,
    short: `${info.daysLeft}d`,
  };
}
