/** Per-terminal POS printer mapping (this browser / PC only). */

export type PaperWidthMm = 58 | 80;

/**
 * Stored printer target string:
 * - Windows / QZ named printer: `"EPSON TM-T20"`
 * - Ethernet / Wi‑Fi ESC/POS (raw port 9100): `"net:192.168.0.21:9100"`
 */
export type PosPrinterSettings = {
  receiptPrinter: string;
  kotPrinter: string;
  /** Bar ticket printer (Dining + Send to Bar). Falls back to receipt when empty. */
  barPrinter: string;
  /** Product barcode / price-label printer. Falls back to receipt when empty. */
  barcodePrinter: string;
  paperWidthMm: PaperWidthMm;
  /** Prefer QZ Tray silent print when connected; else browser dialog. */
  preferQz: boolean;
};

export type PrinterTarget =
  | { kind: "named"; name: string }
  | { kind: "network"; host: string; port: number };

const NET_PREFIX = "net:";
const DEFAULT_RAW_PORT = 9100;

/** True for IPv4 host (optional :port already stripped). */
export function isIpv4Host(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host.trim());
}

export function formatNetworkPrinterTarget(host: string, port = DEFAULT_RAW_PORT): string {
  const h = host.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const cleaned = h.includes(":") && !h.startsWith("[") ? h.split(":")[0]! : h;
  const p =
    typeof port === "number" && Number.isFinite(port) && port > 0 && port <= 65535
      ? Math.floor(port)
      : DEFAULT_RAW_PORT;
  return `${NET_PREFIX}${cleaned}:${p}`;
}

/**
 * Parse a saved printer field into a QZ target.
 * Also accepts bare `192.168.0.21` or `192.168.0.21:9100` typed by operators.
 */
export function parsePrinterTarget(raw: string | null | undefined): PrinterTarget | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  if (s.toLowerCase().startsWith(NET_PREFIX)) {
    const rest = s.slice(NET_PREFIX.length).trim();
    const colon = rest.lastIndexOf(":");
    if (colon > 0) {
      const host = rest.slice(0, colon).trim();
      const port = Number(rest.slice(colon + 1));
      if (host && Number.isFinite(port) && port > 0) {
        return { kind: "network", host, port: Math.floor(port) };
      }
    }
    if (rest && isIpv4Host(rest)) {
      return { kind: "network", host: rest, port: DEFAULT_RAW_PORT };
    }
    return null;
  }

  // Bare IP or IP:port (common when cashiers paste from self-test slip).
  const bareColon = s.lastIndexOf(":");
  if (bareColon > 0 && isIpv4Host(s.slice(0, bareColon))) {
    const host = s.slice(0, bareColon).trim();
    const port = Number(s.slice(bareColon + 1));
    if (Number.isFinite(port) && port > 0) {
      return { kind: "network", host, port: Math.floor(port) };
    }
  }
  if (isIpv4Host(s)) {
    return { kind: "network", host: s, port: DEFAULT_RAW_PORT };
  }

  return { kind: "named", name: s };
}

export function printerTargetLabel(raw: string): string {
  const t = parsePrinterTarget(raw);
  if (!t) return "";
  if (t.kind === "network") return `${t.host}:${t.port} (LAN)`;
  return t.name;
}

const TERMINAL_ID_KEY = "inflero.pos.terminalId";
const settingsKey = (terminalId: string) => `inflero.pos.printers.v1.${terminalId}`;

const DEFAULT_SETTINGS: PosPrinterSettings = {
  receiptPrinter: "",
  kotPrinter: "",
  barPrinter: "",
  barcodePrinter: "",
  paperWidthMm: 80,
  preferQz: true,
};

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `term_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getPosTerminalId(): string {
  try {
    const existing = localStorage.getItem(TERMINAL_ID_KEY);
    if (existing && existing.trim()) return existing.trim();
    const id = randomId();
    localStorage.setItem(TERMINAL_ID_KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}

export function loadPosPrinterSettings(): PosPrinterSettings {
  try {
    const raw = localStorage.getItem(settingsKey(getPosTerminalId()));
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<PosPrinterSettings>;
    return {
      receiptPrinter: typeof parsed.receiptPrinter === "string" ? parsed.receiptPrinter : "",
      kotPrinter: typeof parsed.kotPrinter === "string" ? parsed.kotPrinter : "",
      barPrinter: typeof parsed.barPrinter === "string" ? parsed.barPrinter : "",
      barcodePrinter: typeof parsed.barcodePrinter === "string" ? parsed.barcodePrinter : "",
      paperWidthMm: parsed.paperWidthMm === 58 ? 58 : 80,
      preferQz: parsed.preferQz !== false,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function savePosPrinterSettings(next: PosPrinterSettings): void {
  const clean: PosPrinterSettings = {
    receiptPrinter: next.receiptPrinter.trim(),
    kotPrinter: next.kotPrinter.trim(),
    barPrinter: next.barPrinter.trim(),
    barcodePrinter: next.barcodePrinter.trim(),
    paperWidthMm: next.paperWidthMm === 58 ? 58 : 80,
    preferQz: next.preferQz !== false,
  };
  localStorage.setItem(settingsKey(getPosTerminalId()), JSON.stringify(clean));
}
