import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, Translations, translations } from "./translations";
import { getStorageItem } from "../lib/storageMigration";
import { STORAGE_KEYS } from "../lib/storageKeys";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

function readSavedLanguage(): Language {
  if (typeof window === "undefined") return "az";

  try {
    const saved = getStorageItem(localStorage, STORAGE_KEYS.language);
    return saved === "en" || saved === "az" || saved === "ru" ? saved : "az";
  } catch {
    return "az";
  }
}

const defaultContextValue: LanguageContextType = {
  language: "az",
  setLanguage: () => {},
  t: translations.az,
};

const LanguageContext = createContext<LanguageContextType>(defaultContextValue);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readSavedLanguage);

  useEffect(() => {
    setLanguageState(readSavedLanguage());
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEYS.language, lang);
      } catch (e) {
        console.error("Failed to save language to localStorage:", e);
      }
    }
  };

  const t = translations[language];

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  return context;
}
