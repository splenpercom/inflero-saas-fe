import { useState, useEffect } from "react";
import { X, Save, Package, FileText } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { fetchPurchase, updatePurchase, type PurchaseDetail } from "../../api/purchases";
import { formatPurchaseDate, parsePurchaseAmount } from "../../lib/purchaseMappers";
import { mapPurchaseStatusToApi } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { PurchaseBranchField, resolvePurchaseStoreIdForApi } from "./PurchaseBranchField";

import { pickLang } from "../../i18n/pickLang";
interface EditPurchaseModalProps {
  purchaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditPurchaseModal({ purchaseId, isOpen, onClose, onSaved }: EditPurchaseModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { branchId, isGlobalMode } = useBranch();
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [purchase, setPurchase] = useState<PurchaseDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("pending");
  const [storeId, setStoreId] = useState("");
  const [orderTax, setOrderTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!isOpen || !purchaseId) {
      setPurchase(null);
      return;
    }
    setLoading(true);
    fetchPurchase(purchaseId)
      .then((data) => {
        setPurchase(data);
        setStatus(data.statusLabel.toLowerCase());
        setStoreId(data.storeId ?? (!isGlobalMode && branchId ? branchId : ""));
        setOrderTax(data.orderTax ? parsePurchaseAmount(data.orderTax) : 0);
        setDiscount(data.discount ? parsePurchaseAmount(data.discount) : 0);
        setShipping(data.shipping ? parsePurchaseAmount(data.shipping) : 0);
        setDescription(data.description ?? "");
      })
      .catch((err) => {
        notifyFromError(err, tr("Satınalma yüklənə bilmədi", "Failed to load purchase"));
        setPurchase(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, purchaseId, language, isGlobalMode, branchId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseId || !(isAuthenticated || isDemo) || !purchase) return;

    const resolvedStoreId =
      purchase.storeId ?? resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId);
    const markingReceived = status === "received";

    if (stockEnabled && markingReceived && !resolvedStoreId) {
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

    if (stockEnabled && markingReceived && purchase.statusLabel.toLowerCase() !== "received") {
      const ok = await askConfirm({
        title: tr("Təsdiq", "Confirm"),
        message: tr(
          "Qəbul edildi statusu stoka əlavə edəcək. Davam edilsin?",
          "Received status will add stock. Continue?",
        ),
      });
      if (!ok) return;
    }

    setSaving(true);
    try {
      await updatePurchase(purchaseId, {
        status: mapPurchaseStatusToApi(status),
        orderTax,
        discount,
        shipping,
        description: description.trim() || null,
        ...(stockEnabled && resolvedStoreId && !purchase.storeId ? { storeId: resolvedStoreId } : {}),
      });
      notifySuccess(tr("Satınalma uğurla yeniləndi", "Purchase updated successfully"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err, tr("Satınalma yenilənə bilmədi", "Failed to update purchase"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !purchaseId) return null;

  const total = purchase ? parsePurchaseAmount(purchase.total) : 0;
  const paid = purchase ? parsePurchaseAmount(purchase.paid) : 0;
  const due = purchase ? parsePurchaseAmount(purchase.due) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0026f6] to-[#001db8] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {tr("Satınalmanı Redaktə Et", "Edit Purchase")}
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

        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
        ) : !purchase ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Satınalma tapılmadı", "Purchase not found")}</p>
        ) : (
          <form onSubmit={(e) => void handleSubmit(e)} className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-4">
            {stockEnabled && !purchase.storeId && (
              <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                {tr(
                  "Bu satınalmanın filialı yoxdur — filial təyin edin, sonra Qəbul edildi statusuna keçin. Filialsız satınalmalar yalnız «Bütün filiallar» görünüşündə görünür.",
                  "This purchase has no branch — assign a branch before marking Received. Unassigned purchases only appear in the All branches view.",
                )}
              </div>
            )}

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tr("Təchizatçı", "Supplier")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{purchase.supplierName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tr("Tarix", "Date")}:</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatPurchaseDate(purchase.date)}</span>
              </div>
              {purchase.storeName && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{tr("Filial", "Branch")}:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{purchase.storeName}</span>
                </div>
              )}
            </div>

            {!purchase.storeId && (
              <PurchaseBranchField
                value={storeId}
                onChange={setStoreId}
                required
              />
            )}

            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Package className="w-3.5 h-3.5" />
                {tr("Status", "Status")}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              >
                <option value="ordered">{tr("Sifariş Edildi", "Ordered")}</option>
                <option value="pending">{tr("Gözləyir", "Pending")}</option>
                <option value="received">{tr("Qəbul Edildi", "Received")}</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {tr("Sifariş vergisi", "Order tax")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={orderTax}
                  onChange={(e) => setOrderTax(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {tr("Endirim", "Discount")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                  {tr("Çatdırılma", "Shipping")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={shipping}
                  onChange={(e) => setShipping(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                {tr("Təsvir", "Description")}
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            <div className="glass-card p-4 rounded-xl border border-white/20 dark:border-white/10 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Ümumi Cəmi", "Grand Total")}:</span>
                <span className="font-semibold text-gray-900 dark:text-white">₼{total.toFixed(2)}</span>
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
          </form>
        )}

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={(e) => void handleSubmit(e)}
            disabled={loading || !purchase || saving || isDemo}
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Yadda saxla", "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
