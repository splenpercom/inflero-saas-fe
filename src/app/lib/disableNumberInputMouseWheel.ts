/**
 * Prevent mouse-wheel from changing <input type="number"> values.
 * Call once at app boot (document capture listener).
 */
export function disableNumberInputMouseWheel(): void {
  const onWheel = (e: WheelEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "number") return;
    // Only block when the number field is focused — otherwise allow normal page scroll.
    if (document.activeElement !== target) return;
    e.preventDefault();
    target.blur();
  };

  document.addEventListener("wheel", onWheel, { passive: false, capture: true });
}
