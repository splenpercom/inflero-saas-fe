import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import {
  fetchPurchaseReturn,
  updatePurchaseReturn,
  recordPurchaseReturnPayment,
  type PurchaseReturnDetail,
} from "../../api/purchases";
import {
  formatPurchaseDate,
  parsePurchaseAmount,
  mapPaymentMethodToApi,
} from "../../lib/purchaseMappers";
import { mapPurchaseStatusToApi, type PosUiPaymentMethod } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { cn } from "../ui/utils";
import { PurchaseBranchField, resolvePurchaseStoreIdForApi } from "./PurchaseBranchField";

import { pickLang } from "../../i18n/pickLang";
interface PurchaseReturnDetailModalProps {
  returnId: string | null;
  canEdit: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function PurchaseReturnDetailModal({
  returnId,
  canEdit,
  onClose,
  onChanged,
}: PurchaseReturnDetailModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isGlobalMode } = useBranch();
  const askConfirm = useConfirm();
  const [detail, setDetail] = useState<PurchaseReturnDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusUi, setStatusUi] = useState("");
  const [storeId, setStoreId] = useState("");
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
      const data = await fetchPurchaseReturn(id);
      setDetail(data);
      setStatusUi(data.statusLabel.toLowerCase());
      setStoreId(data.storeId ?? (!isGlobalMode && branchId ? branchId : ""));
      const due = parsePurchaseAmount(data.due);
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

  const dueAmount = detail ? parsePurchaseAmount(detail.due) : 0;

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
    if (statusUi === "received" && detail.statusLabel.toLowerCase() !== "received") {
      const ok = await askConfirm({
        title: tr("Təsdiq", "Confirm"),
        message: tr(
          "Qəbul edildi statusu stokdan çıxaracaq. Davam edilsin?",
          "Received status will deduct stock. Continue?",
        ),
      });
      if (!ok) return;
    }
    const resolvedStoreId =
      resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId) ?? detail.storeId;

    if (statusUi === "received" && !resolvedStoreId) {
      notifyFromError(
        new Error(
          tr(
            "Qəbul edilməsi üçün filial seçilməlidir.",
            "A branch must be selected before marking as Received.",
          ),
        ),
      );
      return;
    }

    setSavingStatus(true);
    try {
      const updated = await updatePurchaseReturn(detail.id, {
        status: mapPurchaseStatusToApi(statusUi),
        ...(!detail.storeId && resolvedStoreId ? { storeId: resolvedStoreId } : {}),
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
      const updated = await recordPurchaseReturnPayment(detail.id, {
        amount,
        method: mapPaymentMethodToApi(paymentMethod),
        note: paymentNote.trim() || null,
        reference: paymentReference.trim() || null,
      });
      setDetail(updated);
      const newDue = parsePurchaseAmount(updated.due);
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
              {tr("Satınalma Qaytarması", "Purchase Return")}
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
                  <p className="text-gray-500">{tr("Təchizatçı", "Supplier")}</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {detail.supplierName ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Tarix", "Date")}</p>
                  <p className="text-gray-900 dark:text-white">{formatPurchaseDate(detail.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Filial", "Branch")}</p>
                  <p className="text-gray-900 dark:text-white">{detail.storeName ?? "—"}</p>
                </div>
                {detail.purchaseReference && (
                  <div>
                    <p className="text-gray-500">{tr("Satınalma", "Purchase")}</p>
                    <p className="text-gray-900 dark:text-white">{detail.purchaseReference}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500">{tr("Status", "Status")}</p>
                  {!detail.storeId && canEdit && !isDemo && (
                    <div className="mb-2">
                      <PurchaseBranchField value={storeId} onChange={setStoreId} required />
                    </div>
                  )}
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
                        className="px-2 py-1 text-xs bg-[#0026f6] text-white rounded-lg disabled:opacity-50"
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
                {detail.stockDeductedAt && (
                  <div>
                    <p className="text-gray-500">{tr("Stokdan çıxarıldı", "Stock deducted")}</p>
                    <p className="text-gray-900 dark:text-white">
                      {formatPurchaseDate(detail.stockDeductedAt)}
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
                      const lineTotal = parsePurchaseAmount(item.totalCost);
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
                            ₼{parsePurchaseAmount(item.purchasePrice).toFixed(2)}
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
                  {detail.orderTax && parsePurchaseAmount(detail.orderTax) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Sifariş vergisi", "Order tax")}</span>
                      <span>₼{parsePurchaseAmount(detail.orderTax).toFixed(2)}</span>
                    </div>
                  )}
                  {detail.discount && parsePurchaseAmount(detail.discount) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Endirim", "Discount")}</span>
                      <span>-₼{parsePurchaseAmount(detail.discount).toFixed(2)}</span>
                    </div>
                  )}
                  {detail.shipping && parsePurchaseAmount(detail.shipping) > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">{tr("Çatdırılma", "Shipping")}</span>
                      <span>₼{parsePurchaseAmount(detail.shipping).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1">
                    <span>{tr("Cəmi", "Total")}</span>
                    <span>₼{parsePurchaseAmount(detail.total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tr("Ödənilib", "Paid")}</span>
                    <span className="text-green-600">₼{parsePurchaseAmount(detail.paid).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">{tr("Borc", "Due")}</span>
                    <span>₼{dueAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {detail.payments.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-800 pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-900 dark:text-white">
                    {tr("Ödəniş tarixçəsi", "Payment history")}
                  </p>
                  {detail.payments.map((p) => (
                    <div key={p.paymentId} className="flex justify-between text-xs">
                      <span className="text-gray-500">
                        {formatPurchaseDate(p.date)} — {p.method}
                      </span>
                      <span>₼{parsePurchaseAmount(p.allocatedAmount).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {dueAmount > 0 && !isDemo && canEdit && (
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
