import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "./utils";
import { useFloatingPosition } from "./useFloatingPosition";

export interface ModernMultiSelectOption {
  value: string;
  label: string;
}

interface ModernMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  options: ModernMultiSelectOption[];
  /** Fallback labels for values not yet present in `options` (e.g. while options load). */
  labelMap?: Record<string, string>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  minWidth?: number;
  disabled?: boolean;
}

const DROPDOWN_ESTIMATED_HEIGHT = 260;

export function ModernMultiSelect({
  values,
  onChange,
  options,
  labelMap,
  placeholder = "Select",
  className,
  buttonClassName,
  minWidth = 120,
  disabled = false,
}: ModernMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT, portalRef);
  const selected = values.map((value) => {
    const fromOptions = options.find((opt) => opt.value === value);
    if (fromOptions) return fromOptions;
    return { value, label: labelMap?.[value] || value };
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || portalRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const toggle = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.map((s) => s.label).join(", ")
        : `${selected.length} selected`;

  return (
    <div className={cn("relative min-w-0 w-full", className)} ref={anchorRef} style={{ minWidth }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full min-w-0 overflow-hidden px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] flex items-center justify-between gap-2 hover:border-gray-400 dark:hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          buttonClassName,
        )}
      >
        <span className={cn("truncate min-w-0 flex-1 text-left", selected.length === 0 && "text-gray-400")}>
          {summary}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {selected.map((s) => (
            <span
              key={s.value}
              className="inline-flex items-center gap-1 max-w-full px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#0f766e] dark:text-[#5eead4]"
            >
              <span className="truncate">{s.label}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(s.value);
                  }}
                  className="flex-shrink-0 rounded hover:bg-[#99f6e4]/50 dark:hover:bg-[#14b8a6]/30"
                  aria-label={`Remove ${s.label}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      {isOpen &&
        !disabled &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, minWidth),
              minWidth,
            }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {options.length === 0 ? (
                <div className="px-3 py-2 text-xs text-gray-400">No options</div>
              ) : (
                options.map((option) => {
                  const checked = values.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={cn(
                        "w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-2",
                        checked
                          ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6]"
                          : "text-gray-900 dark:text-white",
                      )}
                      title={option.label}
                    >
                      <span className="flex-1 truncate">{option.label}</span>
                      {checked && <Check className="w-3.5 h-3.5 text-[#14b8a6] flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
