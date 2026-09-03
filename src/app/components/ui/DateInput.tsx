import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Calendar } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { useLanguage } from "../../i18n/LanguageContext";
import { useFloatingPosition } from "./useFloatingPosition";
import {
  AZ_MONTHS_LONG,
  AZ_WEEKDAYS_SHORT,
  EN_MONTHS_LONG,
  EN_WEEKDAYS_SHORT,
  RU_MONTHS_LONG,
  RU_WEEKDAYS_SHORT,
} from "../../lib/dateFormat";

import { pickLang } from "../../i18n/pickLang";
interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  /** When opening with no value, start calendar around this many years in the past (good for DOB). */
  defaultYearsAgo?: number;
}

const CALENDAR_ESTIMATED_HEIGHT = 360;
const MIN_YEAR_OFFSET = 100;

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function DateInput({
  value,
  onChange,
  placeholder,
  required,
  className = "",
  defaultYearsAgo = 25,
}: DateInputProps) {
  const { language } = useLanguage();
  const [showCalendar, setShowCalendar] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [viewDate, setViewDate] = useState(() => new Date());
  const anchorRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const position = useFloatingPosition(anchorRef, showCalendar, CALENDAR_ESTIMATED_HEIGHT);
  const today = useMemo(() => startOfDay(new Date()), []);
  const currentYear = today.getFullYear();
  const minYear = currentYear - MIN_YEAR_OFFSET;

  const formatPlaceholder = pickLang(language, "GG/AA/İİİİ", "DD/MM/YYYY");

  const monthNames =
    language === "az"
      ? [...AZ_MONTHS_LONG]
      : language === "ru"
        ? [...RU_MONTHS_LONG]
        : [...EN_MONTHS_LONG];

  const dayNames =
    language === "az"
      ? [...AZ_WEEKDAYS_SHORT]
      : language === "ru"
        ? [...RU_WEEKDAYS_SHORT]
        : [...EN_WEEKDAYS_SHORT];

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= minYear; y--) years.push(y);
    return years;
  }, [currentYear, minYear]);

  const selectedDate = useMemo(() => {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? startOfDay(d) : null;
  }, [value]);

  useEffect(() => {
    if (value) {
      try {
        const date = parse(value, "yyyy-MM-dd", new Date());
        if (isValid(date)) {
          setInputValue(format(date, "dd/MM/yyyy"));
        }
      } catch {
        setInputValue("");
      }
    } else {
      setInputValue("");
    }
  }, [value]);

  useEffect(() => {
    if (!showCalendar) return;
    if (value) {
      const d = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(d)) {
        setViewDate(d);
        return;
      }
    }
    const fallback = new Date();
    fallback.setFullYear(fallback.getFullYear() - defaultYearsAgo);
    setViewDate(fallback);
  }, [showCalendar, value, defaultYearsAgo]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target) || calendarRef.current?.contains(target)) return;
      setShowCalendar(false);
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showCalendar]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth; day++) days.push(day);
    return days;
  }, [viewYear, viewMonth]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "");
    if (val.length >= 2) val = val.slice(0, 2) + "/" + val.slice(2);
    if (val.length >= 5) val = val.slice(0, 5) + "/" + val.slice(5);
    if (val.length > 10) val = val.slice(0, 10);
    setInputValue(val);

    if (val.length === 10) {
      try {
        const parsedDate = parse(val, "dd/MM/yyyy", new Date());
        if (isValid(parsedDate) && startOfDay(parsedDate) <= today) {
          onChange(format(parsedDate, "yyyy-MM-dd"));
        }
      } catch {
        /* invalid */
      }
    } else if (val.length === 0) {
      onChange("");
    }
  };

  const setViewMonth = (month: number) => {
    setViewDate(new Date(viewYear, month, 1));
  };

  const setViewYear = (year: number) => {
    setViewDate(new Date(year, viewMonth, 1));
  };

  const handleDayClick = (day: number) => {
    const picked = startOfDay(new Date(viewYear, viewMonth, day));
    if (picked > today) return;
    onChange(format(picked, "yyyy-MM-dd"));
    setShowCalendar(false);
  };

  const isDaySelected = (day: number) =>
    !!selectedDate &&
    selectedDate.getFullYear() === viewYear &&
    selectedDate.getMonth() === viewMonth &&
    selectedDate.getDate() === day;

  const isDayDisabled = (day: number) => startOfDay(new Date(viewYear, viewMonth, day)) > today;

  const calendarPanel = showCalendar ? (
    <div
      ref={calendarRef}
      className="fixed z-[9999] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 w-[300px]"
      style={{ top: position.top, left: position.left }}
    >
      <div className="flex items-center gap-2 mb-3">
        <select
          value={viewMonth}
          onChange={(e) => setViewMonth(Number(e.target.value))}
          className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
          aria-label={pickLang(language, "Ay", "Month")}
        >
          {monthNames.map((name, i) => (
            <option key={name} value={i}>
              {name}
            </option>
          ))}
        </select>
        <select
          value={viewYear}
          onChange={(e) => setViewYear(Number(e.target.value))}
          className="w-[88px] shrink-0 px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
          aria-label={pickLang(language, "İl", "Year")}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day, i) => (
          <div key={i} className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, i) => (
          <div key={i}>
            {day ? (
              <button
                type="button"
                disabled={isDayDisabled(day)}
                onClick={() => handleDayClick(day)}
                className={`w-full aspect-square flex items-center justify-center text-xs rounded transition-colors ${
                  isDayDisabled(day)
                    ? "text-gray-300 dark:text-gray-600 cursor-not-allowed"
                    : isDaySelected(day)
                      ? "bg-[#14b8a6] text-white hover:bg-[#14b8a6]/90"
                      : "text-gray-900 dark:text-white hover:bg-orange-100 dark:hover:bg-orange-900/30"
                }`}
              >
                {day}
              </button>
            ) : (
              <div className="w-full aspect-square" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
        <button
          type="button"
          onClick={() => {
            onChange(format(today, "yyyy-MM-dd"));
            setShowCalendar(false);
          }}
          className="flex-1 text-xs py-1.5 text-[#14b8a6] dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
        >
          {pickLang(language, "Bu gün", "Today")}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setInputValue("");
              setShowCalendar(false);
            }}
            className="flex-1 text-xs py-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            {pickLang(language, "Təmizlə", "Clear")}
          </button>
        )}
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" ref={anchorRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder || formatPlaceholder}
          required={required}
          className={`w-full px-3 py-1.5 pr-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] ${className}`}
          maxLength={10}
        />
        <button
          type="button"
          onClick={() => setShowCalendar(!showCalendar)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <Calendar className="w-3.5 h-3.5" />
        </button>
      </div>

      {calendarPanel && createPortal(calendarPanel, document.body)}
    </div>
  );
}
