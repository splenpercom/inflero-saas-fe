import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../ui/utils";
import { useFloatingPosition } from "../ui/useFloatingPosition";

interface ModernSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  className?: string;
}

const DROPDOWN_ESTIMATED_HEIGHT = 240;

export function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (anchorRef.current?.contains(target) || portalRef.current?.contains(target)) return;
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, handleClickOutside]);

  const handleSelect = useCallback(
    (option: string) => {
      onChange(option);
      setIsOpen(false);
    },
    [onChange],
  );

  return (
    <div className={cn("relative", className)} ref={anchorRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full px-2.5 sm:px-3 py-1.5 sm:py-2 text-[11px] sm:text-xs border border-gray-200 dark:border-gray-700 rounded-md sm:rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:border-orange-300 dark:hover:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 dark:focus:ring-orange-400/50 transition-all flex items-center justify-between gap-2"
      >
        <span
          className={cn(
            "truncate",
            value ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-gray-500",
          )}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md sm:rounded-lg shadow-lg overflow-hidden"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, 140),
            }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  role="option"
                  aria-selected={value === option}
                  className={cn(
                    "w-full px-2.5 sm:px-3 py-2 sm:py-2.5 text-[11px] sm:text-xs text-left hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center justify-between gap-2",
                    value === option
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 font-medium"
                      : "text-gray-700 dark:text-gray-300",
                  )}
                >
                  <span className="truncate">{option}</span>
                  {value === option && (
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
