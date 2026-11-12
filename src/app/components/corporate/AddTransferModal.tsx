import { useState, useEffect } from "react";
import { X, Search, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createStockTransfer } from "../../api/stock";
import { useStockProductSearch } from "../../hooks/useStockProductSearch";
import {
  StockLocationFields,
  isLocationValid,
  locationsEqual,
  type StockLocationValue,
} from "./StockLocationFields";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import {
  parseNumericInput,
  roundToMaxDp,
  sanitizeNumericTypingMaxDp,
} from "../../lib/numericInput";

import { pickLang } from "../../i18n/pickLang";
interface LineItem {
  productId: string;
  productLabel: string;
  quantity: string;
  search: string;
  /** Available stock at the From branch when the product was selected. */
  availableQty: number | null;
}

interface AddTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function emptyLine(): LineItem {
  return { productId: "", productLabel: "", quantity: "", search: "", availableQty: null };
}

function formatAvailQty(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const rounded = roundToMaxDp(n, 3);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export function AddTransferModal({ isOpen, onClose, onSaved }: AddTransferModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();

  const [fromLoc, setFromLoc] = useState<StockLocationValue>({ storeId: null });
  const [toLoc, setToLoc] = useState<StockLocationValue>({ storeId: null });
  const [referenceNumber, setReferenceNumber] = useState("");
  const [documentNo, setDocumentNo] = useState("");
  const [notes, setNotes] = useState("");
  const [isDeposited, setIsDeposited] = useState(false);
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);
  const [activeLineSearch, setActiveLineSearch] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const activeSearch = activeLineSearch !== null ? lines[activeLineSearch]?.search ?? "" : "";
  const { products, loading: productsLoading } = useStockProductSearch(activeSearch, isOpen, {
    storeId: fromLoc.storeId,
  });

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen) {
      setFromLoc({ storeId: null });
      setToLoc({ storeId: null });
      setReferenceNumber("");
      setDocumentNo("");
      setNotes("");
      setIsDeposited(false);
      setLines([emptyLine()]);
      setActiveLineSearch(null);
    }
  }, [isOpen]);

  // If source changes to match destination, clear destination so user must pick another branch.
  useEffect(() => {
    if (fromLoc.storeId && toLoc.storeId && fromLoc.storeId === toLoc.storeId) {
      setToLoc({ storeId: null });
    }
  }, [fromLoc.storeId, toLoc.storeId]);

  // Product stock is branch-scoped — reset lines when From branch changes.
  useEffect(() => {
    if (!isOpen) return;
    setLines([emptyLine()]);
    setActiveLineSearch(null);
  }, [fromLoc.storeId, isOpen]);

  useEffect(() => {
    if (isDeposited && lines.length > 1) {
      setLines([lines[0]]);
    }
  }, [isDeposited]);

  const updateLine = (index: number, patch: Partial<LineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const sameLocation = isLocationValid(fromLoc) && isLocationValid(toLoc) && locationsEqual(fromLoc, toLoc);

  const handleSave = async () => {
    if (!(isAuthenticated || isDemo) || sameLocation) return;

    const items = lines
      .filter((l) => l.productId && l.quantity)
      .map((l) => ({
        productId: l.productId,
        quantity: roundToMaxDp(parseNumericInput(l.quantity, NaN), 3),
      }))
      .filter((l) => Number.isFinite(l.quantity) && l.quantity > 0);

    if (items.length === 0 || !isLocationValid(fromLoc) || !isLocationValid(toLoc)) return;

    setSaving(true);
    try {
      await createStockTransfer({
        fromStoreId: fromLoc.storeId,
        toStoreId: toLoc.storeId,
        referenceNumber: referenceNumber || null,
        documentNo: documentNo || null,
        notes: notes || null,
        isDeposited,
        items,
      });
      notifySuccess(tr("Transfer yaradıldı", "Transfer created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const validLines = lines.every(
    (l) =>
      !l.productId ||
      (l.productId &&
        l.quantity &&
        roundToMaxDp(parseNumericInput(l.quantity, NaN), 3) > 0),
  );
  const canSubmit =
    isLocationValid(fromLoc) &&
    isLocationValid(toLoc) &&
    !sameLocation &&
    validLines &&
    lines.some((l) => l.productId && l.quantity);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Transfer Əlavə Et", "Add Transfer")}
          </h2>
          <button type="button" onClick={onClose}>
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">
              {tr("Haradan filial", "From branch")} <span className="text-red-500">*</span>
            </p>
            {/* Locked to header branch when one is selected (stock leaves this branch). */}
            <StockLocationFields value={fromLoc} onChange={setFromLoc} />
          </div>

          <div>
            <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">
              {tr("Hədəf filial", "To branch")} <span className="text-red-500">*</span>
            </p>
            {/* Always selectable — must be a different branch (stock arrives here). */}
            <StockLocationFields
              value={toLoc}
              onChange={setToLoc}
              lockToSelectedBranch={false}
              excludeStoreIds={[fromLoc.storeId]}
            />
          </div>

          {sameLocation && (
            <p className="text-xs text-red-600">
              {tr("Mənbə və təyinat eyni ola bilməz", "Source and destination must differ")}
            </p>
          )}

          <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isDeposited}
              onChange={(e) => setIsDeposited(e.target.checked)}
              className="accent-[#14b8a6]"
            />
            {tr("Depozit transfer", "Deposited transfer")}
          </label>
          {isDeposited && (
            <p className="text-[10px] text-gray-500">
              {tr(
                "Depozit transferlər təsdiqlənənə qədər ehtiyatı saxlayır. Yalnız bir məhsul sətri.",
                "Deposited transfers hold stock until approved. Single line item only.",
              )}
            </p>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-900 dark:text-white">
                {tr("Məhsullar", "Products")} <span className="text-red-500">*</span>
              </p>
              {!isDeposited && (
                <button
                  type="button"
                  onClick={() => setLines((prev) => [...prev, emptyLine()])}
                  className="flex items-center gap-1 text-xs text-[#14b8a6]"
                >
                  <Plus className="w-3 h-3" />
                  {tr("Sətir əlavə et", "Add line")}
                </button>
              )}
            </div>

            {!fromLoc.storeId && (
              <p className="text-[10px] text-amber-700 dark:text-amber-300">
                {tr(
                  "Mövcud stok göstərmək üçün əvvəlcə mənbə filialı seçin.",
                  "Select the From branch first to see available stock.",
                )}
              </p>
            )}

            {lines.map((line, index) => {
              const enteredQty = roundToMaxDp(parseNumericInput(line.quantity, NaN), 3);
              const overStock =
                line.availableQty != null &&
                Number.isFinite(enteredQty) &&
                enteredQty > line.availableQty;
              return (
              <div key={index} className="space-y-1">
                <div className="flex gap-2 items-start">
                <div className="flex-1 relative">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                      type="text"
                      value={line.productLabel || line.search}
                      onChange={(e) => {
                        updateLine(index, {
                          search: e.target.value,
                          productId: "",
                          productLabel: "",
                          availableQty: null,
                        });
                        setActiveLineSearch(index);
                      }}
                      onFocus={() => setActiveLineSearch(index)}
                      placeholder={tr("Məhsul", "Product")}
                      className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                    />
                  </div>
                  {activeLineSearch === index && line.search && !line.productId && (
                    <div className="absolute z-20 mt-1 w-full max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border rounded-lg shadow-lg">
                      {productsLoading ? (
                        <p className="px-2 py-1 text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                      ) : products.length === 0 ? (
                        <p className="px-2 py-1 text-xs text-gray-500">
                          {tr("Məhsul tapılmadı", "No products found")}
                        </p>
                      ) : (
                        products.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between gap-2"
                            onClick={() => {
                              updateLine(index, {
                                productId: p.id,
                                productLabel: `${p.name} (${p.sku})`,
                                search: p.name,
                                availableQty: p.quantity,
                              });
                              setActiveLineSearch(null);
                            }}
                          >
                            <span className="truncate text-gray-900 dark:text-white">
                              {p.name}{" "}
                              <span className="text-gray-400">({p.sku})</span>
                            </span>
                            <span
                              className={`shrink-0 tabular-nums ${
                                (p.quantity ?? 0) <= 0
                                  ? "text-red-600"
                                  : "text-teal-700 dark:text-teal-300"
                              }`}
                            >
                              {tr("Stok", "Stock")}: {formatAvailQty(p.quantity)}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(index, {
                      quantity: sanitizeNumericTypingMaxDp(e.target.value, 3),
                    })
                  }
                  placeholder={tr("Miqdar", "Qty")}
                  className="w-20 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
                {!isDeposited && lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    className="p-1.5 text-red-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                </div>
                {line.productId && line.availableQty != null && (
                  <p
                    className={`text-[10px] pl-1 ${
                      overStock
                        ? "text-red-600"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {tr("Mövcud stok", "Available")}: {formatAvailQty(line.availableQty)}
                    {overStock
                      ? ` — ${tr("miqdar stokdan çoxdur", "qty exceeds stock")}`
                      : ""}
                  </p>
                )}
              </div>
              );
            })}
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
              {tr("İstinad nömrəsi", "Reference number")}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
              {tr("Sənəd nömrəsi", "Document no.")}
            </label>
            <input
              type="text"
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1 block">
              {tr("Qeydlər", "Notes")}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 resize-none"
            />
          </div>
        </div>

        <div className="px-4 py-3 border-t flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button type="button" onClick={onClose} className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs">
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit || saving}
            className="px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs disabled:opacity-50"
          >
            {saving ? tr("Yaradılır...", "Creating...") : tr("Yarat", "Create")}
          </button>
        </div>
      </div>
    </div>
  );
}
