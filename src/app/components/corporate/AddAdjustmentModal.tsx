import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createStockAdjustment } from "../../api/stock";
import { fetchTenantUsers } from "../../api/userManagement";
import { useStockProductSearch } from "../../hooks/useStockProductSearch";
import { StockLocationFields, isLocationValid } from "./StockLocationFields";
import { ModernSelect } from "../ui/ModernSelect";
import { notifyFromError, notifySuccess } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
interface AddAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddAdjustmentModal({ isOpen, onClose, onSaved }: AddAdjustmentModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const [productSearch, setProductSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [location, setLocation] = useState<{ storeId: string | null }>({
    storeId: null,
  });
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [personId, setPersonId] = useState("");
  const [notes, setNotes] = useState("");
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [showProductList, setShowProductList] = useState(false);

  const { products, loading: productsLoading } = useStockProductSearch(productSearch, isOpen);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen || !(isAuthenticated || isDemo)) return;
    fetchTenantUsers()
      .then((rows) =>
        setUsers(
          rows.map((u) => ({
            value: u.id,
            label: [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email,
          })),
        ),
      )
      .catch(() => setUsers([]));
  }, [isOpen, isAuthenticated, isDemo]);

  useEffect(() => {
    if (!isOpen) {
      setProductSearch("");
      setProductId("");
      setLocation({ storeId: null });
      setQuantity("");
      setReason("");
      setReferenceNumber("");
      setPersonId("");
      setNotes("");
      setShowProductList(false);
    }
  }, [isOpen]);

  const selectedProduct = products.find((p) => p.id === productId);

  const handleSave = async () => {
    if (isDemo || !isAuthenticated) return;
    const qty = parseInt(quantity, 10);
    if (!productId || !isLocationValid(location) || Number.isNaN(qty) || qty === 0) return;

    setSaving(true);
    try {
      await createStockAdjustment({
        productId,
        storeId: location.storeId,
        quantity: qty,
        reason: reason || null,
        referenceNumber: referenceNumber || null,
        personId: personId || null,
        notes: notes || null,
      });
      notifySuccess(tr("Tənzimləmə yaradıldı", "Adjustment created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const qtyNum = parseInt(quantity, 10);
  const canSubmit =
    productId &&
    isLocationValid(location) &&
    quantity &&
    !Number.isNaN(qtyNum) &&
    qtyNum !== 0;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Düzəliş Əlavə Et", "Add Adjustment")}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="relative">
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setProductId("");
                  setShowProductList(true);
                }}
                onFocus={() => setShowProductList(true)}
                placeholder={tr("Məhsul axtar", "Search product")}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            {showProductList && (productSearch || !productId) && (
              <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {productsLoading ? (
                  <p className="px-3 py-2 text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                ) : products.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">
                    {tr("Məhsul tapılmadı", "No products found")}
                  </p>
                ) : (
                  products.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => {
                        setProductId(p.id);
                        setProductSearch(p.name);
                        setShowProductList(false);
                      }}
                    >
                      {p.name} <span className="text-gray-400">({p.sku})</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <StockLocationFields value={location} onChange={setLocation} />

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Tənzimləmə miqdarı", "Adjustment quantity")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={tr("+50 və ya -30", "+50 or -30")}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Səbəb", "Reason")}
            </label>
            <ModernSelect
              value={reason}
              onChange={setReason}
              placeholder={tr("Seçin", "Select")}
              options={[
                { value: "", label: tr("—", "—") },
                { value: "Stock replenishment", label: tr("Ehtiyat doldurulması", "Stock replenishment") },
                { value: "Damaged goods", label: tr("Zədələnmiş mallar", "Damaged goods") },
                { value: "Theft/Loss", label: tr("Oğurluq/İtki", "Theft/Loss") },
                { value: "Stock count correction", label: tr("Sayım düzəlişi", "Stock count correction") },
                { value: "Other", label: tr("Digər", "Other") },
              ]}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("İstinad nömrəsi", "Reference number")}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məsul şəxs", "Responsible person")}
            </label>
            <ModernSelect
              value={personId}
              onChange={setPersonId}
              placeholder={tr("Seçin", "Select")}
              options={[{ value: "", label: tr("—", "—") }, ...users]}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Qeydlər", "Notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit || saving}
            className="px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {saving ? tr("Yaradılır...", "Creating...") : tr("Tənzimləmə yarat", "Create adjustment")}
          </button>
        </div>
      </div>
    </div>
  );
}
