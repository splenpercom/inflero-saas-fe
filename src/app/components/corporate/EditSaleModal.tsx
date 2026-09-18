import { useState, useEffect } from "react";
import { X, Scan, Trash2, Save, Keyboard } from "lucide-react";
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
import { ModernSelect } from "../ui/ModernSelect";
import { TouchKeyboard } from "../ui/TouchKeyboard";
import {
  useLastPointerType,
  usePrefersTouchKeyboard,
} from "../../hooks/usePrefersTouchKeyboard";
import { pickLang } from "../../i18n/pickLang";
import { fetchCustomerVehicles, type CustomerVehicle } from "../../api/people";
import { asNumber, sanitizeNumericTyping } from "../../lib/numericInput";

interface ProductItem {
  id: string;
  name: string;
  unitPrice: number | "";
  stock: number;
  qty: number | "";
  /** Units already returned for this product (locked floor). */
  returnedQty: number;
}

interface EditSaleModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type TouchKbTarget =
  | { kind: "customer" | "product" | "reference" | "mileage" }
  | { kind: "taxPercent" | "discount" | "shipping" | "serviceFee" }
  | { kind: "lineQty" | "linePrice"; productId: string };

const NUMPAD_KINDS = new Set([
  "mileage",
  "taxPercent",
  "discount",
  "shipping",
  "serviceFee",
  "lineQty",
  "linePrice",
]);

function bufferToNumber(s: string): number | "" {
  if (s === "") return "";
  const n = Number(s);
  return Number.isFinite(n) ? n : "";
}

