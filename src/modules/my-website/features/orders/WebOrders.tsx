import { useState, useRef, useEffect } from "react";
import { cn } from "../../ui";
import {
  Search,
  ChevronDown,
  Eye,
  RefreshCw,
  FileText,
  FileSpreadsheet,
  MapPin,
  Phone,
  Mail,
  Package,
  X,
  ShoppingBag,
  CreditCard,
  Truck,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useLanguage, useTr } from "../../i18n";
import { DataPagination, dataPaginationShowText } from "../../../../app/components/ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../../../app/hooks/usePagination";
import type { WebOrder } from "./types";
import { DUMMY_ORDERS } from "./data";
import {
  STATUS_COLORS,
  STATUS_ICONS,
  PAYMENT_STATUS_COLORS,
  ALL_STATUSES,
  ALL_PAYMENT_STATUSES,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from "./constants";

function StatusPill({ orderId, status, onChange }: {
  orderId: string;
  status: WebOrder["status"];
  onChange: (id: string, s: WebOrder["status"]) => void;
}) {
  const { language } = useLanguage();
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const Icon = STATUS_ICONS[status];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity select-none", STATUS_COLORS[status])}
        title={tr("Statusu dəyişmək üçün klikləyin", "Click to change status")}
      >
        <Icon className="w-2.5 h-2.5" />
        {STATUS_LABELS[language as "az" | "en"]?.[status] ?? STATUS_LABELS.en[status]}
        <ChevronDown className="w-2 h-2 ml-0.5 opacity-60" />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 overflow-hidden">
          {ALL_STATUSES.map(s => {
            const SI = STATUS_ICONS[s];
            return (
              <button
                key={s}
                onClick={() => { onChange(orderId, s); setOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors",
                  s === status ? "bg-gray-50 dark:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                )}
              >
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium w-full", STATUS_COLORS[s])}>
                  <SI className="w-2.5 h-2.5 shrink-0" />
                  {STATUS_LABELS[language as "az" | "en"]?.[s] ?? STATUS_LABELS.en[s]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PaymentStatusPill({ orderId, paymentStatus, paymentMethod, onChange }: {
  orderId: string;
  paymentStatus: WebOrder["paymentStatus"];
  paymentMethod: WebOrder["paymentMethod"];
  onChange: (id: string, s: WebOrder["paymentStatus"]) => void;
}) {
  const { language } = useLanguage();
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity select-none", PAYMENT_STATUS_COLORS[paymentStatus])}
        title={tr("Ödəniş statusunu dəyişmək üçün klikləyin", "Click to change payment status")}
      >
        {PAYMENT_STATUS_LABELS[language as "az" | "en"]?.[paymentStatus] ?? PAYMENT_STATUS_LABELS.en[paymentStatus]}
        <ChevronDown className="w-2 h-2 ml-0.5 opacity-60" />
      </button>
      <p className="text-[9px] text-gray-400 mt-0.5">
        {paymentMethod === "epoint" ? "Epoint" : tr("Nağd ödəniş", "Cash on Delivery")}
      </p>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1 overflow-hidden">
          {ALL_PAYMENT_STATUSES.map(s => (
            <button
              key={s}
              onClick={() => { onChange(orderId, s); setOpen(false); }}
              className={cn(
                "w-full flex items-center px-3 py-1.5 text-left transition-colors",
                s === paymentStatus ? "bg-gray-50 dark:bg-gray-700/50" : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
              )}
            >
              <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium w-full", PAYMENT_STATUS_COLORS[s])}>
                {PAYMENT_STATUS_LABELS[language as "az" | "en"]?.[s] ?? PAYMENT_STATUS_LABELS.en[s]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onStatusChange, onPaymentStatusChange }: {
  order: WebOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: WebOrder["status"]) => void;
  onPaymentStatusChange: (id: string, s: WebOrder["paymentStatus"]) => void;
}) {
  const tr = useTr();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Modal header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-5 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.reference}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{order.date}</p>
          </div>
          <div className="flex items-center gap-2 mr-4">
            <StatusPill orderId={order.id} status={order.status} onChange={onStatusChange} />
            <PaymentStatusPill orderId={order.id} paymentStatus={order.paymentStatus} paymentMethod={order.paymentMethod} onChange={onPaymentStatusChange} />
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shrink-0">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Customer info */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tr("Müştəri", "Customer")}</p>
            </div>
            <div className="px-4 py-3 space-y-2">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer.name}</p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {order.customer.email}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {order.customer.phone}
                </div>
              </div>
            </div>
          </div>

          {/* Shipping address */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tr("Çatdırılma Ünvanı", "Shipping Address")}</p>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              <div className="flex items-start gap-2 text-xs text-gray-700 dark:text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p>{order.shipping.address}</p>
                  <p>{order.shipping.city}, {order.shipping.country} {order.shipping.postalCode}</p>
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

          {/* Order items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tr("Sifariş Məhsulları", "Order Items")}</p>
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
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">{(item.price * item.qty).toFixed(2)} ₼</p>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{tr("Ümumi Məbləğ", "Grand Total")}</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{order.grandTotal.toFixed(2)} ₼</p>
            </div>
          </div>

          {/* Payment */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{tr("Ödəniş", "Payment")}</p>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                {order.paymentMethod === "epoint" ? "Epoint (Online)" : tr("Nağd ödəniş", "Cash on Delivery")}
              </div>
              <PaymentStatusPill orderId={order.id} paymentStatus={order.paymentStatus} paymentMethod={order.paymentMethod} onChange={onPaymentStatusChange} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export function WebOrders() {
  const tr = useTr();

  const [orders, setOrders] = useState<WebOrder[]>(DUMMY_ORDERS);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPayment, setFilterPayment] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [detailOrder, setDetailOrder] = useState<WebOrder | null>(null);

  const handleStatusChange = (id: string, status: WebOrder["status"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    setDetailOrder(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const handlePaymentStatusChange = (id: string, paymentStatus: WebOrder["paymentStatus"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, paymentStatus } : o));
    setDetailOrder(prev => prev?.id === id ? { ...prev, paymentStatus } : prev);
  };

  const filtered = orders.filter(o => {
    const matchSearch = search === "" ||
      o.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || o.status === filterStatus;
    const matchPayment = filterPayment === "all" || o.paymentStatus === filterPayment;
    return matchSearch && matchStatus && matchPayment;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData: pagedOrders,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: filtered,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${search}|${filterStatus}|${filterPayment}|${sortBy}`,
  });

  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((s, o) => s + o.grandTotal, 0);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const completedCount = orders.filter(o => o.status === "completed").length;

  const totalQty = (order: WebOrder) => order.items.reduce((s, it) => s + it.qty, 0);

  const tableHeaders = [
    tr("SİFARİŞ", "ORDER"),
    tr("MÜŞTƏRİ", "CUSTOMER"),
    tr("ÜNVAN", "ADDRESS"),
    tr("MƏHSULLAR", "ITEMS"),
    tr("MƏBLƏĞ", "TOTAL"),
    tr("STATUS", "STATUS"),
    tr("ÖDƏNİŞ", "PAYMENT"),
    "",
  ];

  const filterStatusOptions: [string, string][] = [
    ["all",       tr("Bütün statuslar", "All Statuses")],
    ["pending",   tr("Gözləyir",        "Pending")],
    ["confirmed", tr("Təsdiqləndi",     "Confirmed")],
    ["shipped",   tr("Göndərildi",      "Shipped")],
    ["completed", tr("Tamamlandı",      "Completed")],
    ["cancelled", tr("Ləğv edildi",     "Cancelled")],
  ];

  const filterPaymentOptions: [string, string][] = [
    ["all",      tr("Bütün ödənişlər",  "All Payments")],
    ["paid",     tr("Ödənilib",         "Paid")],
    ["unpaid",   tr("Ödənilməyib",      "Unpaid")],
    ["refunded", tr("Qaytarılıb",       "Refunded")],
  ];

  const sortOptions: [string, string][] = [
    ["newest",  tr("Ən yeni",          "Newest First")],
    ["oldest",  tr("Ən köhnə",         "Oldest First")],
    ["highest", tr("Ən yüksək məbləğ", "Highest Total")],
    ["lowest",  tr("Ən aşağı məbləğ",  "Lowest Total")],
  ];

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">

        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl font-semibold text-gray-900 dark:text-white">
            {tr("Veb Sifarişlər", "Web Orders")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {tr("Saytdan gələn sifarişlər", "Orders coming from your website")}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: tr("Ümumi Gəlir", "Total Revenue"), value: `${totalRevenue.toFixed(2)} ₼`, icon: CreditCard, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: tr("Gözləyən",    "Pending"),        value: pendingCount,                    icon: Clock,        color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
            { label: tr("Tamamlanan",  "Completed"),      value: completedCount,                  icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 flex items-center gap-3">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Ad, e-poçt və ya sifariş nömrəsinə görə axtar…", "Search by name, email or order ID…")}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                { value: filterStatus,  set: setFilterStatus,  options: filterStatusOptions },
                { value: filterPayment, set: setFilterPayment, options: filterPaymentOptions },
                { value: sortBy,        set: setSortBy,        options: sortOptions },
              ].map((f, fi) => (
                <div key={fi} className="relative">
                  <select value={f.value} onChange={e => f.set(e.target.value)}
                    className="appearance-none pl-3 pr-7 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-400 cursor-pointer">
                    {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              ))}
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("PDF ixrac et", "Export PDF")}>
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Excel ixrac et", "Export Excel")}>
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Yenilə", "Refresh")}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center">
                      <ShoppingBag className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
                      <p className="text-xs text-gray-400">{tr("Sifariş tapılmadı", "No orders found")}</p>
                    </td>
                  </tr>
                ) : pagedOrders.map((order, i) => {
                  const qty = totalQty(order);
                  return (
                    <tr key={order.id} className={cn(
                      "border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors",
                      i % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10"
                    )}>

                      {/* Order ref + date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white">{order.reference}</p>
                        <p className="text-[10px] text-gray-400">{order.date}</p>
                      </td>

                      {/* Customer */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{order.customer.name}</p>
                        <div className="flex flex-col gap-0.5 mt-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Mail className="w-2.5 h-2.5 shrink-0" /> {order.customer.email}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-gray-400">
                            <Phone className="w-2.5 h-2.5 shrink-0" /> {order.customer.phone}
                          </div>
                        </div>
                      </td>

                      {/* Address */}
                      <td className="px-4 py-3">
                        <div className="flex items-start gap-1 text-[10px] text-gray-500 dark:text-gray-400 max-w-[160px]">
                          <MapPin className="w-2.5 h-2.5 shrink-0 mt-0.5 text-gray-400" />
                          <span className="leading-tight">{order.shipping.address}, {order.shipping.city}</span>
                        </div>
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                          {qty} {tr("məhsul", qty === 1 ? "item" : "items")}
                        </span>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{order.grandTotal.toFixed(2)} ₼</span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusPill orderId={order.id} status={order.status} onChange={handleStatusChange} />
                      </td>

                      {/* Payment status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <PaymentStatusPill
                          orderId={order.id}
                          paymentStatus={order.paymentStatus}
                          paymentMethod={order.paymentMethod}
                          onChange={handlePaymentStatusChange}
                        />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          onClick={() => setDetailOrder(order)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          title={tr("Ətraflı bax", "View details")}
                        >
                          <Eye className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="px-4 py-2.5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
              <DataPagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                showText={dataPaginationShowText(tr)}
              />
            </div>
          )}
        </div>
      </div>

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onStatusChange={handleStatusChange}
          onPaymentStatusChange={handlePaymentStatusChange}
        />
      )}
    </div>
  );
}
