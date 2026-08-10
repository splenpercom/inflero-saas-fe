import logoLight from "../../assets/logo.png";
import logoDark from "../../assets/logo-dark.png";
import favicon from "../../assets/favicon.png";
import { getCompanyLogoUrl } from "./userDisplay";

export const APP_LOGO_LIGHT = logoLight;
export const APP_LOGO_DARK = logoDark;
export const APP_FAVICON = favicon;

export function getAppLogo(darkMode: boolean): string {
  return darkMode ? APP_LOGO_DARK : APP_LOGO_LIGHT;
}

export function getBrandLogoUrl(
  tenant: Parameters<typeof getCompanyLogoUrl>[0],
  darkMode: boolean,
): string {
  return getCompanyLogoUrl(tenant, darkMode) ?? getAppLogo(darkMode);
}

const FAVICON_SELECTOR = 'link[rel="icon"]';

/** Set the browser tab icon (default Inflero favicon unless overridden). */
export function applyDocumentFavicon(url?: string | null): void {
  const href = url ?? APP_FAVICON;
  let link = document.querySelector<HTMLLinkElement>(FAVICON_SELECTOR);
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    document.head.appendChild(link);
  }
  if (link.getAttribute("href") !== href) {
    link.setAttribute("href", href);
  }
}

