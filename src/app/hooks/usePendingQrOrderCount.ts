import { useState, useEffect, useCallback } from "react";
import { fetchPendingQrPosOrderCount } from "../api/sales";
import { useAuth } from "../context/AuthContext";
import { useBranchRevision } from "./useBranchRevision";
import { playNotificationSound } from "../utils/reservationNotifications";
import { getStorageItem } from "../lib/storageMigration";

const SEEN_KEY = "inflero_qr_pending_seen";
let sharedCount = 0;
let sharedPrevious: number | null = null;
let sharedTimer: ReturnType<typeof setInterval> | null = null;
let sharedConsumers = 0;
const sharedListeners = new Set<(count: number) => void>();

async function pollSharedCount() {
  try {
    const { count } = await fetchPendingQrPosOrderCount();
    if (sharedPrevious !== null && count > sharedPrevious) playNotificationSound();
    sharedPrevious = count;
    sharedCount = count;
    sharedListeners.forEach((listener) => listener(count));
  } catch {
    /* independently ignore QR pending badge failures */
  }
}

/** Unclaimed QR menu orders awaiting POS approval — sidebar pulse on Sales / Orders. */
export function usePendingQrOrderCount(pollMs = 20_000) {
  const { isAuthenticated, isDemo, hasModule, hasPermission } = useAuth();
  const branchRevision = useBranchRevision();
  const enabled =
    (isAuthenticated || isDemo) &&
    !isDemo &&
    hasModule("POS") &&
    hasModule("DINING") &&
    hasPermission("Sales", "view");
  const [pendingCount, setPendingCount] = useState(sharedCount);
  const [seenCount, setSeenCount] = useState(() => {
    const raw = getStorageItem(sessionStorage, SEEN_KEY);
    return raw ? Number(raw) : 0;
  });

  useEffect(() => {
    if (!enabled) {
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
    } else {
      void pollSharedCount();
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
  }, [enabled, pollMs, branchRevision]);

  const acknowledge = useCallback(() => {
    setSeenCount(pendingCount);
    try {
      sessionStorage.setItem(SEEN_KEY, String(pendingCount));
    } catch {
      /* ignore */
    }
  }, [pendingCount]);

  const badgeCount = Math.max(0, pendingCount - seenCount);

  return { pendingCount, badgeCount, acknowledge };
}
