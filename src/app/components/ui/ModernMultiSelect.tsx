import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search, X } from "lucide-react";
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
  /** Show a search input at the top of the dropdown. */
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = "Search...",
}: ModernMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT, portalRef);
  const selected = values.map((value) => {
    const fromOptions = options.find((opt) => opt.value === value);
    if (fromOptions) return fromOptions;
    return { value, label: labelMap?.[value] || value };
  });

  const filteredOptions = useMemo(() => {
    if (!searchable || !search.trim()) return options;
    const q = search.trim().toLocaleLowerCase("az");
    return options.filter((opt) => opt.label.toLocaleLowerCase("az").includes(q));
  }, [options, search, searchable]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      return;
    }
    if (searchable) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [isOpen, searchable]);

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
            {searchable && (
              <div className="sticky top-0 z-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        e.stopPropagation();
                        setIsOpen(false);
                      }
                    }}
                    placeholder={searchPlaceholder}
                    className="w-full pl-7 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#14b8a6]"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-2.5 text-xs text-gray-400 text-center">
                  {search.trim() ? "No results" : "No options"}
                </div>
              ) : (
                filteredOptions.map((option) => {
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
