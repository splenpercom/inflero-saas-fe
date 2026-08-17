import { useState, useEffect, useCallback } from "react";
import { fetchPendingReservationCount } from "../api/reservations";
import { useAuth } from "../context/AuthContext";
import { playNotificationSound } from "../utils/reservationNotifications";

import { getStorageItem } from "../lib/storageMigration";

const SEEN_KEY = "inflero_res_pending_seen";
let sharedCount = 0;
let sharedPrevious: number | null = null;
let sharedTimer: ReturnType<typeof setInterval> | null = null;
let sharedConsumers = 0;
const sharedListeners = new Set<(count: number) => void>();

async function pollSharedCount() {
  try {
    const count = await fetchPendingReservationCount();
    if (sharedPrevious !== null && count > sharedPrevious) playNotificationSound();
    sharedPrevious = count;
    sharedCount = count;
    sharedListeners.forEach((listener) => listener(count));
  } catch {
    /* independently ignore reservation badge failures */
  }
}

export function usePendingReservationCount(pollMs = 45000) {
  const { isAuthenticated, isDemo, hasModule, hasPermission } = useAuth();
  const reservationsEnabled =
    hasModule("RESERVATIONS") && hasPermission("Reservations", "view");
  const [pendingCount, setPendingCount] = useState(sharedCount);
  const [seenCount, setSeenCount] = useState(() => {
    const raw = getStorageItem(sessionStorage, SEEN_KEY);
    return raw ? Number(raw) : 0;
  });

  useEffect(() => {
    if (!(isAuthenticated || isDemo) || !reservationsEnabled) {
      setPendingCount(0);
      return;
    }
    const listener = (count: number) => setPendingCount(count);
    sharedListeners.add(listener);
    sharedConsumers += 1;
    setPendingCount(sharedCount);
    if (sharedConsumers === 1) {
      void pollSharedCount();
      sharedTimer = setInterval(() => void pollSharedCount(), pollMs);
    }
    return () => {
      sharedListeners.delete(listener);
      sharedConsumers -= 1;
      if (sharedConsumers === 0 && sharedTimer) {
        clearInterval(sharedTimer);
        sharedTimer = null;
        sharedPrevious = null;
      }
    };
  }, [isDemo, isAuthenticated, pollMs, reservationsEnabled]);

  const acknowledge = useCallback(() => {
    setSeenCount(pendingCount);
    sessionStorage.setItem(SEEN_KEY, String(pendingCount));
  }, [pendingCount]);

  const badgeCount = Math.max(0, pendingCount - seenCount);

  return { pendingCount, badgeCount, acknowledge };
}
