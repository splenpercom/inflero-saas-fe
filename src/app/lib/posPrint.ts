import type { Language } from "../i18n/translations";
import { pickLang } from "../i18n/pickLang";
import type { PosOrderDetail } from "../api/sales";
import { formatDateTime } from "./dateFormat";
import { loadPosPrinterSettings } from "./posPrinterSettings";
import { ensureQzConnected, isQzAvailable, qzPrintHtml } from "./qzTrayClient";
import {
  buildDailySalesSummaryHtml,
  buildThermalReceiptHtml,
  type DailySalesSummaryPayload,
  type ThermalReceiptPayload,
} from "./thermalReceipt";

export type PosPrintRole = "receipt" | "kot" | "bar";

export type PosPrintResult = {
  channel: "qz" | "browser";
  printer?: string;
  /** True when QZ was preferred/mapped but we had to use the browser dialog. */
  fellBackFromQz?: boolean;
};

/** Serialize prints so KOT + bill (or double-clicks) cannot race the iframe/QZ job. */
let printChain: Promise<unknown> = Promise.resolve();

function enqueuePrint<T>(job: () => Promise<T>): Promise<T> {
  const run = printChain.then(job, job);
  // Keep the chain alive even if a job fails.
  printChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (v) => {
        window.clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        window.clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/** Make relative Vite/asset paths absolute so QZ / iframes can load them. */
export function toAbsoluteAssetUrl(src: string | null | undefined): string | null {
  if (!src?.trim()) return null;
  const s = src.trim();
  if (/^(https?:|data:|blob:)/i.test(s)) return s;
  if (typeof window === "undefined") return s;
  try {
    return new URL(s, window.location.href).href;
  } catch {
    return s;
  }
}

/**
 * Browser print without window.open — popups are blocked after async API calls.
 * Uses a temporary off-screen iframe and resolves after print() is invoked
 * (so callers can await before opening modals that steal focus).
 */
function browserPrintHtml(html: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    // Non-zero size off-screen — some browsers skip print on 0×0 frames.
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:800px;height:1200px;border:0;opacity:0;pointer-events:none;z-index:-1;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
    if (!doc) {
      iframe.remove();
      reject(new Error("Unable to open print frame"));
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const cleanup = () => {
      try {
        iframe.remove();
      } catch {
        /* ignore */
      }
    };

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.setTimeout(cleanup, 2500);
      resolve();
    };

    const runPrint = () => {
      try {
        const win = iframe.contentWindow;
        if (!win) {
          cleanup();
          reject(new Error("Unable to open print frame"));
          return;
        }
        win.focus();
        win.addEventListener?.("afterprint", finish, { once: true });
        win.print();
        // Fallback if afterprint never fires (common on Chromium + silent printers).
        window.setTimeout(finish, 1200);
      } catch (err) {
        cleanup();
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };

    let printed = false;
    const trigger = () => {
      if (printed) return;
      printed = true;
      // Short delay so layout/fonts settle inside the iframe.
      window.setTimeout(runPrint, 100);
    };

    iframe.onload = () => trigger();
    // doc.write often never fires onload — hard fallback.
    window.setTimeout(trigger, 500);
  });
}

/**
 * Resolve QZ target:
 * - KOT → kitchen, then billing
 * - receipt/bar → billing, then kitchen (so a single mapped printer still prints bills)
 */
export function resolvePosPrinterName(role: PosPrintRole): string {
  const settings = loadPosPrinterSettings();
  const receipt = settings.receiptPrinter.trim();
  const kot = settings.kotPrinter.trim();
  if (role === "kot") return kot || receipt;
  return receipt || kot;
}

function payloadForChannel(
  payload: ThermalReceiptPayload,
  channel: "qz" | "browser",
): ThermalReceiptPayload {
  // QZ rasterize frequently fails or hangs on remote/relative <img> logos.
  // Prefer text-only company header for silent thermal print reliability.
  if (channel === "qz") {
    return { ...payload, logoSrc: null };
  }
  return {
    ...payload,
    logoSrc: toAbsoluteAssetUrl(payload.logoSrc) ?? payload.logoSrc,
  };
}

async function tryQzPrint(
  role: PosPrintRole,
  language: Language,
  payload: ThermalReceiptPayload,
  printer: string,
  paperWidthMm: 58 | 80,
): Promise<void> {
  const copy =
    role === "kot" ? "kitchen" : role === "bar" ? "bar" : "customer";
  const html = buildThermalReceiptHtml(payloadForChannel(payload, "qz"), {
    language,
    copy,
    paperWidthMm,
  });
  await withTimeout(ensureQzConnected(), 8000, "QZ connect");
  await withTimeout(qzPrintHtml(printer, html, paperWidthMm), 20000, "QZ print");
}

async function tryBrowserPrint(
  role: PosPrintRole,
  language: Language,
  payload: ThermalReceiptPayload,
  paperWidthMm: 58 | 80,
): Promise<void> {
  const copy =
    role === "kot" ? "kitchen" : role === "bar" ? "bar" : "customer";
  const html = buildThermalReceiptHtml(payloadForChannel(payload, "browser"), {
    language,
    copy,
    paperWidthMm,
  });
  await browserPrintHtml(html);
}

/**
 * Print receipt / KOT / Bar.
 * - Mapped QZ printer → silent print (no logo images — reliable on thermal)
 * - Else browser dialog
 * Jobs are queued so concurrent POS actions cannot race.
 */
export async function printPosTicket(opts: {
  role: PosPrintRole;
  language: Language;
  payload: ThermalReceiptPayload;
  forceBrowser?: boolean;
}): Promise<PosPrintResult> {
  return enqueuePrint(async () => {
    const settings = loadPosPrinterSettings();
    const printer = resolvePosPrinterName(opts.role);
    const paperWidthMm = settings.paperWidthMm;

    const wantQz =
      !opts.forceBrowser && settings.preferQz && !!printer;

    if (wantQz) {
      const qzUp = await withTimeout(
        isQzAvailable().catch(() => false),
        8000,
        "QZ availability",
      ).catch(() => false);

      if (qzUp) {
        try {
          await tryQzPrint(opts.role, opts.language, opts.payload, printer, paperWidthMm);
          return { channel: "qz" as const, printer };
        } catch {
          // Fall through to browser — still deliver a bill.
        }
      }
    }

    await tryBrowserPrint(opts.role, opts.language, opts.payload, paperWidthMm);
    return {
      channel: "browser" as const,
      printer: printer || undefined,
      fellBackFromQz: wantQz,
    };
  });
}

/** @deprecated Prefer printPosTicket — kept for callers that already built HTML. */
export async function printThermalHtml(opts: {
  role: PosPrintRole;
  html: string;
  forceBrowser?: boolean;
}): Promise<PosPrintResult> {
  return enqueuePrint(async () => {
    const settings = loadPosPrinterSettings();
    const printer = resolvePosPrinterName(opts.role);

    const wantQz =
      !opts.forceBrowser && settings.preferQz && !!printer;

    if (wantQz) {
      const qzUp = await withTimeout(
        isQzAvailable().catch(() => false),
        8000,
        "QZ availability",
      ).catch(() => false);
      if (qzUp) {
        try {
          await withTimeout(ensureQzConnected(), 8000, "QZ connect");
          await withTimeout(
            qzPrintHtml(printer, opts.html, settings.paperWidthMm),
            20000,
            "QZ print",
          );
          return { channel: "qz" as const, printer };
        } catch {
          /* browser fallback */
        }
      }
    }

    await browserPrintHtml(opts.html);
    return {
      channel: "browser" as const,
      printer: printer || undefined,
      fellBackFromQz: wantQz,
    };
  });
}

/** Print today's product sales summary on the bill/receipt printer. */
export async function printDailySalesSummary(opts: {
  language: Language;
  payload: DailySalesSummaryPayload;
  forceBrowser?: boolean;
}): Promise<PosPrintResult> {
  const settings = loadPosPrinterSettings();
  // Reuse queue via printThermalHtml after building HTML (no logo for QZ path inside).
  const htmlBrowser = buildDailySalesSummaryHtml(
    {
      ...opts.payload,
      logoSrc: toAbsoluteAssetUrl(opts.payload.logoSrc) ?? opts.payload.logoSrc,
    },
    {
      language: opts.language,
      paperWidthMm: settings.paperWidthMm,
    },
  );
  const htmlQz = buildDailySalesSummaryHtml(
    { ...opts.payload, logoSrc: null },
    {
      language: opts.language,
      paperWidthMm: settings.paperWidthMm,
    },
  );

  return enqueuePrint(async () => {
    const printer = resolvePosPrinterName("receipt");
    const wantQz =
      !opts.forceBrowser && settings.preferQz && !!printer;

    if (wantQz) {
      const qzUp = await withTimeout(
        isQzAvailable().catch(() => false),
        8000,
        "QZ availability",
      ).catch(() => false);
      if (qzUp) {
        try {
          await withTimeout(ensureQzConnected(), 8000, "QZ connect");
          await withTimeout(
            qzPrintHtml(printer, htmlQz, settings.paperWidthMm),
            20000,
            "QZ print",
          );
          return { channel: "qz" as const, printer };
        } catch {
          /* browser */
        }
      }
    }

    await browserPrintHtml(htmlBrowser);
    return {
      channel: "browser" as const,
      printer: printer || undefined,
      fellBackFromQz: wantQz,
    };
  });
}

export async function canSilentPrint(role: PosPrintRole): Promise<boolean> {
  const settings = loadPosPrinterSettings();
  const printer = resolvePosPrinterName(role);
  if (!settings.preferQz || !printer) return false;
  return withTimeout(isQzAvailable(), 5000, "QZ availability").catch(() => false);
}

function parseMoney(value: string | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Map a loaded POS order into the shared thermal print payload. */
export function posOrderToThermalPayload(
  order: PosOrderDetail,
  opts: {
    language: Language;
    companyName: string;
    logoSrc?: string | null;
    customerPhone?: string;
  },
): ThermalReceiptPayload {
  const language = opts.language;
  const t = (az: string, en: string) => pickLang(language, az, en);
  const orderDate = new Date(order.date);
  const dateStr = Number.isNaN(orderDate.getTime())
    ? order.date
    : formatDateTime(orderDate, language);

  const method = (order.paymentMethod ?? "").toUpperCase();
  const paymentMethod =
    method === "CARD" || method === "CREDIT_CARD"
      ? t("Kart", "Card")
      : method === "CASH" || method === "CASH_ON_HAND"
        ? t("Nağd", "Cash")
        : order.paymentMethod?.trim() || t("Göstərilməyib", "Not specified");

  const subtotal = order.items.reduce(
    (sum, item) => sum + parseMoney(item.price) * item.quantity,
    0,
  );
  const total = parseMoney(order.grandTotal);
  const paid = parseMoney(order.paid);
  const paymentStatusLabel =
    order.paymentStatus.toLowerCase() === "paid" || (total > 0 && paid >= total)
      ? t("Ödənilib", "Paid")
      : order.paymentStatus.toLowerCase() === "unpaid"
        ? t("Gözləyir", "Pending")
        : order.paymentStatus || "—";

  const tableLabel = order.table
    ? order.table.name?.trim() || String(order.table.number)
    : undefined;

  return {
    orderNo: order.reference,
    date: dateStr,
    customer: order.customerName?.trim() || t("Anonim", "Anonymous"),
    customerPhone: opts.customerPhone?.trim() || "—",
    vehicle: order.vehicleLabel ?? undefined,
    mileage: order.mileageAtService ?? undefined,
    employee: order.billerName?.trim() || "—",
    items: order.items.map((item) => ({
      name: item.productName,
      qty: item.quantity,
      price: parseMoney(item.price),
    })),
    subtotal,
    shipping: parseMoney(order.shipping),
    serviceFee: parseMoney(order.serviceFee),
    discount: parseMoney(order.discount),
    discountLabel: t("Endirim", "Discount"),
    total,
    paymentMethod,
    paymentStatusLabel,
    tableLabel,
    companyName: opts.companyName,
    logoSrc: opts.logoSrc,
    siteFooter: "app.inflero.com",
  };
}

/** Convenience: map order detail → thermal print (receipt or KOT). */
export async function printPosOrderTicket(opts: {
  order: PosOrderDetail;
  role: PosPrintRole;
  language: Language;
  companyName: string;
  logoSrc?: string | null;
  customerPhone?: string;
}): Promise<PosPrintResult> {
  const payload = posOrderToThermalPayload(opts.order, {
    language: opts.language,
    companyName: opts.companyName,
    logoSrc: opts.logoSrc,
    customerPhone: opts.customerPhone,
  });
  return printPosTicket({
    role: opts.role,
    language: opts.language,
    payload,
  });
}
