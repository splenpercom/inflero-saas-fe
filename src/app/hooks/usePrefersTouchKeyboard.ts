import { useEffect, useRef, useState, type MutableRefObject } from "react";

/**
 * True when the device's primary pointer is coarse (typical phone/tablet).
 * Not enough alone for hybrids (touchscreen laptops often report fine pointer).
 */
export function usePrefersTouchKeyboard(): boolean {
  const [prefersTouch, setPrefersTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    const mq = window.matchMedia("(pointer: coarse)");
    const sync = () => setPrefersTouch(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return prefersTouch;
}

/**
 * Tracks the most recent pointer type so focus can open the on-screen keyboard
 * only when the user actually tapped (not mouse/trackpad).
 */
export function useLastPointerType(): MutableRefObject<"mouse" | "pen" | "touch" | ""> {
  const last = useRef<"mouse" | "pen" | "touch" | "">("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen" || e.pointerType === "mouse") {
        last.current = e.pointerType;
      }
    };
    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return last;
}
