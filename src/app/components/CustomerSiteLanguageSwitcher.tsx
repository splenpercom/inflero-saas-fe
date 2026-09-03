import { useEffect, useRef, useState } from "react";
import { ChevronDown, Globe } from "lucide-react";
import {
  CUSTOMER_SITE_LANG_OPTIONS,
  type CustomerSiteLang,
} from "../lib/customerSiteLang";

export function CustomerSiteLanguageSwitcher({
  lang,
  onChange,
}: {
  lang: CustomerSiteLang;
  onChange: (lang: CustomerSiteLang) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const current = CUSTOMER_SITE_LANG_OPTIONS.find((option) => option.code === lang);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-3 h-3" />
        <span>{current?.code.toUpperCase() ?? lang.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="listbox"
          className="absolute right-0 mt-1 min-w-[9.5rem] py-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
        >
          {CUSTOMER_SITE_LANG_OPTIONS.map((option) => (
            <button
              key={option.code}
              type="button"
              role="option"
              aria-selected={lang === option.code}
              onClick={() => {
                onChange(option.code);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                lang === option.code
                  ? "bg-[#f0f3ff] text-[#14b8a6] font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
