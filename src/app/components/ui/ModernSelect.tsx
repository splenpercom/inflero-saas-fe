import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
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
}

const DROPDOWN_ESTIMATED_HEIGHT = 240;

export function ModernSelect({
  value,
  onChange,
  options,
  placeholder = "Select",
  className,
  buttonClassName,
  minWidth = 120,
}: ModernSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT, portalRef);
  const selectedOption = options.find((opt) => opt.value === value);

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

  return (
    <div className={cn("relative", className)} ref={anchorRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] flex items-center justify-between hover:border-gray-400 dark:hover:border-gray-600 transition-colors",
          buttonClassName,
        )}
        style={{ minWidth }}
      >
        <span className={cn("truncate", !value && "text-gray-400")}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-gray-400 transition-transform flex-shrink-0 ml-2",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, minWidth),
            }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {options.map((option) => (
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
                      ? "bg-[#e8ebff] dark:bg-[#0026f6]/20 text-[#0026f6] dark:text-[#0026f6]"
                      : "text-gray-900 dark:text-white",
                  )}
                >
                  <span className="flex-1 truncate">{option.label}</span>
                  {value === option.value && (
                    <Check className="w-3.5 h-3.5 text-[#0026f6] dark:text-[#0026f6] flex-shrink-0" />
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
