import { useState, useEffect } from "react";
import { X, Search, Trash2, RotateCcw } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { createPurchase, fetchPurchase, type PurchaseListRow } from "../../api/purchases";
import { mapPurchaseStatusToApi } from "../../lib/salesMappers";
import { parsePurchaseAmount } from "../../lib/purchaseMappers";
import { usePurchaseSuppliers } from "../../hooks/usePurchaseSuppliers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { PurchaseBranchField, resolvePurchaseStoreIdForApi } from "./PurchaseBranchField";
import { SupplierRecentPurchasesPanel } from "./SupplierRecentPurchasesPanel";
import { PurchaseDetailModal } from "./PurchaseDetailModal";
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

interface AddPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

function lineTaxAmount(price: number, qty: number, discount: number, taxPercent: number) {
  const base = price * qty - discount;
  return (base * taxPercent) / 100;
}

function lineTotalCost(price: number, qty: number, discount: number, taxPercent: number) {
  const base = price * qty - discount;
  return base + lineTaxAmount(price, qty, discount, taxPercent);
}

export function AddPurchaseModal({ isOpen, onClose, onSaved }: AddPurchaseModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isGlobalMode } = useBranch();
  const askConfirm = useConfirm();

  const [supplierId, setSupplierId] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
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
  const [viewPurchaseId, setViewPurchaseId] = useState<string | null>(null);
  const [reusingPurchaseId, setReusingPurchaseId] = useState<string | null>(null);

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
      setViewPurchaseId(null);
      setReusingPurchaseId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !isGlobalMode && branchId) {
      setStoreId(branchId);
    }
  }, [isOpen, isGlobalMode, branchId]);

  const handleAddProduct = (id: string, name: string, sku: string) => {
    if (products.some((p) => p.productId === id)) return;
    setProducts([...products, { productId: id, name, sku, qty: 1, purchasePrice: 0, discount: 0, taxPercent: 0 }]);
    setProductSearch("");
    setShowProductList(false);
  };

  const handleUpdateLine = (
    productId: string,
    field: keyof Pick<ProductLine, "qty" | "purchasePrice" | "discount" | "taxPercent">,
    value: number,
  ) => {
    setProducts(products.map((p) => (p.productId === productId ? { ...p, [field]: value } : p)));
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter((p) => p.productId !== productId));
  };

  const mapDetailItemsToLines = (items: Awaited<ReturnType<typeof fetchPurchase>>["items"]): ProductLine[] =>
    items.map((item) => ({
      productId: item.productId,
      name: item.productName,
      sku: item.sku ?? "",
      qty: item.quantity,
      purchasePrice: parsePurchaseAmount(item.purchasePrice),
      discount: parsePurchaseAmount(item.discount),
      taxPercent: parsePurchaseAmount(item.taxPercent),
    }));

  const handleReusePurchase = async (purchase: PurchaseListRow) => {
    if (products.length > 0) {
      const ok = await askConfirm({
        title: tr("Təsdiq", "Confirm"),
        message: tr(
          "Mövcud forma məlumatları əvvəlki satınalma ilə əvəz olunacaq. Davam edilsin?",
          "Current form data will be replaced with the previous purchase. Continue?",
        ),
      });
      if (!ok) return;
    }

    setReusingPurchaseId(purchase.id);
    try {
      const detail = await fetchPurchase(purchase.id);
      setProducts(mapDetailItemsToLines(detail.items));
      setOrderTax(parsePurchaseAmount(detail.orderTax));
      setDiscount(parsePurchaseAmount(detail.discount));
      setShipping(parsePurchaseAmount(detail.shipping));
      setStatus(detail.status.toLowerCase());
      setDescription(detail.description ?? "");
      if (detail.storeId) {
        setStoreId(detail.storeId);
      }
      // New purchase: keep/choose a fresh date; do not reuse old reference (uniqueness).
      if (!date) {
        setDate(new Date().toISOString().slice(0, 10));
      }
      setReference("");
      notifySuccess(
        tr(
          "Əvvəlki satınalma yükləndi — istədiyiniz kimi redaktə edin",
          "Previous purchase loaded — edit any fields before saving",
        ),
      );
    } catch (err) {
      notifyFromError(err, tr("Satınalma yüklənə bilmədi", "Failed to load purchase"));
    } finally {
      setReusingPurchaseId(null);
    }
  };

  const selectedSupplierName = suppliers.find((s) => s.id === supplierId)?.name;

  const linesSubtotal = products.reduce(
    (sum, p) => sum + lineTotalCost(p.purchasePrice, p.qty, p.discount, p.taxPercent),
    0,
  );
  const grandTotal = linesSubtotal + orderTax - discount + shipping;

  const handleSave = async () => {
    if (!(isAuthenticated || isDemo) || !supplierId || !date || products.length === 0 || !status) return;

    const invalidLine = products.some((p) => p.qty <= 0 || p.purchasePrice < 0);
    if (invalidLine) return;

    const resolvedStoreId = resolvePurchaseStoreIdForApi(isGlobalMode, branchId, storeId);
    const branchRequired = isGlobalMode || status === "received";
    if (branchRequired && !resolvedStoreId) {
      notifyFromError(
        new Error(
          tr(
            "Zəhmət olmasa filial seçin. Qəbul edilmiş satınalmalar stoka yazılır.",
            "Please select a branch. Received purchases are booked into branch stock.",
          ),
        ),
      );
      return;
    }

    if (status === "received") {
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
      await createPurchase({
        supplierId,
        date,
        reference: reference.trim() || null,
        storeId: resolvedStoreId,
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
      notifySuccess(tr("Satınalma yaradıldı", "Purchase created"));
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
  const branchOk = !(isGlobalMode || status === "received") || !!resolvedStoreId;

  const canSubmit =
    supplierId &&
    date &&
    products.length > 0 &&
    status &&
    branchOk &&
    products.every((p) => p.qty > 0 && p.purchasePrice >= 0);

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
            {tr("Satınalma Əlavə Et", "Add Purchase")}
          </h2>
          <button type="button" onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {isGlobalMode && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
              {tr(
                "Bütün filiallar seçilib — satınalma üçün filial mütləq seçilməlidir.",
                "All branches is selected — you must choose a branch for this purchase.",
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
                  title={tr("Yenilə", "Refresh")}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={supplierSearch}
                onChange={(e) => {
                  setSupplierSearch(e.target.value);
                  setSupplierId("");
                }}
                placeholder={tr("Təchizatçı axtar", "Search supplier")}
                className="w-full mt-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              />
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

          {supplierId && (
            <SupplierRecentPurchasesPanel
              supplierId={supplierId}
              supplierName={selectedSupplierName}
              enabled={isOpen}
              reusingPurchaseId={reusingPurchaseId}
              onView={setViewPurchaseId}
              onReuse={(purchase) => void handleReusePurchase(purchase)}
            />
          )}

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
                          onChange={(e) =>
                            handleUpdateLine(product.productId, "qty", Number(e.target.value))
                          }
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
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

          <div className="flex justify-end">
            <div className="w-72 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{tr("Məhsul cəmi", "Lines subtotal")}</span>
                <span>₼ {linesSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>{tr("Ümumi məbləğ", "Grand total")}</span>
                <span>₼ {grandTotal.toFixed(2)}</span>
              </div>
            </div>
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

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Təsvir", "Description")}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
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
            className="px-4 py-1.5 bg-[#0026f6] hover:bg-[#001fc4] text-white rounded-lg text-xs font-medium disabled:opacity-50"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq et", "Submit")}
          </button>
        </div>
      </div>

      <PurchaseDetailModal
        purchaseId={viewPurchaseId}
        isOpen={!!viewPurchaseId}
        onClose={() => setViewPurchaseId(null)}
        overlayZIndexClass="z-[70]"
      />
    </div>
  );
}
