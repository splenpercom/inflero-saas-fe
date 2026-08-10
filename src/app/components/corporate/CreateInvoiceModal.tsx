import { useState, useEffect } from "react";
import { X, Plus, Search, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createInvoice } from "../../api/sales";
import { fetchProduct } from "../../api/inventory";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
interface LineItem {
  key: string;
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function emptyLine(): LineItem {
  return {
    key: crypto.randomUUID(),
    productId: null,
    description: "",
    quantity: 1,
    unitPrice: 0,
  };
}

export function CreateInvoiceModal({ isOpen, onClose, onSaved }: CreateInvoiceModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const [customerId, setCustomerId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [activeLineKey, setActiveLineKey] = useState<string | null>(null);
  const [showProductList, setShowProductList] = useState(false);

  const { customers } = useSalesCustomers("", isOpen);
  const { products, loading: productsLoading } = useSalesProductSearch(
    productSearch,
    isOpen && showProductList,
  );

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen) {
      setCustomerId("");
      setDueDate("");
      setNotes("");
      setLines([emptyLine()]);
      setProductSearch("");
      setActiveLineKey(null);
      setShowProductList(false);
    }
  }, [isOpen]);

  const updateLine = (key: string, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  };

  const handleSelectProduct = async (productId: string, productName: string) => {
    if (!activeLineKey) return;
    let unitPrice = 0;
    try {
      const detail = await fetchProduct(productId);
      unitPrice = parseFloat(detail.price) || 0;
    } catch {
      // keep manual price
    }
    updateLine(activeLineKey, {
      productId,
      description: productName,
      unitPrice,
    });
    setProductSearch("");
    setShowProductList(false);
    setActiveLineKey(null);
  };

  const handleSubmit = async () => {
    if (isDemo || !isAuthenticated) return;
    if (!dueDate) return;

    const validLines = lines.filter(
      (line) => line.description.trim() && line.quantity > 0 && line.unitPrice >= 0,
    );
    if (validLines.length === 0) return;

    setSaving(true);
    try {
      await createInvoice({
        customerId: customerId || null,
        dueDate,
        notes: notes.trim() || null,
        items: validLines.map((line) => ({
          productId: line.productId,
          description: line.description.trim(),
          quantity: line.quantity,
          unitPrice: line.unitPrice,
        })),
      });
      notifySuccess(tr("Qaimə yaradıldı", "Invoice created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const canSubmit =
    !!dueDate &&
    lines.some((line) => line.description.trim() && line.quantity > 0);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-3xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Qaimə Yarat", "Create Invoice")}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Müştəri", "Customer")}
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">{tr("Müştəri seçin (ixtiyari)", "Choose customer (optional)")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Son Tarix", "Due Date")} <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={dueDate}
                onChange={setDueDate}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-900 dark:text-white">
                {tr("Sətirlər", "Line Items")} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, emptyLine()])}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[#0026f6] dark:text-[#0026f6] border border-gray-300 dark:border-gray-700 rounded-lg"
              >
                <Plus className="w-3 h-3" />
                {tr("Sətir əlavə et", "Add line")}
              </button>
            </div>

            <div className="space-y-2">
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="grid grid-cols-12 gap-2 items-start p-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="col-span-12 sm:col-span-5 relative">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        value={
                          activeLineKey === line.key && showProductList
                            ? productSearch
                            : line.description
                        }
                        onChange={(e) => {
                          if (activeLineKey === line.key && showProductList) {
                            setProductSearch(e.target.value);
                          } else {
                            updateLine(line.key, { description: e.target.value, productId: null });
                          }
                        }}
                        onFocus={() => {
                          setActiveLineKey(line.key);
                          setProductSearch(line.description);
                          setShowProductList(true);
                        }}
                        placeholder={tr("Təsvir və ya məhsul axtar", "Description or search product")}
                        className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    {activeLineKey === line.key && showProductList && (
                      <div className="absolute z-20 mt-1 w-full max-h-32 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
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
                              onClick={() => void handleSelectProduct(p.id, p.name)}
                            >
                              {p.name} <span className="text-gray-400">({p.sku})</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(line.key, { quantity: parseInt(e.target.value, 10) || 0 })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={tr("Miqdar", "Qty")}
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitPrice || ""}
                      onChange={(e) =>
                        updateLine(line.key, { unitPrice: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder={tr("Qiymət", "Price")}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2 flex items-center justify-end gap-2">
                    <span className="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {(line.quantity * line.unitPrice).toFixed(2)} ₼
                    </span>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
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

          <div className="flex justify-end text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Alt məbləğ", "Subtotal")}: {subtotal.toFixed(2)} ₼
          </div>
        </div>

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 rounded-lg"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || saving}
            className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-[#0026f6] to-[#001db8] rounded-lg disabled:opacity-50"
          >
            {saving ? tr("Saxlanılır...", "Saving...") : tr("Qaimə yarat", "Create Invoice")}
          </button>
        </div>
      </div>
    </div>
  );
}
