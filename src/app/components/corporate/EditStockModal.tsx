import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import type { StockLevelRow } from "../../api/stock";
import { patchStockLevel } from "../../api/stock";
import { fetchTenantUsers } from "../../api/userManagement";
import { branchLabel, formatStockDate } from "../../lib/stockMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { ModernSelect } from "../ui/ModernSelect";

import { pickLang } from "../../i18n/pickLang";
interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  stockItem: StockLevelRow | null;
}

export function EditStockModal({ isOpen, onClose, onSaved, stockItem }: EditStockModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const [managedById, setManagedById] = useState("");
  const [qty, setQty] = useState("");
  const [users, setUsers] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

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
    if (isOpen && stockItem) {
      setManagedById(stockItem.managedById ?? "");
      setQty(String(stockItem.qty));
    } else if (!isOpen) {
      setManagedById("");
      setQty("");
    }
  }, [isOpen, stockItem]);

  const handleSave = async () => {
    if (!stockItem || !(isAuthenticated || isDemo)) return;
    const quantity = parseInt(qty, 10);
    if (Number.isNaN(quantity) || quantity < 0) return;
    setSaving(true);
    try {
      await patchStockLevel(stockItem.id, {
        quantity,
        managedById: managedById || null,
      });
      notifySuccess(tr("Stok yeniləndi", "Stock updated"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !stockItem) return null;

  const loc = branchLabel(stockItem.store);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Stok Redaktə Et", "Edit Stock")}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 space-y-1.5 text-xs">
            <p className="text-gray-500 dark:text-gray-400">{tr("Məhsul", "Product")}</p>
            <p className="font-medium text-gray-900 dark:text-white">{stockItem.productName}</p>
            <p className="text-gray-500 dark:text-gray-400">SKU: {stockItem.productSku}</p>
            <p className="text-gray-500 dark:text-gray-400">
              {tr("Filial", "Branch")}: {loc}
            </p>
            <p className="text-gray-500 dark:text-gray-400">
              {tr("Yenilənib", "Updated")}: {formatStockDate(stockItem.date)}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məsul şəxs", "Responsible person")}
            </label>
            <ModernSelect
              value={managedById}
              onChange={setManagedById}
              placeholder={tr("Seçin", "Select")}
              options={[{ value: "", label: tr("—", "—") }, ...users]}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Miqdar", "Quantity")} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
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
            disabled={saving || !qty}
            className="px-3 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Yenilə", "Update")}
          </button>
        </div>
      </div>
    </div>
  );
}
