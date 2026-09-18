/** Per-terminal POS printer mapping (this browser / PC only). */

export type PaperWidthMm = 58 | 80;

export type PosPrinterSettings = {
  receiptPrinter: string;
  kotPrinter: string;
  paperWidthMm: PaperWidthMm;
  /** Prefer QZ Tray silent print when connected; else browser dialog. */
  preferQz: boolean;
};

const TERMINAL_ID_KEY = "inflero.pos.terminalId";
const settingsKey = (terminalId: string) => `inflero.pos.printers.v1.${terminalId}`;

const DEFAULT_SETTINGS: PosPrinterSettings = {
  receiptPrinter: "",
  kotPrinter: "",
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
    paperWidthMm: next.paperWidthMm === 58 ? 58 : 80,
    preferQz: next.preferQz !== false,
  };
  localStorage.setItem(settingsKey(getPosTerminalId()), JSON.stringify(clean));
}
