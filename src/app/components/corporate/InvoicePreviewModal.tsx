import { useState, useEffect, useCallback } from "react";
import { Download, Printer, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { pickLang } from "../../i18n/pickLang";
import {
  fetchInvoice,
  fetchPosOrder,
  type InvoiceDetail,
  type PosOrderDetail,
} from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import {
  downloadInvoicePdf,
  invoiceDetailFromPosOrder,
  printInvoiceDocument,
} from "../../lib/invoicePdf";
import { notifyFromError, notifySuccess } from "../../lib/toast";

function parseAmount(value: string | number): number {
  if (typeof value === "number") return value;
  return parseFloat(value) || 0;
}

interface InvoicePreviewModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InvoicePreviewModal({ orderId, isOpen, onClose }: InvoicePreviewModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [sourceOrder, setSourceOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) {
      setInvoice(null);
      setSourceOrder(null);
      return;
    }
    setLoading(true);
    try {
      const detail = await fetchPosOrder(orderId);
      setSourceOrder(detail);
      if (detail.invoiceId) {
        setInvoice(await fetchInvoice(detail.invoiceId));
      } else {
        setInvoice(invoiceDetailFromPosOrder(detail));
      }
    } catch (err) {
      notifyFromError(err, tr("Qaiməni yükləmək alınmadı", "Failed to load invoice"));
      setInvoice(null);
      setSourceOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, language]);

  useEffect(() => {
    if (!isOpen || !orderId) return;
    void load();
  }, [isOpen, orderId, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      await downloadInvoicePdf({ invoice, sourceOrder, tr });
      notifySuccess(tr("Qaimə yükləndi", "Invoice downloaded"));
    } catch (err) {
      notifyFromError(err, tr("Qaimə yüklənə bilmədi", "Failed to download invoice"));
    }
  };

  const handlePrint = () => {
    if (!invoice) return;
    try {
      printInvoiceDocument({ invoice, sourceOrder, tr });
    } catch (err) {
      notifyFromError(err, tr("Çap uğursuz oldu", "Failed to print"));
    }
  };

  const customer = invoice?.customer;
  const total = invoice ? parseAmount(invoice.total) : 0;
  const subtotal = invoice ? parseAmount(invoice.subtotal) : 0;
  const tax = invoice ? parseAmount(invoice.tax) : 0;
  const discount = invoice ? parseAmount(invoice.discount) : 0;
  const paid = invoice ? parseAmount(invoice.paid) : 0;
  const amountDue = invoice ? parseAmount(invoice.amountDue) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {invoice
                ? `${tr("Qaimə", "Invoice")} #${invoice.invoiceNo}`
                : tr("Qaimə önizləməsi", "Invoice preview")}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {tr("Çap edin və ya yükləyin", "Print or download")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={!invoice || loading}
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Çap et", "Print")}</span>
            </button>
            <button
              type="button"
              disabled={!invoice || loading}
              onClick={() => void handleDownload()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Yüklə", "Download")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={tr("Bağla", "Close")}
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-16">
              {tr("Yüklənir...", "Loading...")}
            </p>
          ) : !invoice ? (
            <p className="text-center text-sm text-gray-500 py-16">
              {tr("Qaimə tapılmadı", "Invoice not found")}
            </p>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 sm:p-8">
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
                      <span className="text-gray-500 dark:text-gray-400">
                        {tr("Qaimə No:", "Invoice No:")}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {invoice.invoiceNo}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {tr("Tarix:", "Date:")}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSalesDate(invoice.createdAt)}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {tr("Son Tarix:", "Due Date:")}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatSalesDate(invoice.dueDate)}
                      </span>
                    </div>
                    <div className="flex justify-end gap-2">
                      <span className="text-gray-500 dark:text-gray-400">
                        {tr("Status:", "Status:")}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {invoice.status}
                      </span>
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
                    <p className="text-gray-600 dark:text-gray-400">
                      {tr("Müştəri təyin edilməyib", "No customer assigned")}
                    </p>
                  )}
                </div>
                {sourceOrder?.vehicleLabel && (
                  <div className="mt-3 text-sm text-gray-900 dark:text-white">
                    <p>
                      <span className="text-gray-500 dark:text-gray-400">
                        {tr("Avtomobil", "Vehicle")}:
                      </span>{" "}
                      {sourceOrder.vehicleLabel}
                    </p>
                    {sourceOrder.mileageAtService != null && (
                      <p>
                        <span className="text-gray-500 dark:text-gray-400">
                          {tr("Yürüş", "Mileage")}:
                        </span>{" "}
                        {sourceOrder.mileageAtService} km
                      </p>
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
                          <td className="py-3 text-sm text-gray-900 dark:text-white">
                            {item.description}
                          </td>
                          <td className="py-3 text-sm text-gray-600 dark:text-gray-400 text-right">
                            {item.quantity}
                          </td>
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
                    <span className="text-gray-600 dark:text-gray-400">
                      {tr("Alt Məbləğ:", "Subtotal:")}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {subtotal.toFixed(2)} ₼
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Vergi:", "Tax:")}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {tax.toFixed(2)} ₼
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {tr("Endirim:", "Discount:")}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {discount.toFixed(2)} ₼
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-300 dark:border-gray-700 pt-2 flex justify-between text-base font-bold">
                    <span className="text-gray-900 dark:text-white">{tr("Ümumi:", "Total:")}</span>
                    <span className="text-gray-900 dark:text-white">{total.toFixed(2)} ₼</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {tr("Ödənilib:", "Paid:")}
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {paid.toFixed(2)} ₼
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-800 pt-2 flex justify-between text-base font-bold">
                    <span className="text-gray-900 dark:text-white">
                      {tr("Qalan Borc:", "Amount Due:")}
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {amountDue.toFixed(2)} ₼
                    </span>
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
                          <th className="text-left text-xs font-medium text-gray-500 pb-2">
                            {tr("Tarix", "Date")}
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 pb-2">
                            {tr("Üsul", "Method")}
                          </th>
                          <th className="text-right text-xs font-medium text-gray-500 pb-2">
                            {tr("Məbləğ", "Amount")}
                          </th>
                          <th className="text-left text-xs font-medium text-gray-500 pb-2">
                            {tr("İstinad", "Reference")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(invoice.payments ?? []).map((payment) => (
                          <tr
                            key={payment.paymentId}
                            className="border-b border-gray-100 dark:border-gray-800"
                          >
                            <td className="py-2 text-xs text-gray-600 dark:text-gray-400">
                              {formatSalesDate(payment.date)}
                            </td>
                            <td className="py-2 text-xs text-gray-900 dark:text-white">
                              {payment.method}
                            </td>
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

              <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tr("Xidmətimizə görə təşəkkür edirik!", "Thank you for your business!")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
