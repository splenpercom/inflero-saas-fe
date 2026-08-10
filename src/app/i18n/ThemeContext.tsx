import React, { createContext, useContext, useState, useEffect } from "react";
import { getStorageItem, getStorageJson } from "../lib/storageMigration";
import { STORAGE_KEYS } from "../lib/storageKeys";

function readInitialTheme(): "light" | "dark" {
  const saved = getStorageItem(localStorage, STORAGE_KEYS.darkMode);
  if (saved === "true") return "dark";
  if (saved === "false") return "light";
  return "light";
}

interface ThemeContextType {
  themeColor: string;
  setThemeColor: (color: string) => void;
  logoUrl: string | null;
  setLogoUrl: (url: string | null) => void;
  faviconUrls: { [key: string]: string | null };
  setFaviconUrls: (urls: { [key: string]: string | null }) => void;
  showRestaurantNameWithLogo: boolean;
  setShowRestaurantNameWithLogo: (show: boolean) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeColor, setThemeColorState] = useState<string>(() => {
    return getStorageItem(localStorage, STORAGE_KEYS.themeColor) ?? "#0026f6";
  });

  const [logoUrl, setLogoUrlState] = useState<string | null>(() => {
    return getStorageItem(localStorage, STORAGE_KEYS.logoUrl);
  });

  const [faviconUrls, setFaviconUrlsState] = useState<{ [key: string]: string | null }>(() => {
    return getStorageJson(localStorage, STORAGE_KEYS.faviconUrls) ?? {};
  });

  const [showRestaurantNameWithLogo, setShowRestaurantNameWithLogoState] = useState<boolean>(() => {
    return getStorageJson<boolean>(localStorage, STORAGE_KEYS.showRestaurantName) ?? true;
  });

  const [theme, setThemeState] = useState<"light" | "dark">(readInitialTheme);

  const setThemeColor = (color: string) => {
    setThemeColorState(color);
    localStorage.setItem(STORAGE_KEYS.themeColor, color);
  };

  const setLogoUrl = (url: string | null) => {
    setLogoUrlState(url);
    if (url) {
      localStorage.setItem(STORAGE_KEYS.logoUrl, url);
    } else {
      localStorage.removeItem(STORAGE_KEYS.logoUrl);
    }
  };

  const setFaviconUrls = (urls: { [key: string]: string | null }) => {
    setFaviconUrlsState(urls);
    localStorage.setItem(STORAGE_KEYS.faviconUrls, JSON.stringify(urls));
  };

  const setShowRestaurantNameWithLogo = (show: boolean) => {
    setShowRestaurantNameWithLogoState(show);
    localStorage.setItem(STORAGE_KEYS.showRestaurantName, JSON.stringify(show));
  };

  const toggleTheme = () => {
    setThemeState((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem(STORAGE_KEYS.darkMode, String(newTheme === "dark"));
      return newTheme;
    });
  };

  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        setThemeColor,
        logoUrl,
        setLogoUrl,
        faviconUrls,
        setFaviconUrls,
        showRestaurantNameWithLogo,
        setShowRestaurantNameWithLogo,
        theme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
