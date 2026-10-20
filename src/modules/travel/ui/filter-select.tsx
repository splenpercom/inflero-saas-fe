import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOption[];
  className?: string;
}

export function FilterSelect({ value, onChange, options, className = "" }: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || dropRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Re-position if scroll happens while open
  useEffect(() => {
    if (!open) return;
    function onScroll() {
      if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    }
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open]);

  function handleToggle() {
    if (!open && btnRef.current) {
      setRect(btnRef.current.getBoundingClientRect());
    }
    setOpen(v => !v);
  }

  const current = options.find(o => o.value === value) ?? options[0];

  return (
    <div className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs bg-white dark:bg-gray-900 border rounded-lg font-medium whitespace-nowrap transition-colors w-full ${
          open
            ? "border-[#14b8a6] text-gray-900 dark:text-white dark:border-[#14b8a6]/60"
            : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <span className="flex-1 text-left">{current?.label}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && rect && createPortal(
        <div
          ref={dropRef}
          style={{
            position: "fixed",
            top: rect.bottom + 4,
            left: rect.left,
            minWidth: rect.width,
            zIndex: 99999,
          }}
          className="w-max bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 max-h-56 overflow-y-auto"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                opt.value === value
                  ? "bg-[#14b8a6]/8 text-[#14b8a6] dark:bg-[#14b8a6]/20 dark:text-[#14b8a6] font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <span className="flex-1">{opt.label}</span>
              {opt.value === value && <Check className="w-3 h-3 opacity-70 flex-shrink-0" />}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
