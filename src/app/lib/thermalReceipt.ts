import type { Language } from "../i18n/translations";
import { pickLang } from "../i18n/pickLang";

/** Strip Azerbaijani diacritics for thermal printers with limited glyph support. */
export function latinize(str: string): string {
  return str
    .replace(/ə/g, "e")
    .replace(/Ə/g, "E")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "O")
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "G")
    .replace(/ı/g, "i")
    .replace(/İ/g, "I")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "U")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "C")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "S");
}

/** Print-safe text: latinize AZ UI content for cheap thermal printers; keep EN/RU as-is. */
export function receiptPrintText(language: Language, value: string): string {
  return language === "az" ? latinize(value) : value;
}

/**
 * Shared 80mm thermal receipt CSS — keep identical across SAAS + Inflero Auto POS.
 * Sized for browser→thermal print: larger pt sizes, pure black (grays wash out).
 */
export const THERMAL_RECEIPT_PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: Arial, Helvetica, "Segoe UI", sans-serif;
    font-size: 13pt;
    line-height: 1.45;
    font-weight: 600;
    width: 72mm;
    max-width: 72mm;
    margin: 0 auto;
    padding: 3mm 2mm;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  .center { text-align: center; }
  .bold { font-weight: 800; }
  .big { font-size: 15pt; font-weight: 800; letter-spacing: 0.4px; }
  .divider { border-top: 1.5px dashed #000; margin: 6px 0; }
  .divider-solid { border-top: 2px solid #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin: 3px 0; font-size: 12pt; }
  .row > span:last-child { text-align: right; word-break: break-word; font-weight: 700; }
  .row-item { margin: 5px 0; }
  .row-item .name { width: 100%; word-break: break-word; font-weight: 800; font-size: 12.5pt; }
  .row-item .nums { display: flex; justify-content: space-between; gap: 8px; padding-left: 2px; color: #000; font-size: 12pt; font-weight: 700; margin-top: 2px; }
  .section-title { font-size: 11.5pt; font-weight: 800; margin: 4px 0 6px; text-transform: uppercase; letter-spacing: 0.3px; }
  .total-row { display: flex; justify-content: space-between; gap: 8px; font-size: 15pt; font-weight: 800; margin-top: 6px; }
  .label { color: #000; flex-shrink: 0; font-weight: 700; }
  .thanks { text-align: center; margin-top: 10px; font-size: 11pt; line-height: 1.45; font-weight: 700; }
  .logo-area { text-align: center; margin-bottom: 6px; }
  img { max-width: 100%; height: auto; }
  @media print {
    html, body {
      width: 72mm !important;
      max-width: 72mm !important;
      margin: 0 auto !important;
      padding: 2mm 1.5mm !important;
      font-size: 13pt !important;
    }
    @page { size: 80mm auto; margin: 0; }
  }
`.trim();

export function thermalReceiptLabels(language: Language) {
  const t = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  return {
    receipt: t("Qəbz", "Receipt"),
    order: t("Sifariş", "Order"),
    date: t("Tarix", "Date"),
    table: t("Masa", "Table"),
    customer: t("Müştəri", "Customer"),
    phone: t("Telefon", "Phone"),
    vehicle: t("Avtomobil", "Vehicle"),
    plate: t("Qeydiyyat", "Plate"),
    mileage: t("Yürüş", "Mileage"),
    mileageKm: t("Km göstəricisi", "Odometer"),
    employee: t("İşçi", "Employee"),
    products: t("Məhsul / Xidmət", "Product / Service"),
    orderItems: t("Sifariş", "Order"),
    qty: t("əd", "qty"),
    subtotal: t("Ara cəm", "Subtotal"),
    shipping: t("Çatdırılma", "Shipping"),
    serviceFee: t("Xidmət haqqı", "Service fee"),
    total: t("CƏMİ", "TOTAL"),
    payment: t("Ödəniş", "Payment"),
    status: t("Status", "Status"),
    thanks: t("Müraciətiniz üçün təşəkkür edirik!", "Thank you for your business!"),
    close: t("Bağla", "Close"),
    print: t("Çap Et", "Print"),
    kitchen: t("Mətbəx", "Kitchen"),
    kitchenBanner: t("*** MƏTBƏX / KITCHEN ***", "*** KITCHEN ***"),
    kitchenCopy: t("*** MƏTBƏX KOPYASI ***", "*** KITCHEN COPY ***"),
    dualCopies: "2x",
  };
}

/** Compact logo block sized for 80mm rolls (shared print + preview scale). */
export function brandLogoThermalHtml(src: string, alt: string): string {
  const safeAlt = alt.replace(/"/g, "&quot;");
  return `<div class="logo-area" style="height:52px;max-width:58mm;margin:0 auto 6px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <img src="${src}" alt="${safeAlt}" style="max-height:52px;max-width:100%;width:auto;object-fit:contain;object-position:center;" />
</div>`;
}
