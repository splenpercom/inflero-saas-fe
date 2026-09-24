import { useCallback, useRef } from "react";

/**
 * Ignore stale async results when deps change quickly (e.g. rapid pagination clicks).
 * Call at the start of each async load; check isStale() before every setState after await.
 */
export function useAsyncGuard() {
  const seqRef = useRef(0);

  return useCallback(() => {
    const seq = ++seqRef.current;
    return () => seq !== seqRef.current;
  }, []);
}
