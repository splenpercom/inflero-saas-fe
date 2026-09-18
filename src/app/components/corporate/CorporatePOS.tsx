import { pickLang } from "../../i18n/pickLang";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  X,
  User,
  CreditCard,
  Wallet,
  Trash2,
  ChevronDown,
  UserCheck,
  Tag,
  Check,
  Printer,
  ArrowLeft,
  Home,
  Car,
  ChefHat,
  Armchair,
  Factory,
  Keyboard,
} from "lucide-react";
import { TouchKeyboard } from "../ui/TouchKeyboard";
import {
  useLastPointerType,
  usePrefersTouchKeyboard,
} from "../../hooks/usePrefersTouchKeyboard";
import { sanitizeNumericTyping } from "../../lib/numericInput";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBarcodeWedge } from "../../hooks/useBarcodeWedge";
import { formatCurrency } from "../../utils/currency";
import { fetchProducts, lookupProductByCode, type ProductListItem } from "../../api/inventory";
import {
  fetchCustomers,
  fetchCustomerVehicles,
  type CustomerVehicle,
  type PeopleCustomer,
} from "../../api/people";
import { createPosOrder, posCheckout, sendPosOrderToKot, sendPosOrderToProduction } from "../../api/sales";
import { fetchDiningTables, type DiningTable } from "../../api/dining";
import { fetchTenantSettings } from "../../api/tenantSettings";
import { useSalesBillers } from "../../hooks/useSalesBillers";
import { parsePrice } from "../../lib/inventoryMappers";
import { formatDateTime } from "../../lib/dateFormat";
import { notifyFromError, notifySuccess, notifyWarning, isAbortError, isNetworkError, notifyError } from "../../lib/toast";
import { mapPaymentMethodToApi } from "../../lib/salesMappers";
import { APP_LOGO_LIGHT, getBrandLogoUrl } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { useIsDarkMode } from "../../hooks/useIsDarkMode";
import { BrandLogo } from "../ui/BrandLogo";
import { thermalReceiptLabels, type ThermalReceiptPayload } from "../../lib/thermalReceipt";
import { printPosTicket } from "../../lib/posPrint";
import { loadPosPrinterSettings } from "../../lib/posPrinterSettings";
import { PosPrinterSettings } from "./PosPrinterSettings";
import { useNavigate } from "react-router";
import { pickCurrentUserBillerId } from "../../lib/salesBiller";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  code: string;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

type PaymentMethod = "cash" | "card";
type PaymentStatusChoice = "paid" | "pending";

function ProductThumb({ image, className }: { image: string; className?: string }) {
  if (image.startsWith("http") || image.startsWith("/")) {
    return <img src={image} alt="" className={className} />;
  }
  return <span>{image || "📦"}</span>;
}

