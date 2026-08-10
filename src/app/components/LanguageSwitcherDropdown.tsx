import { Globe } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import type { Language } from "../i18n/translations";
import { SimpleDropdown, SimpleDropdownItem } from "./ui/simple-dropdown";

const LANG_OPTIONS: { code: Language; label: string; short: string }[] = [
  { code: "en", label: "🇬🇧 English", short: "EN" },
  { code: "az", label: "🇦🇿 Azərbaycan", short: "AZ" },
  { code: "ru", label: "🇷🇺 Русский", short: "RU" },
];

type Props = {
  /** Dark glass style for login/landing; light matches corporate header */
  variant?: "dark" | "light";
};

export function LanguageSwitcherDropdown({ variant = "dark" }: Props) {
  const { language, setLanguage } = useLanguage();
  const current = LANG_OPTIONS.find((o) => o.code === language) ?? LANG_OPTIONS[1];

  if (variant === "light") {
    return (
      <SimpleDropdown
        estimatedHeight={140}
        trigger={
          <button
            type="button"
            className="px-2 py-1.5 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition flex items-center gap-1.5 bg-[#0026f6]/10 dark:bg-[#0026f6]/20 border border-[#0026f6]/20 dark:border-[#0026f6]/30"
          >
            <Globe className="w-3.5 h-3.5 text-[#0026f6] dark:text-[#0026f6]" />
            <span className="text-xs font-medium text-[#0026f6] dark:text-[#0026f6]">{current.short}</span>
          </button>
        }
      >
        {LANG_OPTIONS.map((o) => (
          <SimpleDropdownItem
            key={o.code}
            onClick={() => setLanguage(o.code)}
            className={language === o.code ? "bg-[#0026f6]/20 dark:bg-[#0026f6]/30" : ""}
          >
            <span className="text-xs">{o.label}</span>
          </SimpleDropdownItem>
        ))}
      </SimpleDropdown>
    );
  }

  return (
    <SimpleDropdown
      estimatedHeight={140}
      trigger={
        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/6 border border-white/10 hover:bg-white/10 transition-all"
        >
          <Globe className="w-3.5 h-3.5" />
          {current.short}
        </button>
      }
    >
      {LANG_OPTIONS.map((o) => (
        <SimpleDropdownItem
          key={o.code}
          onClick={() => setLanguage(o.code)}
          className={language === o.code ? "bg-gray-100 dark:bg-gray-800" : ""}
        >
          <span className="text-xs">{o.label}</span>
        </SimpleDropdownItem>
      ))}
    </SimpleDropdown>
  );
}
