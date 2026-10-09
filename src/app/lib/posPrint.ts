import JsBarcode from "jsbarcode";
import type { Language } from "../i18n/translations";
import { pickLang } from "../i18n/pickLang";
import type { PosOrderDetail } from "../api/sales";
import { formatDateTime } from "./dateFormat";
import { loadPosPrinterSettings } from "./posPrinterSettings";
import {
  ensureQzConnected,
  isQzAvailable,
  qzPrintBarcodeLabelHtml,
  qzPrintHtml,
} from "./qzTrayClient";
import {
  buildDailySalesSummaryHtml,
  buildOpticsPrescriptionHtml,
  buildThermalReceiptHtml,
  type DailySalesSummaryPayload,
  type OpticsPrescriptionPrintPayload,
  type ThermalReceiptPayload,
} from "./thermalReceipt";
import type { OpticsPrescriptionMeta } from "../api/sales";

export type PosPrintRole = "receipt" | "kot" | "bar" | "barcode";

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
      "position:fixed;left:-10000px;top:0;width:900px;height:500px;border:0;opacity:0;pointer-events:none;z-index:-1;";
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
 * - bar → bar, then billing, then kitchen
 * - barcode → barcode label printer, then billing
 * - receipt → billing, then kitchen (so a single mapped printer still prints bills)
 */
export function resolvePosPrinterName(role: PosPrintRole): string {
  const settings = loadPosPrinterSettings();
  const receipt = settings.receiptPrinter.trim();
  const kot = settings.kotPrinter.trim();
  const bar = settings.barPrinter.trim();
  const barcode = settings.barcodePrinter.trim();
  if (role === "kot") return kot || receipt;
  if (role === "bar") return bar || receipt || kot;
  if (role === "barcode") return barcode || receipt || kot || bar;
  return receipt || kot || bar || barcode;
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
  barShowPrices?: boolean,
): Promise<void> {
  const copy =
    role === "kot" ? "kitchen" : role === "bar" ? "bar" : "customer";
  const html = buildThermalReceiptHtml(payloadForChannel(payload, "qz"), {
    language,
    copy,
    paperWidthMm,
    barShowPrices: role === "bar" ? barShowPrices === true : undefined,
  });
  await withTimeout(ensureQzConnected(), 8000, "QZ connect");
  await withTimeout(qzPrintHtml(printer, html, paperWidthMm), 20000, "QZ print");
}

async function tryBrowserPrint(
  role: PosPrintRole,
  language: Language,
  payload: ThermalReceiptPayload,
  paperWidthMm: 58 | 80,
  barShowPrices?: boolean,
): Promise<void> {
  const copy =
    role === "kot" ? "kitchen" : role === "bar" ? "bar" : "customer";
  const html = buildThermalReceiptHtml(payloadForChannel(payload, "browser"), {
    language,
    copy,
    paperWidthMm,
    barShowPrices: role === "bar" ? barShowPrices === true : undefined,
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
  /** When role is bar, print line prices + totals. */
  barShowPrices?: boolean;
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
          await tryQzPrint(
            opts.role,
            opts.language,
            opts.payload,
            printer,
            paperWidthMm,
            opts.barShowPrices,
          );
          return { channel: "qz" as const, printer };
        } catch {
          // Fall through to browser — still deliver a bill.
        }
      }
    }

    await tryBrowserPrint(
      opts.role,
      opts.language,
      opts.payload,
      paperWidthMm,
      opts.barShowPrices,
    );
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

function escapePrintHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Format sale price for barcode label (under the bars). */
export function formatBarcodePriceLabel(price: string): string {
  const trimmed = price.trim();
  if (!trimmed) return "";
  const n = Number(trimmed.replace(",", "."));
  if (Number.isFinite(n)) {
    return n.toFixed(2);
  }
  return trimmed;
}

/** Physical slip: 20×30mm printed landscape → 30mm wide × 20mm tall. */
export const BARCODE_LABEL_WIDTH_MM = 30;
export const BARCODE_LABEL_HEIGHT_MM = 20;

/** Single print-optimized CODE128 SVG used by every product label path. */
export function buildBarcodeLabelSvgHtml(barcodeValue: string): string {
  const code = barcodeValue.trim();
  if (!code) {
    throw new Error("Barcode value is required");
  }
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, code, {
    format: "CODE128",
    // Dense bars so CSS can stretch SVG across full 30mm width without looking sparse.
    width: 1.2,
    height: 28,
    displayValue: true,
    fontSize: 9,
    margin: 0,
    textMargin: 1,
    background: "#ffffff",
    lineColor: "#000000",
  });
  return svg.outerHTML;
}

/**
 * Compact landscape product label: product name + barcode + price only.
 * Page is fixed 30×20mm so the barcode stretches the full long edge of the slip.
 */
