import { useState, useEffect } from "react";
import { X, Scan, Trash2, Save } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { fetchPosOrder, updatePosOrder, type PosOrderDetail } from "../../api/sales";
import { fetchProduct } from "../../api/inventory";
import { useSalesBillers } from "../../hooks/useSalesBillers";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { useSalesProductSearch } from "../../hooks/useSalesProductSearch";
import {
  mapOrderStatusToApi,
  mapPaymentMethodFromApi,
  mapPaymentMethodToApi,
  type PosUiPaymentMethod,
} from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { DateInput } from "../ui/DateInput";
import { pickLang } from "../../i18n/pickLang";
import { fetchCustomerVehicles, type CustomerVehicle } from "../../api/people";

interface ProductItem {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  qty: number;
}

interface EditSaleModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditSaleModal({ orderId, isOpen, onClose, onSaved }: EditSaleModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user, hasModule } = useAuth();
  const autoEnabled = hasModule("AUTO");
  const stockEnabled = hasModule("STOCK");
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [order, setOrder] = useState<PosOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [mileageAtService, setMileageAtService] = useState("");
  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [billerId, setBillerId] = useState("");
  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PosUiPaymentMethod>("cash");
  const [status, setStatus] = useState("completed");
  const [shipping, setShipping] = useState(0);
  const [serviceFee, setServiceFee] = useState(0);
  const [commissionAmount, setCommissionAmount] = useState(0);
  const [commissionEnabled, setCommissionEnabled] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [taxPercent, setTaxPercent] = useState(0);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const linesLocked = stockEnabled && stockDeducted;

  const { customers } = useSalesCustomers(customerSearch, isOpen);
  const { products: searchResults, loading: productsLoading } = useSalesProductSearch(
    productSearch,
    isOpen && !linesLocked,
  );
  const { billers, loading: billersLoading } = useSalesBillers(isOpen);

  useEffect(() => {
    if (!isOpen || !orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    fetchPosOrder(orderId)
      .then((data) => {
        setOrder(data);
        setCustomerId(data.customerId ?? "");
        setCustomerSearch(data.customerName ?? "");
        setVehicleId(data.vehicleId ?? "");
        setMileageAtService(data.mileageAtService == null ? "" : String(data.mileageAtService));
        setBillerId(data.billerId ?? "");
        setDate(data.date.slice(0, 10));
        setReference(data.reference && data.reference !== "—" ? data.reference : "");
        setPaymentMethod(mapPaymentMethodFromApi(data.paymentMethod));
        setStatus(data.status.toLowerCase());
        setShipping(data.shipping ? parseFloat(data.shipping) : 0);
        setServiceFee(data.serviceFee ? parseFloat(data.serviceFee) : 0);
        setCommissionEnabled(Boolean(data.commissionEnabled));
        setCommissionAmount(data.commissionAmount ? parseFloat(data.commissionAmount) : 0);
        setDiscount(data.discount ? parseFloat(data.discount) : 0);
        setTaxPercent(data.taxPercent ? parseFloat(data.taxPercent) : 0);
        setStockDeducted(Boolean(data.stockDeducted));
        setPaidAmount(parseFloat(data.paid) || 0);
        setProducts(
          data.items.map((item) => ({
            id: item.productId,
            name: item.productName,
            unitPrice: parseFloat(item.price) || 0,
            stock: 0,
            qty: item.quantity,
          })),
        );
        setProductSearch("");
        setShowProductList(false);
      })
      .catch((err) => {
        notifyFromError(err, tr("Satış yüklənə bilmədi", "Failed to load sale"));
        setOrder(null);
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId, language]);

  useEffect(() => {
    if (!isOpen || !autoEnabled || !customerId) {
      setCustomerVehicles([]);
      return;
    }
    let cancelled = false;
    fetchCustomerVehicles(customerId)
      .then((rows) => {
        if (!cancelled) setCustomerVehicles(rows);
      })
      .catch(() => {
        if (!cancelled) setCustomerVehicles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, autoEnabled, customerId]);

  const handleCustomerChange = (nextId: string) => {
    if (autoEnabled && nextId !== customerId) {
      setVehicleId("");
      setMileageAtService("");
    }
    setCustomerId(nextId);
  };

  const handleAddProduct = async (productId: string) => {
    if (linesLocked) return;
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
    if (linesLocked) return;
    setProducts(products.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleRemoveProduct = (id: string) => {
    if (linesLocked) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const calculateLineTotal = (product: ProductItem) => product.unitPrice * product.qty;

  const calculateTotals = () => {
    const subtotal = products.reduce((sum, p) => sum + calculateLineTotal(p), 0);
    const taxAmount = (subtotal * taxPercent) / 100;
    const grandTotal = subtotal + taxAmount - discount + shipping + serviceFee;
    return { subtotal, taxAmount, grandTotal };
  };

  const totals = calculateTotals();
  const filteredSearchResults = searchResults.filter((p) => !products.find((line) => line.id === p.id));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderId || !(isAuthenticated || isDemo)) return;
    if (!date || products.length === 0 || !status) return;
    if (!billerId) {
      notifyFromError(new Error(tr("Kassir seçin", "Please select an employee / biller")));
      return;
    }

    setSaving(true);
    try {
      const body: Parameters<typeof updatePosOrder>[1] = {
        customerId: customerId || null,
        ...(autoEnabled && vehicleId ? { vehicleId } : {}),
        ...(autoEnabled && vehicleId && mileageAtService.trim()
          ? { mileageAtService: Number(mileageAtService) }
          : {}),
        billerId: billerId || null,
        paymentMethod: mapPaymentMethodToApi(paymentMethod),
        status: mapOrderStatusToApi(status),
        date,
        reference: reference || null,
        taxPercent,
        discount,
        shipping,
        serviceFee,
      };
      if (!linesLocked) {
        body.items = products.map((p) => ({
          productId: p.id,
          quantity: p.qty,
          price: p.unitPrice,
        }));
      }
      await updatePosOrder(orderId, body);
      notifySuccess(tr("Satış uğurla yeniləndi", "Sale updated successfully"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err, tr("Satış yenilənə bilmədi", "Failed to update sale"));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen || !orderId) return null;

  const canSave =
    Boolean(date && products.length > 0 && status && billerId) &&
    !loading &&
    !saving &&
    !isDemo &&
    Boolean(order);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-5xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tr("Satışı Redaktə Et", "Edit Sale")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{order?.reference ?? "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
        ) : !order ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Satış tapılmadı", "Sale not found")}</p>
        ) : (
          <div className="p-4 space-y-3">
            {linesLocked && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                {tr(
                  "Stok çıxıldığı üçün məhsul sətirləri dəyişdirilə bilməz. Digər sahələr redaktə oluna bilər.",
                  "Line items cannot be changed after stock has been deducted. Other fields remain editable.",
                )}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Müştəri", "Customer")}
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
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
                >
                  <option value="">{tr("Müştəri Seç", "Choose Customer")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  {customerId && !customers.some((c) => c.id === customerId) && order.customerName && (
                    <option value={customerId}>{order.customerName}</option>
                  )}
                </select>
              </div>

              {autoEnabled && customerId && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                      {tr("Avtomobil", "Vehicle")}
                    </label>
                    <select
                      value={vehicleId}
                      onChange={(e) => {
                        setVehicleId(e.target.value);
                        if (!e.target.value) setMileageAtService("");
                      }}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="">{tr("Avtomobil seçilməyib", "No vehicle")}</option>
                      {customerVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {[vehicle.make, vehicle.model, vehicle.plate].filter(Boolean).join(" · ")}
                        </option>
                      ))}
                      {vehicleId && !customerVehicles.some((vehicle) => vehicle.id === vehicleId) && order.vehicleLabel && (
                        <option value={vehicleId}>{order.vehicleLabel}</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                      {tr("Yürüş (km)", "Mileage (km)")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={mileageAtService}
                      onChange={(e) => setMileageAtService(e.target.value)}
                      disabled={!vehicleId}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Kassir", "Biller")} <span className="text-red-500">*</span>
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
                  {billerId && !billers.some((b) => b.id === billerId) && order.billerName && (
                    <option value={billerId}>{order.billerName}</option>
                  )}
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

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Ödəniş Üsulu", "Payment Method")}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PosUiPaymentMethod)}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer"
                >
                  <option value="cash">{tr("Nağd", "Cash")}</option>
                  <option value="card">{tr("Kart", "Card")}</option>
                  <option value="bank">{tr("Bank Transferi", "Bank Transfer")}</option>
                </select>
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
                  <option value="completed">{tr("Tamamlandı", "Completed")}</option>
                  {status === "held" || status === "draft" ? null : (
                    <>
                      <option value="pending">{tr("Gözləyir", "Pending")}</option>
                      <option value="processing">{tr("İşlənir", "Processing")}</option>
                    </>
                  )}
                  <option value="cancelled">{tr("Ləğv Edildi", "Cancelled")}</option>
                  {(status === "held" || status === "draft" || status === "pending") && (
                    <option value="held">{tr("Qaralama", "Draft")}</option>
                  )}
                </select>
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
                  disabled={linesLocked}
                  placeholder={tr("Məhsul kodu daxil edin və seçin", "Please type product code and select")}
                  className="w-full px-2.5 py-1.5 pr-10 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] disabled:opacity-60"
                />
                <Scan className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                {!linesLocked && showProductList && productSearch && (
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
                    {stockEnabled && <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                      {tr("Stok", "Stock")}
                    </th>}
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
                      <td colSpan={stockEnabled ? 6 : 5} className="px-2 py-4 text-center text-gray-500">
                        {tr("Məhsul əlavə edin", "Add products")}
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-2 py-2 text-gray-900 dark:text-white">{product.name}</td>
                        <td className="px-2 py-2">
                          {linesLocked ? (
                            <span className="text-gray-900 dark:text-white">₼{product.unitPrice.toFixed(2)}</span>
                          ) : (
                            <input
                              type="number"
                              value={product.unitPrice}
                              onChange={(e) =>
                                handleUpdateProduct(product.id, "unitPrice", Number(e.target.value))
                              }
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                        </td>
                        {stockEnabled && <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {linesLocked ? "—" : product.stock}
                        </td>}
                        <td className="px-2 py-2">
                          {linesLocked ? (
                            <span className="text-gray-900 dark:text-white">{product.qty}</span>
                          ) : (
                            <input
                              type="number"
                              value={product.qty}
                              onChange={(e) =>
                                handleUpdateProduct(product.id, "qty", Number(e.target.value))
                              }
                              min="1"
                              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          ₼{calculateLineTotal(product).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          {!linesLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(product.id)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
                  {tr("Xidmət haqqı", "Service fee")}
                </label>
                <input
                  type="number"
                  value={serviceFee}
                  onChange={(e) => setServiceFee(Number(e.target.value))}
                  min="0"
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
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
                {serviceFee > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Xidmət haqqı", "Service fee")}</span>
                    <span className="text-gray-900 dark:text-white">₼ {serviceFee.toFixed(2)}</span>
                  </div>
                )}
                {commissionEnabled && commissionAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Komissiya", "Commission")}</span>
                    <span className="text-gray-900 dark:text-white">₼ {commissionAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-semibold pt-2 border-t border-gray-300 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">{tr("Ümumi Məbləğ", "Grand Total")}</span>
                  <span className="text-gray-900 dark:text-white">₼ {totals.grandTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{tr("Ödənilib", "Paid")}</span>
                  <span className="text-green-600 dark:text-green-400">₼ {paidAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{tr("Borc", "Due")}</span>
                  <span className="text-[#14b8a6] dark:text-[#14b8a6]">
                    ₼ {Math.max(0, totals.grandTotal - paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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
            onClick={() => void handleSubmit()}
            disabled={!canSave}
            className="flex items-center gap-2 px-6 py-3 text-sm bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Yadda saxla", "Save Changes")}
          </button>
        </div>
      </div>
    </div>
  );
}
