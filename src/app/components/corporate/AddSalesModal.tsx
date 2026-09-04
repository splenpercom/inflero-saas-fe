import { useState, useEffect } from "react";
import { X, Scan, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { createPosOrder } from "../../api/sales";
import { fetchProduct } from "../../api/inventory";
import { useSalesBillers } from "../../hooks/useSalesBillers";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import { mapOrderStatusToApi } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";

import { pickLang } from "../../i18n/pickLang";
interface ProductItem {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  qty: number;
}

interface AddSalesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddSalesModal({ isOpen, onClose, onSaved }: AddSalesModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user } = useAuth();
  const [customerId, setCustomerId] = useState("");
  const [billerId, setBillerId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [taxPercent, setTaxPercent] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [showProductList, setShowProductList] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { customers } = useSalesCustomers(customerSearch, isOpen);
  const { products: searchResults, loading: productsLoading } = useSalesProductSearch(productSearch, isOpen);
  const { billers, defaultBillerId, loading: billersLoading } = useSalesBillers(isOpen);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (isOpen && defaultBillerId) {
      setBillerId(defaultBillerId);
    }
  }, [isOpen, defaultBillerId]);

  useEffect(() => {
    if (!isOpen) {
      setCustomerId("");
      setBillerId("");
      setDate("");
      setReference("");
      setProductSearch("");
      setProducts([]);
      setTaxPercent(0);
      setDiscount(0);
      setShipping(0);
      setStatus("");
      setShowProductList(false);
      setCustomerSearch("");
    }
  }, [isOpen]);

  const handleAddProduct = async (productId: string) => {
    if (products.find((p) => p.id === productId)) return;
    try {
      const detail = await fetchProduct(productId);
      setProducts((prev) => [
        ...prev,
        {
          id: detail.id,
          name: detail.name,
          unitPrice: parseFloat(detail.price) || 0,
          stock: detail.quantity,
          qty: 1,
        },
      ]);
      setProductSearch("");
      setShowProductList(false);
    } catch (err) {
      notifyFromError(err, tr("Məhsul yüklənə bilmədi", "Failed to load product"));
    }
  };

  const handleUpdateProduct = (id: string, field: keyof ProductItem, value: number) => {
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleRemoveProduct = (id: string) => {
    setProducts(products.filter((p) => p.id !== id));
  };

  const calculateLineTotal = (product: ProductItem) => product.unitPrice * product.qty;

  const calculateTotals = () => {
    const subtotal = products.reduce((sum, p) => sum + calculateLineTotal(p), 0);
    const taxAmount = (subtotal * taxPercent) / 100;
    const grandTotal = subtotal + taxAmount - discount + shipping;
    return { subtotal, taxAmount, grandTotal };
  };

  const totals = calculateTotals();

  const handleSave = async () => {
    if (isDemo || !isAuthenticated) return;
    if (!customerId || !date || products.length === 0 || !status) return;
    if (!billerId) {
      notifyFromError(new Error(tr("Kassir seçin", "Please select an employee / biller")));
      return;
    }

    setSaving(true);
    try {
      await createPosOrder({
        customerId,
        billerId: billerId || null,
        status: mapOrderStatusToApi(status),
        date,
        reference: reference || null,
        taxPercent,
        discount,
        shipping,
        items: products.map((p) => ({
          productId: p.id,
          quantity: p.qty,
          price: p.unitPrice,
        })),
      });
      notifySuccess(tr("Satış uğurla əlavə edildi", "Sale added successfully"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err, tr("Satış yaradıla bilmədi", "Failed to create sale"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const filteredSearchResults = searchResults.filter((p) => !products.find((line) => line.id === p.id));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tr("Satış Əlavə Et", "Add Sale")}
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Müştəri", "Customer")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder={tr("Müştəri axtar...", "Search customer...")}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-1"
              />
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
              >
                <option value="">{tr("Müştəri Seç", "Choose Customer")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Kassir", "Biller")}
              </label>
              <select
                value={billerId}
                onChange={(e) => setBillerId(e.target.value)}
                disabled={billersLoading}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer disabled:opacity-60"
              >
                <option value="">{tr("Kassir Seç", "Choose Biller")}</option>
                {billers.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
              {!billersLoading && billers.length === 0 && user && (
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {tr(
                    "Saxlananda cari istifadəçi kassir kimi təyin olunacaq",
                    "Current user will be assigned as biller on save",
                  )}
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
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
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
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
              {tr("Məhsul", "Product")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductList(true);
                }}
                onFocus={() => setShowProductList(true)}
                placeholder={tr("Məhsul kodu daxil edin və seçin", "Please type product code and select")}
                className="w-full px-2.5 py-1.5 pr-10 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
              <Scan className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

              {showProductList && productSearch && (
                <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {productsLoading ? (
                    <p className="px-3 py-2 text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                  ) : filteredSearchResults.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-500">{tr("Məhsul tapılmadı", "No products found")}</p>
                  ) : (
                    filteredSearchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => void handleAddProduct(product.id)}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        {product.name} ({product.sku})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Məhsul Adı", "Product Name")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Vahid Qiymət(₼)", "Net Unit Price(₼)")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Stok", "Stock")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Miqdar", "QTY")}
                  </th>
                  <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                    {tr("Ara Cəm (₼)", "Subtotal (₼)")}
                  </th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                      {tr("Məhsul əlavə edin", "Add products")}
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-2 py-2 text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-2 py-2 text-gray-900 dark:text-white">₼{product.unitPrice.toFixed(2)}</td>
                      <td className="px-2 py-2 text-gray-900 dark:text-white">{product.stock}</td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={product.qty}
                          onChange={(e) => handleUpdateProduct(product.id, "qty", Number(e.target.value))}
                          min="1"
                          max={product.stock}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-2 py-2 text-gray-900 dark:text-white">₼{calculateLineTotal(product).toFixed(2)}</td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(product.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
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
            <div className="w-80 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Vergi", "Tax")}</span>
                <span className="text-gray-900 dark:text-white">₼ {totals.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Endirim", "Discount")}</span>
                <span className="text-gray-900 dark:text-white">₼ {discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-600 dark:text-gray-400">{tr("Çatdırılma", "Shipping")}</span>
                <span className="text-gray-900 dark:text-white">₼ {shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold pt-2 border-t border-gray-300 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">{tr("Ümumi Məbləğ", "Grand Total")}</span>
                <span className="text-gray-900 dark:text-white">₼ {totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Vergi %", "Tax %")}
              </label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Number(e.target.value))}
                min="0"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Endirim", "Discount")}
              </label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min="0"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Çatdırılma", "Shipping")}
              </label>
              <input
                type="number"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                min="0"
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Status", "Status")} <span className="text-red-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
              >
                <option value="">{tr("Seç", "Select")}</option>
                <option value="completed">{tr("Tamamlandı", "Completed")}</option>
                <option value="pending">{tr("Gözləyir", "Pending")}</option>
                <option value="cancelled">{tr("Ləğv Edildi", "Cancelled")}</option>
                <option value="held">{tr("Qaralama", "Draft")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!customerId || !date || products.length === 0 || !status || saving || isDemo}
            className="px-6 py-3 text-sm bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
