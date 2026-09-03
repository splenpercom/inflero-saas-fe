import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import {
  fetchStockTransferDetail,
  approveDepositedTransfer,
  rejectDepositedTransfer,
  sellDepositedTransfer,
  returnDepositedTransfer,
  deleteStockTransfer,
  type StockTransferDetail,
  type StockTransferRow,
} from "../../api/stock";
import { formatStockDate } from "../../lib/stockMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { cn } from "../ui/utils";

import { pickLang } from "../../i18n/pickLang";
interface TransferDetailModalProps {
  transfer: StockTransferRow | null;
  onClose: () => void;
  onChanged: () => void;
}

export function TransferDetailModal({ transfer, onClose, onChanged }: TransferDetailModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasPermission } = useAuth();
  const { canEdit, canDelete } = useModulePermissions("Stock");
  const canSellFinance = hasPermission("Finances", "create");
  const askConfirm = useConfirm();

  const [detail, setDetail] = useState<StockTransferDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [sellQty, setSellQty] = useState<Record<string, string>>({});
  const [sellPrice, setSellPrice] = useState<Record<string, string>>({});
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!transfer || !(isAuthenticated || isDemo)) {
      setDetail(null);
      return;
    }
    setLoading(true);
    fetchStockTransferDetail(transfer.id)
      .then(setDetail)
      .catch((err) => notifyFromError(err))
      .finally(() => setLoading(false));
  }, [transfer, isDemo, isAuthenticated]);

  if (!transfer) return null;

  const handleApprove = async () => {
    if (!canEdit || isDemo) return;
    setActionLoading(true);
    try {
      await approveDepositedTransfer(transfer.id);
      notifySuccess(tr("Transfer təsdiqləndi", "Transfer approved"));
      onChanged();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!canEdit || isDemo) return;
    setActionLoading(true);
    try {
      await rejectDepositedTransfer(transfer.id, { reason: rejectReason || null });
      notifySuccess(tr("Transfer rədd edildi", "Transfer rejected"));
      onChanged();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSell = async () => {
    if (!canEdit || !canSellFinance || isDemo || !detail) return;
    const items = detail.items
      .map((item) => ({
        transferItemId: item.id,
        quantity: parseInt(sellQty[item.id] ?? "0", 10),
        unitPrice: parseFloat(sellPrice[item.id] ?? "0"),
      }))
      .filter((i) => i.quantity > 0 && i.unitPrice > 0);
    if (items.length === 0) return;
    setActionLoading(true);
    try {
      await sellDepositedTransfer(transfer.id, { items });
      notifySuccess(tr("Satış qeydə alındı", "Sale recorded"));
      onChanged();
      const refreshed = await fetchStockTransferDetail(transfer.id);
      setDetail(refreshed);
    } catch (err) {
      notifyFromError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    if (!canEdit || isDemo || !detail) return;
    const items = detail.items
      .map((item) => ({
        transferItemId: item.id,
        quantity: parseInt(returnQty[item.id] ?? "0", 10),
      }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) return;
    setActionLoading(true);
    try {
      await returnDepositedTransfer(transfer.id, { items });
      notifySuccess(tr("Qaytarma qeydə alındı", "Return recorded"));
      onChanged();
      const refreshed = await fetchStockTransferDetail(transfer.id);
      setDetail(refreshed);
    } catch (err) {
      notifyFromError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete || isDemo) return;
    const confirmed = await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr(
        "Bu transferi silmək istəyirsiniz? Bu, audit qeydini gizlədir; artıq köçürülmüş ehtiyat geri qaytarılmır.",
        "Delete this transfer? This soft-deletes the audit record; stock already moved is not reversed.",
      ),
      variant: "danger",
    });
    if (!confirmed) return;
    setActionLoading(true);
    try {
      await deleteStockTransfer(transfer.id);
      notifySuccess(tr("Transfer silindi", "Transfer deleted"));
      onChanged();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setActionLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-amber-100 text-amber-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return (
      <span className={cn("px-2 py-0.5 rounded text-[10px] font-medium", colors[status] ?? "bg-gray-100")}>
        {status}
      </span>
    );
  };

  const isPendingDeposited =
    transfer.isDeposited && transfer.approvalStatus === "PENDING";
  const isApprovedDeposited =
    transfer.isDeposited && transfer.approvalStatus === "APPROVED";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Transfer təfərrüatları", "Transfer details")}
            </h2>
            {transfer.isDeposited && statusBadge(transfer.approvalStatus)}
          </div>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {loading ? (
            <p className="text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
          ) : detail ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500">{tr("Haradan filial", "From branch")}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{detail.fromWarehouse}</p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Hədəf filial", "To branch")}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{detail.toWarehouse}</p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("Tarix", "Date")}</p>
                  <p className="text-gray-900 dark:text-white">{formatStockDate(detail.date)}</p>
                </div>
                <div>
                  <p className="text-gray-500">{tr("İstinad", "Reference")}</p>
                  <p className="text-gray-900 dark:text-white">{detail.referenceNumber || "—"}</p>
                </div>
                {detail.notes && (
                  <div className="col-span-2">
                    <p className="text-gray-500">{tr("Qeydlər", "Notes")}</p>
                    <p className="text-gray-900 dark:text-white">{detail.notes}</p>
                  </div>
                )}
                {detail.rejectReason && (
                  <div className="col-span-2">
                    <p className="text-gray-500">{tr("Rədd səbəbi", "Reject reason")}</p>
                    <p className="text-red-600">{detail.rejectReason}</p>
                  </div>
                )}
              </div>

              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2">{tr("Məhsul", "Product")}</th>
                    <th className="text-right py-2">{tr("Köçürülən", "Transferred")}</th>
                    <th className="text-right py-2">{tr("Satılan", "Sold")}</th>
                    <th className="text-right py-2">{tr("Qaytarılan", "Returned")}</th>
                    <th className="text-right py-2">{tr("Qalan", "Remaining")}</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 text-gray-900 dark:text-white">
                        {item.productName}
                        <span className="text-gray-400 ml-1">({item.sku})</span>
                      </td>
                      <td className="text-right py-2">{item.transferredQty}</td>
                      <td className="text-right py-2">{item.soldQty}</td>
                      <td className="text-right py-2">{item.returnedQty}</td>
                      <td className="text-right py-2 font-medium">{item.remainingQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {isPendingDeposited && canEdit && (
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleApprove()}
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {tr("Təsdiqlə", "Approve")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReject((v) => !v)}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg"
                  >
                    {tr("Rədd et", "Reject")}
                  </button>
                </div>
              )}

              {showReject && isPendingDeposited && (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder={tr("Rədd səbəbi", "Reject reason")}
                    rows={2}
                    className="w-full px-2 py-1.5 text-xs border rounded-lg"
                  />
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleReject()}
                    className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg disabled:opacity-50"
                  >
                    {tr("Rəddi təsdiqlə", "Confirm reject")}
                  </button>
                </div>
              )}

              {isApprovedDeposited && canEdit && detail.items.some((i) => i.remainingQty > 0) && (
                <div className="space-y-3 pt-2 border-t">
                  {canSellFinance && (
                    <div>
                      <p className="text-xs font-medium mb-2">{tr("Satış", "Sell")}</p>
                      {detail.items
                        .filter((i) => i.remainingQty > 0)
                        .map((item) => (
                          <div key={item.id} className="flex gap-2 mb-2 items-center">
                            <span className="text-xs flex-1 truncate">{item.productName}</span>
                            <input
                              type="number"
                              min={1}
                              max={item.remainingQty}
                              placeholder={tr("Miqdar", "Qty")}
                              value={sellQty[item.id] ?? ""}
                              onChange={(e) =>
                                setSellQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-16 px-2 py-1 text-xs border rounded"
                            />
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              placeholder={tr("Qiymət", "Price")}
                              value={sellPrice[item.id] ?? ""}
                              onChange={(e) =>
                                setSellPrice((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              className="w-20 px-2 py-1 text-xs border rounded"
                            />
                          </div>
                        ))}
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() => void handleSell()}
                        className="px-3 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg disabled:opacity-50"
                      >
                        {tr("Satışı qeyd et", "Record sale")}
                      </button>
                    </div>
                  )}

                  <div>
                    <p className="text-xs font-medium mb-2">{tr("Qaytarma", "Return")}</p>
                    {detail.items
                      .filter((i) => i.remainingQty > 0)
                      .map((item) => (
                        <div key={item.id} className="flex gap-2 mb-2 items-center">
                          <span className="text-xs flex-1 truncate">{item.productName}</span>
                          <input
                            type="number"
                            min={1}
                            max={item.remainingQty}
                            placeholder={tr("Miqdar", "Qty")}
                            value={returnQty[item.id] ?? ""}
                            onChange={(e) =>
                              setReturnQty((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="w-16 px-2 py-1 text-xs border rounded"
                          />
                        </div>
                      ))}
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() => void handleReturn()}
                      className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg disabled:opacity-50"
                    >
                      {tr("Qaytarmanı qeyd et", "Record return")}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="flex justify-between px-4 py-3 border-t sticky bottom-0 bg-white dark:bg-gray-900">
          <div>
            {canDelete && !isPendingDeposited && (
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => void handleDelete()}
                className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg disabled:opacity-50"
              >
                {tr("Sil", "Delete")}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs bg-gray-100 dark:bg-gray-800 rounded-lg"
          >
            {tr("Bağla", "Close")}
          </button>
        </div>
      </div>
    </div>
  );
}