// ─── Reusable dropdown ────────────────────────────────────────────────────────
function SelectDropdown({
  value,
  onChange,
  options,
  placeholder,
  icon: Icon,
  disabled = false,
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string; sub?: string }[];
  placeholder: string;
  icon: React.ElementType;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.id === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          if (!disabled) setOpen((p) => !p);
        }}
        disabled={disabled}
        className="w-full flex items-center gap-2 pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white dark:disabled:hover:bg-gray-900"
      >
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
        <span className={selected ? "text-gray-900 dark:text-white" : "text-gray-400"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={`ml-auto w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {placeholder}
          </button>
          {options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="flex-1 text-left">
                <span className="block font-medium text-gray-900 dark:text-white">{opt.label}</span>
                {opt.sub && <span className="block text-gray-400 text-[10px]">{opt.sub}</span>}
              </span>
              {value === opt.id && <Check className="w-3 h-3 text-[#14b8a6] dark:text-[#14b8a6]" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Thermal Receipt ──────────────────────────────────────────────────────────
interface ReceiptData {
  orderNo: string;
  date: string;
  customer: string;
  customerPhone: string;
  vehicle?: string;
  mileage?: number;
  employee: string;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  shipping: number;
  serviceFee: number;
  discount: number;
  discountLabel: string;
  total: number;
  paymentMethod: string;
  paymentStatusLabel: string;
  /** Auto-print customer/counter receipt once (QZ when mapped, else browser). */
  autoPrintReceipt?: boolean;
  /** Show optional kitchen paper reprint (kitchen primary path is digital KOT). */
  allowKitchenReprint?: boolean;
  tableLabel?: string;
}

function ThermalReceipt({
  data,
  onClose,
  onConfigurePrinters,
}: {
  data: ReceiptData;
  onClose: () => void;
  onConfigurePrinters?: () => void;
}) {
  const { language } = useLanguage();
  const labels = thermalReceiptLabels(language);
  const isDark = useIsDarkMode();
  const { user } = useAuth();
  const companyName = user?.tenant?.name?.trim() || "Inflero";
  const previewLogoSrc = getBrandLogoUrl(user?.tenant, isDark);
  const printLogoSrc =
    getCompanyLogoUrl(user?.tenant, false) ??
    getCompanyLogoUrl(user?.tenant, true) ??
    APP_LOGO_LIGHT;
  const autoPrintedRef = useRef(false);
  const [printing, setPrinting] = useState(false);
  const printerMap = loadPosPrinterSettings();

  const toPayload = (): ThermalReceiptPayload => ({
    orderNo: data.orderNo,
    date: data.date,
    customer: data.customer,
    customerPhone: data.customerPhone,
    vehicle: data.vehicle,
    mileage: data.mileage,
    employee: data.employee,
    items: data.items,
    subtotal: data.subtotal,
    shipping: data.shipping,
    serviceFee: data.serviceFee,
    discount: data.discount,
    discountLabel: data.discountLabel,
    total: data.total,
    paymentMethod: data.paymentMethod,
    paymentStatusLabel: data.paymentStatusLabel,
    tableLabel: data.tableLabel,
    companyName,
    logoSrc: printLogoSrc,
    siteFooter: "app.inflero.com",
  });

  const handlePrint = async (opts?: { copy?: "customer" | "kitchen" }) => {
    const copy = opts?.copy ?? "customer";
    const role = copy === "kitchen" ? "kot" : "receipt";
    setPrinting(true);
    try {
      await printPosTicket({
        role,
        language,
        payload: toPayload(),
      });
    } catch (err) {
      notifyFromError(
        err,
        pickLang(language, "Çap alınmadı", "Print failed"),
      );
    } finally {
      setPrinting(false);
    }
  };

  useEffect(() => {
    if (autoPrintedRef.current) return;
    if (!data.autoPrintReceipt) return;
    autoPrintedRef.current = true;
    void handlePrint({ copy: "customer" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#14b8a6] dark:text-[#14b8a6]" />
            {labels.receipt} — {data.orderNo}
            {data.allowKitchenReprint && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300">
                KOT
              </span>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <button
            type="button"
            onClick={() => onConfigurePrinters?.()}
            className="text-[10px] text-[#14b8a6] hover:underline text-left"
          >
            {pickLang(
              language,
              printerMap.receiptPrinter
                ? `Printerlər: ${printerMap.receiptPrinter}${printerMap.kotPrinter ? ` / ${printerMap.kotPrinter}` : ""}`
                : "Printerləri təyin et (QZ Tray)",
              printerMap.receiptPrinter
                ? `Printers: ${printerMap.receiptPrinter}${printerMap.kotPrinter ? ` / ${printerMap.kotPrinter}` : ""}`
                : "Configure printers (QZ Tray)",
            )}
          </button>
        </div>

        <div className="p-4 font-mono text-[12px] leading-[1.35] text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 mx-4 mt-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 max-h-80 overflow-y-auto">
          <BrandLogo src={previewLogoSrc} alt={companyName} size="receipt" />
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.order}:</span><span className="font-bold text-right break-words">{data.orderNo}</span></div>
          <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.date}:</span><span className="text-right">{data.date}</span></div>
          {data.tableLabel && (
            <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.table}:</span><span className="font-semibold text-right">{data.tableLabel}</span></div>
          )}
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.customer}:</span><span className="font-semibold text-right break-words">{data.customer}</span></div>
          <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.phone}:</span><span className="text-right">{data.customerPhone}</span></div>
          {data.vehicle && <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.vehicle}:</span><span className="text-right break-words">{data.vehicle}</span></div>}
          {data.mileage != null && <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.mileage}:</span><span>{data.mileage} km</span></div>}
          <div className="flex justify-between gap-2"><span className="text-gray-400 shrink-0">{labels.employee}:</span><span className="text-right break-words">{data.employee}</span></div>
          <hr className="border-gray-400 dark:border-gray-500 my-1" />
          <p className="text-[11px] font-bold mb-1 uppercase">{labels.products}</p>
          {data.items.map((it, i) => (
            <div key={i} className="mb-1">
              <p className="break-words font-semibold">{it.name}</p>
              <div className="flex justify-between text-gray-400 pl-2 text-[11px]">
                <span>{it.qty} x {it.price.toFixed(2)} AZN</span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">{(it.qty * it.price).toFixed(2)} AZN</span>
              </div>
            </div>
          ))}
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between"><span className="text-gray-400">{labels.subtotal}:</span><span>{data.subtotal.toFixed(2)} AZN</span></div>
          <div className="flex justify-between"><span className="text-gray-400">{labels.shipping}:</span><span>{data.shipping.toFixed(2)} AZN</span></div>
          {data.serviceFee > 0 && <div className="flex justify-between"><span className="text-gray-400">{labels.serviceFee}:</span><span>{data.serviceFee.toFixed(2)} AZN</span></div>}
          {data.discount > 0 && <div className="flex justify-between"><span className="text-gray-400">{data.discountLabel}:</span><span>-{data.discount.toFixed(2)} AZN</span></div>}
          <hr className="border-gray-400 dark:border-gray-500 my-1" />
          <div className="flex justify-between text-[13px] font-bold"><span>{labels.total}:</span><span>{data.total.toFixed(2)} AZN</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-400">{labels.payment}:</span><span className="font-semibold">{data.paymentMethod}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-400">{labels.status}:</span><span className="font-semibold">{data.paymentStatusLabel}</span></div>
          <hr className="border-gray-400 dark:border-gray-500 my-2" />
          <p className="text-center text-[11px] text-gray-400">{labels.thanks}</p>
          <p className="text-center text-[11px] text-gray-400">app.inflero.com</p>
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {labels.close}
          </button>
          <button
            onClick={() => void handlePrint({ copy: "customer" })}
            disabled={printing}
            className="flex-1 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            {labels.print}
          </button>
          {data.allowKitchenReprint && (
            <button
              onClick={() => void handlePrint({ copy: "kitchen" })}
              disabled={printing}
              className="flex-1 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              title={pickLang(
                language,
                "Kağız KOT — əsas yol rəqəmsal KOT ekranıdır",
                "Paper KOT — primary path is the digital KOT screen",
              )}
            >
              <Printer className="w-3.5 h-3.5" />
              {labels.kitchen}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main POS Component ───────────────────────────────────────────────────────
export function CorporatePOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { user, isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const autoEnabled = hasModule("AUTO");
  const diningEnabled = hasModule("DINING");
  const { branchId, isGlobalMode } = useBranch();
  const branchRevision = useBranchRevision();
  const { canCreate } = useModulePermissions("Sales");
  const prefersTouchKeyboard = usePrefersTouchKeyboard();
  const lastPointerType = useLastPointerType();

  // Translation helper — must come before any data that uses it
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [mileageInput, setMileageInput] = useState("");
  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedBillerId, setSelectedBillerId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [diningTables, setDiningTables] = useState<DiningTable[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<PaymentStatusChoice>("paid");
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);
  const [shippingInput, setShippingInput] = useState("");
  const [serviceFeeInput, setServiceFeeInput] = useState("");
  const [posServiceFeeEnabled, setPosServiceFeeEnabled] = useState(false);
  const [posSendToProductionEnabled, setPosSendToProductionEnabled] = useState(false);
  const [touchKb, setTouchKb] = useState<null | {
    mode: "full" | "numpad";
    field: "search" | "shipping" | "serviceFee" | "mileage" | "discount";
  }>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const lookupSeqRef = useRef(0);
  const lastLookupCodeRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const lookupInFlightCodeRef = useRef<string | null>(null);

  const mapListItemToProduct = useCallback((item: ProductListItem): Product => ({
    id: item.id,
    name: item.name,
    price: parsePrice(item.price),
    image: item.image || "📦",
    category: item.category || "",
    stock: item.quantity,
    code: item.sku,
  }), []);
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingToKot, setSendingToKot] = useState(false);
  const [sendingToProduction, setSendingToProduction] = useState(false);
  const { billers, defaultBillerId } = useSalesBillers((isAuthenticated || isDemo));
  const isEmployee = !isDemo && user?.role?.name.trim().toLowerCase() === "employee";
  const currentUserBillerId = useMemo(
    () => pickCurrentUserBillerId(billers, user),
    [billers, user],
  );

  useEffect(() => {
    if (isEmployee) {
      setSelectedBillerId(currentUserBillerId);
      return;
    }
    if (defaultBillerId && !selectedBillerId) {
      setSelectedBillerId(defaultBillerId);
    }
  }, [currentUserBillerId, defaultBillerId, isEmployee, selectedBillerId]);

  const loadProducts = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    try {
      const data = await fetchProducts({ pageSize: 100 });
      setProducts(data.items.map(mapListItemToProduct));
    } catch (err) {
      notifyFromError(err, tr("Məhsulları yükləmək alınmadı", "Failed to load products"));
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [isDemo, isAuthenticated, branchRevision, language, mapListItemToProduct]);

  const loadCustomers = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setCustomers([]);
      return;
    }
    try {
      const rows = await fetchCustomers();
      setCustomers(rows);
    } catch {
      setCustomers([]);
    }
  }, [isDemo, isAuthenticated, branchRevision]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    if (!diningEnabled || !(isAuthenticated || isDemo) || isGlobalMode || !branchId) {
      setDiningTables([]);
      setSelectedTableId("");
      return;
    }
    let cancelled = false;
    fetchDiningTables()
      .then((rows) => {
        if (!cancelled) setDiningTables(rows);
      })
      .catch(() => {
        if (!cancelled) setDiningTables([]);
      });
    return () => {
      cancelled = true;
    };
  }, [diningEnabled, isAuthenticated, isDemo, isGlobalMode, branchId, branchRevision]);

  useEffect(() => {
    if (!autoEnabled || !selectedCustomerId) {
      setCustomerVehicles([]);
      return;
    }
    let cancelled = false;
    fetchCustomerVehicles(selectedCustomerId)
      .then((rows) => {
        if (!cancelled) setCustomerVehicles(rows);
      })
      .catch(() => {
        if (!cancelled) setCustomerVehicles([]);
      });
    return () => {
      cancelled = true;
    };
  }, [autoEnabled, selectedCustomerId]);

  useEffect(() => {
    if (!(isAuthenticated || isDemo)) {
      setPosServiceFeeEnabled(false);
      setPosSendToProductionEnabled(false);
      return;
    }
    let cancelled = false;
    fetchTenantSettings()
      .then((s) => {
        if (!cancelled) {
          setPosServiceFeeEnabled(s.posServiceFeeEnabled === true);
          setPosSendToProductionEnabled(s.posSendToProductionEnabled === true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosServiceFeeEnabled(false);
          setPosSendToProductionEnabled(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, branchRevision]);

  // Derived selections
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const customerOptions = customers.map((c) => ({ id: c.id, label: c.name, sub: c.phone }));
  const billerOptions = billers.map((b) => ({ id: b.id, label: b.name, sub: b.code }));
  const tableOptions = diningTables.map((t) => ({
    id: t.id,
    label: `#${t.number} ${t.name}`,
    sub: `${t.status}${t.area ? ` · ${t.area}` : ""}`,
  }));

  const handleCustomerChange = (id: string) => {
    if (autoEnabled && id !== selectedCustomerId) {
      setSelectedVehicleId("");
      setMileageInput("");
    }
    setSelectedCustomerId(id);
  };

  const categories = useMemo(() => {
    const unique = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return [
      { id: "all", name: tr("Hamısı", "All") },
      ...unique.map((name) => ({ id: name, name })),
    ];
  }, [products, language]);

  const paymentMethods: { id: PaymentMethod; name: string; icon: React.ElementType }[] = [
    { id: "cash", name: tr("Nağd", "Cash"), icon: Wallet },
    { id: "card", name: tr("Kart", "Card"), icon: CreditCard },
  ];

  // Play beep sound when adding to cart
  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Pleasant beep frequency
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const warnOutOfStock = (product: Product) => {
    notifyWarning(
      tr(`"${product.name}" stokda yoxdur`, `"${product.name}" is out of stock`),
    );
  };

  const warnInsufficientStock = (product: Product, available: number) => {
    notifyWarning(
      tr(
        `"${product.name}" üçün yalnız ${available} ədəd mövcuddur`,
        `Only ${available} available for "${product.name}"`,
      ),
    );
  };

  const addToCart = (product: Product): boolean => {
    if (!canCreate) return false;
    const existing = cart.find((i) => i.id === product.id);
    const nextQty = existing ? existing.quantity + 1 : 1;

    if (stockEnabled && product.stock <= 0) {
      warnOutOfStock(product);
      return false;
    }
    if (stockEnabled && nextQty > product.stock) {
      warnInsufficientStock(product, product.stock);
      return false;
    }

    playBeep();
    setCart((prev) => {
      const inCart = prev.find((i) => i.id === product.id);
      if (inCart) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
    return true;
  };

  const addToCartRef = useRef(addToCart);
  addToCartRef.current = addToCart;

  const handleBarcodeScan = useCallback(
    async (code: string): Promise<boolean | "ignored"> => {
      const trimmed = code.trim();
      if (!trimmed) return "ignored";

      if (!canCreate) {
        notifyWarning(tr("Sifariş yaratmaq icazəniz yoxdur", "You do not have permission to add items"));
        return false;
      }
      if (receipt) return "ignored";

      // Same code already looking up → ignore (do not abort; abort races can double-add).
      if (lookupInFlightCodeRef.current === trimmed) {
        return "ignored";
      }

      // Soft debounce for identical rapid rescans (gun bounce).
      const now = Date.now();
      if (
        lastLookupCodeRef.current.code === trimmed &&
        now - lastLookupCodeRef.current.at < 500
      ) {
        return "ignored";
      }
      lastLookupCodeRef.current = { code: trimmed, at: now };

      // Abort only when a *different* code supersedes an in-flight lookup.
      lookupAbortRef.current?.abort();
      const ac = new AbortController();
      lookupAbortRef.current = ac;
      const seq = ++lookupSeqRef.current;
      lookupInFlightCodeRef.current = trimmed;

      try {
        const item = await lookupProductByCode(trimmed, { signal: ac.signal });
        if (seq !== lookupSeqRef.current || ac.signal.aborted) return "ignored";
        const added = addToCartRef.current(mapListItemToProduct(item));
        if (!added) return false;
        setSearchQuery("");
        notifySuccess(
          tr(`Əlavə olundu: ${item.name}`, `Added: ${item.name}`),
        );
        // Refresh debounce clock after success so a late second hit can't slip in.
        lastLookupCodeRef.current = { code: trimmed, at: Date.now() };
        return true;
      } catch (err) {
        if (seq !== lookupSeqRef.current || isAbortError(err) || ac.signal.aborted) return "ignored";
        if (isNetworkError(err)) {
          notifyError(
            tr(
              "Şəbəkə xətası — bağlantını yoxlayın və ya SKU-nu axtarışda əl ilə daxil edin",
              "Network error — check connection, or type the SKU in search manually",
            ),
          );
          return false;
        }
        notifyFromError(
          err,
          tr("Məhsul tapılmadı", "Product not found for this barcode"),
        );
        return false;
      } finally {
        if (lookupInFlightCodeRef.current === trimmed) {
          lookupInFlightCodeRef.current = null;
        }
      }
    },
    [canCreate, receipt, mapListItemToProduct, language],
  );

  const { handleKeyDown: handleSearchBarcodeKeyDown } = useBarcodeWedge(handleBarcodeScan);

  const openTouchKb = useCallback(
    (
      mode: "full" | "numpad",
      field: "search" | "shipping" | "serviceFee" | "mileage" | "discount",
      force = false,
    ) => {
      const fromTouch =
        lastPointerType.current === "touch" || lastPointerType.current === "pen";
      if (force || prefersTouchKeyboard || fromTouch) {
        setTouchKb({ mode, field });
      }
    },
    [prefersTouchKeyboard, lastPointerType],
  );

  const removeFromCart = (id: string) => {
    if (!canCreate) return;
    setCart((p) => p.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number, maxStock?: number) => {
    if (!canCreate) return;
    const product = products.find((p) => p.id === id);
    const item = cart.find((i) => i.id === id);
    if (!item) return;

    const next = item.quantity + delta;
    if (delta > 0) {
      if (stockEnabled && product && product.stock <= 0) {
        warnOutOfStock(product);
        return;
      }
      if (stockEnabled && maxStock != null && maxStock > 0 && next > maxStock) {
        if (product) warnInsufficientStock(product, maxStock);
        return;
      }
    }

    setCart((p) =>
      p
        .map((i) => (i.id === id ? { ...i, quantity: next } : i))
        .filter((i) => i.quantity > 0),
    );
  };

  const getCartQuantity = (productId: string) =>
    cart.find((i) => i.id === productId)?.quantity ?? 0;

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping =
    cart.length > 0 ? Math.max(0, parseFloat(shippingInput) || 0) : 0;
  const serviceFee =
    cart.length > 0 && posServiceFeeEnabled
      ? Math.max(0, parseFloat(serviceFeeInput) || 0)
      : 0;
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percent"
      ? subtotal * (appliedDiscount.value / 100)
      : Math.min(appliedDiscount.value, subtotal)
    : 0;
  const total = subtotal + shipping + serviceFee - discountAmount;

  const handleApplyDiscount = () => {
    const val = parseFloat(discountValue);
    if (!isNaN(val) && val > 0) setAppliedDiscount({ type: discountType, value: val });
    setDiscountModalOpen(false);
    setDiscountValue("");
    setTouchKb(null);
  };

  const touchKbValue =
    touchKb?.field === "search"
      ? searchQuery
      : touchKb?.field === "shipping"
        ? shippingInput
        : touchKb?.field === "serviceFee"
          ? serviceFeeInput
          : touchKb?.field === "mileage"
            ? mileageInput
            : touchKb?.field === "discount"
              ? discountValue
              : "";

  const handleTouchKbChange = (next: string) => {
    if (!touchKb) return;
    switch (touchKb.field) {
      case "search":
        setSearchQuery(next);
        break;
      case "shipping":
        setShippingInput(sanitizeNumericTyping(next, { allowDecimal: true }));
        break;
      case "serviceFee":
        setServiceFeeInput(sanitizeNumericTyping(next, { allowDecimal: true }));
        break;
      case "mileage":
        setMileageInput(sanitizeNumericTyping(next, { allowDecimal: false }));
        break;
      case "discount":
        setDiscountValue(
          sanitizeNumericTyping(next, { allowDecimal: discountType !== "percent" }),
        );
        break;
    }
  };

  const resetCartAfterSave = () => {
    setCart([]);
    setShippingInput("");
    setServiceFeeInput("");
    setSelectedCustomerId("");
    setSelectedVehicleId("");
    setMileageInput("");
    setSelectedBillerId(defaultBillerId || "");
    setSelectedTableId("");
    setSelectedPaymentMethod(null);
    setPaymentStatusChoice("paid");
    setAppliedDiscount(null);
    void loadProducts();
  };

  const handleSaveDraft = async () => {
    if (!canCreate || isDemo || !isAuthenticated) return;
    if (cart.length === 0) {
      notifyWarning(tr("Səbəti doldurun", "Please add items to cart"));
      return;
    }
    if (isGlobalMode || !branchId) {
      notifyWarning(tr("POS üçün filial seçin", "Select a branch before using POS"));
      return;
    }

    setSavingDraft(true);
    try {
      const detail = await createPosOrder({
        status: "HELD",
        customerId: selectedCustomerId || null,
        billerId: selectedBillerId || null,
        ...(selectedPaymentMethod ? { paymentMethod: mapPaymentMethodToApi(selectedPaymentMethod) } : {}),
        shipping,
        ...(serviceFee > 0 ? { serviceFee } : {}),
        discount: discountAmount > 0 ? discountAmount : undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        initialPaymentAmount: 0,
        ...(autoEnabled && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
        ...(autoEnabled && selectedVehicleId && mileageInput.trim()
          ? { mileageAtService: Number(mileageInput) }
          : {}),
        ...(diningEnabled && selectedTableId ? { tableId: selectedTableId } : {}),
      });
      notifySuccess(
        tr(
          `Qaralama saxlanıldı (${detail.reference})`,
          `Draft saved (${detail.reference})`,
        ),
      );
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSavingDraft(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!canCreate || isDemo || !isAuthenticated) return;
    if (cart.length === 0) { alert(tr("Səbəti doldurun", "Please add items to cart")); return; }
    if (!selectedPaymentMethod) { alert(tr("Ödəniş üsulunu seçin", "Please select a payment method")); return; }
    if (!selectedBillerId) { alert(tr("Kassir seçin", "Please select an employee / biller")); return; }

    const stockIssue = stockEnabled && cart.find((item) => {
      const product = products.find((p) => p.id === item.id);
      return !product || product.stock <= 0 || item.quantity > product.stock;
    });
    if (stockIssue) {
      const product = products.find((p) => p.id === stockIssue.id);
      if (product && product.stock <= 0) {
        warnOutOfStock(product);
      } else if (product) {
        warnInsufficientStock(product, product.stock);
      } else {
        notifyWarning(
          tr(
            "Səbətdə stokda olmayan məhsullar var",
            "Some items in the cart are out of stock or exceed available quantity",
          ),
        );
      }
      return;
    }

    const pmLabel: Record<PaymentMethod, string> = { cash: tr("Nağd", "Cash"), card: tr("Kart", "Card") };

    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setPlacingOrder(true);
    try {
      const detail = await posCheckout({
        status: "COMPLETED",
        customerId: selectedCustomerId || null,
        ...(autoEnabled && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
        ...(autoEnabled && selectedVehicleId && mileageInput.trim()
          ? { mileageAtService: Number(mileageInput) }
          : {}),
        billerId: selectedBillerId || null,
        paymentMethod: mapPaymentMethodToApi(selectedPaymentMethod),
        shipping,
        ...(serviceFee > 0 ? { serviceFee } : {}),
        discount: discountAmount > 0 ? discountAmount : undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        // Paid: omit amount so backend collects exact grandTotal.
        // Pending: explicit 0 so collectFullPaymentIfMethodSet does not auto-charge.
        ...(paymentStatusChoice === "paid" ? {} : { initialPaymentAmount: 0 }),
        ...(isGlobalMode ? { storeId: branchId ?? null } : {}),
        ...(diningEnabled && selectedTableId ? { tableId: selectedTableId } : {}),
      });

      const orderDate = new Date(detail.date);
      const dateStr = Number.isNaN(orderDate.getTime())
        ? detail.date
        : formatDateTime(orderDate, language);

      const apiSubtotal = detail.items.reduce(
        (sum, item) => sum + parsePrice(item.price) * item.quantity,
        0,
      );
      const apiShipping = parsePrice(detail.shipping);
      const apiServiceFee = parsePrice(detail.serviceFee);
      const apiDiscount = parsePrice(detail.discount);
      const apiTotal = parsePrice(detail.grandTotal);
      const apiPaid = parsePrice(detail.paid);
      const serverPaymentStatusLabel =
        detail.paymentStatus.toLowerCase() === "paid" || (apiTotal > 0 && apiPaid >= apiTotal)
          ? tr("Ödənilib", "Paid")
          : paymentStatusChoice === "pending" || detail.paymentStatus.toLowerCase() === "unpaid"
            ? tr("Gözləyir", "Pending")
            : detail.paymentStatus;

      setReceipt({
        orderNo: detail.reference,
        date: dateStr,
        customer: detail.customerName ?? receiptCustomer,
        customerPhone: receiptPhone,
        vehicle: detail.vehicleLabel ?? undefined,
        mileage: detail.mileageAtService ?? undefined,
        employee: detail.billerName ?? receiptBiller,
        items: detail.items.map((item) => ({
          name: item.productName,
          qty: item.quantity,
          price: parsePrice(item.price),
        })),
        subtotal: apiSubtotal,
        shipping: apiShipping,
        serviceFee: apiServiceFee,
        discount: apiDiscount,
        discountLabel: appliedDiscount
          ? appliedDiscount.type === "percent"
            ? tr(`Endirim (${appliedDiscount.value}%)`, `Discount (${appliedDiscount.value}%)`)
            : tr("Endirim", "Discount")
          : tr("Endirim", "Discount"),
        total: apiTotal,
        paymentMethod: pmLabel[selectedPaymentMethod],
        paymentStatusLabel: serverPaymentStatusLabel,
        autoPrintReceipt: true,
        allowKitchenReprint: diningEnabled,
        ...(diningEnabled && selectedTableId
          ? {
              tableLabel:
                diningTables.find((t) => t.id === selectedTableId)?.name ??
                diningTables.find((t) => t.id === selectedTableId)?.number?.toString(),
            }
          : {}),
      });

      if (diningEnabled && selectedTableId) {
        notifySuccess(
          tr(
            "Sifariş tamamlandı — mətbəx KOT ekranında",
            "Order completed — on the kitchen KOT screen",
          ),
        );
      }

      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setPlacingOrder(false);
    }
  };

  const buildReceiptFromDetail = (
    detail: Awaited<ReturnType<typeof posCheckout>>,
    pmLabel: Record<PaymentMethod, string>,
    receiptCustomer: string,
    receiptPhone: string,
    receiptBiller: string,
    opts?: { diningFlow?: boolean; tableLabel?: string },
  ) => {
    const orderDate = new Date(detail.date);
    const dateStr = Number.isNaN(orderDate.getTime())
      ? detail.date
      : formatDateTime(orderDate, language);

    const apiSubtotal = detail.items.reduce(
      (sum, item) => sum + parsePrice(item.price) * item.quantity,
      0,
    );
    const apiShipping = parsePrice(detail.shipping);
    const apiServiceFee = parsePrice(detail.serviceFee);
    const apiDiscount = parsePrice(detail.discount);
    const apiTotal = parsePrice(detail.grandTotal);
    const apiPaid = parsePrice(detail.paid);
    const serverPaymentStatusLabel =
      detail.paymentStatus.toLowerCase() === "paid" || (apiTotal > 0 && apiPaid >= apiTotal)
        ? tr("Ödənilib", "Paid")
        : paymentStatusChoice === "pending" || detail.paymentStatus.toLowerCase() === "unpaid"
          ? tr("Gözləyir", "Pending")
          : detail.paymentStatus;

    return {
      orderNo: detail.reference,
      date: dateStr,
      customer: detail.customerName ?? receiptCustomer,
      customerPhone: receiptPhone,
      vehicle: detail.vehicleLabel ?? undefined,
      mileage: detail.mileageAtService ?? undefined,
      employee: detail.billerName ?? receiptBiller,
      items: detail.items.map((item) => ({
        name: item.productName,
        qty: item.quantity,
        price: parsePrice(item.price),
      })),
      subtotal: apiSubtotal,
      shipping: apiShipping,
      serviceFee: apiServiceFee,
      discount: apiDiscount,
      discountLabel: appliedDiscount
        ? appliedDiscount.type === "percent"
          ? tr(`Endirim (${appliedDiscount.value}%)`, `Discount (${appliedDiscount.value}%)`)
          : tr("Endirim", "Discount")
        : tr("Endirim", "Discount"),
      total: apiTotal,
      paymentMethod: selectedPaymentMethod ? pmLabel[selectedPaymentMethod] : "—",
      paymentStatusLabel: serverPaymentStatusLabel,
      autoPrintReceipt: true,
      allowKitchenReprint: !!opts?.diningFlow || diningEnabled,
      ...(opts?.diningFlow || opts?.tableLabel
        ? { tableLabel: opts.tableLabel }
        : {}),
    };
  };

  const handleSendToKot = async () => {
    if (!canCreate || isDemo || !isAuthenticated || !diningEnabled) return;
    if (cart.length === 0) {
      alert(tr("Səbəti doldurun", "Please add items to cart"));
      return;
    }
    if (!selectedPaymentMethod) {
      alert(tr("Ödəniş üsulunu seçin", "Please select a payment method"));
      return;
    }
    if (!selectedBillerId) {
      alert(tr("Kassir seçin", "Please select an employee / biller"));
      return;
    }
    if (isGlobalMode || !branchId) {
      notifyWarning(tr("POS üçün filial seçin", "Select a branch before using POS"));
      return;
    }

    const stockIssue = stockEnabled && cart.find((item) => {
      const product = products.find((p) => p.id === item.id);
      return !product || product.stock <= 0 || item.quantity > product.stock;
    });
    if (stockIssue) {
      const product = products.find((p) => p.id === stockIssue.id);
      if (product && product.stock <= 0) warnOutOfStock(product);
      else if (product) warnInsufficientStock(product, product.stock);
      else {
        notifyWarning(
          tr(
            "Səbətdə stokda olmayan məhsullar var",
            "Some items in the cart are out of stock or exceed available quantity",
          ),
        );
      }
      return;
    }

    const pmLabel: Record<PaymentMethod, string> = {
      cash: tr("Nağd", "Cash"),
      card: tr("Kart", "Card"),
    };
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setSendingToKot(true);
    try {
      const detail = await sendPosOrderToKot({
        status: "COMPLETED",
        customerId: selectedCustomerId || null,
        ...(autoEnabled && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
        ...(autoEnabled && selectedVehicleId && mileageInput.trim()
          ? { mileageAtService: Number(mileageInput) }
          : {}),
        billerId: selectedBillerId || null,
        paymentMethod: mapPaymentMethodToApi(selectedPaymentMethod),
        shipping,
        ...(serviceFee > 0 ? { serviceFee } : {}),
        discount: discountAmount > 0 ? discountAmount : undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        ...(paymentStatusChoice === "paid" ? {} : { initialPaymentAmount: 0 }),
        ...(selectedTableId ? { tableId: selectedTableId } : {}),
      });

      setReceipt(
        buildReceiptFromDetail(detail, pmLabel, receiptCustomer, receiptPhone, receiptBiller, {
          diningFlow: true,
          tableLabel: selectedTableId
            ? diningTables.find((t) => t.id === selectedTableId)?.name ??
              diningTables.find((t) => t.id === selectedTableId)?.number?.toString()
            : tr("Gələn müştəri", "Walk-in"),
        }),
      );
      notifySuccess(
        selectedTableId
          ? tr(
              "KOT-a göndərildi — mətbəx ekranında görünür",
              "Sent to KOT — visible on the kitchen screen",
            )
          : tr(
              "KOT-a göndərildi (gələn müştəri) — mətbəx ekranında görünür",
              "Sent to KOT (walk-in) — visible on the kitchen screen",
            ),
      );
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSendingToKot(false);
    }
  };

  const handleSendToProduction = async () => {
    if (!canCreate || isDemo || !isAuthenticated || !posSendToProductionEnabled) return;
    if (cart.length === 0) {
      alert(tr("Səbəti doldurun", "Please add items to cart"));
      return;
    }
    if (!selectedPaymentMethod) {
      alert(tr("Ödəniş üsulunu seçin", "Please select a payment method"));
      return;
    }
    if (!selectedBillerId) {
      alert(tr("Kassir seçin", "Please select an employee / biller"));
      return;
    }

    const stockIssue = stockEnabled && cart.find((item) => {
      const product = products.find((p) => p.id === item.id);
      return !product || product.stock <= 0 || item.quantity > product.stock;
    });
    if (stockIssue) {
      const product = products.find((p) => p.id === stockIssue.id);
      if (product && product.stock <= 0) warnOutOfStock(product);
      else if (product) warnInsufficientStock(product, product.stock);
      else {
        notifyWarning(
          tr(
            "Səbətdə stokda olmayan məhsullar var",
            "Some items in the cart are out of stock or exceed available quantity",
          ),
        );
      }
      return;
    }

    const pmLabel: Record<PaymentMethod, string> = {
      cash: tr("Nağd", "Cash"),
      card: tr("Kart", "Card"),
    };
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setSendingToProduction(true);
    try {
      const detail = await sendPosOrderToProduction({
        status: "COMPLETED",
        customerId: selectedCustomerId || null,
        ...(autoEnabled && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
        ...(autoEnabled && selectedVehicleId && mileageInput.trim()
          ? { mileageAtService: Number(mileageInput) }
          : {}),
        billerId: selectedBillerId || null,
        paymentMethod: mapPaymentMethodToApi(selectedPaymentMethod),
        shipping,
        ...(serviceFee > 0 ? { serviceFee } : {}),
        discount: discountAmount > 0 ? discountAmount : undefined,
        items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
        ...(paymentStatusChoice === "paid" ? {} : { initialPaymentAmount: 0 }),
        ...(isGlobalMode ? { storeId: branchId ?? null } : {}),
        ...(diningEnabled && selectedTableId ? { tableId: selectedTableId } : {}),
      });

      setReceipt(
        buildReceiptFromDetail(detail, pmLabel, receiptCustomer, receiptPhone, receiptBiller),
      );
      notifySuccess(tr("İstehsala göndərildi", "Sent to production"));
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSendingToProduction(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)) &&
      (selectedCategory === "all" || p.category === selectedCategory)
    );
  });

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Back to Dashboard Button - Small and secluded */}
      <button
        onClick={() => navigate("/dashboard")}
        className="fixed top-2 left-2 z-50 p-2 rounded-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-gray-900 transition-all opacity-50 hover:opacity-100"
        title={tr("Əsas Səhifə", "Back to Dashboard")}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setPrinterSettingsOpen(true)}
        className="fixed top-2 left-12 z-50 p-2 rounded-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#14b8a6] hover:bg-white dark:hover:bg-gray-900 transition-all opacity-50 hover:opacity-100"
        title={tr("POS Printerlər", "POS Printers")}
      >
        <Printer className="w-3.5 h-3.5" />
      </button>

      <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* ── Left: Products ── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[40vh] lg:min-h-0 overflow-hidden">
            <div className="shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    inputMode="none"
                    placeholder={tr("Məhsul/xidmət axtar və ya skan et...", "Search or scan product...")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchBarcodeKeyDown}
                    onFocus={() => openTouchKb("full", "search")}
                    autoComplete="off"
                    className="w-full pl-9 pr-10 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-[#14b8a6]"
                    title={tr("Klaviatura", "Keyboard")}
                    onClick={() => openTouchKb("full", "search", true)}
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-[#14b8a6] text-white"
                        : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
              {productsLoading ? (
                <div className="flex items-center justify-center h-32 text-xs text-gray-400">
                  {tr("Yüklənir...", "Loading...")}
                </div>
              ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pb-4">
                {filteredProducts.map((product) => {
                  const qtyInCart = getCartQuantity(product.id);
                  const outOfStock = stockEnabled && product.stock <= 0;
                  const atStockLimit =
                    stockEnabled && product.stock > 0 && qtyInCart >= product.stock;

                  return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={canCreate ? 0 : -1}
                    onClick={() => canCreate && addToCart(product)}
                    onKeyDown={(e) => {
                      if (canCreate && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        addToCart(product);
                      }
                    }}
                    className={`relative bg-white dark:bg-gray-900 border rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all active:scale-95 text-left group touch-manipulation cursor-pointer ${
                      outOfStock
                        ? "border-red-300 dark:border-red-900/60 opacity-80"
                        : "border-gray-200 dark:border-gray-800 hover:border-[#14b8a6] dark:hover:border-[#0f766e]"
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
                  >
                    {stockEnabled && outOfStock && (
                      <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                        {tr("Stokda yoxdur", "Out of stock")}
                      </span>
                    )}
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center text-4xl mb-2 border border-gray-300 dark:border-gray-700 group-hover:border-[#14b8a6] transition-colors overflow-hidden">
                      <ProductThumb image={product.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{product.code}</div>
                    <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[32px]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#14b8a6] dark:text-[#14b8a6]">
                        {formatCurrency(product.price)}
                      </span>
                      {stockEnabled && <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        outOfStock
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                          : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {product.stock < 99 ? `${product.stock}` : "∞"}
                      </span>}
                    </div>
                    {canCreate && qtyInCart > 0 && (
                      <div
                        className="mt-2 flex items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1, product.stock)}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
                            aria-label={tr("Azalt", "Decrease quantity")}
                          >
                            <Minus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                          </button>
                          <span className="text-xs font-semibold text-gray-900 dark:text-white px-2 min-w-[1.5rem] text-center">
                            {qtyInCart}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, 1, product.stock)}
                            disabled={atStockLimit}
                            className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label={tr("Artır", "Increase quantity")}
                          >
                            <Plus className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>

          {/* ── Right: Order panel ── */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[50vh] lg:min-h-0 overflow-hidden">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 flex flex-col h-full min-h-0">

              {/* Order Header */}
              <div className="shrink-0 flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#14b8a6] flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Cari Sifariş", "Current Order")}</h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">{cart.length} {tr("məhsul", "items")}</p>
                  </div>
                </div>
                {cart.length > 0 && canCreate && (
                  <button
                    onClick={() => {
                      setCart([]);
                      setShippingInput("");
                    }}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Scrollable: customer fields, cart, checkout */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5 pb-2">
                <div className="space-y-2 mb-3">
                <SelectDropdown
                  value={selectedCustomerId}
                  onChange={handleCustomerChange}
                  options={customerOptions}
                  placeholder={tr("Müştəri seçin...", "Select customer...")}
                  icon={User}
                />

                {autoEnabled && selectedCustomerId && (
                  <div className="grid grid-cols-2 gap-2">
                    <SelectDropdown
                      value={selectedVehicleId}
                      onChange={(id) => {
                        setSelectedVehicleId(id);
                        if (!id) setMileageInput("");
                      }}
                      options={customerVehicles.map((vehicle) => ({
                        id: vehicle.id,
                        label: [vehicle.make, vehicle.model].filter(Boolean).join(" ") || tr("Avtomobil", "Vehicle"),
                        sub: vehicle.plate || undefined,
                      }))}
                      placeholder={tr("Avtomobil (istəyə bağlı)", "Vehicle (optional)")}
                      icon={Car}
                    />
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="none"
                        value={mileageInput}
                        onChange={(e) =>
                          setMileageInput(
                            sanitizeNumericTyping(e.target.value, { allowDecimal: false }),
                          )
                        }
                        onFocus={() => openTouchKb("numpad", "mileage")}
                        disabled={!selectedVehicleId}
                        placeholder={tr("KM (istəyə bağlı)", "KM (optional)")}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-xs text-gray-900 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-[#14b8a6] disabled:opacity-40"
                        title={tr("Klaviatura", "Keyboard")}
                        disabled={!selectedVehicleId}
                        onClick={() => openTouchKb("numpad", "mileage", true)}
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <SelectDropdown
                  value={selectedBillerId}
                  onChange={setSelectedBillerId}
                  options={
                    isEmployee
                      ? billerOptions.filter((biller) => biller.id === currentUserBillerId)
                      : billerOptions
                  }
                  placeholder={tr("İşçi seçin...", "Select employee...")}
                  icon={UserCheck}
                  disabled={isEmployee}
                />

                {diningEnabled && (
                  <SelectDropdown
                    value={selectedTableId}
                    onChange={setSelectedTableId}
                    options={tableOptions}
                    placeholder={tr("Masa (istəyə bağlı)", "Table (optional)")}
                    icon={Armchair}
                  />
                )}
                </div>

                <div className="space-y-2 mb-3">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-24 text-center">
                    <ShoppingCart className="w-10 h-10 text-gray-300 dark:text-gray-700 mb-2" />
                    <p className="text-xs text-gray-400">{tr("Səbət boşdur", "Cart is empty")}</p>
                  </div>
                ) : (
                  cart.map((item) => {
                    const product = products.find((p) => p.id === item.id);
                    const itemOutOfStock = stockEnabled && product != null && product.stock <= 0;
                    const itemExceedsStock =
                      stockEnabled && product != null && product.stock > 0 && item.quantity > product.stock;

                    return (
                    <div key={item.id} className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border ${
                      itemOutOfStock || itemExceedsStock
                        ? "border-red-300 dark:border-red-900/60"
                        : "border-gray-200 dark:border-gray-700"
                    }`}>
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center text-xl border border-gray-300 dark:border-gray-600 flex-shrink-0 overflow-hidden">
                          <ProductThumb image={item.image} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-0.5 truncate">{item.name}</h3>
                          {(itemOutOfStock || itemExceedsStock) && (
                            <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mb-1">
                              {itemOutOfStock
                                ? tr("Stokda yoxdur", "Out of stock")
                                : tr(
                                    `Yalnız ${product!.stock} ədəd mövcuddur`,
                                    `Only ${product!.stock} available`,
                                  )}
                            </p>
                          )}
                          <p className="text-xs font-semibold text-[#14b8a6] dark:text-[#14b8a6] mb-1.5">{formatCurrency(item.price)}</p>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  const product = products.find((p) => p.id === item.id);
                                  updateQuantity(item.id, -1, product?.stock);
                                }}
                                className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg transition-colors"
                                aria-label={tr("Azalt", "Decrease quantity")}
                              >
                                <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="text-xs font-medium text-gray-900 dark:text-white px-2 min-w-[1.25rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const product = products.find((p) => p.id === item.id);
                                  updateQuantity(item.id, 1, product?.stock);
                                }}
                                disabled={
                                  (() => {
                                    const product = products.find((p) => p.id === item.id);
                                    return (
                                      product != null &&
                                      product.stock > 0 &&
                                      item.quantity >= product.stock
                                    );
                                  })()
                                }
                                className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={tr("Artır", "Increase quantity")}
                              >
                                <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
                </div>

              {/* Order Summary */}
              {cart.length > 0 && (
                <div>
                  <div className="space-y-1.5 mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">{tr("Ara cəm", "Subtotal")}</span>
                      <span className="text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="text-gray-500 dark:text-gray-400 shrink-0">
                        {tr("Çatdırılma", "Shipping")}
                      </span>
                      <div className="relative w-28">
                        <input
                          type="text"
                          inputMode="none"
                          value={shippingInput}
                          onChange={(e) =>
                            setShippingInput(
                              sanitizeNumericTyping(e.target.value, { allowDecimal: true }),
                            )
                          }
                          onFocus={() => openTouchKb("numpad", "shipping")}
                          className="w-full pr-7 pl-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                          ₼
                        </span>
                      </div>
                    </div>
                    {posServiceFeeEnabled && (
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-gray-500 dark:text-gray-400 shrink-0">
                          {tr("Xidmət haqqı", "Service fee")}
                        </span>
                        <div className="relative w-28">
                          <input
                            type="text"
                            inputMode="none"
                            value={serviceFeeInput}
                            onChange={(e) =>
                              setServiceFeeInput(
                                sanitizeNumericTyping(e.target.value, { allowDecimal: true }),
                              )
                            }
                            onFocus={() => openTouchKb("numpad", "serviceFee")}
                            className="w-full pr-7 pl-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
                            ₼
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        {appliedDiscount ? (
                          <>
                            <span className="text-green-600 dark:text-green-400">
                              {tr("Endirim", "Discount")} ({appliedDiscount.type === "percent" ? `${appliedDiscount.value}%` : formatCurrency(appliedDiscount.value)})
                            </span>
                            <button onClick={() => setAppliedDiscount(null)} className="text-red-400 hover:text-red-600 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setDiscountModalOpen(true)}
                            className="flex items-center gap-1 text-[#14b8a6] dark:text-[#14b8a6] hover:underline font-medium"
                          >
                            <Tag className="w-3 h-3" />
                            {tr("Endirim əlavə et", "Add Discount")}
                          </button>
                        )}
                      </div>
                      {appliedDiscount && (
                        <span className="text-green-600 dark:text-green-400 font-medium">-{formatCurrency(discountAmount)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Cəmi", "Total")}</span>
                    <span className="text-lg font-bold text-[#14b8a6] dark:text-[#14b8a6]">{formatCurrency(total)}</span>
                  </div>

                  {/* Payment Methods */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">{tr("Ödəniş Üsulu", "Payment Method")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setSelectedPaymentMethod(m.id)}
                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                              selectedPaymentMethod === m.id
                                ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border-[#14b8a6] dark:border-[#14b8a6] text-[#14b8a6] dark:text-[#14b8a6]"
                                : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{m.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Status: Paid vs Pending */}
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                      {tr("Status", "Status")}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(
                        [
                          { id: "paid" as const, name: tr("Ödənilib", "Paid") },
                          { id: "pending" as const, name: tr("Gözləyir", "Pending") },
                        ] as const
                      ).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setPaymentStatusChoice(s.id)}
                          className={`flex items-center justify-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all ${
                            paymentStatusChoice === s.id
                              ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border-[#14b8a6] dark:border-[#14b8a6] text-[#14b8a6] dark:text-[#14b8a6]"
                              : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          }`}
                        >
                          <span>{s.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {canCreate && (
              <div className="mt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveDraft()}
                    disabled={cart.length === 0 || placingOrder || savingDraft || sendingToKot || sendingToProduction || isGlobalMode || !branchId}
                    className="px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingDraft
                      ? tr("Saxlanılır...", "Saving...")
                      : tr("Qaralama olaraq saxla", "Save as Draft")}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePlaceOrder()}
                    disabled={cart.length === 0 || placingOrder || savingDraft || sendingToKot || sendingToProduction || isGlobalMode || !branchId}
                    className="px-3 py-2.5 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    {placingOrder ? tr("Göndərilir...", "Processing...") : tr("Ödənişi Tamamla", "Complete & Print")}
                  </button>
                </div>
                {posSendToProductionEnabled && (
                  <button
                    type="button"
                    onClick={() => void handleSendToProduction()}
                    disabled={
                      cart.length === 0 ||
                      placingOrder ||
                      savingDraft ||
                      sendingToKot ||
                      sendingToProduction ||
                      isGlobalMode ||
                      !branchId
                    }
                    className="w-full px-3 py-2.5 text-xs font-medium text-white bg-[#0d9488] hover:bg-[#0f766e] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <Factory className="w-3.5 h-3.5" />
                    {sendingToProduction
                      ? tr("İstehsala göndərilir...", "Sending to production...")
                      : tr("İstehsala göndər", "Send to Production")}
                  </button>
                )}
                {diningEnabled && (
                  <button
                    type="button"
                    onClick={() => void handleSendToKot()}
                    disabled={
                      cart.length === 0 ||
                      placingOrder ||
                      savingDraft ||
                      sendingToKot ||
                      sendingToProduction ||
                      isGlobalMode ||
                      !branchId
                    }
                    className="w-full px-3 py-2.5 text-xs font-medium text-white bg-[#0f766e] hover:bg-[#0d9488] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    {sendingToKot
                      ? tr("KOT-a göndərilir...", "Sending to KOT...")
                      : tr("KOT-a göndər", "Send to KOT")}
                  </button>
                )}
              </div>
              )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Discount Modal */}
      {discountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 w-80">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#14b8a6] dark:text-[#14b8a6]" />
                {tr("Endirim əlavə et", "Add Discount")}
              </h3>
              <button onClick={() => setDiscountModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${discountType === "percent" ? "bg-[#14b8a6] text-white border-[#14b8a6]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50"}`}
              >
                {tr("Faiz (%)", "Percent (%)")}
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${discountType === "fixed" ? "bg-[#14b8a6] text-white border-[#14b8a6]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50"}`}
              >
                {tr("Sabit (₼)", "Fixed (₼)")}
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="text"
                inputMode="none"
                placeholder={discountType === "percent" ? "0 – 100" : "0.00"}
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(
                    sanitizeNumericTyping(e.target.value, {
                      allowDecimal: discountType !== "percent",
                    }),
                  )
                }
                onFocus={() => openTouchKb("numpad", "discount")}
                autoFocus
                className="w-full px-3 py-2 pr-16 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
              <button
                type="button"
                className="absolute right-8 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-[#14b8a6]"
                title={tr("Klaviatura", "Keyboard")}
                onClick={() => openTouchKb("numpad", "discount", true)}
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{discountType === "percent" ? "%" : "₼"}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDiscountModalOpen(false)} className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {tr("Ləğv et", "Cancel")}
              </button>
              <button onClick={handleApplyDiscount} className="flex-1 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors">
                {tr("Tətbiq et", "Apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {receipt && (
        <ThermalReceipt
          data={receipt}
          onClose={() => setReceipt(null)}
          onConfigurePrinters={() => setPrinterSettingsOpen(true)}
        />
      )}
      {printerSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Printer className="w-4 h-4 text-[#14b8a6]" />
                {tr("POS Printerlər", "POS Printers")}
              </h3>
              <button
                type="button"
                onClick={() => setPrinterSettingsOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <PosPrinterSettings embedded accessModule="Sales" />
          </div>
        </div>
      )}

      {touchKb && (
        <TouchKeyboard
          open
          mode={touchKb.mode}
          value={touchKbValue}
          onChange={handleTouchKbChange}
          onClose={() => setTouchKb(null)}
          title={
            touchKb.field === "search"
              ? tr("Axtarış", "Search")
              : touchKb.field === "shipping"
                ? tr("Çatdırılma", "Shipping")
                : touchKb.field === "serviceFee"
                  ? tr("Xidmət haqqı", "Service fee")
                  : touchKb.field === "mileage"
                    ? tr("Km göstərici", "Mileage")
                    : tr("Endirim", "Discount")
          }
        />
      )}
    </div>
  );
}
