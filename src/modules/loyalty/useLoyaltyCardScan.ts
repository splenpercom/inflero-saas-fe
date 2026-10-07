import { useCallback, useRef, useState } from "react";
import { useBarcodeWedge } from "../../app/hooks/useBarcodeWedge";

/** Same soft debounce as POS product wedge (gun bounce / double Enter). */
export const LOYALTY_SCAN_DEBOUNCE_MS = 500;

/**
 * Card assign scan — mirrors POS barcode field behavior:
 * - USB wedge buffer + Enter via useBarcodeWedge
 * - paste + Enter on field value
 * - ignore identical code within ~500ms
 */
export function useLoyaltyCardScan(onAssign: (code: string) => void | Promise<unknown>) {
  const [barcode, setBarcode] = useState("");
  const lastScanRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const assigningRef = useRef(false);
  const onAssignRef = useRef(onAssign);
  onAssignRef.current = onAssign;

  const runAssign = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code || assigningRef.current) return;

    const now = Date.now();
    if (
      lastScanRef.current.code === code &&
      now - lastScanRef.current.at < LOYALTY_SCAN_DEBOUNCE_MS
    ) {
      return;
    }
    lastScanRef.current = { code, at: now };
    assigningRef.current = true;
    try {
      await onAssignRef.current(code);
      setBarcode("");
    } finally {
      assigningRef.current = false;
      // Refresh debounce clock after success so a late second hit can't slip in.
      lastScanRef.current = { code, at: Date.now() };
    }
  }, []);

  const { handleKeyDown } = useBarcodeWedge((code) => {
    void runAssign(code);
  });

  const submitTyped = useCallback(() => {
    void runAssign(barcode);
  }, [barcode, runAssign]);

  return {
    barcode,
    setBarcode,
    handleKeyDown,
    submitTyped,
    runAssign,
  };
}
