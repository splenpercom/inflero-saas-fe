import { useEffect, useState, useCallback } from "react";
import { X, DollarSign, Plus } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchPosOrder, type PosOrderDetail } from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { notifyFromError } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
interface ShowPaymentsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onCreatePayment: () => void;
  reloadKey?: number;
}

function formatPaymentMethod(method: string, tr: (az: string, en: string) => string) {
  const key = method.toUpperCase();
  const labels: Record<string, string> = {
    CASH: tr("Nağd", "Cash"),
    CARD: tr("Kart", "Card"),
    BANK_TRANSFER: tr("Bank köçürməsi", "Bank Transfer"),
    CHEQUE: tr("Çek", "Cheque"),
    CREDIT_CARD: tr("Kredit kartı", "Credit Card"),
    DEBIT_CARD: tr("Debet kartı", "Debit Card"),
  };
  return labels[key] ?? method;
}

export function ShowPaymentsModal({
  orderId,
  isOpen,
  onClose,
  onCreatePayment,
  reloadKey = 0,
}: ShowPaymentsModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [order, setOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const data = await fetchPosOrder(orderId);
      setOrder(data);
    } catch (err) {
      notifyFromError(err, tr("Ödəniş məlumatları yüklənə bilmədi", "Failed to load payment info"));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId, language]);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }
    void loadOrder();
  }, [isOpen, orderId, reloadKey, loadOrder]);

  if (!isOpen || !orderId) return null;

  const grandTotal = order ? parseFloat(order.grandTotal) : 0;
  const paid = order ? parseFloat(order.paid) : 0;
  const due = order ? parseFloat(order.due) : 0;
  const payments = order?.payments ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Ödənişlər", "Payments")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {order ? `${order.reference} - ${order.customerName ?? "—"}` : "—"}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-6 space-y-4">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Yüklənir...", "Loading...")}</p>
          ) : !order ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Sifariş tapılmadı", "Order not found")}</p>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr("Ümumi Cəmi", "Total Amount")}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">₼{grandTotal.toFixed(2)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr("Ödənilib", "Paid")}</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">₼{paid.toFixed(2)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-[#14b8a6]/20 dark:border-[#14b8a6]/30 bg-[#f0f3ff]/50 dark:bg-[#14b8a6]/10">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{tr("Borc", "Due")}</p>
                  <p className="text-lg font-bold text-[#14b8a6] dark:text-[#14b8a6]">₼{due.toFixed(2)}</p>
                </div>
              </div>

              <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tr("Ödəniş Tarixçəsi", "Payment History")}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onCreatePayment();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {tr("Ödəniş Əlavə Et", "Add Payment")}
                  </button>
                </div>

                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {tr("Hələ ödəniş qeydə alınmayıb", "No payments recorded yet")}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                            {tr("Tarix", "Date")}
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                            {tr("Üsul", "Method")}
                          </th>
                          <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                            {tr("Məbləğ", "Amount")}
                          </th>
                          <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-400 py-2 px-3">
                            {tr("İstinad / Qeyd", "Reference / Note")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.paymentId} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">
                              {formatSalesDate(payment.date)}
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-900 dark:text-white">
                              {formatPaymentMethod(payment.method, tr)}
                            </td>
                            <td className="py-2 px-3 text-xs text-right font-medium text-gray-900 dark:text-white">
                              ₼{parseFloat(payment.allocatedAmount).toFixed(2)}
                            </td>
                            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">
                              {payment.reference || payment.note || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
