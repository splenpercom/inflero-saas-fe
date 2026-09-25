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

/** Usable content / QZ page widths (narrower than paper due to head margins). */
export function thermalPrintContentWidthMm(paperWidthMm: 58 | 80): number {
  return paperWidthMm === 58 ? 46 : 64;
}

export function thermalQzPageWidthMm(paperWidthMm: 58 | 80): number {
  return paperWidthMm === 58 ? 48 : 68;
}

/**
 * Shared thermal receipt CSS for browser + QZ Tray pixel/html.
 * Keep weights light — heavy bold expands glyphs and clips on narrow rolls.
 */
export function thermalReceiptPrintCss(paperWidthMm: 58 | 80 = 80): string {
  const contentMm = thermalPrintContentWidthMm(paperWidthMm);
  const bodyPt = paperWidthMm === 58 ? "9.5pt" : "10.5pt";
  const rowPt = paperWidthMm === 58 ? "9pt" : "10pt";
  const titlePt = paperWidthMm === 58 ? "9pt" : "10pt";
  const totalPt = paperWidthMm === 58 ? "11pt" : "12pt";
  return `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    font-family: Arial, Helvetica, "Segoe UI", sans-serif;
    font-size: ${bodyPt};
    line-height: 1.35;
    font-weight: 400;
    width: ${contentMm}mm;
    max-width: ${contentMm}mm;
    margin: 0 auto;
    padding: 2mm 1.5mm;
    color: #000;
    background: #fff;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
  }
  .center { text-align: center; }
  .bold { font-weight: 600; }
  .big { font-size: ${totalPt}; font-weight: 600; letter-spacing: 0; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  .divider-solid { border-top: 1.5px solid #000; margin: 4px 0; }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 4px;
    margin: 2px 0;
    font-size: ${rowPt};
    font-weight: 400;
  }
  .row > span:last-child {
    text-align: right;
    word-break: break-word;
    overflow-wrap: anywhere;
    min-width: 0;
    flex: 1 1 auto;
    font-weight: 400;
  }
  .row-item { margin: 3px 0; }
  .row-item .name {
    width: 100%;
    word-break: break-word;
    overflow-wrap: anywhere;
    font-weight: 600;
    font-size: ${rowPt};
  }
  .row-item .nums {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    padding-left: 0;
    color: #000;
    font-size: ${rowPt};
    font-weight: 400;
    margin-top: 1px;
  }
  .row-item .nums > span:last-child {
    min-width: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .section-title {
    font-size: ${titlePt};
    font-weight: 600;
    margin: 3px 0 4px;
    text-transform: uppercase;
    letter-spacing: 0.2px;
  }
  .total-row {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    font-size: ${totalPt};
    font-weight: 600;
    margin-top: 4px;
  }
  .total-row > span:last-child {
    min-width: 0;
    text-align: right;
    overflow-wrap: anywhere;
  }
  .label { color: #000; flex-shrink: 0; max-width: 42%; font-weight: 400; }
  .thanks {
    text-align: center;
    margin-top: 8px;
    font-size: ${paperWidthMm === 58 ? "8.5pt" : "9pt"};
    line-height: 1.35;
    font-weight: 400;
  }
  .logo-area { text-align: center; margin-bottom: 4px; }
  img { max-width: 100%; height: auto; }
  @media print {
    html, body {
      width: ${contentMm}mm !important;
      max-width: ${contentMm}mm !important;
      margin: 0 auto !important;
      padding: 1.5mm 1mm !important;
    }
    @page { size: ${paperWidthMm}mm auto; margin: 0; }
  }
`.trim();
}

/** @deprecated Prefer thermalReceiptPrintCss(paperWidthMm) */
export const THERMAL_RECEIPT_PRINT_CSS = thermalReceiptPrintCss(80);

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
    thanks: t("Təşəkkür edirik", "Thank you"),
    close: t("Bağla", "Close"),
    print: t("Çap Et", "Print"),
    kitchen: t("Mətbəx", "Kitchen"),
    kitchenBanner: t("*** MƏTBƏX / KITCHEN ***", "*** KITCHEN ***"),
    kitchenCopy: t("*** MƏTBƏX KOPYASI ***", "*** KITCHEN COPY ***"),
    barBanner: t("*** BAR ***", "*** BAR ***"),
    barCopy: t("*** BAR KOPYASI ***", "*** BAR COPY ***"),
    dailySales: t("GÜNÜN SATIŞLARI", "TODAY'S SALES"),
    productsSold: t("Satılan məhsullar", "Products sold"),
    noSales: t("Bu gün satış yoxdur", "No sales today"),
  };
}

