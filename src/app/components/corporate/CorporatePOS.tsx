import { pickLang } from "../../i18n/pickLang";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
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
  Wine,
  Keyboard,
  Wrench,
  GripVertical,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Users,
  Bell,
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
import { fetchPosProducts, lookupProductByCode, type ProductListItem } from "../../api/inventory";
import {
  fetchCustomers,
  fetchCustomerVehicles,
  type CustomerVehicle,
  type PeopleCustomer,
} from "../../api/people";
import { createPosOrder, posCheckout, sendPosOrderToBar, sendPosOrderToKot, sendPosOrderToProduction, acceptQrPosOrder, approveQrAndSendToKot, fetchPendingQrPosOrderCount, fetchPendingQrPosOrders, fetchPosOrder, recordPosOrderPayment, releaseQrPosOrder, rejectQrPosOrder, updatePosOrder, type PendingQrPosOrderRow, type PosOrderDetail } from "../../api/sales";
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
import { printPosTicket, printPosOrderTicket } from "../../lib/posPrint";
import { loadPosPrinterSettings } from "../../lib/posPrinterSettings";
import { PosPrinterSettings } from "./PosPrinterSettings";
import { useNavigate, useSearchParams } from "react-router";
import { pickCurrentUserBillerId } from "../../lib/salesBiller";
import { ApiError } from "../../api/client";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  code: string;
  barcode: string;
  productType?: "SINGLE" | "VARIABLE" | "SERVICE";
  trackStock?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  productType?: "SINGLE" | "VARIABLE" | "SERVICE";
  trackStock?: boolean;
}

type PaymentMethod = "cash" | "card";
type PaymentStatusChoice = "paid" | "pending";
type PaymentStatusChoiceState = PaymentStatusChoice | null;

type PosCategoryChip = { id: string; name: string; pinned?: boolean };

const POS_CATEGORY_ORDER_KEY = "inflero-pos-category-order";

