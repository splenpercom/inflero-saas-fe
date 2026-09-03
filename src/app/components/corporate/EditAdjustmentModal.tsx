import { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";

import { pickLang } from "../../i18n/pickLang";
interface StockAdjustment {
  id: string;
  warehouse: string;
  store: string;
  productImage: string;
  productName: string;
  date: string;
  personImage: string;
  personName: string;
  qty: number;
  adjustmentQty?: number;
  reason?: string;
  notes?: string;
  referenceNumber?: string;
}

interface EditAdjustmentModalProps {
  isOpen: boolean;
  adjustment: StockAdjustment | null;
  onClose: () => void;
  onSave: (adjustmentData: {
    id: string;
    product: string;
    warehouse: string;
    store: string;
    adjustmentQty: number;
    reason: string;
    referenceNumber: string;
    responsiblePerson: string;
    notes: string;
  }) => void;
}

export function EditAdjustmentModal({ isOpen, adjustment, onClose, onSave }: EditAdjustmentModalProps) {
  const { language } = useLanguage();
  const [product, setProduct] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [store, setStore] = useState("");
  const [adjustmentQty, setAdjustmentQty] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [responsiblePerson, setResponsiblePerson] = useState("");
  const [notes, setNotes] = useState("");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Populate form when adjustment changes
  useEffect(() => {
    if (adjustment) {
      setProduct(adjustment.productName);
      setWarehouse(adjustment.warehouse);
      setStore(adjustment.store);
      setAdjustmentQty((adjustment.adjustmentQty ?? adjustment.qty).toString());
      setReason(adjustment.reason || "");
      setReferenceNumber(adjustment.referenceNumber || "");
      setResponsiblePerson(adjustment.personName);
      setNotes(adjustment.notes || "");
    }
  }, [adjustment]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setProduct("");
      setWarehouse("");
      setStore("");
      setAdjustmentQty("");
      setReason("");
      setReferenceNumber("");
      setResponsiblePerson("");
      setNotes("");
    }
  }, [isOpen]);

  const handleSave = () => {
    const qty = parseInt(adjustmentQty);
    if (adjustment && product && warehouse && store && adjustmentQty && !isNaN(qty) && qty !== 0 && reason && referenceNumber && responsiblePerson) {
      onSave({
        id: adjustment.id,
        product,
        warehouse,
        store,
        adjustmentQty: qty,
        reason,
        referenceNumber,
        responsiblePerson,
        notes
      });
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !adjustment) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Tənzimləməni Redaktə Et", "Edit Adjustment")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Product */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                placeholder={tr("Məhsul Axtar", "Search Product")}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>

          {/* Warehouse */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Anbar", "Warehouse")} <span className="text-red-500">*</span>
            </label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              <option value="">{tr("Seçin", "Select")}</option>
              <option value="Lavish Warehouse">Lavish Warehouse</option>
              <option value="Quaint Warehouse">Quaint Warehouse</option>
              <option value="Overflow Warehouse">Overflow Warehouse</option>
              <option value="Traditional Warehouse">Traditional Warehouse</option>
              <option value="Cool Warehouse">Cool Warehouse</option>
              <option value="Retail Supply Hub">Retail Supply Hub</option>
            </select>
          </div>

          {/* Store */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Mağaza", "Store")} <span className="text-red-500">*</span>
            </label>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              <option value="">{tr("Seçin", "Select")}</option>
              <option value="Electro Mart">Electro Mart</option>
              <option value="Quantum Gadgets">Quantum Gadgets</option>
              <option value="Prime Bazaar">Prime Bazaar</option>
              <option value="Gadget World">Gadget World</option>
              <option value="Volt Vault">Volt Vault</option>
              <option value="Elite Retail">Elite Retail</option>
              <option value="Prime Mart">Prime Mart</option>
            </select>
          </div>

          {/* Adjustment Quantity */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Tənzimləmə Miqdarı", "Adjustment Quantity")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={adjustmentQty}
              onChange={(e) => setAdjustmentQty(e.target.value)}
              placeholder={tr("+50 və ya -30", "+50 or -30")}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Səbəb", "Reason")} <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              <option value="">{tr("Seçin", "Select")}</option>
              <option value="Stock replenishment">{tr("Ehtiyat Doldurulması", "Stock Replenishment")}</option>
              <option value="Damaged goods">{tr("Zədələnmiş Mallar", "Damaged Goods")}</option>
              <option value="Theft/Loss">{tr("Oğurluq/İtki", "Theft/Loss")}</option>
              <option value="Stock count correction">{tr("Ehtiyat Sayımı Düzəlişi", "Stock Count Correction")}</option>
              <option value="Defective items">{tr("Qüsurlu Mallar", "Defective Items")}</option>
              <option value="Customer return">{tr("Müştəri Qaytarması", "Customer Return")}</option>
              <option value="Expired products">{tr("Vaxtı Keçmiş Məhsullar", "Expired Products")}</option>
              <option value="Other">{tr("Digər", "Other")}</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("İstinad Nömrəsi", "Reference Number")} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={tr("REF-2024-001", "REF-2024-001")}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
            />
          </div>

          {/* Responsible Person */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məsul Şəxs", "Responsible Person")} <span className="text-red-500">*</span>
            </label>
            <select
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
            >
              <option value="">{tr("Seçin", "Select")}</option>
              <option value="James Kirwin">James Kirwin</option>
              <option value="Francis Chang">Francis Chang</option>
              <option value="Antonio Engle">Antonio Engle</option>
              <option value="Leo Kelly">Leo Kelly</option>
              <option value="Annette Walker">Annette Walker</option>
              <option value="John Weaver">John Weaver</option>
              <option value="Gary Hennessy">Gary Hennessy</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Qeydlər", "Notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={tr("Əlavə qeydlər...", "Additional notes...")}
              rows={3}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={!product || !warehouse || !store || !adjustmentQty || parseInt(adjustmentQty) === 0 || isNaN(parseInt(adjustmentQty)) || !reason || !referenceNumber || !responsiblePerson}
            className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {tr("Dəyişiklikləri Yadda Saxla", "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
