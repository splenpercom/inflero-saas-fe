import { useState, useEffect } from "react";
import { X, Search, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { createSalesReturn } from "../../api/sales";
import { mapPurchaseStatusToApi } from "../../lib/salesMappers";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import { notifyFromError, notifySuccess } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
interface ProductLine {
  productId: string;
  name: string;
  sku: string;
  qty: number;
  unitPrice: number;
}

interface AddSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddSalesReturnModal({ isOpen, onClose, onSaved }: AddSalesReturnModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isGlobalMode } = useBranch();

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [posOrderId, setPosOrderId] = useState("");
  const [reference, setReference] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductLine[]>([]);
  const [orderTax, setOrderTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [status, setStatus] = useState("pending");
  const [showProductList, setShowProductList] = useState(false);
  const [saving, setSaving] = useState(false);

  const { customers, loading: customersLoading } = useSalesCustomers(customerSearch, isOpen);
  const { products: searchResults, loading: productsLoading } = useSalesProductSearch(
    productSearch,
    isOpen,
  );

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!isOpen) {
      setCustomerId("");
      setCustomerSearch("");
      setPosOrderId("");
      setReference("");
      setProductSearch("");
      setProducts([]);
      setOrderTax(0);
      setDiscount(0);
      setShipping(0);
      setStatus("pending");
      setShowProductList(false);
    }
  }, [isOpen]);

  const handleAddProduct = (id: string, name: string, sku: string) => {
    if (products.some((p) => p.productId === id)) return;
    setProducts([...products, { productId: id, name, sku, qty: 1, unitPrice: 0 }]);
    setProductSearch("");
    setShowProductList(false);
  };

  const handleUpdateLine = (productId: string, field: "qty" | "unitPrice", value: number) => {
    setProducts(
      products.map((p) => (p.productId === productId ? { ...p, [field]: value } : p)),
    );
  };

  const handleRemoveProduct = (productId: string) => {
    setProducts(products.filter((p) => p.productId !== productId));
  };

  const linesSubtotal = products.reduce((sum, p) => sum + p.unitPrice * p.qty, 0);
  const grandTotal = linesSubtotal + orderTax - discount + shipping;

  const handleSave = async () => {
    if (!(isAuthenticated || isDemo) || !customerId || products.length === 0 || !status) return;

    const invalidLine = products.some((p) => p.qty <= 0 || p.unitPrice < 0);
    if (invalidLine) return;

    setSaving(true);
    try {
      await createSalesReturn({
        customerId,
        posOrderId: posOrderId.trim() || null,
        reference: reference.trim() || null,
        storeId: !isGlobalMode && branchId ? branchId : null,
        orderTax,
        discount,
        shipping,
        status: mapPurchaseStatusToApi(status),
        items: products.map((p) => ({
          productId: p.productId,
          quantity: p.qty,
          unitPrice: p.unitPrice,
        })),
      });
      notifySuccess(tr("Satış qaytarması yaradıldı", "Sales return created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const canSubmit =
    customerId &&
    products.length > 0 &&
    status &&
    products.every((p) => p.qty > 0 && p.unitPrice >= 0);

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
            {tr("Satış Qaytarması Əlavə Et", "Add Sales Return")}
          </h2>
          <button type="button" onClick={onClose} className="text-white bg-red-500 hover:bg-red-600 rounded-full p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Müştəri", "Customer")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => {
                  setCustomerSearch(e.target.value);
                  setCustomerId("");
                }}
                placeholder={tr("Müştəri axtar", "Search customer")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 mb-1"
              />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="">
                  {customersLoading
                    ? tr("Yüklənir...", "Loading...")
                    : tr("Müştəri seç", "Choose customer")}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("POS Sifariş ID", "POS Order ID")}
              </label>
              <input
                type="text"
                value={posOrderId}
                onChange={(e) => setPosOrderId(e.target.value)}
                placeholder={tr("İstəyə bağlı", "Optional")}
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

          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Məhsul", "Product")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Miqdar", "Qty")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Vahid qiymət (₼)", "Unit price (₼)")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Ara cəm", "Subtotal")}
                  </th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
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
                          value={product.unitPrice}
                          min={0}
                          step="0.01"
                          onChange={(e) =>
                            handleUpdateLine(
                              product.productId,
                              "unitPrice",
                              Number(e.target.value),
                            )
                          }
                          className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800"
                        />
                      </td>
                      <td className="px-2 py-2 text-gray-900 dark:text-white">
                        ₼{(product.qty * product.unitPrice).toFixed(2)}
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
