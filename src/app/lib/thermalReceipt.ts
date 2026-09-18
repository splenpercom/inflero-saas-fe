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
 * Content width ~72mm with padding so text does not clip on typical ESC/POS printers.
 */
export const THERMAL_RECEIPT_PRINT_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    line-height: 1.35;
    width: 72mm;
    max-width: 72mm;
    margin: 0 auto;
    padding: 3mm 2.5mm;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold { font-weight: 700; }
  .big { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; }
  .divider { border-top: 1px dashed #000; margin: 5px 0; }
  .divider-solid { border-top: 1px solid #000; margin: 5px 0; }
  .row { display: flex; justify-content: space-between; gap: 6px; margin: 2px 0; }
  .row > span:last-child { text-align: right; word-break: break-word; }
  .row-item { margin: 4px 0; }
  .row-item .name { width: 100%; word-break: break-word; font-weight: 700; }
  .row-item .nums { display: flex; justify-content: space-between; gap: 6px; padding-left: 2px; color: #222; font-size: 11px; }
  .section-title { font-size: 11px; font-weight: 700; margin: 2px 0 4px; text-transform: uppercase; }
  .total-row { display: flex; justify-content: space-between; gap: 6px; font-size: 13px; font-weight: 700; margin-top: 4px; }
  .label { color: #333; flex-shrink: 0; }
  .thanks { text-align: center; margin-top: 8px; font-size: 11px; line-height: 1.4; }
  .logo-area { text-align: center; margin-bottom: 4px; }
  img { max-width: 100%; height: auto; }
  @media print {
    html, body { width: 72mm; margin: 0; padding: 2mm 2mm; }
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
  return `<div class="logo-area" style="height:48px;max-width:56mm;margin:0 auto 4px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <img src="${src}" alt="${safeAlt}" style="max-height:48px;max-width:100%;width:auto;object-fit:contain;object-position:center;" />
</div>`;
}
