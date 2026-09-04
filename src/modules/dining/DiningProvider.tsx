import type { ReactNode } from "react";

/** Wrap dining dashboard routes. Language already comes from the host LanguageProvider. */
export function DiningProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
