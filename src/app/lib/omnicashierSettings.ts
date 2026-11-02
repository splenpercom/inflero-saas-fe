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

/** Loopback bridge port (see scripts/omni-lan-bridge.mjs). */
export const OMNI_LAN_BRIDGE_PORT = 18989;

const DEFAULT_SETTINGS: OmnicashierSettings = {
  enabled: false,
  host: "",
  port: 8989,
  username: "",
  password: "",
  defaultVatPercent: 18,
};

/** Accept "192.168.1.10" or "192.168.1.10:8989" in the host field. */
export function parseOmniHostPort(
  hostRaw: string,
  portRaw: number,
): { host: string; port: number } {
  let host = hostRaw.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  let port =
    typeof portRaw === "number" && Number.isFinite(portRaw) && portRaw > 0
      ? Math.floor(portRaw)
      : 8989;
  const colon = host.lastIndexOf(":");
  if (colon > 0 && /^\d{2,5}$/.test(host.slice(colon + 1))) {
    port = Number(host.slice(colon + 1));
    host = host.slice(0, colon).trim();
  }
  return { host, port: port > 0 ? port : 8989 };
}

export function loadOmnicashierSettings(): OmnicashierSettings {
  try {
    const raw = localStorage.getItem(settingsKey(getPosTerminalId()));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<OmnicashierSettings>;
    const { host, port } = parseOmniHostPort(
      typeof parsed.host === "string" ? parsed.host : "",
      typeof parsed.port === "number" && Number.isFinite(parsed.port) ? parsed.port : 8989,
    );
    const vat =
      typeof parsed.defaultVatPercent === "number" && Number.isFinite(parsed.defaultVatPercent)
        ? parsed.defaultVatPercent
        : 18;
    return {
      enabled: parsed.enabled === true,
      host,
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
  const { host, port } = parseOmniHostPort(next.host, next.port);
  const clean: OmnicashierSettings = {
    enabled: next.enabled === true,
    host,
    port,
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

function normalizeHost(raw: string): string {
  return parseOmniHostPort(raw, 8989).host;
}

function isLoopbackHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "127.0.0.1" || h === "localhost" || h === "::1";
}

function isAppOnLoopback(): boolean {
  if (typeof window === "undefined") return false;
  return isLoopbackHost(window.location.hostname);
}

/** Private LAN IPv4 (device on same Wi‑Fi). */
export function isPrivateLanHost(host: string): boolean {
  const h = normalizeHost(host).toLowerCase();
  if (!h || isLoopbackHost(h)) return false;
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/** Send X-Omni-Target so Vite proxy / LAN bridge know the real device. */
export function omnicashierUsesTargetHeader(
  s: OmnicashierSettings = loadOmnicashierSettings(),
): boolean {
  const host = normalizeHost(s.host);
  if (!host) return false;
  const lower = host.toLowerCase();
  if (lower === "proxy" || lower === "vite-proxy") return false;
  return isPrivateLanHost(host);
}

/**
 * True when production HTTPS must use the external localhost bridge process
 * (Inflero OmniBridge install.bat). Vite HTTPS on localhost uses same-origin /omni-api instead.
 */
export function needsOmniLanBridge(s: OmnicashierSettings = loadOmnicashierSettings()): boolean {
  if (typeof window === "undefined") return false;
  if (window.location.protocol !== "https:") return false;
  if (!omnicashierUsesTargetHeader(s)) return false;
  // Local Vite HTTPS can forward via /omni-api (same origin — no mixed content).
  if (isAppOnLoopback()) return false;
  return true;
}

/** Target header for bridge / Vite proxy (host:port of the real device). */
export function omnicashierTargetHeader(
  s: OmnicashierSettings = loadOmnicashierSettings(),
): string | null {
  const { host, port } = parseOmniHostPort(s.host, s.port);
  if (!host || !isPrivateLanHost(host)) return null;
  return `${host}:${port}`;
}

/**
 * Base URL for OmniCashier POST /v2.
 * - `proxy` / HTTPS→device-as-localhost → same-origin `/omni-api` (Vite)
 * - HTTPS production + LAN device IP → `http://127.0.0.1:18989` (omni:bridge)
 * - HTTP pages → direct `http://device:port/v2`
 */
export function omnicashierBaseUrl(s: OmnicashierSettings = loadOmnicashierSettings()): string {
  const { host, port } = parseOmniHostPort(s.host, s.port);
  const lower = host.toLowerCase();
  const useSameOriginProxy =
    lower === "proxy" ||
    lower === "vite-proxy" ||
    (typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      isLoopbackHost(host)) ||
    // Vite HTTPS localhost + real LAN IP: proxy through /omni-api
    (typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      isAppOnLoopback() &&
      isPrivateLanHost(host));

  if (useSameOriginProxy && typeof window !== "undefined") {
    return `${window.location.origin}/omni-api/v2`;
  }

  if (needsOmniLanBridge(s)) {
    return `http://127.0.0.1:${OMNI_LAN_BRIDGE_PORT}/v2`;
  }

  return `http://${host || "127.0.0.1"}:${port}/v2`;
}

/** Quick check that the POS PC bridge is running (production HTTPS only). */
export async function probeOmniLanBridge(): Promise<{ ok: boolean; detail: string }> {
  const url = `http://127.0.0.1:${OMNI_LAN_BRIDGE_PORT}/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      return {
        ok: false,
        detail: `Bridge HTTP ${res.status}. Reinstall Inflero OmniBridge (install.bat) on this POS PC.`,
      };
    }
    return { ok: true, detail: `Bridge OK on 127.0.0.1:${OMNI_LAN_BRIDGE_PORT}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      detail: `Bridge not reachable at ${url} (${msg}). On this POS PC install Inflero OmniBridge once (install.bat) — it auto-starts with Windows.`,
    };
  } finally {
    clearTimeout(timer);
  }
}
