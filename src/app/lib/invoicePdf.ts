import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { InvoiceDetail, PosOrderDetail } from "../api/sales";
import { formatSalesDate } from "./salesMappers";

export type InvoicePdfTr = (az: string, en: string, ru?: string) => string;

function parseAmount(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML body that mirrors InvoiceView on-screen / print layout 1:1.
 * Used for both browser print and PDF download.
 */
export function buildInvoiceDocumentHtml(opts: {
  invoice: InvoiceDetail;
  sourceOrder?: Pick<PosOrderDetail, "vehicleLabel" | "mileageAtService"> | null;
  tr: InvoicePdfTr;
}): string {
  const { invoice, sourceOrder, tr } = opts;
  const customer = invoice.customer;
  const total = parseAmount(invoice.total);
  const subtotal = parseAmount(invoice.subtotal);
  const tax = parseAmount(invoice.tax);
  const discount = parseAmount(invoice.discount);
  const paid = parseAmount(invoice.paid);
  const amountDue = parseAmount(invoice.amountDue);
  const payments = invoice.payments ?? [];

  const customerHtml = customer
    ? `<p style="font-weight:600;font-size:16px;margin:0 0 4px;color:#111827">${escapeHtml(customer.name)}</p>
       ${customer.country ? `<p style="color:#4b5563;margin:0">${escapeHtml(customer.country)}</p>` : ""}
       ${customer.email ? `<p style="color:#4b5563;margin:0">${escapeHtml(customer.email)}</p>` : ""}
       ${customer.phone ? `<p style="color:#4b5563;margin:0">${escapeHtml(customer.phone)}</p>` : ""}`
    : `<p style="color:#4b5563;margin:0">${escapeHtml(tr("Müştəri təyin edilməyib", "No customer assigned"))}</p>`;

  const vehicleHtml = sourceOrder?.vehicleLabel
    ? `<div style="margin-top:12px;font-size:14px;color:#111827">
         <p style="margin:0"><span style="color:#6b7280">${escapeHtml(tr("Avtomobil", "Vehicle"))}:</span> ${escapeHtml(sourceOrder.vehicleLabel)}</p>
         ${
           sourceOrder.mileageAtService != null
             ? `<p style="margin:0"><span style="color:#6b7280">${escapeHtml(tr("Yürüş", "Mileage"))}:</span> ${sourceOrder.mileageAtService} km</p>`
             : ""
         }
       </div>`
    : "";

  const itemsHtml = invoice.items
    .map((item, index) => {
      const bg = index % 2 === 0 ? "" : "background:#f9fafb;";
      return `<tr style="${bg}border-bottom:1px solid #e5e7eb">
        <td style="padding:12px 0;font-size:14px;color:#111827">${escapeHtml(item.description)}</td>
        <td style="padding:12px 0;font-size:14px;color:#4b5563;text-align:right">${item.quantity}</td>
        <td style="padding:12px 0;font-size:14px;color:#4b5563;text-align:right">${parseAmount(item.unitPrice).toFixed(2)} ₼</td>
        <td style="padding:12px 0;font-size:14px;font-weight:500;color:#111827;text-align:right">${parseAmount(item.total).toFixed(2)} ₼</td>
      </tr>`;
    })
    .join("");

  const paymentsHtml =
    payments.length > 0
      ? `<div style="margin-bottom:32px">
           <h4 style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 12px">${escapeHtml(tr("Ödənişlər", "Payments"))}</h4>
           <table style="width:100%;border-collapse:collapse">
             <thead>
               <tr style="border-bottom:1px solid #e5e7eb">
                 <th style="text-align:left;font-size:12px;font-weight:500;color:#6b7280;padding-bottom:8px">${escapeHtml(tr("Tarix", "Date"))}</th>
                 <th style="text-align:left;font-size:12px;font-weight:500;color:#6b7280;padding-bottom:8px">${escapeHtml(tr("Üsul", "Method"))}</th>
                 <th style="text-align:right;font-size:12px;font-weight:500;color:#6b7280;padding-bottom:8px">${escapeHtml(tr("Məbləğ", "Amount"))}</th>
                 <th style="text-align:left;font-size:12px;font-weight:500;color:#6b7280;padding-bottom:8px">${escapeHtml(tr("İstinad", "Reference"))}</th>
               </tr>
             </thead>
             <tbody>
               ${payments
                 .map(
                   (p) => `<tr style="border-bottom:1px solid #f3f4f6">
                     <td style="padding:8px 0;font-size:12px;color:#4b5563">${escapeHtml(formatSalesDate(p.date))}</td>
                     <td style="padding:8px 0;font-size:12px;color:#111827">${escapeHtml(String(p.method))}</td>
                     <td style="padding:8px 0;font-size:12px;color:#111827;text-align:right">${parseAmount(p.allocatedAmount).toFixed(2)} ₼</td>
                     <td style="padding:8px 0;font-size:12px;color:#4b5563">${escapeHtml(p.reference || p.note || "—")}</td>
                   </tr>`,
                 )
                 .join("")}
             </tbody>
           </table>
         </div>`
      : "";

  const notesHtml = invoice.notes
    ? `<div style="border-top:1px solid #e5e7eb;padding-top:24px">
         <h4 style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">${escapeHtml(tr("Qeydlər", "Notes"))}</h4>
         <p style="font-size:14px;color:#4b5563;margin:0">${escapeHtml(invoice.notes)}</p>
       </div>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(tr("Qaimə", "Invoice"))} #${escapeHtml(invoice.invoiceNo)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #111827; background: #fff; }
    @media print {
      body { padding: 0; }
      @page { margin: 12mm; }
    }
  </style>
</head>
<body>
  <div id="invoice-root" style="max-width:800px;margin:0 auto;padding:24px 32px;background:#fff">
    <div style="display:flex;justify-content:space-between;gap:32px;margin-bottom:32px;flex-wrap:wrap">
      <div>
        <h2 style="font-size:28px;font-weight:700;margin:0 0 16px;color:#111827">Inflero</h2>
        <p style="font-size:14px;color:#4b5563;line-height:1.6;margin:0">
          123 Business Street<br />
          Business City, BC 12345<br />
          noreply@inflero.com<br />
          +1 (555) 123-4567
        </p>
      </div>
      <div style="text-align:right">
        <h3 style="font-size:32px;font-weight:700;margin:0 0 16px;color:#111827">${escapeHtml(tr("QAİMƏ", "INVOICE"))}</h3>
        <div style="font-size:14px;line-height:1.7">
          <div><span style="color:#6b7280">${escapeHtml(tr("Qaimə No:", "Invoice No:"))}</span> <strong style="color:#111827">${escapeHtml(invoice.invoiceNo)}</strong></div>
          <div><span style="color:#6b7280">${escapeHtml(tr("Tarix:", "Date:"))}</span> <strong style="color:#111827">${escapeHtml(formatSalesDate(invoice.createdAt))}</strong></div>
          <div><span style="color:#6b7280">${escapeHtml(tr("Son Tarix:", "Due Date:"))}</span> <strong style="color:#111827">${escapeHtml(formatSalesDate(invoice.dueDate))}</strong></div>
          <div><span style="color:#6b7280">${escapeHtml(tr("Status:", "Status:"))}</span> <strong style="color:#111827">${escapeHtml(invoice.status)}</strong></div>
        </div>
      </div>
    </div>

    <div style="margin-bottom:32px">
      <h4 style="font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin:0 0 8px">${escapeHtml(tr("Müştəri", "Bill To"))}</h4>
      <div style="font-size:14px">${customerHtml}</div>
      ${vehicleHtml}
    </div>

    <div style="margin-bottom:32px">
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="border-bottom:2px solid #d1d5db">
            <th style="text-align:left;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;padding-bottom:12px">${escapeHtml(tr("Təsvir", "Description"))}</th>
            <th style="text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;padding-bottom:12px">${escapeHtml(tr("Miqdar", "Qty"))}</th>
            <th style="text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;padding-bottom:12px">${escapeHtml(tr("Qiymət", "Unit Price"))}</th>
            <th style="text-align:right;font-size:12px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;padding-bottom:12px">${escapeHtml(tr("Cəm", "Total"))}</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>
    </div>

    <div style="display:flex;justify-content:flex-end;margin-bottom:32px">
      <div style="width:280px;font-size:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#4b5563">${escapeHtml(tr("Alt Məbləğ:", "Subtotal:"))}</span>
          <span style="font-weight:500;color:#111827">${subtotal.toFixed(2)} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#4b5563">${escapeHtml(tr("Vergi:", "Tax:"))}</span>
          <span style="font-weight:500;color:#111827">${tax.toFixed(2)} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#4b5563">${escapeHtml(tr("Endirim:", "Discount:"))}</span>
          <span style="font-weight:500;color:#111827">${discount.toFixed(2)} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:2px solid #d1d5db;padding-top:8px;margin-bottom:8px;font-size:16px;font-weight:700;color:#111827">
          <span>${escapeHtml(tr("Ümumi:", "Total:"))}</span>
          <span>${total.toFixed(2)} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#4b5563">${escapeHtml(tr("Ödənilib:", "Paid:"))}</span>
          <span style="font-weight:500;color:#16a34a">${paid.toFixed(2)} ₼</span>
        </div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid #e5e7eb;padding-top:8px;font-size:16px;font-weight:700">
          <span style="color:#111827">${escapeHtml(tr("Qalan Borc:", "Amount Due:"))}</span>
          <span style="color:#dc2626">${amountDue.toFixed(2)} ₼</span>
        </div>
      </div>
    </div>

    ${paymentsHtml}
    ${notesHtml}

    <div style="border-top:1px solid #e5e7eb;margin-top:32px;padding-top:24px;text-align:center">
      <p style="font-size:12px;color:#6b7280;margin:0">${escapeHtml(tr("Xidmətimizə görə təşəkkür edirik!", "Thank you for your business!"))}</p>
    </div>
  </div>
</body>
</html>`;
}

function mountInvoiceHtml(html: string): HTMLDivElement {
  const host = document.createElement("div");
  host.setAttribute("data-invoice-pdf-host", "1");
  host.style.cssText =
    "position:fixed;left:-10000px;top:0;width:800px;background:#fff;z-index:-1;pointer-events:none;";
  host.innerHTML = html;
  document.body.appendChild(host);
  return host;
}

/** Open the Invoice View print document (identical layout). */
export function printInvoiceDocument(opts: {
  invoice: InvoiceDetail;
  sourceOrder?: Pick<PosOrderDetail, "vehicleLabel" | "mileageAtService"> | null;
  tr: InvoicePdfTr;
}): void {
  const html = buildInvoiceDocumentHtml(opts);
  const w = window.open("", "_blank");
  if (!w) {
    throw new Error("Popup blocked");
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
  w.focus();
  const trigger = () => {
    try {
      w.print();
    } catch {
      /* ignore */
    }
  };
  if (w.document.readyState === "complete") {
    setTimeout(trigger, 50);
  } else {
    w.onload = () => setTimeout(trigger, 50);
  }
}

/**
 * PDF download from the same HTML as Invoice View print
 * (html2canvas → jsPDF) so Orders / Invoice download match 1:1.
 */
export async function downloadInvoicePdf(opts: {
  invoice: InvoiceDetail;
  sourceOrder?: Pick<PosOrderDetail, "vehicleLabel" | "mileageAtService"> | null;
  tr: InvoicePdfTr;
}): Promise<void> {
  const html = buildInvoiceDocumentHtml(opts);
  const host = mountInvoiceHtml(html);
  const root = host.querySelector("#invoice-root") as HTMLElement | null;

  try {
    if (!root) {
      throw new Error("Invoice layout missing");
    }

    // Wait a tick so fonts/layout settle before capture
    await new Promise((r) => requestAnimationFrame(() => r(undefined)));

    const canvas = await html2canvas(root, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 800,
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;

    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;

    let heightLeft = imgH;
    let position = margin;

    pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
    heightLeft -= usableH;

    while (heightLeft > 1) {
      position = margin - (imgH - heightLeft);
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", margin, position, imgW, imgH);
      heightLeft -= usableH;
    }

    const safeName = opts.invoice.invoiceNo.replace(/[^\w.-]+/g, "_");
    pdf.save(`invoice_${safeName}.pdf`);
  } finally {
    host.remove();
  }
}

/** Build an InvoiceDetail-shaped model from a POS order when no linked invoice exists yet. */
export function invoiceDetailFromPosOrder(order: PosOrderDetail): InvoiceDetail {
  const shipping = parseAmount(order.shipping ?? 0);
  const serviceFee = parseAmount(order.serviceFee ?? 0);

  const items = order.items.map((item) => {
    const unit = parseAmount(item.price);
    const total = unit * item.quantity;
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      description: item.productName,
      quantity: item.quantity,
      unitPrice: unit.toFixed(2),
      total: total.toFixed(2),
      sku: item.sku,
    };
  });

  if (shipping > 0) {
    items.push({
      id: "shipping",
      productId: null as unknown as string,
      productName: "Shipping",
      description: "Shipping",
      quantity: 1,
      unitPrice: shipping.toFixed(2),
      total: shipping.toFixed(2),
      sku: null as unknown as string,
    });
  }
  if (serviceFee > 0) {
    items.push({
      id: "service-fee",
      productId: null as unknown as string,
      productName: "Service fee",
      description: "Service fee",
      quantity: 1,
      unitPrice: serviceFee.toFixed(2),
      total: serviceFee.toFixed(2),
      sku: null as unknown as string,
    });
  }

  const productSubtotal = order.items.reduce((sum, i) => sum + parseAmount(i.price) * i.quantity, 0);
  const discount = parseAmount(order.discount ?? 0);
  const taxPercent = parseAmount(order.taxPercent ?? 0);
  const afterDisc = Math.max(productSubtotal - discount, 0);
  const tax = (afterDisc * taxPercent) / 100;
  const total = parseAmount(order.grandTotal);
  const paid = parseAmount(order.paid);
  const due = parseAmount(order.due);

  return {
    id: order.id,
    invoiceNo: order.reference || order.documentNo || order.id.slice(0, 8),
    documentNo: order.documentNo,
    createdAt: order.date,
    dueDate: order.date,
    customerId: order.customerId,
    customer: order.customerName
      ? {
          id: order.customerId ?? "",
          code: "",
          name: order.customerName,
          email: null,
          phone: null,
          country: null,
        }
      : null,
    notes: null,
    subtotal: productSubtotal.toFixed(2),
    tax: tax.toFixed(2),
    discount: discount.toFixed(2),
    total: total.toFixed(2),
    paid: paid.toFixed(2),
    amountDue: due.toFixed(2),
    status: order.paymentStatus || order.statusLabel || order.status,
    items:
      items.length > 0
        ? items
        : [
            {
              id: "line",
              productId: null,
              description: "—",
              quantity: 1,
              unitPrice: total.toFixed(2),
              total: total.toFixed(2),
            },
          ],
    payments: (order.payments ?? []).map((p) => ({
      targetType: p.targetType,
      paymentId: p.paymentId,
      method: p.method,
      allocatedAmount: p.allocatedAmount,
      paymentTotal: p.paymentTotal,
      date: p.date,
      note: p.note,
      reference: p.reference,
    })),
    posOrderId: order.id,
  };
}
