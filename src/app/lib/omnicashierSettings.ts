/** Per-terminal OmniCashier fiscal device settings (this browser / PC only). */

import { getPosTerminalId } from "./posPrinterSettings";

export type OmnicashierSettings = {
  /** Master switch — off = zero OmniCashier calls. */
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  /** Used when PosOrder/lines have no taxPercent (CorporatePOS often omits tax). */
  defaultVatPercent: number;
};

const settingsKey = (terminalId: string) => `inflero.pos.omnicashier.v1.${terminalId}`;

const DEFAULT_SETTINGS: OmnicashierSettings = {
  enabled: false,
  host: "",
  port: 8989,
  username: "",
  password: "",
  defaultVatPercent: 18,
};

export function loadOmnicashierSettings(): OmnicashierSettings {
  try {
    const raw = localStorage.getItem(settingsKey(getPosTerminalId()));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<OmnicashierSettings>;
    const port =
      typeof parsed.port === "number" && Number.isFinite(parsed.port) && parsed.port > 0
        ? Math.floor(parsed.port)
        : 8989;
    const vat =
      typeof parsed.defaultVatPercent === "number" && Number.isFinite(parsed.defaultVatPercent)
        ? parsed.defaultVatPercent
        : 18;
    return {
      enabled: parsed.enabled === true,
      host: typeof parsed.host === "string" ? parsed.host.trim() : "",
      port,
      username: typeof parsed.username === "string" ? parsed.username : "",
      password: typeof parsed.password === "string" ? parsed.password : "",
      defaultVatPercent: vat,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveOmnicashierSettings(next: OmnicashierSettings): void {
  const clean: OmnicashierSettings = {
    enabled: next.enabled === true,
    host: next.host.trim(),
    port: next.port > 0 ? Math.floor(next.port) : 8989,
    username: next.username.trim(),
    password: next.password,
    defaultVatPercent:
      Number.isFinite(next.defaultVatPercent) && next.defaultVatPercent >= 0
        ? next.defaultVatPercent
        : 18,
  };
  localStorage.setItem(settingsKey(getPosTerminalId()), JSON.stringify(clean));
}

export function isOmnicashierConfigured(s: OmnicashierSettings = loadOmnicashierSettings()): boolean {
  return s.enabled && Boolean(s.host.trim()) && Boolean(s.username.trim()) && Boolean(s.password);
}

/**
 * Base URL for OmniCashier POST /v2.
 * Host `proxy` (or empty with port 8989 on HTTPS pages) uses Vite `/omni-api` → local mock,
 * so https://localhost:5173 can talk to http://127.0.0.1:8989 without mixed-content blocks.
 */
export function omnicashierBaseUrl(s: OmnicashierSettings = loadOmnicashierSettings()): string {
  const host = s.host.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const useProxy =
    host.toLowerCase() === "proxy" ||
    host.toLowerCase() === "vite-proxy" ||
    (typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      (host === "127.0.0.1" || host.toLowerCase() === "localhost"));
  if (useProxy) {
    return `${window.location.origin}/omni-api/v2`;
  }
  return `http://${host}:${s.port}/v2`;
}
