import { Delete } from "lucide-react";
import { cn } from "./utils";

const DIGIT_ROWS: string[][] = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["Clear", "0", "backspace"],
];

type DigitKeypadProps = {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
  className?: string;
  /** Larger keys for full-screen POS overlay */
  size?: "md" | "lg";
};

/**
 * Digits-only on-screen keypad (0–9 + clear/backspace). No decimal —
 * used for POS staff passcodes and User Management PIN entry.
 */
export function DigitKeypad({
  value,
  onChange,
  maxLength = 4,
  className,
  size = "md",
}: DigitKeypadProps) {
  const applyKey = (key: string) => {
    if (key === "Clear") {
      onChange("");
      return;
    }
    if (key === "backspace") {
      onChange(value.slice(0, -1));
      return;
    }
    if (!/^\d$/.test(key)) return;
    if (value.length >= maxLength) return;
    onChange(value + key);
  };

  const keyBtn =
    size === "lg"
      ? "h-14 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xl font-semibold text-gray-900 dark:text-white active:bg-gray-100 dark:active:bg-gray-700"
      : "h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-base font-semibold text-gray-900 dark:text-white active:bg-gray-100 dark:active:bg-gray-700";

  return (
    <div className={cn("space-y-1.5", className)}>
      {DIGIT_ROWS.map((row) => (
        <div key={row.join("-")} className="grid grid-cols-3 gap-1.5">
          {row.map((key) => (
            <button
              key={key}
              type="button"
              className={cn(
                keyBtn,
                key === "Clear" && "text-red-600 dark:text-red-400 text-sm font-medium",
              )}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => applyKey(key)}
            >
              {key === "backspace" ? (
                <Delete className={cn("mx-auto", size === "lg" ? "w-5 h-5" : "w-4 h-4")} />
              ) : (
                key
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
