import { useCallback, useRef, type KeyboardEvent } from "react";

const CODE_LIKE = /^[A-Za-z0-9\-._/]+$/;

/** Default max gap between keystrokes to treat input as a scanner burst (ms). */
export const DEFAULT_WEDGE_MAX_KEY_GAP_MS = 80;

export type BarcodeWedgeOptions = {
  minLength?: number;
  /**
   * Max milliseconds between keys to keep appending to the scan buffer.
   * Older CCD guns can be slower — raise per branch/device if needed (e.g. 120–150).
   */
  maxKeyGapMs?: number;
};

/** True when value looks like a barcode/SKU (not a normal multi-word search). */
export function isBarcodeLikeCode(value: string): boolean {
  const code = value.trim();
  return code.length >= 4 && CODE_LIKE.test(code) && !/\s/.test(code);
}

/**
 * Keyboard-wedge helper for USB/HID barcode scanners.
 * Scanners type characters quickly and finish with Enter.
 * Also treats Enter on a code-like field value as a scan (paste + Enter / gun).
 */
export function useBarcodeWedge(
  onScan: (code: string) => void | Promise<unknown>,
  opts?: BarcodeWedgeOptions,
) {
  const minLength = opts?.minLength ?? 4;
  const maxKeyGapMs = opts?.maxKeyGapMs ?? DEFAULT_WEDGE_MAX_KEY_GAP_MS;
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);

  const reset = useCallback(() => {
    bufferRef.current = "";
    lastKeyAtRef.current = 0;
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      const now = Date.now();
      const elapsed = now - lastKeyAtRef.current;

      if (e.key === "Enter") {
        const fromBuffer = bufferRef.current.trim();
        const fromField = (e.currentTarget.value ?? "").trim();
        const code =
          fromBuffer.length >= minLength && isBarcodeLikeCode(fromBuffer)
            ? fromBuffer
            : fromField.length >= minLength && isBarcodeLikeCode(fromField)
              ? fromField
              : "";

        reset();
        if (!code) return;

        e.preventDefault();
        e.stopPropagation();
        onScan(code);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Slow typing → start a fresh buffer (human search).
        if (elapsed > maxKeyGapMs) bufferRef.current = "";
        bufferRef.current += e.key;
        lastKeyAtRef.current = now;
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "Escape") {
        reset();
      }
    },
    [maxKeyGapMs, minLength, onScan, reset],
  );

  return { handleKeyDown, reset };
}
