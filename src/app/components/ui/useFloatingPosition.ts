import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

export interface FloatingPosition {
  top: number;
  left: number;
  width: number;
  openAbove: boolean;
}

/** Viewport-fixed coordinates for portaled popovers inside scrollable modals. */
export function useFloatingPosition(
  anchorRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  estimatedHeight = 280,
  contentRef?: RefObject<HTMLElement | null>,
): FloatingPosition {
  const [position, setPosition] = useState<FloatingPosition>({
    top: 0,
    left: 0,
    width: 0,
    openAbove: false,
  });

  const updatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const dropdownHeight = contentRef?.current?.getBoundingClientRect().height ?? estimatedHeight;
    const gap = 4;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceBelow < dropdownHeight + gap && rect.top > dropdownHeight + gap;

    setPosition({
      top: openAbove ? rect.top - dropdownHeight - gap : rect.bottom + gap,
      left: rect.left,
      width: rect.width,
      openAbove,
    });
  }, [anchorRef, contentRef, estimatedHeight]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const raf = requestAnimationFrame(() => updatePosition());

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  return position;
}
