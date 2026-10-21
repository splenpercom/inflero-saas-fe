import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_AZ = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
  "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
];
const MONTHS_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function monthsForLang(language: string) {
  if (language === "az") return MONTHS_AZ;
  if (language === "ru") return MONTHS_RU;
  return MONTHS_EN;
}

/** Wide fixed range so staff can jump far back / ahead. */
const YEAR_MIN = 2000;
const YEAR_MAX = 2045;

function toMonthStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(m: string, delta: number) {
  const [y, mo] = m.split("-").map(Number);
  return toMonthStr(new Date(y!, (mo! - 1) + delta, 1));
}

function buildYears(selectedYear: number): number[] {
  const start = Math.min(YEAR_MIN, selectedYear);
  const end = Math.max(YEAR_MAX, selectedYear);
  const years: number[] = [];
  for (let y = start; y <= end; y++) years.push(y);
  return years;
}

type MenuKind = "month" | "year" | null;

function NavMenu({
  open,
  anchorRect,
  onClose,
  children,
  width,
  align = "left",
  scrollToSelected,
}: {
  open: boolean;
  anchorRect: DOMRect | null;
  onClose: () => void;
  children: ReactNode;
  width: number;
  align?: "left" | "right";
  scrollToSelected?: boolean;
}) {
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      const t = e.target as Node;
      if (dropRef.current?.contains(t)) return;
      onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !scrollToSelected || !dropRef.current) return;
    const selected = dropRef.current.querySelector("[data-selected='true']");
    if (selected instanceof HTMLElement) {
      selected.scrollIntoView({ block: "center" });
    }
  }, [open, scrollToSelected]);

  if (!open || !anchorRect) return null;

  const left =
    align === "right"
      ? Math.max(8, anchorRect.right - width)
      : Math.min(anchorRect.left, window.innerWidth - width - 8);

  return createPortal(
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        top: anchorRect.bottom + 4,
        left,
        width,
        zIndex: 99999,
      }}
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto"
    >
      {children}
    </div>,
    document.body,
  );
}

export function MonthYearNav({
  value,
  onChange,
  language = "en",
  className = "",
}: {
  /** YYYY-MM */
  value: string;
  onChange: (ym: string) => void;
  language?: string;
  className?: string;
}) {
  const parts = value.split("-");
  const year = Number(parts[0]) || new Date().getFullYear();
  const month = Number(parts[1]) || new Date().getMonth() + 1;
  const months = monthsForLang(language);
  const years = useMemo(() => buildYears(year), [year]);

  const [menu, setMenu] = useState<MenuKind>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const monthBtnRef = useRef<HTMLButtonElement>(null);
  const yearBtnRef = useRef<HTMLButtonElement>(null);

  function openMenu(kind: MenuKind, el: HTMLButtonElement | null) {
    if (!el) return;
    if (menu === kind) {
      setMenu(null);
      return;
    }
    setRect(el.getBoundingClientRect());
    setMenu(kind);
  }

  function setMonth(m: number) {
    onChange(`${year}-${String(m).padStart(2, "0")}`);
    setMenu(null);
  }

  function setYear(y: number) {
    onChange(`${y}-${String(month).padStart(2, "0")}`);
    setMenu(null);
  }

  const monthLabel = months[month - 1] ?? months[0];
  const triggerCls = (active: boolean) =>
    `inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors ${
      active
        ? "bg-[#14b8a6]/10 text-[#14b8a6] dark:bg-[#14b8a6]/20 dark:text-[#14b8a6]"
        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
    }`;

  const optionCls = (selected: boolean) =>
    `w-full text-left flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
      selected
        ? "bg-[#14b8a6]/8 text-[#14b8a6] dark:bg-[#14b8a6]/20 dark:text-[#14b8a6] font-medium"
        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
    }`;

  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg px-1 py-1 ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, -1))}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-[#14b8a6]"
        aria-label="Previous month"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      <button
        ref={monthBtnRef}
        type="button"
        onClick={() => openMenu("month", monthBtnRef.current)}
        className={triggerCls(menu === "month")}
        aria-haspopup="listbox"
        aria-expanded={menu === "month"}
      >
        <span>{monthLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${menu === "month" ? "rotate-180 text-[#14b8a6]" : ""}`}
        />
      </button>

      <button
        ref={yearBtnRef}
        type="button"
        onClick={() => openMenu("year", yearBtnRef.current)}
        className={triggerCls(menu === "year")}
        aria-haspopup="listbox"
        aria-expanded={menu === "year"}
      >
        <span className="tabular-nums">{year}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform ${menu === "year" ? "rotate-180 text-[#14b8a6]" : ""}`}
        />
      </button>

      <button
        type="button"
        onClick={() => onChange(shiftMonth(value, 1))}
        className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 hover:text-[#14b8a6]"
        aria-label="Next month"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>

      <NavMenu
        open={menu === "month"}
        anchorRect={rect}
        onClose={() => setMenu(null)}
        width={148}
      >
        {months.map((label, i) => {
          const m = i + 1;
          const selected = m === month;
          return (
            <button
              key={label}
              type="button"
              data-selected={selected ? "true" : undefined}
              onClick={() => setMonth(m)}
              className={optionCls(selected)}
            >
              <span className="flex-1">{label}</span>
              {selected && <Check className="w-3 h-3 opacity-70 flex-shrink-0" />}
            </button>
          );
        })}
      </NavMenu>

      <NavMenu
        open={menu === "year"}
        anchorRect={rect}
        onClose={() => setMenu(null)}
        width={112}
        align="right"
        scrollToSelected
      >
        {years.map((y) => {
          const selected = y === year;
          return (
            <button
              key={y}
              type="button"
              data-selected={selected ? "true" : undefined}
              onClick={() => setYear(y)}
              className={`${optionCls(selected)} tabular-nums`}
            >
              <span className="flex-1">{y}</span>
              {selected && <Check className="w-3 h-3 opacity-70 flex-shrink-0" />}
            </button>
          );
        })}
      </NavMenu>
    </div>
  );
}

export function dateToMonthStr(d: Date): string {
  return toMonthStr(d);
}

export function monthStrToDate(ym: string): Date {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y!, (m! || 1) - 1, 1);
}
