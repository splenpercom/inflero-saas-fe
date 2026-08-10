import { createContext, useContext, useCallback, useMemo, type ReactNode } from "react";
import { pickLang } from "../../../app/i18n/pickLang";

export type Language = "az" | "en" | "ru";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "az",
  setLanguage: () => {},
});

type LanguageProviderProps = {
  children: ReactNode;
  /** When set (host sync), module language follows the app header picker. */
  language?: Language;
  onLanguageChange?: (lang: Language) => void;
};

export function LanguageProvider({
  children,
  language: controlledLanguage,
  onLanguageChange,
}: LanguageProviderProps) {
  const language: Language = controlledLanguage ?? "az";
  const setLanguage = useCallback(
    (lang: Language) => {
      onLanguageChange?.(lang);
    },
    [onLanguageChange],
  );

  const value = useMemo(
    () => ({ language, setLanguage }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * AZ / EN / RU helper — matches host header language.
 * RU uses explicit `ru` when provided, otherwise the platform `inlineRuMap` via `pickLang`.
 */
export function useTr() {
  const { language } = useLanguage();
  return (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
}
