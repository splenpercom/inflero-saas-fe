import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { createPortal } from "react-dom";
import { cn } from "./utils";
import { useFloatingPosition } from "./useFloatingPosition";

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const DROPDOWN_ESTIMATED_HEIGHT = 240;

export function CustomSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  required = false,
  disabled = false,
  className = "",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || "");
  const anchorRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);

  const position = useFloatingPosition(anchorRef, isOpen, DROPDOWN_ESTIMATED_HEIGHT, portalRef);

  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        portalRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onChange?.(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div className={cn("relative", className)} ref={anchorRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setIsOpen(!isOpen);
        }}
        className={cn(
          "w-full min-w-[140px] px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between",
          required && !selectedValue && "border-red-500",
          disabled && "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80",
        )}
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform flex-shrink-0 ml-2", isOpen && "rotate-180")} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={portalRef}
            className="fixed z-[9999] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            style={{
              top: position.top,
              left: position.left,
              width: Math.max(position.width, 140),
            }}
          >
            <div className="max-h-60 overflow-y-auto scrollbar-hide">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-between ${
                    selectedValue === option.value
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "text-gray-900 dark:text-white"
                  }`}
                >
                  <span>{option.label}</span>
                  {selectedValue === option.value && (
                    <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
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
