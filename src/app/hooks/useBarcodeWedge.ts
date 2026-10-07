import { useCallback, useEffect, useRef, type KeyboardEvent } from "react";

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

export type GlobalBarcodeWedgeOptions = BarcodeWedgeOptions & {
  /**
   * When false, the document listener stays attached but ignores keys.
   * Pass a value that updates each render — stored in a ref (no rebind).
   */
  enabled?: boolean;
};

/** True when value looks like a barcode/SKU (not a normal multi-word search). */
export function isBarcodeLikeCode(value: string): boolean {
  const code = value.trim();
  return code.length >= 4 && CODE_LIKE.test(code) && !/\s/.test(code);
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

/** Radix/AlertDialog and custom overlays that declare modality. */
function isModalBlockingScan(): boolean {
  return Boolean(document.querySelector("[aria-modal='true']"));
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
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

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
        void onScanRef.current(code);
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
    [maxKeyGapMs, minLength, reset],
  );

  return { handleKeyDown, reset };
}

/**
 * Always-ready POS scan: one document keydown listener, buffer in refs only
 * (no React state / re-renders while the gun types).
 *
 * Skips when focus is in an input/textarea/select (those use useBarcodeWedge),
 * when enabled=false, or when an aria-modal overlay is open.
 * On a consumed scan, preventDefault so Enter does not activate a focused button.
 */
export function useGlobalBarcodeWedge(
  onScan: (code: string) => void | Promise<unknown>,
  opts?: GlobalBarcodeWedgeOptions,
) {
  const minLength = opts?.minLength ?? 4;
  const maxKeyGapMs = opts?.maxKeyGapMs ?? DEFAULT_WEDGE_MAX_KEY_GAP_MS;
  const bufferRef = useRef("");
  const lastKeyAtRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const enabledRef = useRef(opts?.enabled !== false);
  enabledRef.current = opts?.enabled !== false;

  useEffect(() => {
    const reset = () => {
      bufferRef.current = "";
      lastKeyAtRef.current = 0;
    };

    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!enabledRef.current) return;
      if (e.defaultPrevented) return;
      if (isEditableTarget(e.target)) return;
      if (isModalBlockingScan()) {
        reset();
        return;
      }

      const now = Date.now();
      const elapsed = now - lastKeyAtRef.current;

      if (e.key === "Enter") {
        const code = bufferRef.current.trim();
        reset();
        if (code.length < minLength || !isBarcodeLikeCode(code)) return;

        // Stop Enter from activating a focused button / default action.
        e.preventDefault();
        e.stopPropagation();
        void onScanRef.current(code);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (elapsed > maxKeyGapMs) bufferRef.current = "";
        bufferRef.current += e.key;
        lastKeyAtRef.current = now;
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete" || e.key === "Escape") {
        reset();
      }
    };

    // Capture so we see keys even when a button holds focus, before click handlers.
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [minLength, maxKeyGapMs]);
}
