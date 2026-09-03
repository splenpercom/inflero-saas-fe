import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import {
  fetchSalesReturn,
  updateSalesReturn,
  recordSalesReturnPayment,
  type SalesReturnDetail,
} from "../../api/sales";
import {
  formatSalesDate,
  mapPaymentMethodToApi,
  mapPurchaseStatusToApi,
  type PosUiPaymentMethod,
} from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { cn } from "../ui/utils";

import { pickLang } from "../../i18n/pickLang";
interface SalesReturnDetailModalProps {
  returnId: string | null;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function SalesReturnDetailModal({
  returnId,
  canEdit,
  onClose,
  onChanged,
}: SalesReturnDetailModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const [detail, setDetail] = useState<SalesReturnDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusUi, setStatusUi] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosUiPaymentMethod>("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [recordingPayment, setRecordingPayment] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchSalesReturn(id);
      setDetail(data);
      setStatusUi(data.statusLabel.toLowerCase());
      const due = parseFloat(data.due);
      setPaymentAmount(due > 0 ? String(due) : "");
    } catch (err) {
      notifyFromError(err, tr("Qaytarmanı yükləmək alınmadı", "Failed to load return"));
      setDetail(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!returnId || !(isAuthenticated || isDemo)) {
      setDetail(null);
      return;
    }
    void loadDetail(returnId);
  }, [returnId, isDemo, isAuthenticated]);

  if (!returnId) return null;

  const dueAmount = detail ? parseFloat(detail.due) : 0;

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "received":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "ordered":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "overdue":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "partial":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
    }
  };

  const handleSaveStatus = async () => {
    if (!canEdit || isDemo || !detail || !statusUi) return;
    setSavingStatus(true);
    try {
      const updated = await updateSalesReturn(detail.id, {
        status: mapPurchaseStatusToApi(statusUi),
      });
      setDetail(updated);
      setStatusUi(updated.statusLabel.toLowerCase());
      notifySuccess(tr("Status yeniləndi", "Status updated"));
      onChanged();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!detail || isDemo) return;
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || amount > dueAmount) return;
    setRecordingPayment(true);
    try {
      const updated = await recordSalesReturnPayment(detail.id, {
        amount,
        method: mapPaymentMethodToApi(paymentMethod),
        note: paymentNote.trim() || null,
        reference: paymentReference.trim() || null,
      });
      setDetail(updated);
      const newDue = parseFloat(updated.due);
      setPaymentAmount(newDue > 0 ? String(newDue) : "");
      notifySuccess(tr("Ödəniş qeydə alındı", "Payment recorded"));
      onChanged();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setRecordingPayment(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Satış Qaytarması", "Sales Return")}
            </h2>
            {detail?.reference && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{detail.reference}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {loading ? (
            <p className="text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
          ) : detail ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">{tr("Müştəri", "Customer")}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detail.customerName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Tarix", "Date")}</p>
                  <p className="text-gray-900 dark:text-white">{formatSalesDate(detail.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Filial", "Branch")}</p>
                  <p className="text-gray-900 dark:text-white">{detail.storeName ?? "—"}</p>
                </div>
                {detail.posOrderReference && (
                  <div>
                    <p className="text-gray-500">{tr("POS Sifarişi", "POS Order")}</p>
                    <p className="text-gray-900 dark:text-white">{detail.posOrderReference}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">{tr("Status", "Status")}</p>
                  {canEdit && !isDemo ? (
                    <div className="flex gap-2 mt-1">
                      <select
                        value={statusUi}
                        onChange={(e) => setStatusUi(e.target.value)}
                        className="flex-1 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="ordered">{tr("Sifariş edildi", "Ordered")}</option>
                        <option value="pending">{tr("Gözləyir", "Pending")}</option>
                        <option value="received">{tr("Qəbul edildi", "Received")}</option>
                      </select>
                      <button
                        type="button"
                        disabled={savingStatus}
                        onClick={() => void handleSaveStatus()}
                        className="px-2 py-1 text-xs bg-[#14b8a6] text-white rounded-lg disabled:opacity-50"
                      >
                        {tr("Yadda saxla", "Save")}
                      </button>
                    </div>
                  ) : (
                    <span
                      className={cn(
                        "inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-medium",
                        getStatusBadgeColor(detail.statusLabel),
                      )}
                    >
                      {detail.statusLabel}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-gray-500">{tr("Ödəniş statusu", "Payment status")}</p>
                  <span
                    className={cn(
                      "inline-flex mt-1 px-2 py-0.5 rounded text-[10px] font-medium",
                      getPaymentStatusBadgeColor(detail.paymentStatus),
                    )}
                  >
                    {detail.paymentStatus}
                  </span>
                </div>
                {stockEnabled && detail.restockedAt && (
                  <div>
                    <p className="text-gray-500">{tr("Stoka qaytarıldı", "Restocked")}</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatSalesDate(detail.restockedAt)}
                    </p>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">
                        {tr("Məhsul", "Product")}
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">
                        {tr("Miqdar", "Qty")}
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">
                        {tr("Qiymət", "Price")}
                      </th>
                      <th className="text-right px-3 py-2 text-[10px] font-medium text-gray-500 uppercase">
                        {tr("Cəmi", "Total")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => {
                      const lineTotal =
                        item.quantity * parseFloat(item.unitPrice) -
                        parseFloat(item.discount ?? "0");
                      return (
                        <tr
                          key={item.id}
                          className="border-t border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-3 py-2 text-gray-900 dark:text-white">
                            {item.productName}
                            <span className="text-gray-400 ml-1">({item.sku})</span>
                          </td>
                          <td className="px-3 py-2 text-right">{item.quantity}</td>
                          <td className="px-3 py-2 text-right">
                            ₼{parseFloat(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            ₼{lineTotal.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-1 text-xs">
                  {detail.orderTax && parseFloat(detail.orderTax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Sifariş vergisi", "Order tax")}</span>
                      <span>₼{parseFloat(detail.orderTax).toFixed(2)}</span>
                    </div>
                  )}
                  {detail.discount && parseFloat(detail.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Endirim", "Discount")}</span>
                      <span>-₼{parseFloat(detail.discount).toFixed(2)}</span>
                    </div>
                  )}
                  {detail.shipping && parseFloat(detail.shipping) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Çatdırılma", "Shipping")}</span>
                      <span>₼{parseFloat(detail.shipping).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>{tr("Cəmi", "Total")}</span>
                    <span>₼{parseFloat(detail.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tr("Ödənilib", "Paid")}</span>
                    <span className="text-green-600">₼{parseFloat(detail.paid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tr("Borc", "Due")}</span>
                    <span>₼{dueAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {dueAmount > 0 && !isDemo && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {tr("Ödəniş qeyd et", "Record payment")}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min={0}
                      max={dueAmount}
                      step="0.01"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={tr("Məbləğ", "Amount")}
                      className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <select
                      value={paymentMethod}
                      onChange={(e) =>
                        setPaymentMethod(e.target.value as PosUiPaymentMethod)
                      }
                      className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="cash">{tr("Nağd", "Cash")}</option>
                      <option value="card">{tr("Kart", "Card")}</option>
                      <option value="bank">{tr("Bank", "Bank transfer")}</option>
                    </select>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={tr("İstinad", "Reference")}
                      className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                    <input
                      type="text"
                      value={paymentNote}
                      onChange={(e) => setPaymentNote(e.target.value)}
                      placeholder={tr("Qeyd", "Note")}
                      className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={
                      recordingPayment ||
                      !paymentAmount ||
                      parseFloat(paymentAmount) <= 0 ||
                      parseFloat(paymentAmount) > dueAmount
                    }
                    onClick={() => void handleRecordPayment()}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {tr("Ödənişi qeyd et", "Record payment")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-500">{tr("Məlumat tapılmadı", "No data found")}</p>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
