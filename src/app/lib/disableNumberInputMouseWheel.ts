/**
 * Prevent mouse-wheel from changing focused <input type="number"> values.
 * Call once at app boot (document capture listener).
 */
export function disableNumberInputMouseWheel(): void {
  const onWheel = (e: WheelEvent) => {
    const target = e.target;
    if (!(target instanceof HTMLInputElement)) return;
    if (target.type !== "number") return;
    if (document.activeElement !== target) return;
    e.preventDefault();
  };

  document.addEventListener("wheel", onWheel, { passive: false, capture: true });
}
