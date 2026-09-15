import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPurchase,
  recordPurchasePayment,
  type PurchaseDetail,
} from "../../api/purchases";
import {
  formatPurchaseDate,
  parsePurchaseAmount,
  mapPaymentMethodToApi,
} from "../../lib/purchaseMappers";
import type { PosUiPaymentMethod } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { ModernSelect } from "../ui/ModernSelect";

import { pickLang } from "../../i18n/pickLang";

interface PurchaseDetailModalProps {
  purchaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  onChanged?: () => void;
  overlayZIndexClass?: string;
}

function Field({
  label,
  value,
  required,
}: {
  label: string;
  value: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-900 dark:text-white mb-1.5">
        {label}
        {required ? <span className="text-red-500"> *</span> : null}
      </p>
      <div className="w-full px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white min-h-[30px] flex items-center">
        {value ?? "—"}
      </div>
    </div>
  );
}

function lineTaxAmount(price: number, qty: number, discount: number, taxPercent: number) {
  const base = price * qty - discount;
  return (base * taxPercent) / 100;
}

function lineTotalCost(price: number, qty: number, discount: number, taxPercent: number) {
  const base = price * qty - discount;
  return base + lineTaxAmount(price, qty, discount, taxPercent);
}

export function PurchaseDetailModal({
  purchaseId,
  isOpen,
  onClose,
  canEdit = false,
  onChanged,
  overlayZIndexClass = "z-50",
}: PurchaseDetailModalProps) {
  const { language } = useLanguage();
  const { isDemo } = useAuth();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosUiPaymentMethod>("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const loadPurchase = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchPurchase(id);
      setPurchase(data);
      const due = parsePurchaseAmount(data.due);
      setPaymentAmount(due > 0 ? String(due) : "");
      setPaymentNote("");
      setPaymentReference("");
      setPaymentMethod("cash");
    } catch (err) {
      notifyFromError(
        err,
        tr("Satınalma detalları yüklənə bilmədi", "Failed to load purchase details"),
      );
      setPurchase(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !purchaseId) {
      setPurchase(null);
      return;
    }
    void loadPurchase(purchaseId);
  }, [isOpen, purchaseId, language]);

  if (!isOpen || !purchaseId) return null;

  const total = purchase ? parsePurchaseAmount(purchase.total) : 0;
  const paid = purchase ? parsePurchaseAmount(purchase.paid) : 0;
  const due = purchase ? parsePurchaseAmount(purchase.due) : 0;
  const discount = purchase ? parsePurchaseAmount(purchase.discount ?? 0) : 0;
  const shippingCost = purchase ? parsePurchaseAmount(purchase.shipping ?? 0) : 0;
  const orderTax = purchase ? parsePurchaseAmount(purchase.orderTax ?? 0) : 0;

  const linesSubtotal =
    purchase?.items.reduce((sum, item) => {
      const price = parsePurchaseAmount(item.purchasePrice);
      const lineDiscount = parsePurchaseAmount(item.discount);
      const taxPercent = parsePurchaseAmount(item.taxPercent);
      return sum + lineTotalCost(price, item.quantity, lineDiscount, taxPercent);
    }, 0) ?? 0;

  const grandTotal = linesSubtotal + orderTax - discount + shippingCost;

  const statusLabel = (() => {
    if (!purchase) return "—";
    const key = purchase.status.toLowerCase();
    if (key === "ordered") return tr("Sifariş edildi", "Ordered");
    if (key === "pending") return tr("Gözləyir", "Pending");
    if (key === "received") return tr("Qəbul edildi", "Received");
    return purchase.statusLabel || purchase.status;
  })();

  const handleRecordPayment = async () => {
    if (!purchase || isDemo || !canEdit) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || amount > due) return;
    setRecordingPayment(true);
    try {
      const updated = await recordPurchasePayment(purchase.id, {
        amount,
        method: mapPaymentMethodToApi(paymentMethod),
        note: paymentNote.trim() || null,
        reference: paymentReference.trim() || null,
      });
      setPurchase(updated);
      const newDue = parsePurchaseAmount(updated.due);
      setPaymentAmount(newDue > 0 ? String(newDue) : "");
      setPaymentNote("");
      setPaymentReference("");
      notifySuccess(tr("Ödəniş qeydə alındı", "Payment recorded"));
      onChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 ${overlayZIndexClass} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 shrink-0">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Satınalma Detalları", "Purchase Details")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-3 flex-1 min-h-0">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">
              {tr("Yüklənir...", "Loading...")}
            </p>
          ) : !purchase ? (
            <p className="text-center text-sm text-gray-500 py-8">
              {tr("Satınalma tapılmadı", "Purchase not found")}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Field
                  label={tr("Filial", "Branch")}
                  value={purchase.storeName || "—"}
                  required
                />
                <Field
                  label={tr("Təchizatçı", "Supplier")}
                  value={purchase.supplierName || "—"}
                  required
                />
                <Field
                  label={tr("Tarix", "Date")}
                  value={formatPurchaseDate(purchase.date)}
                  required
                />
                <Field
                  label={tr("İstinad", "Reference")}
                  value={purchase.reference || purchase.documentNo || "—"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field
                  label={tr("Ödəniş statusu", "Payment status")}
                  value={purchase.paymentStatus || "—"}
                />
                <Field label={tr("Ödənilib", "Paid")} value={`₼ ${paid.toFixed(2)}`} />
                <Field
                  label={tr("Borc", "Due")}
                  value={
                    <span className={due > 0 ? "text-[#14b8a6] font-semibold" : undefined}>
                      ₼ {due.toFixed(2)}
                    </span>
                  }
                />
              </div>

              <div>
                <p className="text-xs font-medium text-gray-900 dark:text-white mb-1.5">
                  {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
                </p>
                <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs min-w-[700px]">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Məhsul", "Product")}
                        </th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Miqdar", "Qty")}
                        </th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Qiymət", "Price")}
                        </th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Endirim", "Discount")}
                        </th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Vergi %", "Tax %")}
                        </th>
                        <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {tr("Cəmi", "Total")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                            {tr("Məhsul yoxdur", "No items")}
                          </td>
                        </tr>
                      ) : (
                        purchase.items.map((item) => {
                          const price = parsePurchaseAmount(item.purchasePrice);
                          const lineDiscount = parsePurchaseAmount(item.discount);
                          const taxPercent = parsePurchaseAmount(item.taxPercent);
                          const lineTotal = lineTotalCost(
                            price,
                            item.quantity,
                            lineDiscount,
                            taxPercent,
                          );
                          return (
                            <tr
                              key={item.id}
                              className="border-t border-gray-200 dark:border-gray-700"
                            >
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                {item.productName}
                                {item.sku ? (
                                  <span className="text-gray-400 ml-1">({item.sku})</span>
                                ) : null}
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                {item.quantity}
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                {price.toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                {lineDiscount.toFixed(2)}
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                {taxPercent}
                              </td>
                              <td className="px-2 py-2 text-gray-900 dark:text-white">
                                ₼{lineTotal.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-72 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      {tr("Məhsul cəmi", "Lines subtotal")}
                    </span>
                    <span>₼ {linesSubtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>{tr("Ümumi məbləğ", "Grand total")}</span>
                    <span>₼ {(total || grandTotal).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field
                  label={tr("Sifariş vergisi", "Order tax")}
                  value={`₼ ${orderTax.toFixed(2)}`}
                />
                <Field
                  label={tr("Endirim", "Discount")}
                  value={`₼ ${discount.toFixed(2)}`}
                />
                <Field
                  label={tr("Çatdırılma", "Shipping")}
                  value={`₼ ${shippingCost.toFixed(2)}`}
                />
                <Field label={tr("Status", "Status")} value={statusLabel} required />
              </div>

              <Field
                label={tr("Təsvir", "Description")}
                value={purchase.description?.trim() ? purchase.description : "—"}
              />

              {purchase.payments.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {tr("Ödənişlər", "Payments")}
                  </p>
                  {purchase.payments.map((p) => (
                    <div
                      key={p.paymentId}
                      className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-2 last:border-0 last:pb-0"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatPurchaseDate(p.date)} — {p.method}
                        {p.reference ? ` · ${p.reference}` : ""}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ₼{parsePurchaseAmount(p.allocatedAmount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {purchase && due > 0 && !isDemo && canEdit && (
          <div className="shrink-0 border-t border-[#14b8a6]/30 bg-[#f0fdfa] dark:bg-[#134e4a]/30 px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                {tr("Ödəniş qeyd et", "Record payment")}
              </p>
              <p className="text-xs text-[#0f766e] dark:text-[#5eead4] font-medium">
                {tr("Borc", "Due")}: ₼ {due.toFixed(2)}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <input
                type="number"
                min={0}
                max={due}
                step="0.01"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder={tr("Məbləğ", "Amount")}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <ModernSelect
                value={paymentMethod}
                onChange={(value) => setPaymentMethod(value as PosUiPaymentMethod)}
                className="w-full"
                options={[
                  { value: "cash", label: tr("Nağd", "Cash") },
                  { value: "card", label: tr("Kart", "Card") },
                  { value: "bank", label: tr("Bank köçürməsi", "Bank transfer") },
                ]}
              />
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder={tr("İstinad (istəyə bağlı)", "Reference (optional)")}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder={tr("Qeyd (istəyə bağlı)", "Note (optional)")}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                disabled={
                  recordingPayment ||
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  parseFloat(paymentAmount) > due
                }
                onClick={() => void handleRecordPayment()}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] hover:bg-[#0d9488] text-white disabled:opacity-50"
              >
                {recordingPayment
                  ? tr("Qeyd edilir...", "Recording...")
                  : tr("Ödənişi qeyd et", "Record payment")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
