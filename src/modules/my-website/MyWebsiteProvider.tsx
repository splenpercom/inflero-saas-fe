import type { ReactNode } from "react";
import { useLanguage as useHostLanguage } from "../../app/i18n/LanguageContext";
import { LanguageProvider, type Language } from "./i18n";
import "./styles/my-website.css";

function mapHostLanguage(lang: string): Language {
  if (lang === "az" || lang === "en" || lang === "ru") return lang;
  return "en";
}

/** Wrap my-website routes once. Language follows the host header picker. */
export function MyWebsiteProvider({ children }: { children: ReactNode }) {
  const { language: hostLanguage, setLanguage: setHostLanguage } = useHostLanguage();
  return (
    <LanguageProvider
      language={mapHostLanguage(hostLanguage)}
      onLanguageChange={(lang) => setHostLanguage(lang)}
    >
      {children}
    </LanguageProvider>
  );
}
