import { parsePrinterTarget } from "./posPrinterSettings";
import { thermalQzPageWidthMm } from "./thermalReceipt";

/**
 * Thin wrapper around QZ Tray (must be installed on the POS PC).
 * Unsigned mode: QZ may show an allow prompt until certificates are configured.
 *
 * Printer target may be a Windows printer name or `net:192.168.0.21:9100`
 * (Ethernet / Wi‑Fi ESC/POS raw port — typical for kitchen/bar thermals).
 *
 * Print modes (do not mix):
 * - Named Windows printer → pixel HTML (driver/spooler) — existing path, unchanged.
 * - Network IP:port → raw HTML converted to ESC/POS over TCP (addition for wireless).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QzApi = any;

let qzModule: QzApi | null = null;
let connectPromise: Promise<QzApi> | null = null;

async function loadQz(): Promise<QzApi> {
  if (qzModule) return qzModule;
  const mod = await import("qz-tray");
  qzModule = (mod as { default?: QzApi }).default ?? mod;
  return qzModule;
}

function configureUnsigned(qz: QzApi) {
  // Dev / first-ship: no signing cert yet. QZ may prompt the user to allow the site.
  if (typeof qz?.security?.setCertificatePromise === "function") {
    qz.security.setCertificatePromise((resolve: (v: string) => void) => {
      resolve("");
    });
  }
  if (typeof qz?.security?.setSignaturePromise === "function") {
    qz.security.setSignaturePromise(() => (resolve: (v: string) => void) => {
      resolve("");
    });
  }
}

export async function isQzAvailable(): Promise<boolean> {
  try {
    const qz = await ensureQzConnected();
    return !!qz?.websocket?.isActive?.();
  } catch {
    return false;
  }
}

export async function ensureQzConnected(): Promise<QzApi> {
  const qz = await loadQz();
  configureUnsigned(qz);
  if (qz.websocket?.isActive?.()) return qz;
  if (!connectPromise) {
    connectPromise = qz.websocket
      .connect()
      .then(() => qz)
      .catch((err: unknown) => {
        connectPromise = null;
        throw err;
      });
  }
  return connectPromise;
}

export async function listQzPrinters(): Promise<string[]> {
  const qz = await ensureQzConnected();
  const printers = await qz.printers.find();
  if (Array.isArray(printers)) return printers.map(String);
  if (typeof printers === "string") return [printers];
  return [];
}

function createQzPrinterConfig(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  qz: any,
  printerTarget: string,
  options: Record<string, unknown>,
) {
  const target = parsePrinterTarget(printerTarget);
  if (!target) {
    throw new Error("Printer name or network IP is required");
  }
  if (target.kind === "network") {
    // QZ Tray network/raw printer (Ethernet / Wi‑Fi ESC/POS, usually :9100).
    return qz.configs.create(
      { host: target.host, port: target.port },
      options,
    );
  }
  return qz.configs.create(target.name, options);
}

function isNetworkPrinterTarget(printerTarget: string): boolean {
  return parsePrinterTarget(printerTarget)?.kind === "network";
}

/** Named Windows / driver path — pixel raster HTML (existing behavior). */
function pixelHtmlPrintData(html: string, pageWidthMm: number) {
  return [
    {
      type: "pixel" as const,
      format: "html" as const,
      flavor: "plain" as const,
      data: html,
      options: { pageWidth: pageWidthMm },
    },
  ];
}

/**
 * Network IP:9100 path — QZ converts HTML → ESC/POS and writes the raw socket.
 * Does not change named-printer pixel jobs.
 */
function networkEscPosHtmlPrintData(
  html: string,
  opts: { pageWidthMm: number; pageHeightMm?: number },
) {
  return [
    {
      type: "raw" as const,
      format: "html" as const,
      flavor: "plain" as const,
      data: html,
      options: {
        language: "ESCPOS",
        pageWidth: opts.pageWidthMm,
        ...(opts.pageHeightMm != null ? { pageHeight: opts.pageHeightMm } : {}),
      },
    },
  ];
}

export async function qzPrintHtml(
  printerName: string,
  html: string,
  paperWidthMm: 58 | 80,
): Promise<void> {
  if (!printerName.trim()) {
    throw new Error("Printer name is required");
  }
  // Match CSS usable width so QZ does not scale a wider page onto a narrow roll.
  const pageWidthMm = thermalQzPageWidthMm(paperWidthMm);
  const qz = await ensureQzConnected();
  const network = isNetworkPrinterTarget(printerName);

  if (network) {
    // Addition: wireless / Ethernet raw port — keep options minimal for host:port.
    const config = createQzPrinterConfig(qz, printerName, {});
    await qz.print(config, networkEscPosHtmlPrintData(html, { pageWidthMm }));
    return;
  }

  const config = createQzPrinterConfig(qz, printerName, {
    scaleContent: true,
    rasterize: true,
    units: "mm",
    size: { width: paperWidthMm },
    margins: { top: 0, right: 2, bottom: 0, left: 2 },
    colorType: "blackwhite",
    interpolation: "bilinear",
  });
  await qz.print(config, pixelHtmlPrintData(html, pageWidthMm));
}

/** Product barcode stickers — 30×20mm landscape (20×30 slip, long edge horizontal). */
export async function qzPrintBarcodeLabelHtml(
  printerName: string,
  html: string,
  opts?: { widthMm?: number; heightMm?: number },
): Promise<void> {
  if (!printerName.trim()) {
    throw new Error("Printer name is required");
  }
  const widthMm = opts?.widthMm ?? 30;
  const heightMm = opts?.heightMm ?? 20;
  const qz = await ensureQzConnected();
  const network = isNetworkPrinterTarget(printerName);

  if (network) {
    const config = createQzPrinterConfig(qz, printerName, {});
    await qz.print(
      config,
      networkEscPosHtmlPrintData(html, {
        pageWidthMm: widthMm,
        pageHeightMm: heightMm,
      }),
    );
    return;
  }

  const config = createQzPrinterConfig(qz, printerName, {
    scaleContent: true,
    rasterize: true,
    units: "mm",
    orientation: "landscape",
    size: { width: widthMm, height: heightMm },
    margins: { top: 0, right: 0, bottom: 0, left: 0 },
    colorType: "blackwhite",
    interpolation: "bilinear",
  });
  await qz.print(config, pixelHtmlPrintData(html, widthMm));
}

export function getQzConnectionHint(language: "az" | "en" | "ru" = "en"): string {
  if (language === "az") {
    return "QZ Tray işləmir. POS kompüterində QZ Tray quraşdırın və işə salın (qz.io), sonra yenidən cəhd edin.";
  }
  if (language === "ru") {
    return "QZ Tray не запущен. Установите и запустите QZ Tray на POS-ПК (qz.io), затем повторите.";
  }
  return "QZ Tray is not running. Install and start QZ Tray on this POS PC (qz.io), then try again.";
}
