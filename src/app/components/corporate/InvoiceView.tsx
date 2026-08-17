import { pickLang } from "../../i18n/pickLang";
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, Printer, Mail, DollarSign, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import {
  fetchInvoice,
  fetchPosOrder,
  deleteInvoice,
  recordInvoicePayment,
  type InvoiceDetail,
  type PosOrderDetail,
  type PaymentMethodApi,
} from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { notifyFromError, notifyInfo, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { CreatePaymentModal } from "./CreatePaymentModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function mapPaymentMethodToApi(method: string): PaymentMethodApi {
  if (method === "Card") return "CARD";
  if (method === "Bank Transfer") return "BANK_TRANSFER";
  return "CASH";
}

function parseAmount(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

function formatPdfMoney(value: string | number): string {
  return `${parseAmount(value).toFixed(2)} AZN`;
}

export function InvoiceView() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canEdit, canDelete } = useModulePermissions("Sales");
  const askConfirm = useConfirm();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [sourceOrder, setSourceOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const loadInvoice = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo)) {
      setInvoice(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchInvoice(id);
      setInvoice(data);
      if (data.posOrderId) {
        setSourceOrder(await fetchPosOrder(data.posOrderId).catch(() => null));
      } else {
        setSourceOrder(null);
      }
    } catch (err) {
      notifyFromError(err, tr("Qaiməni yükləmək alınmadı", "Failed to load invoice"));
      setInvoice(null);
      setSourceOrder(null);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, isAuthenticated, language]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const handleDelete = async () => {
    if (!id || !canDelete || isDemo) return;
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu qaiməni silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this invoice?"),
      variant: "danger",
    }))) {
      return;
    }
    try {
      await deleteInvoice(id);
      notifySuccess(tr("Qaimə silindi", "Invoice deleted"));
      navigate("/dashboard/sales/invoices");
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleRecordPayment = async (paymentData: {
    amount: number;
    paymentMethod: string;
    reference: string;
    note: string;
  }) => {
    if (!id || !invoice) return;
    try {
      await recordInvoicePayment(id, {
        amount: paymentData.amount,
        method: mapPaymentMethodToApi(paymentData.paymentMethod),
        reference: paymentData.reference || null,
        note: paymentData.note || null,
      });
      notifySuccess(tr("Ödəniş qeydə alındı", "Payment recorded"));
      void loadInvoice();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleComingSoon = () => {
    notifyInfo(tr("Tezliklə əlavə olunacaq", "Coming soon"));
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const invTotal = parseAmount(invoice.total);
    const invSubtotal = parseAmount(invoice.subtotal);
    const invTax = parseAmount(invoice.tax);
    const invDiscount = parseAmount(invoice.discount);
    const invPaid = parseAmount(invoice.paid);
    const invDue = parseAmount(invoice.amountDue);
    const invCustomer = invoice.customer;

    doc.setFontSize(18);
    doc.setTextColor(0, 38, 246);
    doc.text("Inflero", 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text("123 Business Street, Business City", 14, 25);
    doc.text("noreply@inflero.com", 14, 30);

    doc.setFontSize(16);
    doc.setTextColor(0, 38, 246);
    doc.text(tr("QAİMƏ", "INVOICE"), 140, 18, { align: "right" });
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`${tr("Qaimə No", "Invoice No")}: ${invoice.invoiceNo}`, 140, 26, { align: "right" });
    doc.text(`${tr("Tarix", "Date")}: ${formatSalesDate(invoice.createdAt)}`, 140, 32, { align: "right" });
    doc.text(`${tr("Son Tarix", "Due Date")}: ${formatSalesDate(invoice.dueDate)}`, 140, 38, { align: "right" });
    doc.text(`${tr("Status", "Status")}: ${invoice.status}`, 140, 44, { align: "right" });

    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(tr("Müştəri", "Bill To"), 14, 52);
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    if (invCustomer) {
      doc.text(invCustomer.name, 14, 58);
      let y = 63;
      if (invCustomer.country) {
        doc.text(invCustomer.country, 14, y);
        y += 5;
      }
      if (invCustomer.email) {
        doc.text(invCustomer.email, 14, y);
        y += 5;
      }
      if (invCustomer.phone) {
        doc.text(invCustomer.phone, 14, y);
      }
    } else {
      doc.text(tr("Müştəri təyin edilməyib", "No customer assigned"), 14, 58);
    }
    if (sourceOrder?.vehicleLabel) {
      doc.text(`${tr("Avtomobil", "Vehicle")}: ${sourceOrder.vehicleLabel}`, 105, 58);
      if (sourceOrder.mileageAtService != null) {
        doc.text(`${tr("Yürüş", "Mileage")}: ${sourceOrder.mileageAtService} km`, 105, 63);
      }
    }

    autoTable(doc, {
      startY: 78,
      head: [
        [
          tr("Təsvir", "Description"),
          tr("Miqdar", "Qty"),
          tr("Qiymət", "Unit Price"),
          tr("Cəm", "Total"),
        ],
      ],
      body: invoice.items.map((item) => [
        item.description,
        String(item.quantity),
        formatPdfMoney(item.unitPrice),
        formatPdfMoney(item.total),
      ]),
      theme: "grid",
      headStyles: { fillColor: [0, 38, 246], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: {
        1: { halign: "right" },
        2: { halign: "right" },
        3: { halign: "right" },
      },
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 120;
    let y = finalY + 10;

    const totals: [string, string][] = [
      [tr("Alt Məbləğ", "Subtotal"), formatPdfMoney(invSubtotal)],
      [tr("Vergi", "Tax"), formatPdfMoney(invTax)],
      [tr("Endirim", "Discount"), formatPdfMoney(invDiscount)],
      [tr("Ümumi", "Total"), formatPdfMoney(invTotal)],
      [tr("Ödənilib", "Paid"), formatPdfMoney(invPaid)],
      [tr("Qalan Borc", "Amount Due"), formatPdfMoney(invDue)],
    ];

    doc.setFontSize(10);
    totals.forEach(([label, value]) => {
      doc.text(label, 130, y);
      doc.text(value, 196, y, { align: "right" });
      y += 6;
    });

    const payments = invoice.payments ?? [];
    if (payments.length > 0) {
      y += 4;
      autoTable(doc, {
        startY: y,
        head: [
          [
            tr("Tarix", "Date"),
            tr("Üsul", "Method"),
            tr("Məbləğ", "Amount"),
            tr("İstinad", "Reference"),
          ],
        ],
        body: payments.map((payment) => [
          formatSalesDate(payment.date),
          payment.method,
          formatPdfMoney(payment.allocatedAmount),
          payment.reference || payment.note || "-",
        ]),
        theme: "striped",
        headStyles: { fillColor: [0, 38, 246], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
      });
    }

    if (invoice.notes) {
      const notesY =
        (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 10;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text(tr("Qeydlər", "Notes"), 14, notesY + 10);
      doc.setTextColor(80, 80, 80);
      doc.text(invoice.notes, 14, notesY + 16, { maxWidth: 180 });
    }

    const safeName = invoice.invoiceNo.replace(/[^\w.-]+/g, "_");
    doc.save(`invoice_${safeName}.pdf`);
    notifySuccess(tr("Qaimə yükləndi", "Invoice downloaded"));
  };

  if (loading) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-8 text-center text-sm text-gray-500">
        {tr("Yüklənir...", "Loading...")}
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-8 text-center">
        <p className="text-sm text-gray-500 mb-4">
          {tr("Qaimə tapılmadı", "Invoice not found")}
        </p>
        <button
          onClick={() => navigate("/dashboard/sales/invoices")}
          className="text-xs text-[#0026f6] dark:text-[#0026f6] hover:underline"
        >
          {tr("Qaimələrə qayıt", "Back to invoices")}
        </button>
      </div>
    );
  }

  const total = parseAmount(invoice.total);
  const subtotal = parseAmount(invoice.subtotal);
  const tax = parseAmount(invoice.tax);
  const discount = parseAmount(invoice.discount);
  const paid = parseAmount(invoice.paid);
  const amountDue = parseAmount(invoice.amountDue);
  const customer = invoice.customer;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard/sales/invoices")}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
                {tr("Qaimə", "Invoice")} #{invoice.invoiceNo}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tr("Qaimə detalları", "Invoice details")}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canEdit && amountDue > 0 && !isDemo && (
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr("Ödəniş qeyd et", "Record Payment")}</span>
              </button>
            )}
            {canDelete && !isDemo && (
              <button
                onClick={() => void handleDelete()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-red-300 dark:border-red-800 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tr("Sil", "Delete")}</span>
              </button>
            )}
            <button
              onClick={handleComingSoon}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Göndər", "Send")}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Çap et", "Print")}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Yüklə", "Download")}</span>
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 sm:p-8 print:shadow-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inflero</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                123 Business Street
                <br />
                Business City, BC 12345
                <br />
                noreply@inflero.com
                <br />
                +1 (555) 123-4567
              </p>
            </div>

            <div className="text-right">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {tr("QAİMƏ", "INVOICE")}
              </h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-end gap-2">
                  <span className="text-gray-500 dark:text-gray-400">{tr("Qaimə No:", "Invoice No:")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{invoice.invoiceNo}</span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-gray-500 dark:text-gray-400">{tr("Tarix:", "Date:")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatSalesDate(invoice.createdAt)}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-gray-500 dark:text-gray-400">{tr("Son Tarix:", "Due Date:")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatSalesDate(invoice.dueDate)}
                  </span>
                </div>
                <div className="flex justify-end gap-2">
                  <span className="text-gray-500 dark:text-gray-400">{tr("Status:", "Status:")}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{invoice.status}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {tr("Müştəri", "Bill To")}
            </h4>
            <div className="text-sm text-gray-900 dark:text-white">
              {customer ? (
                <>
                  <p className="font-semibold text-base mb-1">{customer.name}</p>
                  {customer.country && (
                    <p className="text-gray-600 dark:text-gray-400">{customer.country}</p>
                  )}
                  {customer.email && (
                    <p className="text-gray-600 dark:text-gray-400">{customer.email}</p>
                  )}
                  {customer.phone && (
                    <p className="text-gray-600 dark:text-gray-400">{customer.phone}</p>
                  )}
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">{tr("Müştəri təyin edilməyib", "No customer assigned")}</p>
              )}
            </div>
            {sourceOrder?.vehicleLabel && (
              <div className="mt-3 text-sm text-gray-900 dark:text-white">
                <p><span className="text-gray-500 dark:text-gray-400">{tr("Avtomobil", "Vehicle")}:</span> {sourceOrder.vehicleLabel}</p>
                {sourceOrder.mileageAtService != null && (
                  <p><span className="text-gray-500 dark:text-gray-400">{tr("Yürüş", "Mileage")}:</span> {sourceOrder.mileageAtService} km</p>
                )}
              </div>
            )}
          </div>

          <div className="mb-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-700">
                  <th className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                    {tr("Təsvir", "Description")}
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                    {tr("Miqdar", "Qty")}
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                    {tr("Qiymət", "Unit Price")}
                  </th>
                  <th className="text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider pb-3">
                    {tr("Cəm", "Total")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, index) => {
                  const unitPrice = parseAmount(item.unitPrice);
                  const lineTotal = parseAmount(item.total);
                  return (
                  <tr
                    key={item.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0 ? "" : "bg-gray-50/30 dark:bg-gray-800/10"
                    }`}
                  >
                    <td className="py-3 text-sm text-gray-900 dark:text-white">{item.description}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                      {unitPrice.toFixed(2)} ₼
                    </td>
                    <td className="py-3 text-sm font-medium text-gray-900 dark:text-white text-right">
                      {lineTotal.toFixed(2)} ₼
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mb-8">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{tr("Alt Məbləğ:", "Subtotal:")}</span>
                <span className="font-medium text-gray-900 dark:text-white">{subtotal.toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{tr("Vergi:", "Tax:")}</span>
                <span className="font-medium text-gray-900 dark:text-white">{tax.toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{tr("Endirim:", "Discount:")}</span>
                <span className="font-medium text-gray-900 dark:text-white">{discount.toFixed(2)} ₼</span>
              </div>
              <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-2 flex justify-between text-base font-bold">
                <span className="text-gray-900 dark:text-white">{tr("Ümumi:", "Total:")}</span>
                <span className="text-gray-900 dark:text-white">{total.toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib:", "Paid:")}</span>
                <span className="font-medium text-green-600 dark:text-green-400">{paid.toFixed(2)} ₼</span>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 flex justify-between text-base font-bold">
                <span className="text-gray-900 dark:text-white">{tr("Qalan Borc:", "Amount Due:")}</span>
                <span className="text-red-600 dark:text-red-400">{amountDue.toFixed(2)} ₼</span>
              </div>
            </div>
          </div>

          {(invoice.payments ?? []).length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {tr("Ödənişlər", "Payments")}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left text-xs font-medium text-gray-500 pb-2">{tr("Tarix", "Date")}</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-2">{tr("Üsul", "Method")}</th>
                      <th className="text-right text-xs font-medium text-gray-500 pb-2">{tr("Məbləğ", "Amount")}</th>
                      <th className="text-left text-xs font-medium text-gray-500 pb-2">{tr("İstinad", "Reference")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(invoice.payments ?? []).map((payment) => (
                      <tr key={payment.paymentId} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 text-xs text-gray-600 dark:text-gray-400">
                          {formatSalesDate(payment.date)}
                        </td>
                        <td className="py-2 text-xs text-gray-900 dark:text-white">{payment.method}</td>
                        <td className="py-2 text-xs text-gray-900 dark:text-white text-right">
                          {parseAmount(payment.allocatedAmount).toFixed(2)} ₼
                        </td>
                        <td className="py-2 text-xs text-gray-600 dark:text-gray-400">
                          {payment.reference || payment.note || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
              <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {tr("Qeydlər", "Notes")}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">{invoice.notes}</p>
            </div>
          )}

          <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center print:block">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tr("Xidmətimizə görə təşəkkür edirik!", "Thank you for your business!")}
            </p>
          </div>
        </div>
      </div>

      <CreatePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        paymentSummary={
          isPaymentModalOpen
            ? {
                reference: invoice.invoiceNo,
                customerName: customer?.name || tr("Müştəri yoxdur", "No customer"),
                grandTotal: total,
                paid,
                due: amountDue,
              }
            : null
        }
        onSaved={async (data) => {
          await handleRecordPayment(data);
        }}
      />
    </div>
  );
}
