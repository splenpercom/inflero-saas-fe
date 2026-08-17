import { useEffect, useState } from "react";
import { X, User, Calendar, Package, FileText, CreditCard, UserCheck, Car } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { fetchPosOrder, type PosOrderDetail } from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { notifyFromError } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
interface SaleDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SaleDetailModal({ orderId, isOpen, onClose }: SaleDetailModalProps) {
  const { language } = useLanguage();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [order, setOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    fetchPosOrder(orderId)
      .then(setOrder)
      .catch((err) => {
        notifyFromError(err, tr("Satış detalları yüklənə bilmədi", "Failed to load sale details"));
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId, language]);

  if (!isOpen || !orderId) return null;

  const grandTotal = order ? parseFloat(order.grandTotal) : 0;
  const paid = order ? parseFloat(order.paid) : 0;
  const due = order ? parseFloat(order.due) : 0;
  const discount = order?.discount ? parseFloat(order.discount) : 0;
  const shippingCost = order?.shipping ? parseFloat(order.shipping) : 0;
  const serviceFee = order?.serviceFee ? parseFloat(order.serviceFee) : 0;
  const commissionAmount = order?.commissionAmount ? parseFloat(order.commissionAmount) : 0;
  const taxPercent = order?.taxPercent ? parseFloat(order.taxPercent) : 0;
  const itemsSubtotal = order?.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) ?? 0;
  const taxAmount = (itemsSubtotal * taxPercent) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0026f6] to-[#001db8] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Satış Detalları", "Sale Details")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{order?.reference ?? "—"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Yüklənir...", "Loading...")}</p>
          ) : !order ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Satış tapılmadı", "Sale not found")}</p>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Müştəri", "Customer")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customerName ?? "—"}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Tarix", "Date")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatSalesDate(order.date)}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <UserCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Kassir", "Biller")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.billerName ?? "—"}</p>
                </div>

                <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Ödəniş Statusu", "Payment Status")}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.paymentStatus}</p>
                </div>
                {order.vehicleLabel && (
                  <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                        <Car className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{tr("Avtomobil", "Vehicle")}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.vehicleLabel}</p>
                    {order.mileageAtService != null && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{order.mileageAtService} km</p>
                    )}
                  </div>
                )}
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
                      {order.items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-xs text-gray-500">
                            {tr("Məhsul yoxdur", "No items")}
                          </td>
                        </tr>
                      ) : (
                        order.items.map((item) => {
                          const price = parseFloat(item.price);
                          const lineTotal = price * item.quantity;
                          return (
                            <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                              <td className="py-2 px-3 text-xs text-gray-900 dark:text-white">{item.productName}</td>
                              <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{item.sku}</td>
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
                    {taxPercent > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Vergi", "Tax")} ({taxPercent}%):</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {shippingCost > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Göndərmə", "Shipping")}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{shippingCost.toFixed(2)}</span>
                      </div>
                    )}
                    {serviceFee > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Xidmət haqqı", "Service fee")}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{serviceFee.toFixed(2)}</span>
                      </div>
                    )}
                    {order.commissionEnabled && commissionAmount > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Komissiya", "Commission")}:</span>
                        <span className="font-medium text-gray-900 dark:text-white">₼{commissionAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2" />
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-white">{tr("Ümumi Cəmi", "Grand Total")}:</span>
                      <span className="font-bold text-lg text-[#0026f6] dark:text-[#0026f6]">₼{grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib", "Paid")}:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">₼{paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Borc", "Due")}:</span>
                      <span className="font-medium text-[#0026f6] dark:text-[#0026f6]">₼{due.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