export function EditSaleModal({ orderId, isOpen, onClose, onSaved }: EditSaleModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, user, hasModule } = useAuth();
  const prefersTouchKeyboard = usePrefersTouchKeyboard();
  const lastPointerType = useLastPointerType();
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
  const [shipping, setShipping] = useState<number | "">("");
  const [serviceFee, setServiceFee] = useState<number | "">("");
  const [commissionAmount, setCommissionAmount] = useState<number | "">("");
  const [commissionEnabled, setCommissionEnabled] = useState(false);
  const [discount, setDiscount] = useState<number | "">("");
  const [taxPercent, setTaxPercent] = useState<number | "">("");
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [stockDeducted, setStockDeducted] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [refundedAmount, setRefundedAmount] = useState(0);
  const [paymentStatusLabel, setPaymentStatusLabel] = useState("");
  const [touchKb, setTouchKb] = useState<
    (TouchKbTarget & { mode: "full" | "numpad"; buffer: string }) | null
  >(null);
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
      setTouchKb(null);
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
        setPaymentMethod((() => {
          const m = mapPaymentMethodFromApi(data.paymentMethod);
          return m === "bank" ? "cash" : m;
        })());
        setStatus(data.status.toLowerCase());
        setShipping(data.shipping ? parseFloat(data.shipping) : 0);
        setServiceFee(data.serviceFee ? parseFloat(data.serviceFee) : 0);
        setCommissionEnabled(Boolean(data.commissionEnabled));
        setCommissionAmount(data.commissionAmount ? parseFloat(data.commissionAmount) : 0);
        setDiscount(data.discount ? parseFloat(data.discount) : 0);
        setTaxPercent(data.taxPercent ? parseFloat(data.taxPercent) : 0);
        setStockDeducted(Boolean(data.stockDeducted));
        setPaidAmount(parseFloat(data.paid) || 0);
        setRefundedAmount(parseFloat(data.refunded ?? "0") || 0);
        setPaymentStatusLabel(data.paymentStatus ?? "");

        const byProduct = new Map<string, ProductItem>();
        for (const item of data.items) {
          const returnedQty = item.returnedQty ?? 0;
          const prev = byProduct.get(item.productId);
          if (prev) {
            prev.qty += item.quantity;
            prev.returnedQty = Math.max(prev.returnedQty, returnedQty);
          } else {
            byProduct.set(item.productId, {
              id: item.productId,
              name: item.productName,
              unitPrice: parseFloat(item.price) || 0,
              stock: 0,
              qty: item.quantity,
              returnedQty,
            });
          }
        }
        setProducts([...byProduct.values()]);
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

  const payKey = paymentStatusLabel.toLowerCase().replace(/\s+/g, "_");
  const isFullyRefunded =
    payKey === "refunded" ||
    (products.length > 0 &&
      products.every((p) => p.returnedQty > 0 && asNumber(p.qty) <= p.returnedQty));
  const hasAnyReturns = products.some((p) => p.returnedQty > 0);
  const itemsEditable = !linesLocked && !isFullyRefunded;

  const isLineFullyRefunded = (product: ProductItem) =>
    product.returnedQty > 0 && asNumber(product.qty) <= product.returnedQty;

  const handleAddProduct = async (productId: string) => {
    if (!itemsEditable) return;
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
          returnedQty: 0,
        },
      ]);
      setProductSearch("");
      setShowProductList(false);
    } catch (err) {
      notifyFromError(err, tr("Məhsul yüklənə bilmədi", "Failed to load product"));
    }
  };

  const handleUpdateProduct = (id: string, field: "unitPrice" | "qty", value: number | "") => {
    if (!itemsEditable) return;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (isLineFullyRefunded(p)) return p;
        if (field === "unitPrice" && p.returnedQty > 0) return p;
        return { ...p, [field]: value };
      }),
    );
  };

  const touchKbValueFor = (target: TouchKbTarget): string => {
    switch (target.kind) {
      case "customer":
        return customerSearch;
      case "product":
        return productSearch;
      case "reference":
        return reference;
      case "mileage":
        return mileageAtService;
      case "taxPercent":
        return taxPercent === "" ? "" : String(taxPercent);
      case "discount":
        return discount === "" ? "" : String(discount);
      case "shipping":
        return shipping === "" ? "" : String(shipping);
      case "serviceFee":
        return serviceFee === "" ? "" : String(serviceFee);
      case "lineQty": {
        const line = products.find((p) => p.id === target.productId);
        return line == null || line.qty === "" ? "" : String(line.qty);
      }
      case "linePrice": {
        const line = products.find((p) => p.id === target.productId);
        return line == null || line.unitPrice === "" ? "" : String(line.unitPrice);
      }
    }
  };

  const openTouchKb = (target: TouchKbTarget, force = false) => {
    const fromTouch =
      lastPointerType.current === "touch" || lastPointerType.current === "pen";
    if (!force && !prefersTouchKeyboard && !fromTouch) return;
    setTouchKb({
      ...target,
      mode: NUMPAD_KINDS.has(target.kind) ? "numpad" : "full",
      buffer: touchKbValueFor(target),
    });
  };

  const handleTouchKbChange = (next: string) => {
    if (!touchKb) return;
    setTouchKb({ ...touchKb, buffer: next });
    switch (touchKb.kind) {
      case "customer":
        setCustomerSearch(next);
        break;
      case "product":
        setProductSearch(next);
        setShowProductList(true);
        break;
      case "reference":
        setReference(next);
        break;
      case "mileage":
        setMileageAtService(sanitizeNumericTyping(next, { allowDecimal: false }));
        break;
      case "taxPercent":
        setTaxPercent(bufferToNumber(next));
        break;
      case "discount":
        setDiscount(bufferToNumber(next));
        break;
      case "shipping":
        setShipping(bufferToNumber(next));
        break;
      case "serviceFee":
        setServiceFee(bufferToNumber(next));
        break;
      case "lineQty":
        handleUpdateProduct(
          touchKb.productId,
          "qty",
          bufferToNumber(sanitizeNumericTyping(next, { allowDecimal: false })),
        );
        break;
      case "linePrice":
        handleUpdateProduct(touchKb.productId, "unitPrice", bufferToNumber(next));
        break;
    }
  };

  const touchKbTitle = (): string => {
    switch (touchKb?.kind) {
      case "customer":
        return tr("Müştəri", "Customer");
      case "product":
        return tr("Məhsul axtar", "Search product");
      case "reference":
        return tr("İstinad", "Reference");
      case "mileage":
        return tr("Yürüş", "Mileage");
      case "taxPercent":
        return tr("Vergi %", "Tax %");
      case "discount":
        return tr("Endirim", "Discount");
      case "shipping":
        return tr("Çatdırılma", "Shipping");
      case "serviceFee":
        return tr("Xidmət haqqı", "Service fee");
      case "lineQty":
        return tr("Miqdar", "Qty");
      case "linePrice":
        return tr("Vahid qiymət", "Unit price");
      default:
        return tr("Klaviatura", "Keyboard");
    }
  };

  const handleRemoveProduct = (id: string) => {
    if (!itemsEditable) return;
    const row = products.find((p) => p.id === id);
    if (row && row.returnedQty > 0) return;
    setProducts(products.filter((p) => p.id !== id));
  };

  const calculateLineTotal = (product: ProductItem) =>
    asNumber(product.unitPrice) * asNumber(product.qty);

  const calculateTotals = () => {
    const subtotal = products.reduce((sum, p) => sum + calculateLineTotal(p), 0);
    const taxAmount = (subtotal * asNumber(taxPercent)) / 100;
    const grandTotal =
      subtotal + taxAmount - asNumber(discount) + asNumber(shipping) + asNumber(serviceFee);
    return { subtotal, taxAmount, grandTotal };
  };

  const totals = calculateTotals();
  const filteredSearchResults = searchResults.filter((p) => !products.find((line) => line.id === p.id));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!orderId || !(isAuthenticated || isDemo)) return;
    if (isFullyRefunded) {
      notifyFromError(
        new Error(
          tr(
            "Tam qaytarılmış sifariş redaktə edilə bilməz",
            "A fully refunded order cannot be edited",
          ),
        ),
      );
      return;
    }
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
        taxPercent: asNumber(taxPercent),
        discount: asNumber(discount),
        shipping: asNumber(shipping),
        serviceFee: asNumber(serviceFee),
      };
      if (itemsEditable) {
        body.items = products.map((p) => ({
          productId: p.id,
          quantity: asNumber(p.qty, 1),
          price: asNumber(p.unitPrice),
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
    !isFullyRefunded &&
    Boolean(order);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Satışı Redaktə Et", "Edit Sale")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{order?.reference ?? "—"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
        ) : !order ? (
          <p className="p-6 text-center text-sm text-gray-500">{tr("Satış tapılmadı", "Sale not found")}</p>
        ) : (
          <div className="p-4 space-y-3">
            {isFullyRefunded && (
              <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
                {tr(
                  "Bu sifariş tam qaytarılıb. Məhsul sətirləri və sifariş redaktə edilə bilməz.",
                  "This order is fully refunded. Line items and the order cannot be edited.",
                )}
              </p>
            )}
            {!isFullyRefunded && hasAnyReturns && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                {tr(
                  "Qaytarılmış məhsullar kilidlənib. Yalnız qalan miqdar üzərində dəyişiklik edilə bilər.",
                  "Refunded items are locked. You can only change remaining (non-refunded) quantities.",
                )}
              </p>
            )}
            {linesLocked && !isFullyRefunded && (
              <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                {tr(
                  "Stok çıxıldığı üçün məhsul sətirləri dəyişdirilə bilməz. Digər sahələr redaktə oluna bilər.",
                  "Line items cannot be changed after stock has been deducted. Other fields remain editable.",
                )}
              </p>
            )}

            <fieldset disabled={isFullyRefunded} className="space-y-3 disabled:opacity-70">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Müştəri", "Customer")}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="none"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    onFocus={() => openTouchKb({ kind: "customer" })}
                    placeholder={tr("Müştəri axtar...", "Search customer...")}
                    className="w-full px-2.5 py-1.5 pr-9 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-1"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1.5 p-0.5 rounded text-gray-400 hover:text-[#14b8a6]"
                    title={tr("Klaviatura", "Keyboard")}
                    onClick={() => openTouchKb({ kind: "customer" }, true)}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                </div>
                <ModernSelect
                  value={customerId}
                  onChange={handleCustomerChange}
                  className="w-full"
                  placeholder={tr("Müştəri Seç", "Choose Customer")}
                  options={[
                    { value: "", label: tr("Müştəri Seç", "Choose Customer") },
                    ...customers.map((c) => ({ value: c.id, label: c.name })),
                    ...(customerId && !customers.some((c) => c.id === customerId) && order.customerName
                      ? [{ value: customerId, label: order.customerName }]
                      : []),
                  ]}
                />
              </div>

              {autoEnabled && customerId && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                      {tr("Avtomobil", "Vehicle")}
                    </label>
                    <ModernSelect
                      value={vehicleId}
                      onChange={(value) => {
                        setVehicleId(value);
                        if (!value) setMileageAtService("");
                      }}
                      className="w-full"
                      placeholder={tr("Avtomobil seçilməyib", "No vehicle")}
                      options={[
                        { value: "", label: tr("Avtomobil seçilməyib", "No vehicle") },
                        ...customerVehicles.map((vehicle) => ({
                          value: vehicle.id,
                          label: [vehicle.make, vehicle.model, vehicle.plate].filter(Boolean).join(" · "),
                        })),
                        ...(vehicleId &&
                        !customerVehicles.some((vehicle) => vehicle.id === vehicleId) &&
                        order.vehicleLabel
                          ? [{ value: vehicleId, label: order.vehicleLabel }]
                          : []),
                      ]}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                      {tr("Yürüş (km)", "Mileage (km)")}
                    </label>
                    <input
                      type="text"
                      inputMode="none"
                      value={mileageAtService}
                      onChange={(e) =>
                        setMileageAtService(
                          sanitizeNumericTyping(e.target.value, { allowDecimal: false }),
                        )
                      }
                      onFocus={() => openTouchKb({ kind: "mileage" })}
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
                <ModernSelect
                  value={billerId}
                  onChange={setBillerId}
                  disabled={billersLoading}
                  className="w-full"
                  placeholder={tr("Kassir Seç", "Choose Biller")}
                  options={[
                    { value: "", label: tr("Kassir Seç", "Choose Biller") },
                    ...billers.map((b) => ({ value: b.id, label: b.name })),
                    ...(billerId && !billers.some((b) => b.id === billerId) && order.billerName
                      ? [{ value: billerId, label: order.billerName }]
                      : []),
                  ]}
                />
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
                  inputMode="none"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  onFocus={() => openTouchKb({ kind: "reference" })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Ödəniş Üsulu", "Payment Method")}
                </label>
                <ModernSelect
                  value={paymentMethod}
                  onChange={(value) => setPaymentMethod(value as PosUiPaymentMethod)}
                  className="w-full"
                  options={[
                    { value: "cash", label: tr("Nağd", "Cash") },
                    { value: "card", label: tr("Kart", "Card") },
                  ]}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Status", "Status")} <span className="text-red-500">*</span>
                </label>
                <ModernSelect
                  value={status}
                  onChange={setStatus}
                  className="w-full"
                  options={[
                    { value: "completed", label: tr("Tamamlandı", "Completed") },
                    ...(status === "held" || status === "draft"
                      ? []
                      : [
                          { value: "pending", label: tr("Gözləyir", "Pending") },
                          { value: "processing", label: tr("İşlənir", "Processing") },
                        ]),
                    { value: "cancelled", label: tr("Ləğv Edildi", "Cancelled") },
                    ...(status === "held" || status === "draft" || status === "pending"
                      ? [{ value: "held", label: tr("Qaralama", "Draft") }]
                      : []),
                  ]}
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
                  inputMode="none"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => {
                    setShowProductList(true);
                    openTouchKb({ kind: "product" });
                  }}
                  disabled={!itemsEditable}
                  placeholder={tr("Məhsul kodu daxil edin və seçin", "Please type product code and select")}
                  className="w-full px-2.5 py-1.5 pr-16 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6] disabled:opacity-60"
                />
                {itemsEditable && (
                  <button
                    type="button"
                    className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-[#14b8a6]"
                    title={tr("Klaviatura", "Keyboard")}
                    onClick={() => openTouchKb({ kind: "product" }, true)}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                )}
                <Scan className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                {itemsEditable && showProductList && productSearch && (
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
                    products.map((product) => {
                      const fullyRefundedLine = isLineFullyRefunded(product);
                      const qtyNum = asNumber(product.qty);
                      const partiallyRefunded =
                        product.returnedQty > 0 && qtyNum > product.returnedQty;
                      const priceLocked =
                        !itemsEditable || fullyRefundedLine || product.returnedQty > 0;
                      const qtyLocked = !itemsEditable || fullyRefundedLine;
                      const remainingQty = Math.max(0, qtyNum - product.returnedQty);
                      return (
                      <tr
                        key={product.id}
                        className={`border-t border-gray-200 dark:border-gray-700 ${
                          fullyRefundedLine ? "bg-gray-50 dark:bg-gray-800/40 opacity-70" : ""
                        }`}
                      >
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          <div className="flex flex-col gap-0.5">
                            <span>{product.name}</span>
                            {fullyRefundedLine ? (
                              <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {tr("Qaytarılıb", "Refunded")}
                              </span>
                            ) : partiallyRefunded ? (
                              <span className="inline-flex w-fit px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200">
                                {tr(
                                  `${product.returnedQty} qaytarılıb · ${remainingQty} qalıb`,
                                  `${product.returnedQty} refunded · ${remainingQty} left`,
                                )}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          {priceLocked ? (
                            <span className="text-gray-900 dark:text-white">
                              ₼{asNumber(product.unitPrice).toFixed(2)}
                            </span>
                          ) : (
                            <input
                              type="text"
                              inputMode="none"
                              value={product.unitPrice === "" ? "" : product.unitPrice}
                              onChange={(e) => {
                                const s = sanitizeNumericTyping(e.target.value, {
                                  allowDecimal: true,
                                });
                                handleUpdateProduct(
                                  product.id,
                                  "unitPrice",
                                  s === "" ? "" : Number(s),
                                );
                              }}
                              onFocus={() => openTouchKb({ kind: "linePrice", productId: product.id })}
                              className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                        </td>
                        {stockEnabled && <td className="px-2 py-2 text-gray-900 dark:text-white">
                          {qtyLocked ? "—" : product.stock}
                        </td>}
                        <td className="px-2 py-2">
                          {qtyLocked ? (
                            <span className="text-gray-900 dark:text-white">{product.qty}</span>
                          ) : (
                            <input
                              type="text"
                              inputMode="none"
                              value={product.qty === "" ? "" : product.qty}
                              onChange={(e) => {
                                const s = sanitizeNumericTyping(e.target.value, {
                                  allowDecimal: false,
                                });
                                handleUpdateProduct(
                                  product.id,
                                  "qty",
                                  s === "" ? "" : Number(s),
                                );
                              }}
                              onFocus={() => openTouchKb({ kind: "lineQty", productId: product.id })}
                              className="w-16 px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            />
                          )}
                        </td>
                        <td className="px-2 py-2 text-gray-900 dark:text-white">
                          ₼{calculateLineTotal(product).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          {itemsEditable && product.returnedQty === 0 && (
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
                      );
                    })
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
                  type="text"
                  inputMode="none"
                  value={taxPercent === "" ? "" : taxPercent}
                  onChange={(e) => {
                    const s = sanitizeNumericTyping(e.target.value, { allowDecimal: true });
                    setTaxPercent(s === "" ? "" : Number(s));
                  }}
                  onFocus={() => openTouchKb({ kind: "taxPercent" })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Endirim", "Discount")}
                </label>
                <input
                  type="text"
                  inputMode="none"
                  value={discount === "" ? "" : discount}
                  onChange={(e) => {
                    const s = sanitizeNumericTyping(e.target.value, { allowDecimal: true });
                    setDiscount(s === "" ? "" : Number(s));
                  }}
                  onFocus={() => openTouchKb({ kind: "discount" })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Çatdırılma", "Shipping")}
                </label>
                <input
                  type="text"
                  inputMode="none"
                  value={shipping === "" ? "" : shipping}
                  onChange={(e) => {
                    const s = sanitizeNumericTyping(e.target.value, { allowDecimal: true });
                    setShipping(s === "" ? "" : Number(s));
                  }}
                  onFocus={() => openTouchKb({ kind: "shipping" })}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Xidmət haqqı", "Service fee")}
                </label>
                <input
                  type="text"
                  inputMode="none"
                  value={serviceFee === "" ? "" : serviceFee}
                  onChange={(e) => {
                    const s = sanitizeNumericTyping(e.target.value, { allowDecimal: true });
                    setServiceFee(s === "" ? "" : Number(s));
                  }}
                  onFocus={() => openTouchKb({ kind: "serviceFee" })}
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
                  <span className="text-gray-900 dark:text-white">₼ {asNumber(discount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{tr("Çatdırılma", "Shipping")}</span>
                  <span className="text-gray-900 dark:text-white">₼ {asNumber(shipping).toFixed(2)}</span>
                </div>
                {asNumber(serviceFee) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Xidmət haqqı", "Service fee")}</span>
                    <span className="text-gray-900 dark:text-white">₼ {asNumber(serviceFee).toFixed(2)}</span>
                  </div>
                )}
                {commissionEnabled && asNumber(commissionAmount) > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Komissiya", "Commission")}</span>
                    <span className="text-gray-900 dark:text-white">₼ {asNumber(commissionAmount).toFixed(2)}</span>
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
                {refundedAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">{tr("Qaytarılıb", "Refunded")}</span>
                    <span className="text-red-600 dark:text-red-400">-₼ {refundedAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">{tr("Borc", "Due")}</span>
                  <span className="text-[#14b8a6] dark:text-[#14b8a6]">
                    ₼ {Math.max(0, totals.grandTotal - paidAmount).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
            </fieldset>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {isFullyRefunded ? tr("Bağla", "Close") : tr("Ləğv Et", "Cancel")}
          </button>
          {!isFullyRefunded && (
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Yadda saxla", "Save Changes")}
          </button>
          )}
        </div>
      </div>

      {touchKb && (
        <TouchKeyboard
          open
          mode={touchKb.mode}
          value={touchKb.buffer}
          onChange={handleTouchKbChange}
          onClose={() => setTouchKb(null)}
          title={touchKbTitle()}
        />
      )}
    </div>
  );
}
