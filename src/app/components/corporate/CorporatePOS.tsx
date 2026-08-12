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
  Building2,
  Trash2,
  ChevronDown,
  UserCheck,
  Tag,
  Check,
  Printer,
  ArrowLeft,
  Home,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { formatCurrency } from "../../utils/currency";
import { fetchProducts } from "../../api/inventory";
import { fetchCustomers, type PeopleCustomer } from "../../api/people";
import { posCheckout } from "../../api/sales";
import { fetchTenantSettings } from "../../api/tenantSettings";
import { useSalesBillers } from "../../hooks/useSalesBillers";
import { parsePrice } from "../../lib/inventoryMappers";
import { formatDateTime } from "../../lib/dateFormat";
import { notifyFromError, notifyWarning } from "../../lib/toast";
import { mapPaymentMethodToApi } from "../../lib/salesMappers";
import { APP_LOGO_LIGHT, getBrandLogoUrl } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { useIsDarkMode } from "../../hooks/useIsDarkMode";
import { BrandLogo, brandLogoReceiptHtml } from "../ui/BrandLogo";
import { useNavigate } from "react-router";

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

type PaymentMethod = "cash" | "card" | "bank";
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
}: {
  value: string;
  onChange: (val: string) => void;
  options: { id: string; label: string; sub?: string }[];
  placeholder: string;
  icon: React.ElementType;
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
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-2 pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#0026f6] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
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
              {value === opt.id && <Check className="w-3 h-3 text-[#0026f6] dark:text-[#0026f6]" />}
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
}

function latinize(str: string): string {
  return str
    .replace(/ə/g, "e").replace(/Ə/g, "E")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ş/g, "s").replace(/Ş/g, "S");
}

