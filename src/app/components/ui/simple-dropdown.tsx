import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useFloatingPosition } from "./useFloatingPosition";

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  estimatedHeight?: number;
}

export function SimpleDropdown({
  trigger,
  children,
  align = "end",
  estimatedHeight = 240,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, estimatedHeight);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || portalRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={anchorRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] min-w-[200px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-xl"
            style={{
              top: position.top,
              left: align === "end" ? position.left + position.width - Math.max(position.width, 200) : position.left,
              width: Math.max(position.width, 200),
            }}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </div>,
          document.body,
        )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export function SimpleDropdownItem({ onClick, children, className = "" }: DropdownItemProps) {
  return (
    <div
      onClick={onClick}
      className={`relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}
    >
      {children}
    </div>
  );
}

export function SimpleDropdownSeparator() {
  return <div className="my-1 h-px bg-gray-200 dark:bg-gray-700" />;
}

export function SimpleDropdownLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>;
}
