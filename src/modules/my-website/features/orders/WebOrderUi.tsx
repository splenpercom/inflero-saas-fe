import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
  type ComponentType,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "../../ui";
import {
  ChevronDown,
  FileText,
  MapPin,
  Phone,
  Mail,
  Package,
  X,
  CreditCard,
} from "lucide-react";
import { useLanguage } from "../../../../app/i18n/LanguageContext";
import { pickLang } from "../../../../app/i18n/pickLang";
import type { WebOrder } from "./types";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  PAYMENT_STATUS_COLORS,
  ALL_STATUSES,
  ALL_PAYMENT_STATUSES,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./constants";

function useTr() {
  const { language } = useLanguage();
  return (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
}

function statusLabel(language: string, status: WebOrder["status"]): string {
  const key = language === "az" ? "az" : "en";
  return STATUS_LABELS[key][status];
}

function paymentLabel(language: string, status: WebOrder["paymentStatus"]): string {
  const key = language === "az" ? "az" : "en";
  return PAYMENT_STATUS_LABELS[key][status];
}

function useAnchoredMenu(open: boolean) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const menuH = menuRef.current?.offsetHeight ?? 200;
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < menuH + 8 && r.top > spaceBelow;
    setPos({
      top: openUp ? r.top - 4 : r.bottom + 4,
      left: Math.min(r.left, window.innerWidth - 180),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, updatePos]);

  return { triggerRef, menuRef, pos };
}

export type StatusPillOption<T extends string> = {
  value: T;
  label: string;
  colorClass: string;
  icon?: ComponentType<{ className?: string }>;
};

/** Shared pill + portal menu used by web order status/payment (and Orders production). */
export function StatusPillDropdown<T extends string>({
  value,
  options,
  onChange,
  title,
  disabled,
  menuWidthClass = "w-40",
  footer,
}: {
  value: T;
  options: StatusPillOption<T>[];
  onChange: (next: T) => void | Promise<void>;
  title?: string;
  disabled?: boolean;
  menuWidthClass?: string;
  footer?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { triggerRef, menuRef, pos } = useAnchoredMenu(open);
  const current = options.find((o) => o.value === value) ?? options[0];
  const Icon = current?.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, menuRef]);

  if (!current) return null;

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight cursor-pointer hover:opacity-80 transition-opacity select-none disabled:opacity-50 disabled:cursor-not-allowed",
          current.colorClass,
        )}
        title={title}
      >
        {Icon ? <Icon className="w-3 h-3" /> : null}
        {current.label}
        <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
      </button>
      {footer}

      {open &&
        pos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              transform:
                pos.top < (triggerRef.current?.getBoundingClientRect().top ?? 0)
                  ? "translateY(-100%)"
                  : undefined,
              zIndex: 9999,
            }}
            className={cn(
              "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 overflow-hidden",
              menuWidthClass,
            )}
          >
            {options.map((opt) => {
              const SI = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    void onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                    opt.value === value
                      ? "bg-gray-50 dark:bg-gray-700/50"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/40",
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium w-full",
                      opt.colorClass,
                    )}
                  >
                    {SI ? <SI className="w-3 h-3 shrink-0" /> : null}
                    {opt.label}
                  </span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function WebStatusPill({
  orderId,
  status,
  onChange,
  disabled,
}: {
  orderId: string;
  status: WebOrder["status"];
  onChange: (id: string, s: WebOrder["status"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const tr = useTr();

  const options: StatusPillOption<WebOrder["status"]>[] = ALL_STATUSES.map((s) => ({
    value: s,
    label: statusLabel(language, s),
    colorClass: STATUS_COLORS[s],
    icon: STATUS_ICONS[s],
  }));

  return (
    <StatusPillDropdown
      value={status}
      options={options}
      disabled={disabled}
      title={tr("Statusu dəyişmək üçün klikləyin", "Click to change status")}
      onChange={(next) => onChange(orderId, next)}
    />
  );
}

export function WebPaymentStatusPill({
  orderId,
  paymentStatus,
  paymentMethod,
  onChange,
  disabled,
}: {
  orderId: string;
  paymentStatus: WebOrder["paymentStatus"];
  paymentMethod: WebOrder["paymentMethod"];
  onChange: (id: string, s: WebOrder["paymentStatus"]) => void | Promise<void>;
  disabled?: boolean;
}) {
  const { language } = useLanguage();
  const tr = useTr();

  const options: StatusPillOption<WebOrder["paymentStatus"]>[] = ALL_PAYMENT_STATUSES.map((s) => ({
    value: s,
    label: paymentLabel(language, s),
    colorClass: PAYMENT_STATUS_COLORS[s],
  }));

  return (
    <StatusPillDropdown
      value={paymentStatus}
      options={options}
      disabled={disabled}
      menuWidthClass="w-36"
      title={tr("Ödəniş statusunu dəyişmək üçün klikləyin", "Click to change payment status")}
      onChange={(next) => onChange(orderId, next)}
      footer={
        <p className="text-xs text-gray-400 mt-0.5">
          {paymentMethod === "epoint" ? "Epoint" : tr("Nağd ödəniş", "Cash on Delivery")}
        </p>
      }
    />
  );
}

export function WebOrderDetailModal({
  order,
  onClose,
  onStatusChange,
  onPaymentStatusChange,
}: {
  order: WebOrder;
  onClose: () => void;
  onStatusChange?: (id: string, s: WebOrder["status"]) => void | Promise<void>;
  onPaymentStatusChange: (id: string, s: WebOrder["paymentStatus"]) => void | Promise<void>;
}) {
  const tr = useTr();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.reference}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{order.date}</p>
          </div>
          <div className="flex items-center gap-2">
            {onStatusChange ? (
              <WebStatusPill
                orderId={order.id}
                status={order.status}
                onChange={onStatusChange}
              />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Müştəri", "Customer")}
              </p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer.name}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {order.customer.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {order.customer.phone || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Çatdırılma Ünvanı", "Shipping Address")}
              </p>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p>{order.shipping.address}</p>
                  <p>
                    {order.shipping.city}
                    {order.shipping.country ? `, ${order.shipping.country}` : ""}{" "}
                    {order.shipping.postalCode}
                  </p>
                </div>
              </div>
              {order.shipping.notes && (
                <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p className="italic">{order.shipping.notes}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Sifariş Məhsulları", "Order Items")}
              </p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-[10px] text-gray-400">×{item.qty}</p>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {(item.price * item.qty).toFixed(2)} ₼
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {tr("Ümumi Məbləğ", "Grand Total")}
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {order.grandTotal.toFixed(2)} ₼
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {tr("Ödəniş", "Payment")}
              </p>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                {order.paymentMethod === "epoint"
                  ? "Epoint (Online)"
                  : tr("Nağd ödəniş", "Cash on Delivery")}
              </div>
              <WebPaymentStatusPill
                orderId={order.id}
                paymentStatus={order.paymentStatus}
                paymentMethod={order.paymentMethod}
                onChange={onPaymentStatusChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
