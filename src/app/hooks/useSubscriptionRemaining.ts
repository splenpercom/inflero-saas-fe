import { useMemo, useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  computeSubscriptionRemaining,
  subscriptionDisplayLabels,
  subscriptionUrgency,
  type TenantSubscriptionInfo,
  type SubscriptionUrgency,
} from "../lib/subscriptionDisplay";

const RECOMPUTE_MS = 60 * 60 * 1000;

export function useSubscriptionRemaining() {
  const { user, isDemo } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((n) => n + 1), RECOMPUTE_MS);
    return () => clearInterval(interval);
  }, []);

  return useMemo(() => {
    if (isDemo) return null;
    const raw = user?.tenant?.subscription;
    if (!raw?.expiringOn) return null;

    const info = computeSubscriptionRemaining(raw.expiringOn, raw.cycle);
    return info;
  }, [user, isDemo, tick]);
}

export function useSubscriptionBadge(t: (en: string, az: string) => string) {
  const info = useSubscriptionRemaining();

  return useMemo(() => {
    if (!info) return null;
    const urgency = subscriptionUrgency(info);
    const labels = subscriptionDisplayLabels(info, t);
    return { info, urgency, labels };
  }, [info, t]);
}

export type { TenantSubscriptionInfo, SubscriptionUrgency };
