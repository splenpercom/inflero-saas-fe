import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Search, Trash2, RotateCcw } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import {
  createPurchaseReturn,
  fetchPurchase,
  fetchPurchaseReturnQuantityLimits,
  type PurchaseDetail,
  type PurchaseReturnQuantityLimit,
} from "../../api/purchases";
import { mapPurchaseStatusToApi } from "../../lib/salesMappers";
import { usePurchaseSuppliers } from "../../hooks/usePurchaseSuppliers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { PurchaseBranchField, resolvePurchaseStoreIdForApi } from "./PurchaseBranchField";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
interface ProductLine {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  purchasePrice: number;
  discount: number;
  taxPercent: number;
}

interface AddPurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function lineTotalCost(price: number, qty: number, discount: number, taxPercent: number) {
  const base = price * qty - discount;
  return base + (base * taxPercent) / 100;
}

export function AddPurchaseReturnModal({ isOpen, onClose, onSaved }: AddPurchaseReturnModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const { branchId, isGlobalMode } = useBranch();

  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductLine[]>([]);
  const [orderTax, setOrderTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [status, setStatus] = useState("pending");
  const [description, setDescription] = useState("");
  const [storeId, setStoreId] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linkedPurchase, setLinkedPurchase] = useState<PurchaseDetail | null>(null);
  const [purchaseLinkLoading, setPurchaseLinkLoading] = useState(false);
  const [quantityLimits, setQuantityLimits] = useState<PurchaseReturnQuantityLimit[]>([]);
  const [limitsLoading, setLimitsLoading] = useState(false);

  const limitsByProductId = useMemo(
    () => new Map(quantityLimits.map((row) => [row.productId, row])),
    [quantityLimits],
  );

  const { suppliers, loading: suppliersLoading, reload: reloadSuppliers } = usePurchaseSuppliers(
    supplierSearch,
    isOpen,
  );
  const { products: searchResults, loading: productsLoading } = useSalesProductSearch(
    productSearch,
    isOpen,
  );

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen) {
      setSupplierId("");
      setSupplierSearch("");
      setPurchaseId("");
      setDate("");
      setReference("");
      setProductSearch("");
      setProducts([]);
      setOrderTax(0);
      setDiscount(0);
      setShipping(0);
      setStatus("pending");
      setDescription("");
      setStoreId("");
      setShowProductList(false);
      setLinkedPurchase(null);
      setQuantityLimits([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !(isAuthenticated || isDemo)) return;
    const trimmed = purchaseId.trim();
    if (!trimmed) {
      setLinkedPurchase(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setPurchaseLinkLoading(true);
      fetchPurchase(trimmed)
        .then((purchase) => {
          setLinkedPurchase(purchase);
          if (purchase.supplierId) setSupplierId(purchase.supplierId);
          if (purchase.storeId && (isGlobalMode || !branchId)) setStoreId(purchase.storeId);
        })
        .catch(() => {
          setLinkedPurchase(null);
          notifyFromError(
            new Error(tr("Satınalma tapılmadı", "Purchase not found")),
          );
        })
        .finally(() => setPurchaseLinkLoading(false));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [purchaseId, isOpen, isDemo, isAuthenticated, isGlobalMode, branchId, language]);

  const loadQuantityLimits = useCallback(async () => {
    if (!isOpen || !(isAuthenticated || isDemo)) return;
    const resolvedStoreId = resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId);
    const productIds = products.map((p) => p.productId);
    if (productIds.length === 0 && !purchaseId.trim()) {
      setQuantityLimits([]);
      return;
    }
    setLimitsLoading(true);
    try {
      const rows = await fetchPurchaseReturnQuantityLimits({
        purchaseId: purchaseId.trim() || undefined,
        storeId: resolvedStoreId ?? undefined,
        productIds: productIds.length ? productIds : undefined,
        forReceivedStatus: status === "received",
      });
      setQuantityLimits(rows);
    } catch {
      setQuantityLimits([]);
    } finally {
      setLimitsLoading(false);
    }
  }, [
    isOpen,
    isDemo,
    isAuthenticated,
    isGlobalMode,
    branchId,
    storeId,
    purchaseId,
    products,
    status,
    language,
  ]);

  useEffect(() => {
    void loadQuantityLimits();
  }, [loadQuantityLimits]);

  const getMaxQty = useCallback(
    (productId: string): number | null => {
      const row = limitsByProductId.get(productId);
      if (!row) return null;
      if (!stockEnabled && row.purchasedQty != null) {
        return Math.max(0, row.purchasedQty - (row.alreadyReturnedQty ?? 0));
      }
      return row.maxReturnQty ?? null;
    },
    [limitsByProductId, stockEnabled],
  );

  const getQtyHint = useCallback(
    (productId: string): string | null => {
      const row = limitsByProductId.get(productId);
      if (!row) return limitsLoading ? tr("Yüklənir...", "Loading...") : null;
      const parts: string[] = [];
      if (row.purchasedQty != null) {
        const left = Math.max(0, row.purchasedQty - (row.alreadyReturnedQty ?? 0));
        parts.push(tr(`Qaytarıla bilər: ${left}`, `Returnable: ${left}`));
      }
      if (stockEnabled && (status === "received" || row.stockQty >= 0)) {
        parts.push(tr(`Stokda: ${row.stockQty}`, `In stock: ${row.stockQty}`));
      }
      if (row.maxReturnQty != null) {
        parts.push(tr(`Maks: ${row.maxReturnQty}`, `Max: ${row.maxReturnQty}`));
      }
      return parts.join(" · ");
    },
    [limitsByProductId, limitsLoading, status, language, stockEnabled],
  );

  useEffect(() => {
    if (isOpen && !isGlobalMode && branchId) {
      setStoreId(branchId);
    }
  }, [isOpen, isGlobalMode, branchId]);

  const handleAddProduct = (id: string, name: string, sku: string) => {
    if (products.some((p) => p.productId === id)) return;
    if (linkedPurchase && !linkedPurchase.items.some((i) => i.productId === id)) {
      notifyFromError(
        new Error(
          tr(
            "Bu məhsul seçilmiş satınalmada yoxdur.",
            "This product is not on the linked purchase.",
          ),
        ),
      );
      return;
    }
    const purchaseLine = linkedPurchase?.items.find((i) => i.productId === id);
    setProducts([
      ...products,
      {
        productId: id,
        name,
        sku,
        qty: 1,
        purchasePrice: purchaseLine ? parseFloat(purchaseLine.purchasePrice) || 0 : 0,
        discount: purchaseLine ? parseFloat(purchaseLine.discount) || 0 : 0,
        taxPercent: purchaseLine ? parseFloat(purchaseLine.taxPercent) || 0 : 0,
      },
    ]);
    setProductSearch("");
    setShowProductList(false);
  };

  const handleUpdateLine = (
    productId: string,
    field: keyof Pick<ProductLine, "qty" | "purchasePrice" | "discount" | "taxPercent">,
    value: number,
  ) => {
    setProducts(
      products.map((p) => {
        if (p.productId !== productId) return p;
        if (field !== "qty") return { ...p, [field]: value };
        const max = getMaxQty(productId);
        const nextQty = max != null ? Math.min(Math.max(1, value), max) : Math.max(1, value);
        return { ...p, qty: nextQty };
      }),
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter((p) => p.productId !== productId));
  };

  const linesSubtotal = products.reduce(
    (sum, p) => sum + lineTotalCost(p.purchasePrice, p.qty, p.discount, p.taxPercent),
    0,
  );
  const grandTotal = linesSubtotal + orderTax - discount + shipping;

  const handleSave = async () => {
    if (!(isAuthenticated || isDemo) || !supplierId || !date || products.length === 0 || !status) return;

    const invalidLine = products.some((p) => p.qty <= 0 || p.purchasePrice < 0);
    if (invalidLine) return;

    for (const p of products) {
      const max = getMaxQty(p.productId);
      if (max != null && p.qty > max) {
        notifyFromError(
          new Error(
            tr(
              `${p.name} üçün maksimum qaytarıla bilən miqdar ${max}-dir.`,
              `Maximum return quantity for ${p.name} is ${max}.`,
            ),
          ),
        );
        return;
      }
      if (linkedPurchase && !linkedPurchase.items.some((i) => i.productId === p.productId)) {
        notifyFromError(
          new Error(
            tr(
              `${p.name} seçilmiş satınalmada yoxdur.`,
              `${p.name} is not on the linked purchase.`,
            ),
          ),
        );
        return;
      }
    }

    if (
      stockEnabled &&
      status === "received" &&
      linkedPurchase &&
      linkedPurchase.statusLabel.toLowerCase() !== "received"
    ) {
      notifyFromError(
        new Error(
          tr(
            "Qaytarmanı qəbul etmək üçün əvvəlcə satınalma qəbul edilməlidir.",
            "The linked purchase must be received before marking this return as received.",
          ),
        ),
      );
      return;
    }

    const resolvedStoreId = resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId);
    if ((isGlobalMode || (stockEnabled && status === "received")) && !resolvedStoreId) {
      notifyFromError(
        new Error(
          tr(
            "Zəhmət olmasa filial seçin.",
            "Please select a branch.",
          ),
        ),
      );
      return;
    }

    setSaving(true);
    try {
      await createPurchaseReturn({
        supplierId,
        purchaseId: purchaseId.trim() || null,
        date,
        reference: reference.trim() || null,
        ...(resolvedStoreId ? { storeId: resolvedStoreId } : {}),
        orderTax,
        discount,
        shipping,
        status: mapPurchaseStatusToApi(status),
        description: description.trim() || null,
        items: products.map((p) => ({
          productId: p.productId,
          quantity: p.qty,
          purchasePrice: p.purchasePrice,
          discount: p.discount || undefined,
          taxPercent: p.taxPercent || undefined,
        })),
      });
      notifySuccess(tr("Qaytarma yaradıldı", "Purchase return created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const resolvedStoreId = resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId);
  const canSubmit =
    supplierId &&
    date &&
    products.length > 0 &&
    status &&
    (!(isGlobalMode || status === "received") || !!resolvedStoreId) &&
    products.every((p) => {
      if (p.qty <= 0 || p.purchasePrice < 0) return false;
      const max = getMaxQty(p.productId);
      return max == null || p.qty <= max;
    });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Qaytarma Əlavə Et", "Add Purchase Return")}
          </h2>
          <button type="button" onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isGlobalMode && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {tr(
                "Bütün filiallar seçilib — qaytarma üçün filial seçin.",
                "All branches is selected — choose a branch for this return.",
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <PurchaseBranchField
              value={storeId}
              onChange={setStoreId}
              required={isGlobalMode || status === "received"}
            />
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Təchizatçı", "Supplier")} <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                >
                  <option value="">
                    {suppliersLoading ? tr("Yüklənir...", "Loading...") : tr("Seçin", "Select")}
                  </option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void reloadSuppliers()}
                  className="px-2.5 py-1.5 bg-gray-800 text-white rounded-lg"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Satınalma ID", "Purchase ID")}
              </label>
              <input
                type="text"
                value={purchaseId}
                onChange={(e) => setPurchaseId(e.target.value)}
                placeholder={tr("İstəyə bağlı", "Optional")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
              {purchaseLinkLoading && (
                <p className="text-[10px] text-gray-500 mt-1">{tr("Yüklənir...", "Loading...")}</p>
              )}
              {linkedPurchase && (
                <p className="text-[10px] text-green-700 dark:text-green-400 mt-1">
                  {tr("Bağlı:", "Linked:")} {linkedPurchase.reference ?? linkedPurchase.id} ·{" "}
                  {linkedPurchase.statusLabel}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Tarix", "Date")} <span className="text-red-500">*</span>
              </label>
              <DateInput
                value={date}
                onChange={setDate}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("İstinad", "Reference")}
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
          </div>

          <div className="relative">
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductList(true);
                }}
                onFocus={() => setShowProductList(true)}
                placeholder={tr("Məhsul axtar", "Search product")}
                className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            {showProductList && productSearch && (
              <div className="absolute z-20 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                {productsLoading ? (
                  <p className="px-3 py-2 text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                ) : searchResults.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-gray-500">
                    {tr("Məhsul tapılmadı", "No products found")}
                  </p>
                ) : (
                  searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleAddProduct(p.id, p.name, p.sku)}
                      className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {p.name} ({p.sku})
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Məhsul", "Product")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Miqdar", "Qty")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Qiymət", "Price")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Endirim", "Discount")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Vergi %", "Tax %")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Cəmi", "Total")}
                  </th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                      {tr("Məhsul əlavə edin", "Add products")}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.productId} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-2 text-gray-900 dark:text-white">
                        {product.name}
                        <span className="text-gray-400 ml-1">({product.sku})</span>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={product.qty}
                          min={1}
                          max={getMaxQty(product.productId) ?? undefined}
                          onChange={(e) =>
                            handleUpdateLine(product.productId, "qty", Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                        {getQtyHint(product.productId) && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 max-w-[140px]">
                            {getQtyHint(product.productId)}
                          </p>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={product.purchasePrice}
                          min={0}
                          step="0.01"
                          onChange={(e) =>
                            handleUpdateLine(product.productId, "purchasePrice", Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={product.discount}
                          min={0}
                          step="0.01"
                          onChange={(e) =>
                            handleUpdateLine(product.productId, "discount", Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={product.taxPercent}
                          min={0}
                          step="0.01"
                          onChange={(e) =>
                            handleUpdateLine(product.productId, "taxPercent", Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-2 py-2 text-gray-900 dark:text-white">
                        ₼
                        {lineTotalCost(
                          product.purchasePrice,
                          product.qty,
                          product.discount,
                          product.taxPercent,
                        ).toFixed(2)}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product.productId)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Sifariş vergisi", "Order tax")}
              </label>
              <input
                type="number"
                value={orderTax}
                min={0}
                step="0.01"
                onChange={(e) => setOrderTax(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Endirim", "Discount")}
              </label>
              <input
                type="number"
                value={discount}
                min={0}
                step="0.01"
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Çatdırılma", "Shipping")}
              </label>
              <input
                type="number"
                value={shipping}
                min={0}
                step="0.01"
                onChange={(e) => setShipping(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Status", "Status")} <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="ordered">{tr("Sifariş edildi", "Ordered")}</option>
                <option value="pending">{tr("Gözləyir", "Pending")}</option>
                <option value="received">{tr("Qəbul edildi", "Received")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-medium"
          >
            {tr("Ləğv et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit || saving}
            className="px-4 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
