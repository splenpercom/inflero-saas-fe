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

/**
 * Browser print without window.open — popups are blocked after async API calls.
 * Uses a temporary hidden iframe so the print dialog still opens reliably.
 */
function browserPrintHtml(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    throw new Error("Unable to open print frame");
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

  const runPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      window.setTimeout(cleanup, 1500);
    }
  };

  // Prefer onload so images/fonts are ready; fallback timer if onload already fired.
  let printed = false;
  const trigger = () => {
    if (printed) return;
    printed = true;
    runPrint();
  };
  iframe.onload = () => window.setTimeout(trigger, 50);
  window.setTimeout(trigger, 600);
}

/** Resolve QZ target: KOT → kitchen (fallback receipt); bar/receipt → billing printer. */
export function resolvePosPrinterName(role: PosPrintRole): string {
  const settings = loadPosPrinterSettings();
  const receipt = settings.receiptPrinter.trim();
  const kot = settings.kotPrinter.trim();
  if (role === "kot") return kot || receipt;
  return receipt;
}

/** Print pre-built thermal HTML via QZ (receipt role) or browser fallback. */
export async function printThermalHtml(opts: {
  role: PosPrintRole;
  html: string;
  forceBrowser?: boolean;
}): Promise<{ channel: "qz" | "browser"; printer?: string }> {
  const settings = loadPosPrinterSettings();
  const printer = resolvePosPrinterName(opts.role);

  const tryQz =
    !opts.forceBrowser &&
    settings.preferQz &&
    !!printer &&
    (await isQzAvailable().catch(() => false));

  if (tryQz) {
    try {
      await ensureQzConnected();
      await qzPrintHtml(printer, opts.html, settings.paperWidthMm);
      return { channel: "qz", printer };
    } catch {
      // Fall through to browser print.
    }
  }

  browserPrintHtml(opts.html);
  return { channel: "browser", printer: printer || undefined };
}

/**
 * Print receipt, KOT, or Bar ticket.
 * Uses mapped QZ printer when available + configured; otherwise browser print dialog.
 */
export async function printPosTicket(opts: {
  role: PosPrintRole;
  language: Language;
  payload: ThermalReceiptPayload;
  /** Force browser dialog even if QZ is configured. */
  forceBrowser?: boolean;
}): Promise<{ channel: "qz" | "browser"; printer?: string }> {
  const settings = loadPosPrinterSettings();
  const copy =
    opts.role === "kot" ? "kitchen" : opts.role === "bar" ? "bar" : "customer";
  const html = buildThermalReceiptHtml(opts.payload, {
    language: opts.language,
    copy,
    paperWidthMm: settings.paperWidthMm,
  });

  return printThermalHtml({
    role: opts.role,
    html,
    forceBrowser: opts.forceBrowser,
  });
}

/** Print today's product sales summary on the bill/receipt printer. */
export async function printDailySalesSummary(opts: {
  language: Language;
  payload: DailySalesSummaryPayload;
  forceBrowser?: boolean;
}): Promise<{ channel: "qz" | "browser"; printer?: string }> {
  const settings = loadPosPrinterSettings();
  const html = buildDailySalesSummaryHtml(opts.payload, {
    language: opts.language,
    paperWidthMm: settings.paperWidthMm,
  });
  return printThermalHtml({
    role: "receipt",
    html,
    forceBrowser: opts.forceBrowser,
  });
}

export async function canSilentPrint(role: PosPrintRole): Promise<boolean> {
  const settings = loadPosPrinterSettings();
  const printer = resolvePosPrinterName(role);
  if (!settings.preferQz || !printer) return false;
  return isQzAvailable();
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
}): Promise<{ channel: "qz" | "browser"; printer?: string }> {
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
