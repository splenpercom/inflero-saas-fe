import { useEffect } from "react";
import { applyDocumentFavicon } from "../lib/branding";

/** Applies default Inflero favicon on every route. */
export function AppBrandingEffects() {
  useEffect(() => {
    applyDocumentFavicon();
  }, []);

  return null;
}
