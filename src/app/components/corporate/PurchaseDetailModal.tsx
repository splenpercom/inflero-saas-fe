import { useEffect, useState } from "react";
import { X, User, Calendar, Package, FileText, CreditCard } from "lucide-react";
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

import { pickLang } from "../../i18n/pickLang";
interface PurchaseDetailModalProps {
  purchaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  canEdit?: boolean;
  onChanged?: () => void;
  overlayZIndexClass?: string;
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
      notifyFromError(err, tr("Satınalma detalları yüklənə bilmədi", "Failed to load purchase details"));
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
  const discount = purchase?.discount ? parsePurchaseAmount(purchase.discount) : 0;
  const shippingCost = purchase?.shipping ? parsePurchaseAmount(purchase.shipping) : 0;
  const orderTax = purchase?.orderTax ? parsePurchaseAmount(purchase.orderTax) : 0;
  const itemsSubtotal =
    purchase?.items.reduce((sum, item) => sum + parsePurchaseAmount(item.totalCost), 0) ?? 0;

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
    <div className={`fixed inset-0 ${overlayZIndexClass} flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm`}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#14b8a6] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Satınalma Detalları", "Purchase Details")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {purchase?.reference ?? purchase?.documentNo ?? "—"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Yüklənir...", "Loading...")}</p>
          ) : !purchase ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Satınalma tapılmadı", "Purchase not found")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Təchizatçı", "Supplier")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{purchase.supplierName ?? "—"}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Tarix", "Date")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatPurchaseDate(purchase.date)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Package className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Status", "Status")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{purchase.statusLabel}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Ödəniş Statusu", "Payment Status")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{purchase.paymentStatus}</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {tr("Məhsullar", "Products")}
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                          {tr("Məhsul", "Product")}
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">SKU</th>
                        <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                          {tr("Miqdar", "Qty")}
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                          {tr("Qiymət", "Price")}
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                          {tr("Cəmi", "Total")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchase.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-gray-500">
                            {tr("Məhsul yoxdur", "No items")}
                          </td>
                        </tr>
                      ) : (
                        purchase.items.map((item) => {
                          const price = parsePurchaseAmount(item.purchasePrice);
                          const lineTotal = parsePurchaseAmount(item.totalCost);
                          return (
                            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 px-3 text-xs text-gray-900 dark:text-white">{item.productName}</td>
                              <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{item.sku ?? "—"}</td>
                              <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">{item.quantity}</td>
                              <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">₼{price.toFixed(2)}</td>
                              <td className="py-2 px-3 text-xs text-right font-semibold text-gray-900 dark:text-white">
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

              <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                <div className="flex justify-end">
                  <div className="w-full md:w-1/2 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Ara Cəmi", "Subtotal")}:</span>
                      <span className="font-medium text-gray-900 dark:text-white">₼{itemsSubtotal.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Endirim", "Discount")}:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">-₼{discount.toFixed(2)}</span>
                      </div>
                    )}
                    {orderTax > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Sifariş vergisi", "Order tax")}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{orderTax.toFixed(2)}</span>
                      </div>
                    )}
                    {shippingCost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Göndərmə", "Shipping")}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{tr("Ümumi Cəmi", "Grand Total")}:</span>
                      <span className="font-bold text-lg text-[#14b8a6] dark:text-[#14b8a6]">₼{total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib", "Paid")}:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">₼{paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Borc", "Due")}:</span>
                      <span className="font-medium text-[#14b8a6] dark:text-[#14b8a6]">₼{due.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {purchase.payments.length > 0 && (
                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                    {tr("Ödənişlər", "Payments")}
                  </h3>
                  <div className="space-y-2">
                    {purchase.payments.map((p) => (
                      <div
                        key={p.paymentId}
                        className="flex justify-between text-xs border-b border-gray-100 dark:border-gray-800 pb-2"
                      >
                        <span className="text-gray-600 dark:text-gray-400">
                          {formatPurchaseDate(p.date)} — {p.method}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ₼{parsePurchaseAmount(p.allocatedAmount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {due > 0 && !isDemo && canEdit && (
                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tr("Ödəniş qeyd et", "Record payment")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PosUiPaymentMethod)}
                      className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="cash">{tr("Nağd", "Cash")}</option>
                      <option value="card">{tr("Kart", "Card")}</option>
                      <option value="bank">{tr("Bank köçürməsi", "Bank transfer")}</option>
                    </select>
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
                  <button
                    type="button"
                    disabled={
                      recordingPayment ||
                      !paymentAmount ||
                      parseFloat(paymentAmount) <= 0 ||
                      parseFloat(paymentAmount) > due
                    }
                    onClick={() => void handleRecordPayment()}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] text-white disabled:opacity-50"
                  >
                    {recordingPayment
                      ? tr("Qeyd edilir...", "Recording...")
                      : tr("Ödənişi qeyd et", "Record payment")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
