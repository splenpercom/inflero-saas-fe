import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Delete, X } from "lucide-react";
import { sanitizeNumericTyping } from "../../lib/numericInput";
import { cn } from "./utils";

export type TouchKeyboardProps = {
  open: boolean;
  mode: "full" | "numpad";
  value: string;
  onChange: (next: string) => void;
  onClose: () => void;
  title?: string;
};

const NUMPAD_KEYS: string[][] = [
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  ["0", ".", "backspace"],
];

const FULL_ROWS: string[][] = [
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
  ["shift", "z", "x", "c", "v", "b", "n", "m", "backspace"],
];

type Pos = { x: number; y: number };

function clampPos(x: number, y: number, w: number, h: number): Pos {
  const maxX = Math.max(8, window.innerWidth - w - 8);
  const maxY = Math.max(8, window.innerHeight - h - 8);
  return {
    x: Math.min(Math.max(8, x), maxX),
    y: Math.min(Math.max(8, y), maxY),
  };
}

function TouchKeyboard({
  open,
  mode,
  value,
  onChange,
  onClose,
  title,
}: TouchKeyboardProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const [shift, setShift] = useState(false);

  useEffect(() => {
    if (!open) {
      setShift(false);
      return;
    }
    // Default near bottom-center once opened
    const w = mode === "numpad" ? 320 : 560;
    const h = mode === "numpad" ? 360 : 320;
    setPos((prev) => {
      if (prev) return clampPos(prev.x, prev.y, w, h);
      return clampPos(
        (window.innerWidth - w) / 2,
        window.innerHeight - h - 24,
        w,
        h,
      );
    });
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      const el = panelRef.current;
      if (!el || !pos) return;
      const rect = el.getBoundingClientRect();
      setPos(clampPos(pos.x, pos.y, rect.width, rect.height));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, pos]);

  const applyKey = useCallback(
    (key: string) => {
      if (key === "Done") {
        onClose();
        return;
      }
      if (key === "Clear") {
        onChange("");
        return;
      }
      if (key === "backspace") {
        const next = value.slice(0, -1);
        onChange(
          mode === "numpad"
            ? sanitizeNumericTyping(next, { allowDecimal: true })
            : next,
        );
        return;
      }
      if (key === "shift") {
        setShift((s) => !s);
        return;
      }
      if (key === "space") {
        onChange(`${value} `);
        return;
      }

      let ch = key;
      if (mode === "full" && /^[a-z]$/.test(key)) {
        ch = shift ? key.toUpperCase() : key;
      }

      const next = `${value}${ch}`;
      onChange(
        mode === "numpad"
          ? sanitizeNumericTyping(next, { allowDecimal: true })
          : next,
      );
    },
    [mode, onChange, onClose, shift, value],
  );

  const onPointerDownHandle = (e: ReactPointerEvent) => {
    if (!pos) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
  };

  const onPointerMoveHandle = (e: ReactPointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    const el = panelRef.current;
    const w = el?.offsetWidth ?? 320;
    const h = el?.offsetHeight ?? 300;
    setPos(
      clampPos(
        d.origX + (e.clientX - d.startX),
        d.origY + (e.clientY - d.startY),
        w,
        h,
      ),
    );
  };

  const onPointerUpHandle = () => {
    dragRef.current = null;
  };

  if (!open || !pos) return null;

  const keyBtn =
    "min-h-[44px] min-w-[44px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium active:bg-gray-100 dark:active:bg-gray-700 touch-manipulation select-none";

  const renderKey = (key: string, extraClass = "") => {
    const label =
      key === "backspace" ? (
        <Delete className="w-4 h-4 mx-auto" />
      ) : key === "shift" ? (
        "⇧"
      ) : key === "space" ? (
        "Space"
      ) : mode === "full" && /^[a-z]$/.test(key) && shift ? (
        key.toUpperCase()
      ) : (
        key
      );

    return (
      <button
        key={key}
        type="button"
        className={cn(keyBtn, extraClass)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => applyKey(key)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none">
      <div
        ref={panelRef}
        className="pointer-events-auto absolute w-[min(100vw-16px,560px)] rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 shadow-2xl"
        style={{
          left: pos.x,
          top: pos.y,
          width: mode === "numpad" ? 320 : undefined,
          maxWidth: mode === "numpad" ? 320 : 560,
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-3 py-2 cursor-grab active:cursor-grabbing border-b border-gray-200 dark:border-gray-700 rounded-t-xl bg-white dark:bg-gray-800"
          onPointerDown={onPointerDownHandle}
          onPointerMove={onPointerMoveHandle}
          onPointerUp={onPointerUpHandle}
          onPointerCancel={onPointerUpHandle}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-1 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">
              {title ?? (mode === "numpad" ? "Numpad" : "Keyboard")}
            </span>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-white"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClose}
            aria-label="Close keyboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-2 space-y-1.5">
          {mode === "numpad" ? (
            <>
              {NUMPAD_KEYS.map((row) => (
                <div key={row.join("-")} className="grid grid-cols-3 gap-1.5">
                  {row.map((k) => renderKey(k, "text-base"))}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                {renderKey("Clear", "text-red-600 dark:text-red-400")}
                {renderKey(
                  "Done",
                  "bg-[#14b8a6] text-white border-[#14b8a6] dark:bg-[#0d9488] hover:opacity-90",
                )}
              </div>
            </>
          ) : (
            <>
              {FULL_ROWS.map((row, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-1 justify-center",
                    idx === 2 && "px-3",
                  )}
                >
                  {row.map((k) =>
                    renderKey(
                      k,
                      cn(
                        "flex-1 px-1",
                        k === "shift" && shift && "bg-[#14b8a6]/15 dark:bg-[#14b8a6]/20",
                        k === "backspace" && "max-w-[56px]",
                      ),
                    ),
                  )}
                </div>
              ))}
              <div className="flex gap-1.5">
                {renderKey("Clear", "flex-[0.8] text-red-600 dark:text-red-400")}
                {renderKey("space", "flex-[2.5]")}
                {renderKey(
                  "Done",
                  "flex-[0.8] bg-[#14b8a6] text-white border-[#14b8a6] dark:bg-[#0d9488]",
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export { TouchKeyboard };