function ThermalReceipt({ data, onClose }: { data: ReceiptData; onClose: () => void }) {
  const isDark = useIsDarkMode();
  const { user } = useAuth();
  const companyName = user?.tenant?.name?.trim() || "Inflero";
  const previewLogoSrc = getBrandLogoUrl(user?.tenant, isDark);
  // Print on white paper — prefer light company logo, then dark company logo, then app fallback.
  const printLogoSrc =
    getCompanyLogoUrl(user?.tenant, false) ??
    getCompanyLogoUrl(user?.tenant, true) ??
    APP_LOGO_LIGHT;

  const handlePrint = () => {
    const printWin = window.open("", "_blank", "width=340,height=700");
    if (!printWin) return;
    const d = {
      ...data,
      orderNo: latinize(data.orderNo),
      customer: latinize(data.customer),
      customerPhone: data.customerPhone,
      employee: latinize(data.employee),
      paymentMethod: latinize(data.paymentMethod),
      paymentStatusLabel: latinize(data.paymentStatusLabel),
      discountLabel: latinize(data.discountLabel),
      items: data.items.map((it) => ({ ...it, name: latinize(it.name) })),
    };
    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${latinize(companyName)} - ${d.orderNo}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 11px;
            width: 80mm;
            max-width: 80mm;
            padding: 6mm 4mm;
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .big { font-size: 16px; font-weight: bold; letter-spacing: 2px; }
          .divider { border-top: 1px dashed #000; margin: 4px 0; }
          .divider-solid { border-top: 1px solid #000; margin: 4px 0; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .row-item { margin: 3px 0; }
          .row-item .name { width: 100%; }
          .row-item .nums { display: flex; justify-content: space-between; padding-left: 4px; color: #333; }
          .total-row { display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; margin-top: 4px; }
          .label { color: #555; }
          .thanks { text-align: center; margin-top: 6px; font-size: 10px; }
          .logo-area { text-align: center; margin-bottom: 4px; }
          @media print {
            body { width: 80mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        ${brandLogoReceiptHtml(printLogoSrc, latinize(companyName))}
        <div class="divider-solid"></div>

        <div class="row"><span class="label">Siferis:</span><span class="bold">${d.orderNo}</span></div>
        <div class="row"><span class="label">Tarix:</span><span>${d.date}</span></div>
        <div class="divider"></div>

        <div class="row"><span class="label">Musteri:</span><span class="bold">${d.customer}</span></div>
        <div class="row"><span class="label">Telefon:</span><span>${d.customerPhone}</span></div>
        <div class="row"><span class="label">Isci:</span><span>${d.employee}</span></div>
        <div class="divider-solid"></div>

        <div style="font-size:10px;font-weight:bold;margin-bottom:3px;">MEHSUL / XIDMET</div>
        ${d.items.map(it => `
          <div class="row-item">
            <div class="name">${it.name}</div>
            <div class="nums">
              <span>${it.qty} x ${it.price.toFixed(2)} AZN</span>
              <span class="bold">${(it.qty * it.price).toFixed(2)} AZN</span>
            </div>
          </div>
        `).join("")}
        <div class="divider"></div>

        <div class="row"><span class="label">Ara cem:</span><span>${d.subtotal.toFixed(2)} AZN</span></div>
        <div class="row"><span class="label">Catdirilma:</span><span>${d.shipping.toFixed(2)} AZN</span></div>
        ${d.serviceFee > 0 ? `<div class="row"><span class="label">Xidmet haqqi:</span><span>${d.serviceFee.toFixed(2)} AZN</span></div>` : ""}
        ${d.discount > 0 ? `<div class="row"><span class="label">${d.discountLabel}:</span><span>-${d.discount.toFixed(2)} AZN</span></div>` : ""}
        <div class="divider-solid"></div>

        <div class="total-row"><span>CEMI:</span><span>${d.total.toFixed(2)} AZN</span></div>
        <div class="row" style="margin-top:4px;"><span class="label">Odenis:</span><span class="bold">${d.paymentMethod}</span></div>
        <div class="row"><span class="label">Status:</span><span class="bold">${d.paymentStatusLabel}</span></div>
        <div class="divider-solid"></div>

        <div class="thanks">
          <div>Muracietiniz ucun teshekkur edirik!</div>
          <div style="margin-top:3px;color:#555;">app.inflero.com</div>
        </div>
      </body>
      </html>
    `;
    printWin.document.write(content);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => { printWin.print(); printWin.close(); }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#0026f6] dark:text-[#0026f6]" />
            Qəbz — {data.orderNo}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 font-mono text-[11px] leading-relaxed text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 mx-4 mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 max-h-80 overflow-y-auto">
          <BrandLogo src={previewLogoSrc} alt={companyName} size="receipt" />
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between"><span className="text-gray-400">Sifariş:</span><span className="font-bold">{data.orderNo}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Tarix:</span><span>{data.date}</span></div>
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between"><span className="text-gray-400">Müştəri:</span><span className="font-semibold">{data.customer}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Telefon:</span><span>{data.customerPhone}</span></div>
          <div className="flex justify-between"><span className="text-gray-400">İşçi:</span><span>{data.employee}</span></div>
          <hr className="border-gray-400 dark:border-gray-500 my-1" />
          <p className="text-[9px] font-bold mb-1">MƏHSUL / XİDMƏT</p>
          {data.items.map((it, i) => (
            <div key={i} className="mb-1">
              <p className="truncate">{it.name}</p>
              <div className="flex justify-between text-gray-400 pl-2">
                <span>{it.qty} x {it.price.toFixed(2)} ₼</span>
                <span className="text-gray-800 dark:text-gray-200 font-semibold">{(it.qty * it.price).toFixed(2)} ₼</span>
              </div>
            </div>
          ))}
          <hr className="border-dashed border-gray-300 dark:border-gray-600 my-1" />
          <div className="flex justify-between"><span className="text-gray-400">Ara cəm:</span><span>{data.subtotal.toFixed(2)} ₼</span></div>
          <div className="flex justify-between"><span className="text-gray-400">Çatdırılma:</span><span>{data.shipping.toFixed(2)} ₼</span></div>
          {data.serviceFee > 0 && <div className="flex justify-between"><span className="text-gray-400">Xidmət haqqı:</span><span>{data.serviceFee.toFixed(2)} ₼</span></div>}
          {data.discount > 0 && <div className="flex justify-between"><span className="text-gray-400">{data.discountLabel}:</span><span>-{data.discount.toFixed(2)} ₼</span></div>}
          <hr className="border-gray-400 dark:border-gray-500 my-1" />
          <div className="flex justify-between text-sm font-bold"><span>CƏMİ:</span><span>{data.total.toFixed(2)} ₼</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-400">Ödəniş:</span><span className="font-semibold">{data.paymentMethod}</span></div>
          <div className="flex justify-between mt-1"><span className="text-gray-400">Status:</span><span className="font-semibold">{data.paymentStatusLabel}</span></div>
          <hr className="border-gray-400 dark:border-gray-500 my-2" />
          <p className="text-center text-[9px] text-gray-400">Müraciətiniz üçün təşəkkür edirik!</p>
          <p className="text-center text-[9px] text-gray-400">app.inflero.com</p>
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Bağla
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-2 text-xs font-medium text-white bg-[#0026f6] hover:bg-[#001fc4] rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Çap Et
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main POS Component ───────────────────────────────────────────────────────
export function CorporatePOS() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isGlobalMode } = useBranch();
  const branchRevision = useBranchRevision();
  const { canCreate } = useModulePermissions("Sales");

  // Translation helper — must come before any data that uses it
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedBillerId, setSelectedBillerId] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<PaymentStatusChoice>("paid");
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);
  const [shippingInput, setShippingInput] = useState("0");
  const [serviceFeeInput, setServiceFeeInput] = useState("0");
  const [posServiceFeeEnabled, setPosServiceFeeEnabled] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const { billers, defaultBillerId } = useSalesBillers((isAuthenticated || isDemo));

  useEffect(() => {
    if (defaultBillerId && !selectedBillerId) {
      setSelectedBillerId(defaultBillerId);
    }
  }, [defaultBillerId, selectedBillerId]);

  const loadProducts = useCallback(async () => {
    if (!(isAuthenticated || isDemo)) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    try {
      const data = await fetchProducts({ pageSize: 100 });
      setProducts(
        data.items.map((item) => ({
          id: item.id,
          name: item.name,
          price: parsePrice(item.price),
          image: item.image || "📦",
          category: item.category || "",
          stock: item.quantity,
          code: item.sku,
        })),
      );
    } catch (err) {
      notifyFromError(err, tr("Məhsulları yükləmək alınmadı", "Failed to load products"));
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [isDemo, isAuthenticated, branchRevision, language]);

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
    if (!(isAuthenticated || isDemo)) {
      setPosServiceFeeEnabled(false);
      return;
    }
    let cancelled = false;
    fetchTenantSettings()
      .then((s) => {
        if (!cancelled) setPosServiceFeeEnabled(s.posServiceFeeEnabled === true);
      })
      .catch(() => {
        if (!cancelled) setPosServiceFeeEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, branchRevision]);

  // Derived selections
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const customerOptions = customers.map((c) => ({ id: c.id, label: c.name, sub: c.phone }));
  const billerOptions = billers.map((b) => ({ id: b.id, label: b.name, sub: b.code }));

  const handleCustomerChange = (id: string) => {
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
    { id: "bank", name: tr("Bank Transferi", "Bank Transfer"), icon: Building2 },
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

  const addToCart = (product: Product) => {
    if (!canCreate) return;
    const existing = cart.find((i) => i.id === product.id);
    const nextQty = existing ? existing.quantity + 1 : 1;

    if (product.stock <= 0) {
      warnOutOfStock(product);
      return;
    }
    if (nextQty > product.stock) {
      warnInsufficientStock(product, product.stock);
      return;
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
  };

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
      if (product && product.stock <= 0) {
        warnOutOfStock(product);
        return;
      }
      if (maxStock != null && maxStock > 0 && next > maxStock) {
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
  };

  const handlePlaceOrder = async () => {
    if (!canCreate || isDemo || !isAuthenticated) return;
    if (cart.length === 0) { alert(tr("Səbəti doldurun", "Please add items to cart")); return; }
    if (!selectedPaymentMethod) { alert(tr("Ödəniş üsulunu seçin", "Please select a payment method")); return; }
    if (!selectedBillerId) { alert(tr("Kassir seçin", "Please select an employee / biller")); return; }

    const stockIssue = cart.find((item) => {
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

    const pmLabel: Record<PaymentMethod, string> = { cash: tr("Nağd", "Cash"), card: tr("Kart", "Card"), bank: tr("Bank Transferi", "Bank Transfer") };

    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setPlacingOrder(true);
    try {
      const detail = await posCheckout({
        status: "COMPLETED",
        customerId: selectedCustomerId || null,
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
            ? `Endirim (${appliedDiscount.value}%)`
            : "Endirim"
          : "Endirim",
        total: apiTotal,
        paymentMethod: pmLabel[selectedPaymentMethod],
        paymentStatusLabel: serverPaymentStatusLabel,
      });

      setCart([]);
      setShippingInput("0");
      setServiceFeeInput("0");
      setSelectedCustomerId("");
      setSelectedBillerId(defaultBillerId || "");
      setSelectedPaymentMethod(null);
      setPaymentStatusChoice("paid");
      setAppliedDiscount(null);
      void loadProducts();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setPlacingOrder(false);
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

      <div className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* ── Left: Products ── */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[40vh] lg:min-h-0 overflow-hidden">
            <div className="shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder={tr("Məhsul/xidmət axtar...", "Search product or service...")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto mt-3 pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white"
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
                  const outOfStock = product.stock <= 0;
                  const atStockLimit =
                    product.stock > 0 && qtyInCart >= product.stock;

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
                        : "border-gray-200 dark:border-gray-800 hover:border-[#0026f6] dark:hover:border-[#001db8]"
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
                  >
                    {outOfStock && (
                      <span className="absolute top-2 right-2 z-10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800">
                        {tr("Stokda yoxdur", "Out of stock")}
                      </span>
                    )}
                    <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-lg flex items-center justify-center text-4xl mb-2 border border-gray-300 dark:border-gray-700 group-hover:border-[#0026f6] transition-colors overflow-hidden">
                      <ProductThumb image={product.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">{product.code}</div>
                    <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 min-h-[32px]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-[#0026f6] dark:text-[#0026f6]">
                        {formatCurrency(product.price)}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        outOfStock
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                          : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {product.stock < 99 ? `${product.stock}` : "∞"}
                      </span>
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
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0026f6] to-[#001db8] flex items-center justify-center">
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
                      setShippingInput("0");
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

                <SelectDropdown
                  value={selectedBillerId}
                  onChange={setSelectedBillerId}
                  options={billerOptions}
                  placeholder={tr("İşçi seçin...", "Select employee...")}
                  icon={UserCheck}
                />
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
                    const itemOutOfStock = product != null && product.stock <= 0;
                    const itemExceedsStock =
                      product != null && product.stock > 0 && item.quantity > product.stock;

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
                          <p className="text-xs font-semibold text-[#0026f6] dark:text-[#0026f6] mb-1.5">{formatCurrency(item.price)}</p>
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
                          type="number"
                          min="0"
                          step="0.01"
                          value={shippingInput}
                          onChange={(e) => setShippingInput(e.target.value)}
                          className="w-full pr-7 pl-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
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
                            type="number"
                            min="0"
                            step="0.01"
                            value={serviceFeeInput}
                            onChange={(e) => setServiceFeeInput(e.target.value)}
                            className="w-full pr-7 pl-2 py-1 text-xs text-right bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
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
                            className="flex items-center gap-1 text-[#0026f6] dark:text-[#0026f6] hover:underline font-medium"
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
                    <span className="text-lg font-bold text-[#0026f6] dark:text-[#0026f6]">{formatCurrency(total)}</span>
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
                                ? "bg-[#e8ebff] dark:bg-[#0026f6]/20 border-[#0026f6] dark:border-[#0026f6] text-[#0026f6] dark:text-[#0026f6]"
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
                              ? "bg-[#e8ebff] dark:bg-[#0026f6]/20 border-[#0026f6] dark:border-[#0026f6] text-[#0026f6] dark:text-[#0026f6]"
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
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => cart.length === 0 ? alert(tr("Səbəti doldurun", "Cart is empty")) : alert(tr("Sifariş saxlanıldı!", "Order held!"))}
                  disabled={cart.length === 0}
                  className="px-3 py-2.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {tr("Sifarişi Saxla", "Hold Order")}
                </button>
                <button
                  onClick={() => void handlePlaceOrder()}
                  disabled={cart.length === 0 || placingOrder}
                  className="px-3 py-2.5 text-xs font-medium text-white bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  {placingOrder ? tr("Göndərilir...", "Processing...") : tr("Ödənişi Tamamla", "Complete & Print")}
                </button>
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
                <Tag className="w-4 h-4 text-[#0026f6] dark:text-[#0026f6]" />
                {tr("Endirim əlavə et", "Add Discount")}
              </h3>
              <button onClick={() => setDiscountModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setDiscountType("percent")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${discountType === "percent" ? "bg-[#0026f6] text-white border-[#0026f6]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50"}`}
              >
                {tr("Faiz (%)", "Percent (%)")}
              </button>
              <button
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${discountType === "fixed" ? "bg-[#0026f6] text-white border-[#0026f6]" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-50"}`}
              >
                {tr("Sabit (₼)", "Fixed (₼)")}
              </button>
            </div>
            <div className="relative mb-4">
              <input
                type="number"
                min="0"
                step={discountType === "percent" ? "1" : "0.01"}
                max={discountType === "percent" ? "100" : undefined}
                placeholder={discountType === "percent" ? "0 – 100" : "0.00"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{discountType === "percent" ? "%" : "₼"}</span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDiscountModalOpen(false)} className="flex-1 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {tr("Ləğv et", "Cancel")}
              </button>
              <button onClick={handleApplyDiscount} className="flex-1 py-2 text-xs font-medium text-white bg-[#0026f6] hover:bg-[#001fc4] rounded-lg transition-colors">
                {tr("Tətbiq et", "Apply")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thermal Receipt Modal */}
      {receipt && <ThermalReceipt data={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