function loadPosCategoryOrder(storageKey: string): string[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function savePosCategoryOrder(storageKey: string, order: string[]) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

function sortCategoriesByOrder(
  cats: PosCategoryChip[],
  order: string[],
): PosCategoryChip[] {
  if (order.length === 0) return cats;
  const index = new Map(order.map((id, i) => [id, i]));
  return [...cats].sort((a, b) => {
    const ai = index.has(a.id) ? (index.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const bi = index.has(b.id) ? (index.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.name.localeCompare(b.name);
  });
}

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

const TABLE_STATUS_UI: Record<
  DiningTable["status"],
  { key: "available" | "occupied" | "reserved"; labelEn: string; labelAz: string; badge: string; ring: string }
> = {
  AVAILABLE: {
    key: "available",
    labelEn: "Available",
    labelAz: "Boş",
    badge:
      "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
    ring: "ring-green-400/60",
  },
  OCCUPIED: {
    key: "occupied",
    labelEn: "Occupied",
    labelAz: "Dolu",
    badge:
      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800",
    ring: "ring-red-400/50",
  },
  RESERVED: {
    key: "reserved",
    labelEn: "Reserved",
    labelAz: "Rezerv",
    badge:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
    ring: "ring-amber-400/50",
  },
};

function PosTablePickerPortal({
  open,
  tables,
  selectedId,
  onSelect,
  onClose,
  tr,
}: {
  open: boolean;
  tables: DiningTable[];
  selectedId: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  tr: (az: string, en: string) => string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label={tr("Bağla", "Close")}
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={tr("Masa seçin", "Select table")}
        className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {tr("Masa seçin", "Select table")}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {tr("Kart üzərinə klikləyin", "Tap a table card to select")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tables.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-12">
              {tr("Masa tapılmadı", "No tables found")}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {tables.map((table) => {
                const st = TABLE_STATUS_UI[table.status];
                const selected = selectedId === table.id;
                const name = table.name?.trim() || String(table.number);
                return (
                  <button
                    key={table.id}
                    type="button"
                    onClick={() => {
                      onSelect(table.id);
                      onClose();
                    }}
                    className={`text-left rounded-xl border p-3 transition-all ${
                      selected
                        ? `border-[#14b8a6] bg-[#14b8a6]/10 ring-2 ring-[#14b8a6]/40 dark:bg-[#14b8a6]/15`
                        : `border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:border-[#14b8a6]/50 hover:bg-white dark:hover:bg-gray-800 ${st.ring}`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex items-center gap-1.5">
                        <Armchair
                          className={`w-3.5 h-3.5 flex-shrink-0 ${
                            selected ? "text-[#14b8a6]" : "text-gray-400"
                          }`}
                        />
                        <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {name}
                        </span>
                      </div>
                      {selected && <Check className="w-3.5 h-3.5 text-[#14b8a6] flex-shrink-0" />}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${st.badge}`}
                      >
                        {tr(st.labelAz, st.labelEn)}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500 dark:text-gray-400">
                        <Users className="w-3 h-3" />
                        {table.seats}
                      </span>
                      {table.area ? (
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                          {table.area}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80">
          <button
            type="button"
            onClick={() => {
              onSelect("");
              onClose();
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            {tr("Təmizlə", "Clear")}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#14b8a6] text-white hover:bg-[#0d9488] transition-colors"
          >
            {tr("Bağla", "Done")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
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
  /** Auto-print kitchen/KOT ticket once (dining Send KOT & Print). */
  autoPrintKitchen?: boolean;
  /** Show optional kitchen paper reprint (kitchen primary path is digital KOT). */
  allowKitchenReprint?: boolean;
  tableLabel?: string;
}

function ThermalReceipt({
  data,
  onClose,
  onConfigurePrinters,
  diningEnabled = false,
}: {
  data: ReceiptData;
  onClose: () => void;
  onConfigurePrinters?: () => void;
  diningEnabled?: boolean;
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
    if (data.autoPrintKitchen) {
      autoPrintedRef.current = true;
      void handlePrint({ copy: "kitchen" });
      return;
    }
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

        {diningEnabled && onConfigurePrinters && (
          <div className="px-4 pt-3">
            <button
              type="button"
              onClick={() => onConfigurePrinters()}
              className="text-[10px] text-[#14b8a6] hover:underline text-left"
            >
              {pickLang(
                language,
                printerMap.receiptPrinter
                  ? printerMap.kotPrinter
                    ? `Printerlər: ${printerMap.receiptPrinter} / ${printerMap.kotPrinter}`
                    : `Printer: ${printerMap.receiptPrinter}`
                  : "Printerləri təyin et (QZ Tray)",
                printerMap.receiptPrinter
                  ? printerMap.kotPrinter
                    ? `Printers: ${printerMap.receiptPrinter} / ${printerMap.kotPrinter}`
                    : `Printer: ${printerMap.receiptPrinter}`
                  : "Configure printers (QZ Tray)",
              )}
            </button>
          </div>
        )}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isDemo, isAuthenticated, hasModule } = useAuth();
  const stockEnabled = hasModule("STOCK");
  const autoEnabled = hasModule("AUTO");
  const diningEnabled = hasModule("DINING");
  const { branchId, isGlobalMode } = useBranch();
  const branchRevision = useBranchRevision();
  const { canCreate, canEdit } = useModulePermissions("Sales");
  const prefersTouchKeyboard = usePrefersTouchKeyboard();
  const lastPointerType = useLastPointerType();

  // Translation helper — must come before any data that uses it
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categoryReorderMode, setCategoryReorderMode] = useState(false);
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [dragCategoryId, setDragCategoryId] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [mileageInput, setMileageInput] = useState("");
  const [customerVehicles, setCustomerVehicles] = useState<CustomerVehicle[]>([]);
  const [selectedBillerId, setSelectedBillerId] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [diningTables, setDiningTables] = useState<DiningTable[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentStatusChoice, setPaymentStatusChoice] = useState<PaymentStatusChoiceState>(null);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ type: "percent" | "fixed"; value: number } | null>(null);
  const [shippingInput, setShippingInput] = useState("");
  const [serviceFeeInput, setServiceFeeInput] = useState("");
  const [posServiceFeeEnabled, setPosServiceFeeEnabled] = useState(false);
  const [posSendToProductionEnabled, setPosSendToProductionEnabled] = useState(false);
  const [posSendToBarEnabled, setPosSendToBarEnabled] = useState(false);
  const [inventoryServicesEnabled, setInventoryServicesEnabled] = useState(false);
  const [touchKb, setTouchKb] = useState<null | {
    mode: "full" | "numpad";
    field: "search" | "shipping" | "serviceFee" | "mileage" | "discount";
  }>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [printerSettingsOpen, setPrinterSettingsOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const productsRef = useRef<Product[]>([]);
  productsRef.current = products;
  const [pendingQrCount, setPendingQrCount] = useState(0);
  const [pendingQrList, setPendingQrList] = useState<PendingQrPosOrderRow[]>([]);
  const [pendingQrPortalOpen, setPendingQrPortalOpen] = useState(false);
  const [pendingQrOrderId, setPendingQrOrderId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingOrderRef, setEditingOrderRef] = useState<string | null>(null);
  const [editingOrderWasHeld, setEditingOrderWasHeld] = useState(false);
  const [editingAlreadyOnKot, setEditingAlreadyOnKot] = useState(false);
  const [editingStockLocked, setEditingStockLocked] = useState(false);
  /** Product qty already on the order being edited — credited back for stock checks. */
  const [editingOriginalQtyByProduct, setEditingOriginalQtyByProduct] = useState<
    Record<string, number>
  >({});
  const [pendingQrBusyId, setPendingQrBusyId] = useState<string | null>(null);
  const lookupAbortRef = useRef<AbortController | null>(null);
  const lookupSeqRef = useRef(0);
  const lastLookupCodeRef = useRef<{ code: string; at: number }>({ code: "", at: 0 });
  const lookupInFlightCodeRef = useRef<string | null>(null);
  const pendingQrOrderIdRef = useRef<string | null>(null);
  const acceptOrderHandledRef = useRef<string | null>(null);
  const editOrderHandledRef = useRef<string | null>(null);
  const editingOrderIdRef = useRef<string | null>(null);
  const pendingQrPortalOpenRef = useRef(false);
  const pendingQrInFlightRef = useRef(false);

  const mapListItemToProduct = useCallback((item: ProductListItem): Product => {
    const isService = item.productType === "SERVICE" || item.trackStock === false;
    return {
      id: item.id,
      name: item.name,
      price: parsePrice(item.price),
      image: item.image || "📦",
      category: item.category || "",
      stock: isService ? Number.MAX_SAFE_INTEGER : (item.quantity ?? 0),
      code: item.sku,
      barcode: (item.itemBarcode ?? "").trim(),
      productType: item.productType,
      trackStock: !isService,
    };
  }, []);
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [checkoutAction, setCheckoutAction] = useState<
    | "draft"
    | "order"
    | "orderBill"
    | "kot"
    | "kotBill"
    | "bar"
    | "barBill"
    | "production"
    | null
  >(null);
  const checkoutBusy = checkoutAction !== null;
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
      const items = await fetchPosProducts();
      setProducts(items.map(mapListItemToProduct));
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
      setPosSendToBarEnabled(false);
      setInventoryServicesEnabled(false);
      return;
    }
    let cancelled = false;
    fetchTenantSettings()
      .then((s) => {
        if (!cancelled) {
          setPosServiceFeeEnabled(s.posServiceFeeEnabled === true);
          setPosSendToProductionEnabled(s.posSendToProductionEnabled === true);
          setPosSendToBarEnabled(s.posSendToBarEnabled === true);
          setInventoryServicesEnabled(s.inventoryServicesEnabled === true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPosServiceFeeEnabled(false);
          setPosSendToProductionEnabled(false);
          setPosSendToBarEnabled(false);
          setInventoryServicesEnabled(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, branchRevision]);

  useEffect(() => {
    pendingQrOrderIdRef.current = pendingQrOrderId;
  }, [pendingQrOrderId]);

  useEffect(() => {
    editingOrderIdRef.current = editingOrderId;
  }, [editingOrderId]);

  useEffect(() => {
    pendingQrPortalOpenRef.current = pendingQrPortalOpen;
  }, [pendingQrPortalOpen]);

  const canPollPendingQr =
    diningEnabled && isAuthenticated && !isDemo && !isGlobalMode && !!branchId;

  /** Background: count only (pulse). Portal open: list only (count derived from open claims). */
  const refreshPendingQr = useCallback(
    async (mode: "count" | "list" | "auto" = "auto") => {
      if (!canPollPendingQr) {
        setPendingQrCount(0);
        setPendingQrList([]);
        return;
      }
      if (pendingQrInFlightRef.current) return;
      pendingQrInFlightRef.current = true;
      const wantList =
        mode === "list" || (mode === "auto" && pendingQrPortalOpenRef.current);
      try {
        if (wantList) {
          const list = await fetchPendingQrPosOrders();
          setPendingQrList(list);
          setPendingQrCount(list.filter((r) => r.claimStatus === "open").length);
        } else {
          const countRes = await fetchPendingQrPosOrderCount();
          setPendingQrCount(countRes.count);
        }
      } catch {
        // Poll quietly — do not spam toasts
      } finally {
        pendingQrInFlightRef.current = false;
      }
    },
    [canPollPendingQr],
  );

  useEffect(() => {
    if (!canPollPendingQr) {
      setPendingQrCount(0);
      setPendingQrList([]);
      return;
    }

    const tick = () => {
      if (document.hidden) return;
      void refreshPendingQr(pendingQrPortalOpenRef.current ? "list" : "count");
    };

    tick();
    // Count for pulse is enough when closed; list only while modal is open.
    const ms = pendingQrPortalOpen ? 5_000 : 12_000;
    const t = window.setInterval(tick, ms);

    const onVisibility = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(t);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [canPollPendingQr, pendingQrPortalOpen, branchRevision, refreshPendingQr]);

  const hydrateCartFromQrOrder = useCallback(
    (detail: PosOrderDetail) => {
      setEditingOrderId(null);
      setEditingOrderRef(null);
      setEditingOrderWasHeld(false);
      setEditingAlreadyOnKot(false);
      setEditingStockLocked(false);
      setEditingOriginalQtyByProduct({});
      setPendingQrOrderId(detail.id);
      setCart(
        detail.items.map((i) => ({
          id: i.productId,
          name: i.productName,
          price: Number(i.price),
          quantity: i.quantity,
          image: "📦",
          productType: (i as { productType?: CartItem["productType"] }).productType,
          trackStock: (i as { trackStock?: boolean }).trackStock !== false,
        })),
      );
      setSelectedTableId(detail.table?.id ?? "");
      setSelectedCustomerId(detail.customerId ?? "");
      if (detail.billerId) setSelectedBillerId(detail.billerId);
      setSelectedPaymentMethod(
        detail.paymentMethod === "CARD" ? "card" : detail.paymentMethod === "CASH" ? "cash" : null,
      );
      setPaymentStatusChoice(null);
      setShippingInput(detail.shipping ?? "");
      setServiceFeeInput(detail.serviceFee ?? "");
      if (detail.discount && Number(detail.discount) > 0) {
        setAppliedDiscount({ type: "fixed", value: Number(detail.discount) });
      } else {
        setAppliedDiscount(null);
      }
      setPendingQrPortalOpen(false);
    },
    [],
  );

  const hydrateCartFromExistingOrder = useCallback((detail: PosOrderDetail) => {
    setPendingQrOrderId(null);
    setEditingOrderId(detail.id);
    setEditingOrderRef(detail.reference);
    const statusKey = (detail.status || "").toLowerCase();
    setEditingOrderWasHeld(statusKey === "held" || statusKey === "draft");
    setEditingAlreadyOnKot(Boolean(detail.kotStatus));
    const payKey = (detail.paymentStatus || "").toLowerCase().replace(/\s+/g, "_");
    const hasReturns = detail.items.some((i) => (i.returnedQty ?? 0) > 0);
    const fullyRefunded = payKey === "refunded";
    // Lock line edits only when returns/refunds exist (stock reverse+reapply would double-restock).
    setEditingStockLocked(hasReturns || fullyRefunded);
    const originalQty: Record<string, number> = {};
    for (const i of detail.items) {
      originalQty[i.productId] = (originalQty[i.productId] ?? 0) + i.quantity;
    }
    setEditingOriginalQtyByProduct(originalQty);
    setCart(
      detail.items.map((i) => ({
        id: i.productId,
        name: i.productName,
        price: Number(i.price),
        quantity: i.quantity,
        image: "📦",
        productType: (i as { productType?: CartItem["productType"] }).productType,
        trackStock: (i as { trackStock?: boolean }).trackStock !== false,
      })),
    );
    setSelectedTableId(detail.table?.id ?? "");
    setSelectedCustomerId(detail.customerId ?? "");
    if (detail.billerId) setSelectedBillerId(detail.billerId);
    setSelectedPaymentMethod(
      detail.paymentMethod === "CARD" ? "card" : detail.paymentMethod === "CASH" ? "cash" : null,
    );
    setPaymentStatusChoice(payKey === "paid" ? "paid" : "pending");
    setShippingInput(detail.shipping ?? "");
    setServiceFeeInput(detail.serviceFee ?? "");
    if (detail.discount && Number(detail.discount) > 0) {
      setAppliedDiscount({ type: "fixed", value: Number(detail.discount) });
    } else {
      setAppliedDiscount(null);
    }
    if (detail.vehicleId) setSelectedVehicleId(detail.vehicleId);
    if (detail.mileageAtService != null) setMileageInput(String(detail.mileageAtService));
  }, []);

  const handleLoadOrderForEdit = useCallback(
    async (orderId: string) => {
      if ((!canCreate && !canEdit) || isDemo || !isAuthenticated) return;
      try {
        const detail = await fetchPosOrder(orderId);
        const statusKey = (detail.status || "").toLowerCase();
        if (statusKey === "cancelled") {
          notifyWarning(tr("Ləğv edilmiş sifariş redaktə edilə bilməz", "Cancelled orders cannot be edited"));
          return;
        }
        const refunded = parseFloat(detail.refunded ?? "0") || 0;
        const grand = parseFloat(detail.grandTotal) || 0;
        if (refunded > 0 && grand > 0 && refunded >= grand - 0.001) {
          notifyWarning(
            tr("Tam qaytarılmış sifariş redaktə edilə bilməz", "Fully refunded orders cannot be edited"),
          );
          return;
        }
        if (detail.source === "QR_MENU" && statusKey === "pending") {
          notifyWarning(
            tr(
              "QR sifariş üçün qəbul axınından istifadə edin",
              "Use Accept for pending QR menu orders",
            ),
          );
          return;
        }
        hydrateCartFromExistingOrder(detail);
        const hasReturns = detail.items.some((i) => (i.returnedQty ?? 0) > 0);
        const payKey = (detail.paymentStatus || "").toLowerCase().replace(/\s+/g, "_");
        if (hasReturns || payKey === "refunded") {
          notifyWarning(
            tr(
              "Bu sifarişdə qaytarma var — məhsul sətirləri kilidlidir; digər sahələr yenilənə bilər",
              "This order has returns — line items are locked; other fields can still be updated",
            ),
          );
        } else {
          notifySuccess(
            tr(
              `Sifariş redaktə üçün açıldı (${detail.reference})`,
              `Order opened for edit (${detail.reference})`,
            ),
          );
        }
      } catch (err) {
        notifyFromError(err, tr("Sifariş yüklənə bilmədi", "Failed to load order"));
      }
    },
    [canCreate, canEdit, isDemo, isAuthenticated, hydrateCartFromExistingOrder, tr],
  );

  const handleAcceptQrOrder = useCallback(
    async (orderId: string) => {
      if (!canCreate || isDemo || !isAuthenticated) return;
      setPendingQrBusyId(orderId);
      try {
        const detail = await acceptQrPosOrder(orderId);
        hydrateCartFromQrOrder(detail);
        notifySuccess(tr("QR sifariş qəbul edildi", "QR order accepted"));
        void refreshPendingQr("count");
      } catch (err) {
        if (err instanceof ApiError && err.code === "ALREADY_CLAIMED") {
          const raw = err.raw && typeof err.raw === "object" ? (err.raw as Record<string, unknown>) : {};
          const name = typeof raw.claimedByName === "string" ? raw.claimedByName : "";
          notifyWarning(
            name
              ? tr(`Artıq ${name} tərəfindən götürülüb`, `Already taken by ${name}`)
              : tr("Artıq başqa kassir tərəfindən götürülüb", "Already taken by another cashier"),
          );
        } else {
          notifyFromError(err);
        }
        void refreshPendingQr(pendingQrPortalOpenRef.current ? "list" : "count");
      } finally {
        setPendingQrBusyId(null);
      }
    },
    [canCreate, isDemo, isAuthenticated, hydrateCartFromQrOrder, refreshPendingQr, tr],
  );

  const handleRejectQrOrder = useCallback(
    async (orderId: string) => {
      if (!canCreate || isDemo || !isAuthenticated) return;
      setPendingQrBusyId(orderId);
      try {
        await rejectQrPosOrder(orderId);
        if (pendingQrOrderIdRef.current === orderId) {
          setPendingQrOrderId(null);
          setCart([]);
        }
        notifySuccess(tr("QR sifariş rədd edildi", "QR order rejected"));
        void refreshPendingQr(pendingQrPortalOpenRef.current ? "list" : "count");
      } catch (err) {
        notifyFromError(err);
        void refreshPendingQr(pendingQrPortalOpenRef.current ? "list" : "count");
      } finally {
        setPendingQrBusyId(null);
      }
    },
    [canCreate, isDemo, isAuthenticated, refreshPendingQr, tr],
  );

  // Deep-link from POS Orders: ?acceptOrder=id
  useEffect(() => {
    const acceptId = searchParams.get("acceptOrder");
    if (!acceptId || !diningEnabled || !canCreate || isDemo || !isAuthenticated) return;
    if (acceptOrderHandledRef.current === acceptId) return;
    acceptOrderHandledRef.current = acceptId;
    void handleAcceptQrOrder(acceptId).finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("acceptOrder");
      setSearchParams(next, { replace: true });
    });
  }, [
    searchParams,
    setSearchParams,
    diningEnabled,
    canCreate,
    isDemo,
    isAuthenticated,
    handleAcceptQrOrder,
  ]);

  // Deep-link from POS Orders: ?orderId=id → open for edit in POS
  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId || isDemo || !isAuthenticated) return;
    if (!canCreate && !canEdit) return;
    if (editOrderHandledRef.current === orderId) return;
    editOrderHandledRef.current = orderId;
    void handleLoadOrderForEdit(orderId).finally(() => {
      const next = new URLSearchParams(searchParams);
      next.delete("orderId");
      setSearchParams(next, { replace: true });
    });
  }, [
    searchParams,
    setSearchParams,
    canCreate,
    canEdit,
    isDemo,
    isAuthenticated,
    handleLoadOrderForEdit,
  ]);

  // Derived selections
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId) ?? null;

  const customerOptions = customers.map((c) => ({ id: c.id, label: c.name, sub: c.phone }));
  const billerOptions = billers.map((b) => ({ id: b.id, label: b.name, sub: b.code }));
  const selectedTable = diningTables.find((t) => t.id === selectedTableId) ?? null;
  const selectedTableLabel = selectedTable
    ? selectedTable.name?.trim() || String(selectedTable.number)
    : "";

  const handleCustomerChange = (id: string) => {
    if (autoEnabled && id !== selectedCustomerId) {
      setSelectedVehicleId("");
      setMileageInput("");
    }
    setSelectedCustomerId(id);
  };

  const categoryOrderStorageKey = useMemo(() => {
    const tenant = user?.tenant?.id ?? "demo";
    const branch = isGlobalMode ? "global" : branchId || "none";
    return `${POS_CATEGORY_ORDER_KEY}:${tenant}:${branch}`;
  }, [user?.tenant?.id, branchId, isGlobalMode]);

  useEffect(() => {
    setCategoryOrder(loadPosCategoryOrder(categoryOrderStorageKey));
  }, [categoryOrderStorageKey]);

  const persistCategoryOrder = useCallback(
    (next: string[]) => {
      setCategoryOrder(next);
      savePosCategoryOrder(categoryOrderStorageKey, next);
    },
    [categoryOrderStorageKey],
  );

  const categories = useMemo(() => {
    const uniqueNames = [
      ...new Set(
        products
          .filter((p) => p.productType !== "SERVICE" && p.trackStock !== false)
          .map((p) => p.category)
          .filter(Boolean),
      ),
    ];
    const hasServices =
      inventoryServicesEnabled &&
      products.some((p) => p.productType === "SERVICE" || p.trackStock === false);

    const reorderable = sortCategoriesByOrder(
      uniqueNames.map((name) => ({ id: name, name })),
      categoryOrder,
    );

    const pinned: PosCategoryChip[] = [
      { id: "all", name: tr("Hamısı", "All"), pinned: true },
      ...(hasServices
        ? [{ id: "services", name: tr("Xidmətlər", "Services"), pinned: true }]
        : []),
    ];
    return [...pinned, ...reorderable];
  }, [products, language, inventoryServicesEnabled, categoryOrder]);

  const moveCategory = useCallback(
    (categoryId: string, direction: -1 | 1) => {
      const reorderableIds = categories.filter((c) => !c.pinned).map((c) => c.id);
      const from = reorderableIds.indexOf(categoryId);
      if (from < 0) return;
      const to = from + direction;
      if (to < 0 || to >= reorderableIds.length) return;
      const next = [...reorderableIds];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      persistCategoryOrder(next);
    },
    [categories, persistCategoryOrder],
  );

  const onCategoryDragStart = (categoryId: string) => {
    if (!categoryReorderMode) return;
    setDragCategoryId(categoryId);
  };

  const onCategoryDrop = (targetId: string) => {
    if (!categoryReorderMode || !dragCategoryId || dragCategoryId === targetId) {
      setDragCategoryId(null);
      return;
    }
    const reorderableIds = categories.filter((c) => !c.pinned).map((c) => c.id);
    const from = reorderableIds.indexOf(dragCategoryId);
    const to = reorderableIds.indexOf(targetId);
    if (from < 0 || to < 0) {
      setDragCategoryId(null);
      return;
    }
    const next = [...reorderableIds];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    persistCategoryOrder(next);
    setDragCategoryId(null);
  };

  useEffect(() => {
    if (selectedCategory === "services" && !inventoryServicesEnabled) {
      setSelectedCategory("all");
    }
  }, [inventoryServicesEnabled, selectedCategory]);

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

  /** Listed on-hand + qty already reserved on the order being edited (restored on save). */
  const getAvailableStock = (productId: string, listedStock: number) => {
    if (!editingOrderId) return listedStock;
    return listedStock + (editingOriginalQtyByProduct[productId] ?? 0);
  };

  const canMutateCart = canCreate || (!!editingOrderId && canEdit && !editingStockLocked);

  const addToCart = (product: Product): boolean => {
    if (!canMutateCart) return false;
    const isService = !product.trackStock || product.productType === "SERVICE";
    const existing = cart.find((i) => i.id === product.id);
    const nextQty = existing ? existing.quantity + 1 : 1;
    const available = getAvailableStock(product.id, product.stock);

    if (!isService && stockEnabled && available <= 0) {
      warnOutOfStock(product);
      return false;
    }
    if (!isService && stockEnabled && nextQty > available) {
      warnInsufficientStock(product, available);
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
          productType: product.productType,
          trackStock: product.trackStock,
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

      if (!canMutateCart) {
        notifyWarning(
          editingStockLocked
            ? tr(
                "Bu sifarişdə qaytarma var — məhsul əlavə edilə bilməz",
                "This order has returns — items cannot be added",
              )
            : tr("Sifariş yaratmaq icazəniz yoxdur", "You do not have permission to add items"),
        );
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
        const needle = trimmed.toLowerCase();
        const local = productsRef.current.find(
          (p) =>
            p.code.toLowerCase() === needle ||
            (p.barcode && p.barcode.toLowerCase() === needle),
        );
        if (local) {
          if (seq !== lookupSeqRef.current || ac.signal.aborted) return "ignored";
          const added = addToCartRef.current(local);
          if (!added) return false;
          setSearchQuery("");
          notifySuccess(tr(`Əlavə olundu: ${local.name}`, `Added: ${local.name}`));
          lastLookupCodeRef.current = { code: trimmed, at: Date.now() };
          return true;
        }

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
    [canMutateCart, editingStockLocked, receipt, mapListItemToProduct, language],
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
    if (!canMutateCart) return;
    setCart((p) => p.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number, maxStock?: number) => {
    if (!canMutateCart) return;
    const product = products.find((p) => p.id === id);
    const item = cart.find((i) => i.id === id);
    if (!item) return;
    const isService =
      !item.trackStock ||
      item.productType === "SERVICE" ||
      !product?.trackStock ||
      product?.productType === "SERVICE";

    const next = item.quantity + delta;
    const available =
      maxStock != null
        ? maxStock
        : product
          ? getAvailableStock(product.id, product.stock)
          : 0;
    if (delta > 0 && !isService) {
      if (stockEnabled && available <= 0) {
        if (product) warnOutOfStock(product);
        return;
      }
      if (stockEnabled && available > 0 && next > available) {
        if (product) warnInsufficientStock(product, available);
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

  const resetCartAfterSave = (opts?: { skipQrRelease?: boolean }) => {
    const claimedId = pendingQrOrderIdRef.current;
    if (!opts?.skipQrRelease && claimedId && !isDemo && isAuthenticated) {
      void releaseQrPosOrder(claimedId).catch(() => {
        /* claim may already be cleared after KOT */
      });
    }
    setPendingQrOrderId(null);
    setEditingOrderId(null);
    setEditingOrderRef(null);
    setEditingOrderWasHeld(false);
    setEditingAlreadyOnKot(false);
    setEditingStockLocked(false);
    setEditingOriginalQtyByProduct({});
    setCart([]);
    setShippingInput("");
    setServiceFeeInput("");
    setSelectedCustomerId("");
    setSelectedVehicleId("");
    setMileageInput("");
    setSelectedBillerId(defaultBillerId || "");
    setSelectedTableId("");
    setSelectedPaymentMethod(null);
    setPaymentStatusChoice(null);
    setAppliedDiscount(null);
    void loadProducts();
    void refreshPendingQr("count");
  };

  const findCartStockIssue = () => {
    if (!stockEnabled) return null;
    return (
      cart.find((item) => {
        const isService = !item.trackStock || item.productType === "SERVICE";
        if (isService) return false;
        const product = products.find((p) => p.id === item.id);
        if (!product) return true;
        const available = getAvailableStock(item.id, product.stock);
        return available <= 0 || item.quantity > available;
      }) ?? null
    );
  };

  const warnCartStockIssue = (stockIssue: CartItem) => {
    const product = products.find((p) => p.id === stockIssue.id);
    if (!product) {
      notifyWarning(
        tr(
          "Səbətdə stokda olmayan məhsullar var",
          "Some items in the cart are out of stock or exceed available quantity",
        ),
      );
      return;
    }
    const available = getAvailableStock(product.id, product.stock);
    if (available <= 0) warnOutOfStock(product);
    else warnInsufficientStock(product, available);
  };

  /** Shared gate for Order / KOT / Bar / Production — keeps validation identical. */
  const assertPosCheckoutReady = (kind: "order" | "kot" | "bar" | "production"): boolean => {
    const allowed = editingOrderId ? canCreate || canEdit : canCreate;
    if (!allowed || isDemo || !isAuthenticated) return false;
    if (kind === "kot" && !diningEnabled) return false;
    if (kind === "bar" && (!diningEnabled || !posSendToBarEnabled)) return false;
    if (kind === "production" && !posSendToProductionEnabled) return false;

    if (pendingQrOrderId && kind !== "kot") {
      notifyWarning(
        tr(
          "QR sifariş üçün KOT & Çap istifadə edin",
          "Use KOT & Print for QR orders",
        ),
      );
      return false;
    }
    if (cart.length === 0) {
      alert(tr("Səbəti doldurun", "Please add items to cart"));
      return false;
    }
    if (!paymentStatusChoice) {
      alert(tr("Ödəniş statusunu seçin", "Please select payment status (Paid / Pending)"));
      return false;
    }
    if (!selectedBillerId) {
      alert(tr("Kassir seçin", "Please select an employee / biller"));
      return false;
    }
    if (isGlobalMode || !branchId) {
      notifyWarning(tr("POS üçün filial seçin", "Select a branch before using POS"));
      return false;
    }
    if (!editingStockLocked) {
      const stockIssue = findCartStockIssue();
      if (stockIssue) {
        warnCartStockIssue(stockIssue);
        return false;
      }
    }
    return true;
  };

  const paymentMethodLabels = (): Record<PaymentMethod, string> => ({
    cash: tr("Nağd", "Cash"),
    card: tr("Kart", "Card"),
  });

  const paymentMethodUnspecifiedLabel = () =>
    tr("Göstərilməyib", "Not specified");

  const resolvePaymentMethodLabel = (
    pmLabel: Record<PaymentMethod, string>,
    apiMethod?: string | null,
  ) => {
    if (selectedPaymentMethod) return pmLabel[selectedPaymentMethod];
    const m = (apiMethod ?? "").toUpperCase();
    if (m === "CARD" || m === "CREDIT_CARD") return pmLabel.card;
    if (m === "CASH" || m === "CASH_ON_HAND") return pmLabel.cash;
    if (apiMethod?.trim()) return apiMethod.trim();
    return paymentMethodUnspecifiedLabel();
  };

  /**
   * Create/checkout already auto-collects when Paid omits initialPaymentAmount.
   * Edit + QR approve go through updatePosOrder (no initial payment) — collect remaining here
   * so Paid / Pending on the POS footer matches the printed bill.
   */
  const collectRemainingIfPaid = async (detail: PosOrderDetail): Promise<PosOrderDetail> => {
    if (paymentStatusChoice !== "paid") return detail;
    if (detail.status === "HELD" || detail.status === "CANCELLED") return detail;
    const total = parsePrice(detail.grandTotal);
    const paid = parsePrice(detail.paid);
    const due = Math.round((total - paid) * 100) / 100;
    if (due <= 0) return detail;
    return recordPosOrderPayment(detail.id, {
      amount: due,
      ...(selectedPaymentMethod
        ? { method: mapPaymentMethodToApi(selectedPaymentMethod) }
        : {}),
      note: "POS checkout payment",
    });
  };

  const resolveTableLabel = (fallbackWalkIn = false) => {
    if (selectedTableId) {
      return (
        diningTables.find((t) => t.id === selectedTableId)?.name ??
        diningTables.find((t) => t.id === selectedTableId)?.number?.toString()
      );
    }
    return fallbackWalkIn ? tr("Gələn müştəri", "Walk-in") : undefined;
  };

  const buildCheckoutBody = () => ({
    status: "COMPLETED" as const,
    customerId: selectedCustomerId || null,
    ...(autoEnabled && selectedVehicleId ? { vehicleId: selectedVehicleId } : {}),
    ...(autoEnabled && selectedVehicleId && mileageInput.trim()
      ? { mileageAtService: Number(mileageInput) }
      : {}),
    billerId: selectedBillerId || null,
    ...(selectedPaymentMethod
      ? { paymentMethod: mapPaymentMethodToApi(selectedPaymentMethod) }
      : {}),
    shipping,
    ...(serviceFee > 0 ? { serviceFee } : {}),
    discount: discountAmount > 0 ? discountAmount : undefined,
    items: cart.map((i) => ({ productId: i.id, quantity: i.quantity, price: i.price })),
    // Paid: omit amount → backend collects exact grandTotal (method optional).
    // Pending: explicit 0 so backend does not auto-charge.
    ...(paymentStatusChoice === "paid" ? {} : { initialPaymentAmount: 0 }),
    ...(isGlobalMode ? { storeId: branchId ?? null } : {}),
    ...(diningEnabled && selectedTableId ? { tableId: selectedTableId } : {}),
  });

  /** Persist cart changes onto the order opened from Orders (PATCH, not create). */
  const submitEditingOrder = async (opts?: {
    /** Keep/save as draft (HELD). */
    asDraft?: boolean;
    /** Force COMPLETED (e.g. Update & Print on a draft). */
    finalize?: boolean;
    sendToKot?: boolean;
    sendToBar?: boolean;
  }) => {
    const id = editingOrderId;
    if (!id) throw new Error("No order loaded for edit");
    if (opts?.asDraft && !editingOrderWasHeld) {
      throw new Error(
        tr(
          "Tamamlanmış sifariş qaralamaya qaytarıla bilməz",
          "A completed order cannot be saved as draft",
        ),
      );
    }
    const body = buildCheckoutBody();
    const {
      initialPaymentAmount: _pay,
      storeId: _store,
      status: _status,
      ...rest
    } = body as typeof body & { initialPaymentAmount?: number; storeId?: string | null };
    void _pay;
    void _store;
    void _status;

    // Update Order on a draft keeps HELD; Update & Print finalizes to COMPLETED.
    // Completed orders always stay COMPLETED.
    const nextStatus: "HELD" | "COMPLETED" = opts?.asDraft
      ? "HELD"
      : opts?.finalize || !editingOrderWasHeld
        ? "COMPLETED"
        : "HELD";

    const payload: Parameters<typeof updatePosOrder>[1] = {
      ...rest,
      status: nextStatus,
      ...(diningEnabled ? { tableId: selectedTableId || null } : {}),
      ...(opts?.sendToKot && !editingAlreadyOnKot ? { sendToKot: true } : {}),
      ...(opts?.sendToBar && !editingAlreadyOnKot ? { sendToBar: true } : {}),
    };
    if (editingStockLocked) {
      delete payload.items;
    }
    return updatePosOrder(id, payload);
  };

  const handleSaveDraft = async () => {
    const allowed = editingOrderId ? canCreate || canEdit : canCreate;
    if (!allowed || isDemo || !isAuthenticated) return;
    if (pendingQrOrderId) {
      notifyWarning(
        tr(
          "QR sifariş üçün KOT & Çap istifadə edin",
          "Use KOT & Print for QR orders",
        ),
      );
      return;
    }
    if (cart.length === 0) {
      notifyWarning(tr("Səbəti doldurun", "Please add items to cart"));
      return;
    }
    if (isGlobalMode || !branchId) {
      notifyWarning(tr("POS üçün filial seçin", "Select a branch before using POS"));
      return;
    }
    if (editingOrderId && !editingOrderWasHeld) {
      notifyWarning(
        tr(
          "Tamamlanmış sifariş qaralamaya qaytarıla bilməz",
          "A completed order cannot be saved as draft",
        ),
      );
      return;
    }

    setCheckoutAction("draft");
    try {
      const detail = editingOrderId
        ? await submitEditingOrder({ asDraft: true })
        : await createPosOrder({
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
      setCheckoutAction(null);
    }
  };

  const buildReceiptFromDetail = (
    detail: Awaited<ReturnType<typeof posCheckout>>,
    pmLabel: Record<PaymentMethod, string>,
    receiptCustomer: string,
    receiptPhone: string,
    receiptBiller: string,
    opts?: {
      diningFlow?: boolean;
      tableLabel?: string;
      autoPrintReceipt?: boolean;
      allowKitchenReprint?: boolean;
    },
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

    const allowKitchenReprint = opts?.allowKitchenReprint ?? !!opts?.diningFlow;

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
      paymentMethod: resolvePaymentMethodLabel(pmLabel, detail.paymentMethod),
      paymentStatusLabel: serverPaymentStatusLabel,
      autoPrintReceipt: opts?.autoPrintReceipt ?? !opts?.diningFlow,
      autoPrintKitchen: false,
      allowKitchenReprint,
      ...(opts?.diningFlow || opts?.tableLabel
        ? { tableLabel: opts.tableLabel }
        : {}),
    };
  };

  const receiptToPrintPayload = (data: ReceiptData): ThermalReceiptPayload => {
    const logoSrc =
      getCompanyLogoUrl(user?.tenant, false) ??
      getCompanyLogoUrl(user?.tenant, true) ??
      APP_LOGO_LIGHT;
    return {
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
      companyName: user?.tenant?.name?.trim() || "Inflero",
      logoSrc,
      siteFooter: "app.inflero.com",
    };
  };

  const printCustomerBillFromReceipt = async (data: ReceiptData) => {
    await printPosTicket({
      role: "receipt",
      language,
      payload: receiptToPrintPayload(data),
    });
  };

  const handlePlaceOrder = async (opts?: { printBill?: boolean }) => {
    const printBill = opts?.printBill === true;
    if (!assertPosCheckoutReady("order")) return;

    const pmLabel = paymentMethodLabels();
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setCheckoutAction(printBill ? "orderBill" : "order");
    try {
      let detail = editingOrderId
        ? await submitEditingOrder({
            // Update & Print finalizes drafts; Update Order keeps draft as HELD.
            finalize: printBill || !editingOrderWasHeld,
          })
        : await posCheckout(buildCheckoutBody());
      detail = await collectRemainingIfPaid(detail);
      const tableLabel = diningEnabled ? resolveTableLabel(false) : undefined;

      const receiptData = buildReceiptFromDetail(
        detail,
        pmLabel,
        receiptCustomer,
        receiptPhone,
        receiptBiller,
        {
          autoPrintReceipt: false,
          tableLabel,
          allowKitchenReprint: false,
        },
      );

      if (printBill) {
        try {
          await printCustomerBillFromReceipt(receiptData);
          notifySuccess(
            editingOrderId
              ? tr(
                  `Sifariş yeniləndi və qəbz çap olundu (${detail.reference})`,
                  `Order updated and bill printed (${detail.reference})`,
                )
              : tr(
                  `Sifariş yerləşdirildi və qəbz çap olundu (${detail.reference})`,
                  `Order placed and bill printed (${detail.reference})`,
                ),
          );
        } catch (printErr) {
          notifyWarning(
            tr(
              "Sifariş yerləşdirildi, amma qəbz çapı alınmadı",
              "Order placed, but bill print failed",
            ),
          );
          notifyFromError(printErr);
        }
        setReceipt(receiptData);
      } else {
        notifySuccess(
          editingOrderId
            ? editingOrderWasHeld && detail.status === "HELD"
              ? tr(
                  `Qaralama yeniləndi (${detail.reference})`,
                  `Draft updated (${detail.reference})`,
                )
              : tr(
                  `Sifariş yeniləndi (${detail.reference})`,
                  `Order updated (${detail.reference})`,
                )
            : tr(
                `Sifariş yerləşdirildi (${detail.reference})`,
                `Order placed (${detail.reference})`,
              ),
        );
      }
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setCheckoutAction(null);
    }
  };

  const handleSendToKot = async (opts?: { printBill?: boolean }) => {
    const printBill = opts?.printBill === true;
    if (!assertPosCheckoutReady("kot")) return;

    const pmLabel = paymentMethodLabels();
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setCheckoutAction(printBill ? "kotBill" : "kot");
    try {
      const body = buildCheckoutBody();
      let detail = pendingQrOrderId
        ? await approveQrAndSendToKot(pendingQrOrderId, body)
        : editingOrderId
          ? await submitEditingOrder({ sendToKot: true, finalize: true })
          : await sendPosOrderToKot(body);
      detail = await collectRemainingIfPaid(detail);

      const tableLabel = resolveTableLabel(true);

      try {
        const logoSrc =
          getCompanyLogoUrl(user?.tenant, false) ??
          getCompanyLogoUrl(user?.tenant, true) ??
          APP_LOGO_LIGHT;
        await printPosOrderTicket({
          order: detail,
          role: "kot",
          language,
          companyName: user?.tenant?.name?.trim() || "Inflero",
          logoSrc,
          customerPhone: receiptPhone,
        });
        notifySuccess(
          selectedTableId
            ? tr(
                "KOT-a göndərildi və mətbəx çapı göndərildi",
                "Sent to KOT and kitchen ticket printed",
              )
            : tr(
                "KOT-a göndərildi (gələn müştəri) və mətbəx çapı göndərildi",
                "Sent to KOT (walk-in) and kitchen ticket printed",
              ),
        );
      } catch (printErr) {
        notifyWarning(
          tr(
            "KOT-a göndərildi, amma mətbəx çapı alınmadı",
            "Sent to KOT, but kitchen print failed",
          ),
        );
        notifyFromError(printErr);
      }

      const receiptData = buildReceiptFromDetail(
        detail,
        pmLabel,
        receiptCustomer,
        receiptPhone,
        receiptBiller,
        {
          diningFlow: true,
          tableLabel,
          autoPrintReceipt: false,
          allowKitchenReprint: true,
        },
      );

      if (printBill) {
        try {
          await printCustomerBillFromReceipt(receiptData);
        } catch (printErr) {
          notifyWarning(
            tr(
              "KOT göndərildi, amma müştəri qəbzi çap olunmadı",
              "Sent to KOT, but customer bill print failed",
            ),
          );
          notifyFromError(printErr);
        }
      }
      // Always open receipt modal (no auto customer print) so kitchen/customer can be reprinted.
      setReceipt(receiptData);
      resetCartAfterSave({ skipQrRelease: true });
    } catch (err) {
      notifyFromError(err);
    } finally {
      setCheckoutAction(null);
    }
  };

  const handleSendToBar = async (opts?: { printBill?: boolean }) => {
    const printBill = opts?.printBill === true;
    if (!assertPosCheckoutReady("bar")) return;

    const pmLabel = paymentMethodLabels();
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setCheckoutAction(printBill ? "barBill" : "bar");
    try {
      let detail = editingOrderId
        ? await submitEditingOrder({ sendToBar: true, finalize: true })
        : await sendPosOrderToBar(buildCheckoutBody());
      detail = await collectRemainingIfPaid(detail);
      const tableLabel = resolveTableLabel(true);

      try {
        const logoSrc =
          getCompanyLogoUrl(user?.tenant, false) ??
          getCompanyLogoUrl(user?.tenant, true) ??
          APP_LOGO_LIGHT;
        await printPosOrderTicket({
          order: detail,
          role: "bar",
          language,
          companyName: user?.tenant?.name?.trim() || "Inflero",
          logoSrc,
          customerPhone: receiptPhone,
        });
        notifySuccess(
          tr(
            "BAR-a göndərildi və BAR bileti çap olundu",
            "Sent to Bar and BAR ticket printed",
          ),
        );
      } catch (printErr) {
        notifyWarning(
          tr(
            "BAR-a göndərildi, amma BAR çapı alınmadı",
            "Sent to Bar, but BAR print failed",
          ),
        );
        notifyFromError(printErr);
      }

      const receiptData = buildReceiptFromDetail(
        detail,
        pmLabel,
        receiptCustomer,
        receiptPhone,
        receiptBiller,
        {
          diningFlow: true,
          tableLabel,
          autoPrintReceipt: false,
          allowKitchenReprint: false,
        },
      );

      if (printBill) {
        try {
          await printCustomerBillFromReceipt(receiptData);
        } catch (printErr) {
          notifyWarning(
            tr(
              "BAR göndərildi, amma müştəri qəbzi çap olunmadı",
              "Sent to Bar, but customer bill print failed",
            ),
          );
          notifyFromError(printErr);
        }
      }
      setReceipt(receiptData);
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setCheckoutAction(null);
    }
  };

  const handleSendToProduction = async () => {
    if (!assertPosCheckoutReady("production")) return;

    const pmLabel = paymentMethodLabels();
    const receiptCustomer = selectedCustomer?.name ?? tr("Anonim", "Anonymous");
    const receiptPhone = selectedCustomer?.phone ?? "—";
    const receiptBiller = billers.find((b) => b.id === selectedBillerId)?.name ?? "—";

    setCheckoutAction("production");
    try {
      let detail = editingOrderId
        ? await submitEditingOrder({ finalize: true })
        : await sendPosOrderToProduction(buildCheckoutBody());
      detail = await collectRemainingIfPaid(detail);

      const receiptData = buildReceiptFromDetail(
        detail,
        pmLabel,
        receiptCustomer,
        receiptPhone,
        receiptBiller,
        {
          autoPrintReceipt: false,
          allowKitchenReprint: false,
        },
      );

      try {
        await printCustomerBillFromReceipt(receiptData);
        notifySuccess(
          editingOrderId
            ? tr("Sifariş yeniləndi və qəbz çap olundu", "Order updated and bill printed")
            : tr("İstehsala göndərildi və qəbz çap olundu", "Sent to production and bill printed"),
        );
      } catch (printErr) {
        notifyWarning(
          tr(
            "Sifariş tamamlandı, amma qəbz çapı alınmadı",
            "Order completed, but bill print failed",
          ),
        );
        notifyFromError(printErr);
      }

      setReceipt(receiptData);
      resetCartAfterSave();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setCheckoutAction(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (selectedCategory === "services") {
      return p.productType === "SERVICE" || p.trackStock === false;
    }
    if (selectedCategory === "all") return true;
    return p.category === selectedCategory;
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
      {diningEnabled && (
        <button
          type="button"
          onClick={() => setPrinterSettingsOpen(true)}
          className="fixed top-2 left-12 z-50 p-2 rounded-md bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[#14b8a6] hover:bg-white dark:hover:bg-gray-900 transition-all opacity-50 hover:opacity-100"
          title={tr("POS Printerlər", "POS Printers")}
        >
          <Printer className="w-3.5 h-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={() => navigate("/dashboard/sales/pos-orders")}
        className="fixed top-2 right-2 z-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:text-[#0d9488] hover:border-[#14b8a6]/50 hover:bg-[#f0fdfa] dark:hover:bg-[#14b8a6]/10 shadow-sm transition-all"
        title={tr("Sifarişlər", "Orders")}
      >
        <ClipboardList className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">{tr("Sifarişlər", "Orders")}</span>
      </button>
      {diningEnabled && (
        <button
          type="button"
          onClick={() => {
            setPendingQrPortalOpen(true);
            void refreshPendingQr("list");
          }}
          className={`fixed top-2 right-[6.5rem] z-50 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border shadow-sm transition-all ${
            pendingQrCount > 0
              ? "bg-orange-500 border-orange-600 text-white animate-pulse"
              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-orange-400"
          }`}
          title={tr("Gözləyən QR sifarişlər", "Pending QR orders")}
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {tr("QR", "QR")}
            {pendingQrCount > 0 ? ` (${pendingQrCount})` : ""}
          </span>
        </button>
      )}

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
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                    {tr("Kateqoriyalar", "Categories")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setCategoryReorderMode((v) => !v)}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-md border transition-colors ${
                      categoryReorderMode
                        ? "bg-[#14b8a6] border-[#14b8a6] text-white"
                        : "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                    title={tr("Kateqoriyaları sırala", "Reorder categories")}
                  >
                    <ListOrdered className="w-3 h-3" />
                    {categoryReorderMode
                      ? tr("Bitir", "Done")
                      : tr("Sırala", "Reorder")}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const isServices = cat.id === "services";
                    const isActive = selectedCategory === cat.id;
                    const canReorder = categoryReorderMode && !cat.pinned;
                    return (
                      <div
                        key={cat.id}
                        draggable={canReorder}
                        onDragStart={() => onCategoryDragStart(cat.id)}
                        onDragOver={(e) => {
                          if (!canReorder) return;
                          e.preventDefault();
                        }}
                        onDrop={() => {
                          if (!cat.pinned) onCategoryDrop(cat.id);
                        }}
                        onDragEnd={() => setDragCategoryId(null)}
                        className={`inline-flex items-center gap-0.5 rounded-lg ${
                          dragCategoryId === cat.id ? "opacity-60" : ""
                        }`}
                      >
                        {canReorder && (
                          <button
                            type="button"
                            onClick={() => moveCategory(cat.id, -1)}
                            className="p-1 rounded-md text-gray-400 hover:text-[#14b8a6] hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={tr("Sola", "Move left")}
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (categoryReorderMode && !cat.pinned) return;
                            setSelectedCategory(cat.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                            isServices
                              ? isActive
                                ? "bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 dark:ring-blue-500/50"
                                : "bg-blue-50 text-blue-700 border border-blue-300 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/40"
                              : isActive
                                ? "bg-[#14b8a6] text-white"
                                : "bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                          } ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
                        >
                          {canReorder && <GripVertical className="w-3 h-3 shrink-0 opacity-70" />}
                          {isServices && <Wrench className="w-3.5 h-3.5 shrink-0" />}
                          {cat.name}
                        </button>
                        {canReorder && (
                          <button
                            type="button"
                            onClick={() => moveCategory(cat.id, 1)}
                            className="p-1 rounded-md text-gray-400 hover:text-[#14b8a6] hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={tr("Sağa", "Move right")}
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                  const isService = !product.trackStock || product.productType === "SERVICE";
                  const qtyInCart = getCartQuantity(product.id);
                  const available = getAvailableStock(product.id, product.stock);
                  const outOfStock = !isService && stockEnabled && available <= 0;
                  const atStockLimit =
                    !isService && stockEnabled && available > 0 && qtyInCart >= available;
                  const allowAdd = canMutateCart && !outOfStock;

                  return (
                  <div
                    key={product.id}
                    role="button"
                    tabIndex={allowAdd ? 0 : -1}
                    onClick={() => {
                      if (!allowAdd) {
                        if (outOfStock) warnOutOfStock(product);
                        return;
                      }
                      addToCart(product);
                    }}
                    onKeyDown={(e) => {
                      if (!allowAdd) return;
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        addToCart(product);
                      }
                    }}
                    className={`relative bg-white dark:bg-gray-900 border rounded-lg p-3 sm:p-4 hover:shadow-lg transition-all active:scale-95 text-left group touch-manipulation ${
                      outOfStock || !canMutateCart
                        ? "border-red-300 dark:border-red-900/60 opacity-80 cursor-not-allowed"
                        : "border-gray-200 dark:border-gray-800 hover:border-[#14b8a6] dark:hover:border-[#0f766e] cursor-pointer"
                    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`}
                  >
                    {isService && (
                      <span className="absolute top-2 left-2 z-10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {tr("Xidmət", "Service")}
                      </span>
                    )}
                    {!isService && stockEnabled && outOfStock && (
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
                      {!isService && stockEnabled && <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                        outOfStock
                          ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
                          : "text-gray-400 bg-gray-100 dark:bg-gray-800"
                      }`}>
                        {available < 99 ? `${available}` : "∞"}
                      </span>}
                    </div>
                    {canMutateCart && qtyInCart > 0 && (
                      <div
                        className="mt-2 flex items-center justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(product.id, -1, available)}
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
                            onClick={() => updateQuantity(product.id, 1, available)}
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
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                      {editingOrderId
                        ? tr("Sifarişi redaktə et", "Edit Order")
                        : tr("Cari Sifariş", "Current Order")}
                    </h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {editingOrderRef
                        ? editingOrderRef
                        : `${cart.length} ${tr("məhsul", "items")}`}
                    </p>
                  </div>
                </div>
                {cart.length > 0 && (canCreate || (editingOrderId && canEdit)) && (
                  <button
                    onClick={() => resetCartAfterSave()}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors"
                    title={
                      editingOrderId
                        ? tr("Redaktəni ləğv et", "Cancel edit")
                        : tr("Səbəti təmizlə", "Clear cart")
                    }
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              {pendingQrOrderId && (
                <div className="shrink-0 mb-2 px-2 py-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-[11px] text-orange-800 dark:text-orange-200">
                  {tr("QR sifariş qəbul edildi — KOT & Çap ilə təsdiqləyin", "QR order accepted — confirm with KOT & Print")}
                </div>
              )}
              {editingOrderId && !pendingQrOrderId && (
                <div className="shrink-0 mb-2 px-2 py-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-[11px] text-sky-800 dark:text-sky-200">
                  {editingStockLocked
                    ? tr(
                        `Redaktə: ${editingOrderRef ?? editingOrderId} (məhsul sətirləri kilidlidir — qaytarma mövcuddur)`,
                        `Editing ${editingOrderRef ?? editingOrderId} (line items locked — returns exist)`,
                      )
                    : tr(
                        `Redaktə: ${editingOrderRef ?? editingOrderId} — silinən məhsulların stoku geri qaytarılır`,
                        `Editing ${editingOrderRef ?? editingOrderId} — removed items restore stock`,
                      )}
                </div>
              )}

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
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setTablePickerOpen(true)}
                        className="w-full flex items-center gap-2 pl-9 pr-3 py-2 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-[#14b8a6] transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <Armchair className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <span
                          className={
                            selectedTableLabel
                              ? "text-gray-900 dark:text-white truncate"
                              : "text-gray-400"
                          }
                        >
                          {selectedTableLabel || tr("Masa (istəyə bağlı)", "Table (optional)")}
                        </span>
                        <ChevronDown className="ml-auto w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      </button>
                    </div>
                    <PosTablePickerPortal
                      open={tablePickerOpen}
                      tables={diningTables}
                      selectedId={selectedTableId}
                      onSelect={setSelectedTableId}
                      onClose={() => setTablePickerOpen(false)}
                      tr={tr}
                    />
                  </>
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
                    const isService =
                      !item.trackStock ||
                      item.productType === "SERVICE" ||
                      !product?.trackStock ||
                      product?.productType === "SERVICE";
                    const available = product
                      ? getAvailableStock(product.id, product.stock)
                      : 0;
                    const itemOutOfStock =
                      !isService && stockEnabled && product != null && available <= 0;
                    const itemExceedsStock =
                      !isService &&
                      stockEnabled &&
                      product != null &&
                      available > 0 &&
                      item.quantity > available;

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
                          {isService && (
                            <span className="inline-flex mb-1 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {tr("Xidmət", "Service")}
                            </span>
                          )}
                          {(itemOutOfStock || itemExceedsStock) && (
                            <p className="text-[10px] font-medium text-red-600 dark:text-red-400 mb-1">
                              {itemOutOfStock
                                ? tr("Stokda yoxdur", "Out of stock")
                                : tr(
                                    `Yalnız ${available} ədəd mövcuddur`,
                                    `Only ${available} available`,
                                  )}
                            </p>
                          )}
                          {isService ? (
                            <div className="flex items-center gap-1 mb-1.5">
                              <input
                                type="text"
                                inputMode="decimal"
                                value={String(item.price)}
                                onChange={(e) => {
                                  const next = parseFloat(sanitizeNumericTyping(e.target.value));
                                  if (!Number.isFinite(next) || next < 0) return;
                                  setCart((prev) =>
                                    prev.map((i) =>
                                      i.id === item.id ? { ...i, price: next } : i,
                                    ),
                                  );
                                }}
                                className="w-24 px-2 py-1 text-xs font-semibold text-[#14b8a6] bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <span className="text-[10px] text-gray-400">₼</span>
                            </div>
                          ) : (
                            <p className="text-xs font-semibold text-[#14b8a6] dark:text-[#14b8a6] mb-1.5">{formatCurrency(item.price)}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, -1, available)}
                                disabled={!canMutateCart}
                                className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-l-lg transition-colors disabled:opacity-40"
                                aria-label={tr("Azalt", "Decrease quantity")}
                              >
                                <Minus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                              <span className="text-xs font-medium text-gray-900 dark:text-white px-2 min-w-[1.25rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, 1, available)}
                                disabled={!canMutateCart || (!isService && stockEnabled && available > 0 && item.quantity >= available)}
                                className="p-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                aria-label={tr("Artır", "Increase quantity")}
                              >
                                <Plus className="w-3 h-3 text-gray-600 dark:text-gray-400" />
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              disabled={!canMutateCart}
                              className="ml-auto p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40"
                            >
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
                            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-[#14b8a6] dark:hover:text-[#14b8a6] hover:underline"
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

                  {/* Payment Methods */}
                  <div className="mb-2">
                    <p className="text-xs font-medium text-gray-900 dark:text-white mb-2">{tr("Ödəniş Üsulu", "Payment Method")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {paymentMethods.map((m) => {
                        const Icon = m.icon;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() =>
                              setSelectedPaymentMethod((prev) => (prev === m.id ? null : m.id))
                            }
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
                </div>
              )}
              </div>

              {/* Fixed checkout: Total + actions stay visible while cart scrolls */}
              {cart.length > 0 && (
                <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 pt-2.5 mt-1 bg-white dark:bg-gray-900">
                  <div className="flex justify-between items-baseline mb-2.5 pb-2 border-b border-gray-200 dark:border-gray-800">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Cəmi", "Total")}</span>
                    <span className="text-base font-bold text-[#14b8a6] dark:text-[#14b8a6]">{formatCurrency(total)}</span>
                  </div>

                  <div className="mb-2">
                    <p className="text-[11px] font-medium text-gray-900 dark:text-white mb-1.5">
                      {tr("Status", "Status")}
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
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
                          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-medium transition-all ${
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

                  {(canCreate || (editingOrderId && canEdit)) && (
                  <div className="space-y-1.5">
                    {(() => {
                      const baseDisabled =
                        cart.length === 0 ||
                        checkoutBusy ||
                        isGlobalMode ||
                        !branchId;
                      const orderDisabled = baseDisabled || !!pendingQrOrderId;
                      const btnBase =
                        "px-2.5 py-2 text-[11px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1";

                      if (editingOrderId) {
                        return (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handlePlaceOrder()}
                              disabled={baseDisabled}
                              className={`${btnBase} text-white bg-[#14b8a6] hover:bg-[#0d9488]`}
                            >
                              <ClipboardList className="w-3 h-3" />
                              {checkoutAction === "order"
                                ? tr("Yenilənir...", "Updating...")
                                : tr("Sifarişi yenilə", "Update Order")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handlePlaceOrder({ printBill: true })}
                              disabled={baseDisabled}
                              className={`${btnBase} text-white bg-[#14b8a6] hover:bg-[#0d9488]`}
                            >
                              <Printer className="w-3 h-3" />
                              {checkoutAction === "orderBill"
                                ? tr("Yenilənir...", "Updating...")
                                : tr("Yenilə & Çap", "Update & Print")}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => void handleSaveDraft()}
                              disabled={orderDisabled}
                              className={`${btnBase} text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800`}
                            >
                              {checkoutAction === "draft"
                                ? tr("Saxlanılır...", "Saving...")
                                : tr("Qaralama olaraq saxla", "Save as Draft")}
                            </button>
                            <button
                              type="button"
                              onClick={() => void handlePlaceOrder()}
                              disabled={orderDisabled}
                              className={`${btnBase} text-white bg-[#14b8a6] hover:bg-[#0d9488]`}
                            >
                              <ClipboardList className="w-3 h-3" />
                              {checkoutAction === "order"
                                ? tr("Göndərilir...", "Processing...")
                                : tr("Sifariş", "Order")}
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handlePlaceOrder({ printBill: true })}
                            disabled={orderDisabled}
                            className={`${btnBase} w-full text-white bg-[#14b8a6] hover:bg-[#0d9488]`}
                          >
                            <Printer className="w-3 h-3" />
                            {checkoutAction === "orderBill"
                              ? tr("Göndərilir...", "Processing...")
                              : tr("Sifariş & Qəbz", "Order & Bill")}
                          </button>
                          {diningEnabled && (
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleSendToKot()}
                                disabled={baseDisabled}
                                className={`${btnBase} text-white bg-orange-500 hover:bg-orange-600`}
                              >
                                <ChefHat className="w-3 h-3" />
                                {checkoutAction === "kot"
                                  ? tr("Göndərilir...", "Sending...")
                                  : tr("KOT & Çap", "KOT & Print")}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSendToKot({ printBill: true })}
                                disabled={baseDisabled}
                                className={`${btnBase} text-white bg-orange-600 hover:bg-orange-700`}
                              >
                                <Printer className="w-3 h-3" />
                                {checkoutAction === "kotBill"
                                  ? tr("Göndərilir...", "Sending...")
                                  : tr("KOT & Çap & Qəbz", "KOT & Print & Bill")}
                              </button>
                            </div>
                          )}
                          {diningEnabled && posSendToBarEnabled && (
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => void handleSendToBar()}
                                disabled={orderDisabled}
                                className={`${btnBase} text-white bg-violet-600 hover:bg-violet-700`}
                              >
                                <Wine className="w-3 h-3" />
                                {checkoutAction === "bar"
                                  ? tr("Göndərilir...", "Sending...")
                                  : tr("BAR & Çap", "Bar & Print")}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleSendToBar({ printBill: true })}
                                disabled={orderDisabled}
                                className={`${btnBase} text-white bg-violet-700 hover:bg-violet-800`}
                              >
                                <Printer className="w-3 h-3" />
                                {checkoutAction === "barBill"
                                  ? tr("Göndərilir...", "Sending...")
                                  : tr("BAR & Çap & Qəbz", "Bar & Print & Bill")}
                              </button>
                            </div>
                          )}
                          {posSendToProductionEnabled && (
                            <button
                              type="button"
                              onClick={() => void handleSendToProduction()}
                              disabled={orderDisabled}
                              className={`${btnBase} w-full text-white bg-[#0d9488] hover:bg-[#0f766e]`}
                            >
                              <Factory className="w-3 h-3" />
                              {checkoutAction === "production"
                                ? tr("İstehsala göndərilir...", "Sending to production...")
                                : tr("İstehsala göndər", "Send to Production")}
                            </button>
                          )}
                        </>
                      );
                    })()}
                  </div>
                  )}
                </div>
              )}
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
          onConfigurePrinters={
            diningEnabled ? () => setPrinterSettingsOpen(true) : undefined
          }
          diningEnabled={diningEnabled}
        />
      )}
      {diningEnabled && printerSettingsOpen && (
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

      {diningEnabled && pendingQrPortalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[85vh] flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-500" />
                  {tr("Gözləyən QR sifarişlər", "Pending QR orders")}
                  {pendingQrCount > 0 ? (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold animate-pulse">
                      {pendingQrCount}
                    </span>
                  ) : null}
                </h3>
                <button
                  type="button"
                  onClick={() => setPendingQrPortalOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {pendingQrList.length === 0 ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">
                    {tr("Gözləyən QR sifariş yoxdur", "No pending QR orders")}
                  </p>
                ) : (
                  pendingQrList.map((row) => {
                    const busy = pendingQrBusyId === row.id;
                    const isClaimedOther = row.claimStatus === "claimed";
                    const isMine = row.claimStatus === "mine";
                    return (
                      <div
                        key={row.id}
                        className={`rounded-lg border p-3 ${
                          isMine
                            ? "border-[#14b8a6] bg-[#f0fdfa] dark:bg-[#14b8a6]/10"
                            : isClaimedOther
                              ? "border-gray-200 dark:border-gray-700 opacity-70"
                              : "border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                              {row.reference}
                            </p>
                            <p className="text-[11px] font-medium text-gray-800 dark:text-gray-200 mt-0.5 flex items-center gap-1">
                              <Armchair className="w-3 h-3 text-orange-500 shrink-0" />
                              {row.table
                                ? tr(
                                    `Masa #${row.table.number}${
                                      row.table.name?.trim() &&
                                      row.table.name.trim() !== String(row.table.number)
                                        ? ` · ${row.table.name.trim()}`
                                        : ""
                                    }`,
                                    `Table #${row.table.number}${
                                      row.table.name?.trim() &&
                                      row.table.name.trim() !== String(row.table.number)
                                        ? ` · ${row.table.name.trim()}`
                                        : ""
                                    }`,
                                  )
                                : tr("Masa yoxdur (gələn)", "No table (walk-in)")}
                            </p>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                              {row.itemSummary || `${row.itemCount} ${tr("məhsul", "items")}`}
                            </p>
                            <p className="text-[11px] font-medium text-[#14b8a6] mt-1">
                              {formatCurrency(row.grandTotal)}
                            </p>
                            {isClaimedOther && (
                              <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                                {tr(
                                  `Götürüb: ${row.claimedByName ?? "—"}`,
                                  `Claimed by ${row.claimedByName ?? "—"}`,
                                )}
                              </p>
                            )}
                            {isMine && (
                              <p className="text-[10px] text-[#0d9488] mt-1">
                                {tr("Sizin qəbulunuz", "Accepted by you")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              type="button"
                              disabled={busy || isClaimedOther || !canCreate}
                              onClick={() => void handleAcceptQrOrder(row.id)}
                              className="px-2.5 py-1 text-[11px] font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-md disabled:opacity-40"
                            >
                              {busy
                                ? "…"
                                : isMine
                                  ? tr("Aç", "Open")
                                  : tr("Qəbul et", "Accept")}
                            </button>
                            <button
                              type="button"
                              disabled={busy || (isClaimedOther && !canCreate) || !canCreate}
                              onClick={() => void handleRejectQrOrder(row.id)}
                              className="px-2.5 py-1 text-[11px] font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40"
                            >
                              {tr("Rədd", "Reject")}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>,
          document.body,
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
