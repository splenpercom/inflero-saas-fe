import { useEffect, useState } from "react";

function readIsDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

/** Tracks the `dark` class on `<html>` (single source for theme-aware branding). */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(readIsDarkMode);

  useEffect(() => {
    const sync = () => setIsDark(readIsDarkMode());
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
