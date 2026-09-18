import type { Language } from "../i18n/translations";
import { pickLang } from "../i18n/pickLang";
import type { PosOrderDetail } from "../api/sales";
import { formatDateTime } from "./dateFormat";
import { loadPosPrinterSettings } from "./posPrinterSettings";
import { ensureQzConnected, isQzAvailable, qzPrintHtml } from "./qzTrayClient";
import {
  buildThermalReceiptHtml,
  type ThermalReceiptPayload,
} from "./thermalReceipt";

export type PosPrintRole = "receipt" | "kot";

function browserPrintHtml(html: string): void {
  const printWin = window.open("", "_blank", "width=340,height=700");
  if (!printWin) {
    throw new Error("Popup blocked — allow popups to print");
  }
  printWin.document.write(html);
  printWin.document.close();
  printWin.focus();
  window.setTimeout(() => {
    printWin.print();
    printWin.close();
  }, 400);
}

/** Resolve QZ target: KOT falls back to receipt printer when kitchen is unmapped. */
export function resolvePosPrinterName(role: PosPrintRole): string {
  const settings = loadPosPrinterSettings();
  const receipt = settings.receiptPrinter.trim();
  const kot = settings.kotPrinter.trim();
  if (role === "kot") return kot || receipt;
  return receipt;
}

/**
 * Print receipt or KOT ticket.
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
  const copy = opts.role === "kot" ? "kitchen" : "customer";
  const html = buildThermalReceiptHtml(opts.payload, {
    language: opts.language,
    copy,
    paperWidthMm: settings.paperWidthMm,
  });

  const printer = resolvePosPrinterName(opts.role);

  const tryQz =
    !opts.forceBrowser &&
    settings.preferQz &&
    !!printer &&
    (await isQzAvailable().catch(() => false));

  if (tryQz) {
    try {
      await ensureQzConnected();
      await qzPrintHtml(printer, html, settings.paperWidthMm);
      return { channel: "qz", printer };
    } catch {
      // Fall through to browser print.
    }
  }

  browserPrintHtml(html);
  return { channel: "browser", printer: printer || undefined };
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
        : order.paymentMethod?.trim() || "—";

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