export function buildBarcodeLabelHtml(opts: {
  barcodeSvgHtml: string;
  productName?: string;
  priceLabel: string;
}): string {
  const name = escapePrintHtml((opts.productName ?? "").trim());
  const price = escapePrintHtml(opts.priceLabel.trim());
  const w = BARCODE_LABEL_WIDTH_MM;
  const h = BARCODE_LABEL_HEIGHT_MM;
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title></title>
    <style>
      @page {
        size: ${w}mm ${h}mm;
        margin: 0;
      }
      * { box-sizing: border-box; }
      html, body {
        margin: 0;
        padding: 0;
        width: ${w}mm;
        height: ${h}mm;
        background: #fff;
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      body {
        display: flex;
        align-items: stretch;
        justify-content: stretch;
        overflow: hidden;
      }
      .label {
        width: ${w}mm;
        height: ${h}mm;
        padding: 0.6mm 1mm;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        justify-content: space-between;
        gap: 0.3mm;
        text-align: center;
        overflow: hidden;
      }
      .name {
        font-size: 6pt;
        font-weight: 700;
        line-height: 1.05;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .barcode-wrap {
        flex: 1 1 auto;
        min-height: 0;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        line-height: 0;
      }
      .barcode-wrap svg {
        display: block;
        width: 100% !important;
        max-width: 100%;
        height: 100% !important;
        max-height: 11mm;
      }
      .price {
        font-size: 7pt;
        font-weight: 700;
        line-height: 1.05;
        flex-shrink: 0;
      }
      @media print {
        html, body {
          width: ${w}mm;
          height: ${h}mm;
        }
      }
    </style>
  </head>
  <body>
    <div class="label">
      ${name ? `<div class="name">${name}</div>` : ""}
      <div class="barcode-wrap">${opts.barcodeSvgHtml}</div>
      ${price ? `<div class="price">${price}</div>` : ""}
    </div>
  </body>
</html>`;
}

/**
 * Print a product barcode label (create / edit / details / settings test).
 * Always: 30×20mm landscape · product name · barcode · price.
 */
export async function printBarcodeLabel(opts: {
  barcodeValue: string;
  productName: string;
  priceLabel: string;
  forceBrowser?: boolean;
}): Promise<PosPrintResult> {
  const barcodeSvgHtml = buildBarcodeLabelSvgHtml(opts.barcodeValue);
  const html = buildBarcodeLabelHtml({
    barcodeSvgHtml,
    productName: opts.productName,
    priceLabel: opts.priceLabel,
  });

  return enqueuePrint(async () => {
    const settings = loadPosPrinterSettings();
    const printer = resolvePosPrinterName("barcode");

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
            qzPrintBarcodeLabelHtml(printer, html, {
              widthMm: BARCODE_LABEL_WIDTH_MM,
              heightMm: BARCODE_LABEL_HEIGHT_MM,
            }),
            20000,
            "QZ barcode print",
          );
          return { channel: "qz" as const, printer };
        } catch {
          /* browser fallback */
        }
      }
    }

    await browserPrintHtml(html);
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
    /** When true, include product brand under each line (Settings add-on). */
    printProductBrand?: boolean;
    /**
     * Hourly charge is final only after timer ends on a completed order.
     * POS/KOT/Bar bills omit it; Sale Detail receipt may include it.
     */
    includeTableHourlyCharge?: boolean;
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
  const hourlyCharge = parseMoney(order.tableHourlyCharge);
  const includeHourly = opts.includeTableHourlyCharge === true && hourlyCharge > 0;
  const rawTotal = parseMoney(order.grandTotal);
  const total = includeHourly
    ? rawTotal
    : Math.max(0, Math.round((rawTotal - hourlyCharge) * 100) / 100);
  const paid = parseMoney(order.paid);
  const rawDue = parseMoney(order.due) || Math.max(0, rawTotal - paid);
  const amountDue = includeHourly
    ? Math.max(0, Math.round(rawDue * 100) / 100)
    : Math.max(0, Math.round((rawDue - hourlyCharge) * 100) / 100);
  const paymentStatusLabel =
    order.paymentStatus.toLowerCase() === "paid" || (total > 0 && paid >= total)
      ? t("Ödənilib", "Paid")
      : order.paymentStatus.toLowerCase() === "unpaid"
        ? t("Gözləyir", "Pending")
        : order.paymentStatus || "—";

  const tableLabel = order.table
    ? order.table.name?.trim() || String(order.table.number)
    : undefined;

  const showBrand = opts.printProductBrand === true;

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
      ...(showBrand && item.brand?.trim() ? { brand: item.brand.trim() } : {}),
    })),
    subtotal,
    shipping: parseMoney(order.shipping),
    serviceFee: parseMoney(order.serviceFee),
    tableHourlyCharge: includeHourly ? hourlyCharge : 0,
    discount: parseMoney(order.discount),
    discountLabel:
      parseMoney(order.loyaltyRedeemAmount) > 0
        ? t("Loyalty endirim", "Loyalty discount")
        : t("Endirim", "Discount"),
    cashbackEarned: parseMoney(order.loyaltyCashbackEarned),
    total,
    paid,
    amountDue,
    paymentMethod,
    paymentStatusLabel,
    tableLabel,
    companyName: opts.companyName,
    logoSrc: opts.logoSrc,
    siteFooter: "https://www.inflero.com/",
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
  printProductBrand?: boolean;
  /** When role is bar, print line prices + totals. */
  barShowPrices?: boolean;
  /** Include finalized hourly charge (Sale Detail completed receipt only). */
  includeTableHourlyCharge?: boolean;
}): Promise<PosPrintResult> {
  const payload = posOrderToThermalPayload(opts.order, {
    language: opts.language,
    companyName: opts.companyName,
    logoSrc: opts.logoSrc,
    customerPhone: opts.customerPhone,
    printProductBrand: opts.printProductBrand,
    includeTableHourlyCharge: opts.includeTableHourlyCharge === true,
  });
  return printPosTicket({
    role: opts.role,
    language: opts.language,
    payload,
    barShowPrices: opts.barShowPrices,
  });
}

function emptyOpticsEyePrint() {
  return { sph: "", cyl: "", ax: "", dpp: "", height: "", description: "" };
}

function opticsMetaToPrintPayload(
  order: PosOrderDetail,
  meta: OpticsPrescriptionMeta,
  opts: { language: Language; companyName: string },
): OpticsPrescriptionPrintPayload {
  const t = (az: string, en: string, ru?: string) => pickLang(opts.language, az, en, ru);
  const orderDate = new Date(order.date);
  const dateStr = Number.isNaN(orderDate.getTime())
    ? order.date
    : formatDateTime(orderDate, opts.language);

  const sectionDefs: Array<{
    key: keyof OpticsPrescriptionMeta;
    title: string;
  }> = [
    { key: "long", title: t("UZAQ", "LONG", "ДАЛЬ") },
    { key: "short", title: t("YAXIN", "SHORT", "БЛИЗЬ") },
    { key: "extra", title: t("ƏLAVƏ", "EXTRA", "ДОП.") },
  ];

  const rightLabel = t("Sağ", "Right", "Правый");
  const leftLabel = t("Sol", "Left", "Левый");
  const descriptionLabel = t("Məlumat", "Description", "Информация");
  const heightLabel = t("Height", "Height", "Высота");

  const sections = sectionDefs.map(({ key, title }) => {
    const section = meta[key];
    const rightSrc = section?.right ?? section?.od;
    const leftSrc = section?.left ?? section?.os;
    return {
      title,
      productName: section?.productName ?? null,
      right: {
        ...emptyOpticsEyePrint(),
        sph: rightSrc?.sph ?? "",
        cyl: rightSrc?.cyl ?? "",
        ax: rightSrc?.ax ?? rightSrc?.axis ?? "",
        dpp: rightSrc?.dpp ?? rightSrc?.pd ?? "",
        height: rightSrc?.height ?? "",
        description: rightSrc?.description ?? rightSrc?.add ?? "",
      },
      left: {
        ...emptyOpticsEyePrint(),
        sph: leftSrc?.sph ?? "",
        cyl: leftSrc?.cyl ?? "",
        ax: leftSrc?.ax ?? leftSrc?.axis ?? "",
        dpp: leftSrc?.dpp ?? leftSrc?.pd ?? "",
        height: leftSrc?.height ?? "",
        description: leftSrc?.description ?? leftSrc?.add ?? "",
      },
      rightLabel,
      leftLabel,
      descriptionLabel,
      heightLabel,
    };
  });

  return {
    orderNo: order.reference,
    date: dateStr,
    customer: order.customerName?.trim() || t("Anonim", "Anonymous", "Аноним"),
    companyName: opts.companyName,
    sections,
    siteFooter: "https://www.inflero.com/",
  };
}

/** Print OPTICS prescription slip (uses receipt printer mapping). Receipt/KOT paths unchanged. */
export async function printOpticsPrescription(opts: {
  order: PosOrderDetail;
  language: Language;
  companyName: string;
}): Promise<PosPrintResult> {
  const meta = opts.order.opticsMeta;
  if (!meta) {
    throw new Error("No prescription on this order");
  }
  const settings = loadPosPrinterSettings();
  const payload = opticsMetaToPrintPayload(opts.order, meta, {
    language: opts.language,
    companyName: opts.companyName,
  });
  const html = buildOpticsPrescriptionHtml(payload, {
    language: opts.language,
    paperWidthMm: settings.paperWidthMm,
  });
  return printThermalHtml({ role: "receipt", html });
}
