import { useState, useEffect, useRef, useCallback } from "react";
import { fetchPendingReservationCount } from "../api/reservations";
import { useAuth } from "../context/AuthContext";
import { playNotificationSound } from "../utils/reservationNotifications";

import { getStorageItem } from "../lib/storageMigration";

const SEEN_KEY = "inflero_res_pending_seen";

export function usePendingReservationCount(pollMs = 45000) {
  const { isAuthenticated, isDemo } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const prevCountRef = useRef<number | null>(null);
  const [seenCount, setSeenCount] = useState(() => {
    const raw = getStorageItem(sessionStorage, SEEN_KEY);
    return raw ? Number(raw) : 0;
  });

  useEffect(() => {
    if (!(isAuthenticated || isDemo)) {
      setPendingCount(0);
      prevCountRef.current = null;
      return;
    }

    const poll = async () => {
      try {
        const count = await fetchPendingReservationCount();
        if (prevCountRef.current !== null && count > prevCountRef.current) {
          playNotificationSound();
        }
        prevCountRef.current = count;
        setPendingCount(count);
      } catch {
        /* ignore poll errors */
      }
    };

    void poll();
    const interval = setInterval(poll, pollMs);
    return () => clearInterval(interval);
  }, [isDemo, isAuthenticated, pollMs]);

  const acknowledge = useCallback(() => {
    setSeenCount(pendingCount);
    sessionStorage.setItem(SEEN_KEY, String(pendingCount));
  }, [pendingCount]);

  const badgeCount = Math.max(0, pendingCount - seenCount);

  return { pendingCount, badgeCount, acknowledge };
}
