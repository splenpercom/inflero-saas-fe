import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Search } from "lucide-react";
import { cn } from "./utils";
import { useFloatingPosition } from "./useFloatingPosition";

export interface ModernSelectOption {
  value: string;
  label: string;
}

interface ModernSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: ModernSelectOption[];
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  minWidth?: number;
  disabled?: boolean;
  /** Show a search input at the top of the dropdown. */
  searchable?: boolean;
  searchPlaceholder?: string;
}

const DROPDOWN_ESTIMATED_HEIGHT = 280;

export function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
  buttonClassName,
  minWidth = 120,
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT, portalRef);
  const selectedOption = options.find((opt) => opt.value === value);

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
      // Focus after portal mounts
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
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      className={cn("relative min-w-0 w-full", className)}
      ref={anchorRef}
      style={{ minWidth }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full min-w-0 overflow-hidden px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] flex items-center justify-between gap-2 hover:border-gray-400 dark:hover:border-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-gray-300 dark:disabled:hover:border-gray-700",
          buttonClassName,
        )}
      >
        <span className={cn("truncate min-w-0 flex-1 text-left", !selectedOption && "text-gray-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

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
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between gap-2",
                      value === option.value
                        ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6] dark:text-[#14b8a6]"
                        : "text-gray-900 dark:text-white",
                    )}
                    title={option.label}
                  >
                    <span className="flex-1 truncate">{option.label}</span>
                    {value === option.value && (
                      <Check className="w-3.5 h-3.5 text-[#14b8a6] dark:text-[#14b8a6] flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