/** Compact logo block sized for thermal rolls. */
export function brandLogoThermalHtml(src: string, alt: string): string {
  const safeAlt = alt.replace(/"/g, "&quot;");
  return `<div class="logo-area" style="height:52px;max-width:58mm;margin:0 auto 6px;overflow:hidden;display:flex;align-items:center;justify-content:center;">
  <img src="${src}" alt="${safeAlt}" style="max-height:52px;max-width:100%;width:auto;object-fit:contain;object-position:center;" />
</div>`;
}

export type ThermalReceiptPayload = {
  orderNo: string;
  date: string;
  customer: string;
  customerPhone: string;
  vehicle?: string;
  mileage?: number;
  employee: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  serviceFee: number;
  discount: number;
  discountLabel: string;
  total: number;
  paymentMethod: string;
  paymentStatusLabel: string;
  tableLabel?: string;
  companyName: string;
  logoSrc?: string | null;
  siteFooter?: string;
};

export type BuildThermalReceiptOpts = {
  language: Language;
  /** customer = full receipt; kitchen/bar = KOT-style ticket (qty only, no totals). */
  copy: "customer" | "kitchen" | "bar";
  paperWidthMm?: 58 | 80;
};

/** Full HTML document for browser print or QZ Tray pixel/html. */
export function buildThermalReceiptHtml(
  data: ThermalReceiptPayload,
  opts: BuildThermalReceiptOpts,
): string {
  const language = opts.language;
  const isTicket = opts.copy === "kitchen" || opts.copy === "bar";
  const isBar = opts.copy === "bar";
  const paperWidthMm = opts.paperWidthMm ?? 80;
  const labels = thermalReceiptLabels(language);
  const p = (value: string) => receiptPrintText(language, value);

  const d = {
    orderNo: p(data.orderNo),
    customer: p(data.customer),
    customerPhone: data.customerPhone,
    vehicle: data.vehicle ? p(data.vehicle) : undefined,
    employee: p(data.employee),
    paymentMethod: p(data.paymentMethod),
    paymentStatusLabel: p(data.paymentStatusLabel),
    discountLabel: p(data.discountLabel),
    tableLabel: data.tableLabel ? p(data.tableLabel) : undefined,
    items: data.items.map((it) => ({ ...it, name: p(it.name) })),
    date: data.date,
    mileage: data.mileage,
    subtotal: data.subtotal,
    shipping: data.shipping,
    serviceFee: data.serviceFee,
    discount: data.discount,
    total: data.total,
  };

  const L = {
    order: p(labels.order),
    date: p(labels.date),
    table: p(labels.table),
    customer: p(labels.customer),
    phone: p(labels.phone),
    vehicle: p(labels.vehicle),
    mileage: p(labels.mileage),
    employee: p(labels.employee),
    products: p(labels.products),
    orderItems: p(labels.orderItems),
    subtotal: p(labels.subtotal),
    shipping: p(labels.shipping),
    serviceFee: p(labels.serviceFee),
    total: p(labels.total),
    payment: p(labels.payment),
    status: p(labels.status),
    thanks: p(labels.thanks),
    kitchenBanner: p(labels.kitchenBanner),
    kitchenCopy: p(labels.kitchenCopy),
    barBanner: p(labels.barBanner),
    barCopy: p(labels.barCopy),
  };

  const company = p(data.companyName);
  const titleSuffix = isBar ? "BAR" : isTicket ? "KITCHEN" : d.orderNo;
  const ticketBanner = isBar ? L.barBanner : L.kitchenBanner;
  const ticketCopy = isBar ? L.barCopy : L.kitchenCopy;
  const headerBanner = isTicket
    ? `<div class="center bold big" style="margin:6px 0;">${ticketBanner}</div>
       <div class="center bold" style="margin-bottom:4px;">${d.tableLabel ? `${L.table}: ${d.tableLabel}` : ""}</div>`
    : "";
  const footer = receiptPrintText(language, data.siteFooter ?? "app.inflero.com");
  const logo =
    !isTicket && data.logoSrc ? brandLogoThermalHtml(data.logoSrc, company) : "";
  // Always show company name on customer bills (QZ path omits logo images).
  const companyHeader = !isTicket
    ? `<div class="center bold big" style="margin:4px 0 6px;">${company}</div>`
    : "";

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <title>${company} - ${titleSuffix}</title>
  <style>${thermalReceiptPrintCss(paperWidthMm)}</style>
</head>
<body>
  ${logo}
  ${companyHeader}
  ${headerBanner}
  <div class="divider-solid"></div>
  <div class="row"><span class="label">${L.order}:</span><span>${d.orderNo}</span></div>
  <div class="row"><span class="label">${L.date}:</span><span>${d.date}</span></div>
  ${d.tableLabel && !isTicket ? `<div class="row"><span class="label">${L.table}:</span><span>${d.tableLabel}</span></div>` : ""}
  <div class="divider"></div>
  <div class="row"><span class="label">${L.customer}:</span><span>${d.customer}</span></div>
  ${!isTicket ? `<div class="row"><span class="label">${L.phone}:</span><span>${d.customerPhone}</span></div>` : ""}
  ${d.vehicle && !isTicket ? `<div class="row"><span class="label">${L.vehicle}:</span><span>${d.vehicle}</span></div>` : ""}
  ${d.mileage != null && !isTicket ? `<div class="row"><span class="label">${L.mileage}:</span><span>${d.mileage} km</span></div>` : ""}
  ${isTicket ? `<div class="row"><span class="label">${L.employee}:</span><span>${d.employee}</span></div>` : ""}
  <div class="divider-solid"></div>
  <div class="section-title">${isTicket ? L.orderItems : L.products}</div>
  ${d.items
    .map(
      (it) => `
    <div class="row-item">
      <div class="name">${it.name}</div>
      <div class="nums">
        <span>${isTicket ? `x ${it.qty}` : `${it.qty} x ${it.price.toFixed(2)} AZN`}</span>
        ${isTicket ? "" : `<span>${(it.qty * it.price).toFixed(2)} AZN</span>`}
      </div>
    </div>`,
    )
    .join("")}
  <div class="divider"></div>
  ${
    isTicket
      ? `<div class="center" style="margin-top:8px;font-weight:600;">${ticketCopy}</div>`
      : `
  <div class="row"><span class="label">${L.subtotal}:</span><span>${d.subtotal.toFixed(2)} AZN</span></div>
  <div class="row"><span class="label">${L.shipping}:</span><span>${d.shipping.toFixed(2)} AZN</span></div>
  ${d.serviceFee > 0 ? `<div class="row"><span class="label">${L.serviceFee}:</span><span>${d.serviceFee.toFixed(2)} AZN</span></div>` : ""}
  ${d.discount > 0 ? `<div class="row"><span class="label">${d.discountLabel}:</span><span>-${d.discount.toFixed(2)} AZN</span></div>` : ""}
  <div class="divider-solid"></div>
  <div class="total-row"><span>${L.total}:</span><span>${d.total.toFixed(2)} AZN</span></div>
  <div class="row" style="margin-top:4px;"><span class="label">${L.payment}:</span><span>${d.paymentMethod}</span></div>
  <div class="row"><span class="label">${L.status}:</span><span>${d.paymentStatusLabel}</span></div>
  <div class="divider-solid"></div>
  <div class="thanks">
    <div>${L.thanks}</div>
    <div style="margin-top:3px;">${footer}</div>
  </div>`
  }
</body>
</html>`;
}

export type DailySalesSummaryPayload = {
  date: string;
  companyName: string;
  logoSrc?: string | null;
  siteFooter?: string;
  items: { name: string; qty: number; amount: number }[];
  total: number;
};

/** Thermal HTML for today's aggregated product sales (receipt printer). */
export function buildDailySalesSummaryHtml(
  data: DailySalesSummaryPayload,
  opts: { language: Language; paperWidthMm?: 58 | 80 },
): string {
  const language = opts.language;
  const paperWidthMm = opts.paperWidthMm ?? 80;
  const labels = thermalReceiptLabels(language);
  const p = (value: string) => receiptPrintText(language, value);

  const L = {
    dailySales: p(labels.dailySales),
    date: p(labels.date),
    productsSold: p(labels.productsSold),
    qty: p(labels.qty),
    total: p(labels.total),
    noSales: p(labels.noSales),
  };

  const company = p(data.companyName);
  const footer = receiptPrintText(language, data.siteFooter ?? "app.inflero.com");
  const logo = data.logoSrc ? brandLogoThermalHtml(data.logoSrc, company) : "";
  const items = data.items.map((it) => ({ ...it, name: p(it.name) }));

  const body =
    items.length === 0
      ? `<div class="center" style="margin:10px 0;">${L.noSales}</div>`
      : `
  <div class="section-title">${L.productsSold}</div>
  ${items
    .map(
      (it) => `
    <div class="row-item">
      <div class="name">${it.name}</div>
      <div class="nums">
        <span>${it.qty} ${L.qty}</span>
        <span>${it.amount.toFixed(2)} AZN</span>
      </div>
    </div>`,
    )
    .join("")}
  <div class="divider-solid"></div>
  <div class="total-row"><span>${L.total}:</span><span>${data.total.toFixed(2)} AZN</span></div>`;

  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8" />
  <title>${company} - ${L.dailySales}</title>
  <style>${thermalReceiptPrintCss(paperWidthMm)}</style>
</head>
<body>
  ${logo}
  <div class="center bold big" style="margin:6px 0;">${L.dailySales}</div>
  <div class="divider-solid"></div>
  <div class="row"><span class="label">${L.date}:</span><span>${data.date}</span></div>
  <div class="divider"></div>
  ${body}
  <div class="divider-solid"></div>
  <div class="thanks">
    <div style="margin-top:3px;">${footer}</div>
  </div>
</body>
</html>`;
}
