import { useEffect, useState } from "react";
import { X, User, Calendar, Package, FileText, CreditCard, UserCheck, Car, Printer, ChefHat, Loader2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  fetchPosOrder,
  recordPosOrderPayment,
  updatePosOrder,
  type PosOrderDetail,
} from "../../api/sales";
import {
  formatSalesDate,
  isDraftOrderStatus,
  mapPaymentMethodFromApi,
  mapPaymentMethodToApi,
  type PosUiPaymentMethod,
} from "../../lib/salesMappers";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";
import { APP_LOGO_LIGHT } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { posOrderToThermalPayload, printPosTicket } from "../../lib/posPrint";
import { useModulePermissions } from "../../hooks/useModulePermissions";

import { pickLang } from "../../i18n/pickLang";

interface SaleDetailModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  canFinalize?: boolean;
  isDemo?: boolean;
  onFinalized?: () => void;
}

export function SaleDetailModal({
  orderId,
  isOpen,
  onClose,
  canFinalize = false,
  isDemo = false,
  onFinalized,
}: SaleDetailModalProps) {
  const { language } = useLanguage();
  const { user, hasModule } = useAuth();
  const diningEnabled = hasModule("DINING");
  const { canView: canViewSales } = useModulePermissions("Sales");
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const [order, setOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [printing, setPrinting] = useState<"receipt" | "kot" | null>(null);
  const [finalizePaymentMethod, setFinalizePaymentMethod] = useState<PosUiPaymentMethod>("cash");
  const [finalizePaid, setFinalizePaid] = useState(true);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    fetchPosOrder(orderId)
      .then((detail) => {
        setOrder(detail);
        setFinalizePaymentMethod(mapPaymentMethodFromApi(detail.paymentMethod));
        setFinalizePaid(true);
      })
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
  const refunded = order?.refunded ? parseFloat(order.refunded) : 0;
  const discount = order?.discount ? parseFloat(order.discount) : 0;
  const shippingCost = order?.shipping ? parseFloat(order.shipping) : 0;
  const serviceFee = order?.serviceFee ? parseFloat(order.serviceFee) : 0;
  const commissionAmount = order?.commissionAmount ? parseFloat(order.commissionAmount) : 0;
  const taxPercent = order?.taxPercent ? parseFloat(order.taxPercent) : 0;
  const itemsSubtotal = order?.items.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0) ?? 0;
  const taxAmount = (itemsSubtotal * taxPercent) / 100;
  const isDraft = order ? isDraftOrderStatus(order.status) || isDraftOrderStatus(order.statusLabel) : false;

  const handleFinalize = async () => {
    if (!order || !canFinalize || isDemo) return;
    if (order.items.length === 0) {
      notifyWarning(tr("Sifarişdə məhsul yoxdur", "This order has no items"));
      return;
    }
    setFinalizing(true);
    try {
      const updated = await updatePosOrder(order.id, {
        status: "COMPLETED",
        paymentMethod: mapPaymentMethodToApi(finalizePaymentMethod),
      });
      const remaining = parseFloat(updated.due);
      if (finalizePaid && remaining > 0) {
        await recordPosOrderPayment(order.id, {
          amount: remaining,
          method: mapPaymentMethodToApi(finalizePaymentMethod),
          note: "Payment on draft finalize",
        });
      }
      notifySuccess(tr("Sifariş tamamlandı", "Order finalized"));
      onFinalized?.();
      onClose();
    } catch (err) {
      notifyFromError(err, tr("Sifarişi tamamlamaq alınmadı", "Failed to finalize order"));
    } finally {
      setFinalizing(false);
    }
  };

  const handleThermalPrint = async (role: "receipt" | "kot") => {
    if (!order || isDemo) return;
    setPrinting(role);
    try {
      const logoSrc =
        getCompanyLogoUrl(user?.tenant, false) ??
        getCompanyLogoUrl(user?.tenant, true) ??
        APP_LOGO_LIGHT;
      const payload = posOrderToThermalPayload(order, {
        language,
        companyName: user?.tenant?.name?.trim() || "Inflero",
        logoSrc,
      });
      const result = await printPosTicket({ role, language, payload });
      notifySuccess(
        result.channel === "qz"
          ? tr(`Çap edildi → ${result.printer}`, `Printed → ${result.printer}`)
          : tr("Brauzer çap dialoqu açıldı", "Browser print dialog opened"),
      );
    } catch (err) {
      notifyFromError(err, tr("Çap alınmadı", "Print failed"));
    } finally {
      setPrinting(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14b8a6] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {tr("Satış Detalları", "Sale Details")}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{order?.reference ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {order && !loading && canViewSales && (
              <>
                <button
                  type="button"
                  onClick={() => void handleThermalPrint("receipt")}
                  disabled={!!printing || isDemo || order.items.length === 0}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg disabled:opacity-50"
                >
                  {printing === "receipt" ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Printer className="w-3.5 h-3.5" />
                  )}
                  {tr("Qəbz", "Receipt")}
                </button>
                {diningEnabled && (
                  <button
                    type="button"
                    onClick={() => void handleThermalPrint("kot")}
                    disabled={!!printing || isDemo || order.items.length === 0}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50"
                    title={tr(
                      "Kağız KOT — əsas yol rəqəmsal KOT ekranıdır",
                      "Paper KOT — primary path is the digital KOT screen",
                    )}
                  >
                    {printing === "kot" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChefHat className="w-3.5 h-3.5" />
                    )}
                    {tr("KOT", "KOT")}
                  </button>
                )}
              </>
            )}
            <button type="button" onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-6 space-y-6">
          {loading ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Yüklənir...", "Loading...")}</p>
          ) : !order ? (
            <p className="text-center text-sm text-gray-500 py-8">{tr("Satış tapılmadı", "Sale not found")}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Müştəri", "Customer")}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.customerName ?? "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Tarix", "Date")}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{formatSalesDate(order.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Kassir", "Biller")}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.billerName ?? "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Status", "Status")}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                        {isDraft ? tr("Qaralama", "Draft") : order.statusLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                      <CreditCard className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Ödəniş Statusu", "Payment Status")}</p>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.paymentStatus}</p>
                    </div>
                  </div>
                </div>
                {order.vehicleLabel && (
                  <div className="glass-card px-2.5 py-2 rounded-lg border border-white/20 dark:border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shrink-0">
                        <Car className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] leading-tight text-gray-500 dark:text-gray-400">{tr("Avtomobil", "Vehicle")}</p>
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{order.vehicleLabel}</p>
                        {order.mileageAtService != null && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{order.mileageAtService} km</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {tr("Məhsullar", "Products")}
                </h3>
                {order.items.some((i) => (i.returnedQty ?? 0) > 0) && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mb-3">
                    {tr(
                      "Bu sifarişdə qaytarılmış məhsullar var. Aşağıda hər sətir üçün qaytarma məlumatı göstərilir.",
                      "This order has refunded products. Return details are shown on each line below.",
                    )}
                  </p>
                )}
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
                          const returnedQty = item.returnedQty ?? 0;
                          const remainingQty =
                            item.remainingQty ?? Math.max(0, item.quantity - returnedQty);
                          const fullyRefunded = returnedQty > 0 && remainingQty <= 0;
                          const partiallyRefunded = returnedQty > 0 && remainingQty > 0;
                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-gray-100 dark:border-gray-800 ${
                                fullyRefunded ? "bg-gray-50/80 dark:bg-gray-800/30 opacity-80" : ""
                              }`}
                            >
                              <td className="py-2 px-3 text-xs text-gray-900 dark:text-white">
                                <div className="flex flex-col gap-0.5">
                                  <span>{item.productName}</span>
                                  {fullyRefunded ? (
                                    <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                      {tr("Qaytarılıb", "Refunded")}
                                      {returnedQty > 0 ? ` · ${returnedQty}` : ""}
                                    </span>
                                  ) : partiallyRefunded ? (
                                    <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                                      {tr(
                                        `${returnedQty} qaytarılıb · ${remainingQty} qalıb`,
                                        `${returnedQty} refunded · ${remainingQty} left`,
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-400">{item.sku}</td>
                              <td className="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">
                                <div className="flex flex-col items-end gap-0.5">
                                  <span>{item.quantity}</span>
                                  {returnedQty > 0 && (
                                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                      {tr(`Qaytarılıb: ${returnedQty}`, `Returned: ${returnedQty}`)}
                                    </span>
                                  )}
                                </div>
                              </td>
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
                      <span className="font-bold text-lg text-[#14b8a6] dark:text-[#14b8a6]">₼{grandTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib", "Paid")}:</span>
                      <span className="font-medium text-green-600 dark:text-green-400">₼{paid.toFixed(2)}</span>
                    </div>
                    {refunded > 0 && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">{tr("Qaytarılıb", "Refunded")}:</span>
                        <span className="font-medium text-red-600 dark:text-red-400">-₼{refunded.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">{tr("Borc", "Due")}:</span>
                      <span className="font-medium text-[#14b8a6] dark:text-[#14b8a6]">₼{due.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isDraft && canFinalize && (
                <div className="rounded-xl border border-[#14b8a6]/25 dark:border-[#14b8a6]/30 bg-[#f0fdfa] dark:bg-[#14b8a6]/10 p-4 space-y-3">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {tr("Sifarişi tamamla", "Finalize order")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {tr(
                      "Stok silinəcək və satış hesab-faktura yaradılacaq.",
                      "This deducts stock and creates the sale invoice.",
                    )}
                  </p>
                  <div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {tr("Ödəniş üsulu", "Payment method")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: "cash" as const, name: tr("Nağd", "Cash") },
                          { id: "card" as const, name: tr("Kart", "Card") },
                        ] as const
                      ).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFinalizePaymentMethod(m.id)}
                          className={`px-2 py-1.5 rounded-lg border text-xs font-medium ${
                            finalizePaymentMethod === m.id
                              ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border-[#14b8a6] text-[#0f766e] dark:text-[#5eead4]"
                              : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFinalizePaid(true)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium ${
                        finalizePaid
                          ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border-[#14b8a6] text-[#0f766e] dark:text-[#5eead4]"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {tr("Ödənilib", "Paid")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFinalizePaid(false)}
                      className={`px-2 py-1.5 rounded-lg border text-xs font-medium ${
                        !finalizePaid
                          ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border-[#14b8a6] text-[#0f766e] dark:text-[#5eead4]"
                          : "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {tr("Gözləyir", "Pending")}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleFinalize()}
                    disabled={finalizing || isDemo}
                    className="w-full px-3 py-1.5 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg disabled:opacity-50"
                  >
                    {finalizing
                      ? tr("Tamamlanır...", "Finalizing...")
                      : tr("Tamamla və göndər", "Finalize & submit")}
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
