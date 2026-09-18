/**
 * Thin wrapper around QZ Tray (must be installed on the POS PC).
 * Unsigned mode: QZ may show an allow prompt until certificates are configured.
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

export async function qzPrintHtml(
  printerName: string,
  html: string,
  paperWidthMm: 58 | 80,
): Promise<void> {
  if (!printerName.trim()) {
    throw new Error("Printer name is required");
  }
  // Match CSS usable width so QZ does not scale a wider page onto a narrow roll.
  const pageWidthMm = paperWidthMm === 58 ? 48 : 68;
  const qz = await ensureQzConnected();
  const config = qz.configs.create(printerName, {
    scaleContent: true,
    rasterize: true,
    units: "mm",
    size: { width: paperWidthMm },
    margins: { top: 0, right: 2, bottom: 0, left: 2 },
    colorType: "blackwhite",
    interpolation: "bilinear",
  });
  await qz.print(config, [
    {
      type: "pixel",
      format: "html",
      flavor: "plain",
      data: html,
      options: { pageWidth: pageWidthMm },
    },
  ]);
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
