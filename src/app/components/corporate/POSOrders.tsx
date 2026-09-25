import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { cn } from "../ui/utils";
import {
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  Eye,
  Edit2,
  Trash2,
  Plus,
  Download,
  CheckCircle2,
  ChefHat,
  Columns3,
  Keyboard,
  Check,
  X,
} from "lucide-react";
import { TouchKeyboard } from "../ui/TouchKeyboard";
import {
  useLastPointerType,
  usePrefersTouchKeyboard,
} from "../../hooks/usePrefersTouchKeyboard";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { AddSalesModal } from "./AddSalesModal";
import { SaleDetailModal } from "./SaleDetailModal";
import { CreatePaymentModal } from "./CreatePaymentModal";
import {
  fetchPosOrders,
  deletePosOrder,
  recordPosOrderPayment,
  fetchPosOrder,
  sendHeldPosOrderToKot,
  updatePosOrderProductionStatus,
  acceptQrPosOrder,
  rejectQrPosOrder,
  type PosOrderListRow,
  type ProductionStatusApi,
} from "../../api/sales";
import { ApiError } from "../../api/client";
import { fetchTenantSettings } from "../../api/tenantSettings";
import {
  formatSalesDate,
  mapPaymentMethodToApi,
  isDraftOrderStatus,
  formatOrderDisplayId,
  orderSourceTag,
  type PosUiPaymentMethod,
} from "../../lib/salesMappers";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";
import { APP_LOGO_LIGHT } from "../../lib/branding";
import { getCompanyLogoUrl } from "../../lib/userDisplay";
import { printPosOrderTicket } from "../../lib/posPrint";
import { updateWebOrderApi } from "../../api/website";
import type { WebOrder } from "../../../modules/my-website/features/orders/types";
import {
  WebStatusPill,
  WebPaymentStatusPill,
  WebOrderDetailModal,
  StatusPillDropdown,
  type StatusPillOption,
} from "../../../modules/my-website/features/orders/WebOrderUi";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import { ModernSelect } from "../ui/ModernSelect";
import { InvoicePreviewModal } from "./InvoicePreviewModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";

function isWebOrder(order: PosOrderListRow): boolean {
  return String(order.source ?? "").toUpperCase() === "WEB";
}

function webStatusFromOrder(order: PosOrderListRow): WebOrder["status"] {
  if (order.web?.status) return order.web.status;
  const s = String(order.status ?? "").toLowerCase();
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("complete")) return "completed";
  if (s.includes("process") || s.includes("pending")) return "pending";
  return "pending";
}

function webPaymentStatusFromOrder(order: PosOrderListRow): WebOrder["paymentStatus"] {
  if (order.web?.paymentStatus) return order.web.paymentStatus;
  const p = String(order.paymentStatus ?? "").toLowerCase().replace(/\s+/g, "_");
  if (p.includes("refund")) return "refunded";
  if (p === "paid" || p.endsWith("_paid") || p.includes("partial")) return "paid";
  if (p.includes("unpaid") || p.includes("overdue")) return "unpaid";
  return "unpaid";
}

function formatWebOrderDate(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function webOrderFromPosDetail(
  detail: Awaited<ReturnType<typeof fetchPosOrder>>,
  listRow?: PosOrderListRow,
): WebOrder {
  const web = detail.web ?? listRow?.web;
  return {
    id: detail.id,
    reference: detail.reference,
    date: formatWebOrderDate(detail.date),
    status: (web?.status as WebOrder["status"]) ?? "pending",
    paymentStatus: (web?.paymentStatus as WebOrder["paymentStatus"]) ?? "unpaid",
    paymentMethod: (web?.paymentMethod as WebOrder["paymentMethod"]) ?? "cod",
    grandTotal: parseFloat(detail.grandTotal) || listRow?.grandTotal || 0,
    customer: web?.customer ?? {
      name: detail.customerName ?? "—",
      email: "",
      phone: "",
    },
    shipping: web?.shipping ?? {
      address: "—",
      city: "",
      country: "",
      postalCode: "",
    },
    items: detail.items.map((i) => ({
      name: i.productName,
      qty: i.quantity,
      price: parseFloat(i.price) || 0,
    })),
  };
}

type OrdersColumnKey =
  | "customer"
  | "id"
  | "date"
  | "source"
  | "table"
  | "kot"
  | "production"
  | "status"
  | "grandTotal"
  | "paid"
  | "due"
  | "paymentStatus"
  | "biller";

const ORDERS_COLUMNS_STORAGE_KEY = "inflero-orders-visible-columns";

const DEFAULT_ORDERS_COLUMNS: Record<OrdersColumnKey, boolean> = {
  customer: true,
  id: true,
  date: true,
  source: true,
  table: true,
  kot: true,
  production: true,
  status: true,
  grandTotal: true,
  paid: true,
  due: true,
  paymentStatus: true,
  biller: true,
};

function loadOrdersColumns(): Record<OrdersColumnKey, boolean> {
  try {
    const raw = localStorage.getItem(ORDERS_COLUMNS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ORDERS_COLUMNS };
    const parsed = JSON.parse(raw) as Partial<Record<OrdersColumnKey, boolean>>;
    return { ...DEFAULT_ORDERS_COLUMNS, ...parsed };
  } catch {
    return { ...DEFAULT_ORDERS_COLUMNS };
  }
}
export function POSOrders() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated, hasModule, user } = useAuth();
  const posEnabled = hasModule("POS");
  const diningEnabled = hasModule("DINING");
  const webEditorEnabled = hasModule("WEB_EDITOR");
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Sales");
  const branchRevision = useBranchRevision();
  const prefersTouchKeyboard = usePrefersTouchKeyboard();
  const lastPointerType = useLastPointerType();
  const { customers } = useSalesCustomers("", true);
  const askConfirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [qrActionBusyId, setQrActionBusyId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [touchKbOpen, setTouchKbOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [selectedSource, setSelectedSource] = useState(() => {
    const s = new URLSearchParams(window.location.search).get("source");
    return s === "WEB" || s === "POS" || s === "QR_MENU" ? s : "all";
  });

  useEffect(() => {
    if (selectedSource === "WEB" && !webEditorEnabled) setSelectedSource("all");
    if (selectedSource === "QR_MENU" && !diningEnabled) setSelectedSource("all");
  }, [selectedSource, webEditorEnabled, diningEnabled]);

  const [selectedKotStatus, setSelectedKotStatus] = useState("all");
  const [selectedProductionStatus, setSelectedProductionStatus] = useState("all");
  const [posSendToProductionEnabled, setPosSendToProductionEnabled] = useState(false);
  const [updatingProductionId, setUpdatingProductionId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("last7days");
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<OrdersColumnKey, boolean>>(loadOrdersColumns);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);
  const [isInvoicePreviewOpen, setIsInvoicePreviewOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [invoicePreviewOrderId, setInvoicePreviewOrderId] = useState<string | null>(null);
  const [webDetailOrder, setWebDetailOrder] = useState<WebOrder | null>(null);
  const [orders, setOrders] = useState<PosOrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const openTouchKb = (force = false) => {
    const fromTouch =
      lastPointerType.current === "touch" || lastPointerType.current === "pen";
    if (force || prefersTouchKeyboard || fromTouch) {
      setTouchKbOpen(true);
    }
  };

  useEffect(() => {
    if (!posSendToProductionEnabled && selectedProductionStatus !== "all") {
      setSelectedProductionStatus("all");
    }
  }, [posSendToProductionEnabled, selectedProductionStatus]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    debouncedSearch,
    selectedCustomer,
    selectedStatus,
    selectedPaymentStatus,
    selectedSource,
    selectedKotStatus,
    selectedProductionStatus,
    sortBy,
  ]);

  useEffect(() => {
    if (!(isAuthenticated || isDemo)) {
      setPosSendToProductionEnabled(false);
      return;
    }
    let cancelled = false;
    fetchTenantSettings()
      .then((s) => {
        if (!cancelled) setPosSendToProductionEnabled(s.posSendToProductionEnabled === true);
      })
      .catch(() => {
        if (!cancelled) setPosSendToProductionEnabled(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemo, branchRevision]);

  const showProductionColumn = posSendToProductionEnabled && visibleColumns.production;

  const col = (key: OrdersColumnKey) => visibleColumns[key];

  const toggleColumn = (key: OrdersColumnKey) => {
    setVisibleColumns((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(ORDERS_COLUMNS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const columnLabels = useMemo(
    (): { key: OrdersColumnKey; label: string; available: boolean }[] => [
      { key: "customer", label: tr("Müştəri", "Customer"), available: true },
      { key: "id", label: "ID", available: true },
      { key: "date", label: tr("Tarix", "Date"), available: true },
      { key: "source", label: tr("Mənbə", "Source"), available: true },
      { key: "table", label: tr("Masa", "Table"), available: diningEnabled },
      { key: "kot", label: "KOT", available: diningEnabled },
      { key: "production", label: tr("İstehsal", "Production"), available: posSendToProductionEnabled },
      { key: "status", label: tr("Status", "Status"), available: true },
      { key: "grandTotal", label: tr("Ümumi", "Total"), available: true },
      { key: "paid", label: tr("Ödənilib", "Paid"), available: true },
      { key: "due", label: tr("Borc", "Due"), available: true },
      { key: "paymentStatus", label: tr("Ödəniş", "Payment"), available: true },
      { key: "biller", label: tr("Kassir", "Biller"), available: true },
    ],
    [language, diningEnabled, posSendToProductionEnabled],
  );

  useEffect(() => {
    if (!columnsOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target as Node)) {
        setColumnsOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [columnsOpen]);

  const visibleColCount =
    (col("customer") ? 1 : 0) +
    (col("id") ? 1 : 0) +
    (col("date") ? 1 : 0) +
    (col("source") ? 1 : 0) +
    (diningEnabled && col("table") ? 1 : 0) +
    (diningEnabled && col("kot") ? 1 : 0) +
    (showProductionColumn ? 1 : 0) +
    (col("status") ? 1 : 0) +
    (col("grandTotal") ? 1 : 0) +
    (col("paid") ? 1 : 0) +
    (col("due") ? 1 : 0) +
    (col("paymentStatus") ? 1 : 0) +
    (col("biller") ? 1 : 0) +
    1; // actions

  const loadItems = useCallback(async (opts?: { silent?: boolean }) => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setOrders([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    if (!opts?.silent) setLoading(true);
    try {
      const data = await fetchPosOrders({
        search: debouncedSearch.trim() || undefined,
        customerId: selectedCustomer !== "all" ? selectedCustomer : undefined,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        source: selectedSource,
        sortBy,
        page: currentPage,
        pageSize: itemsPerPage,
        ...(diningEnabled ? { kotStatus: selectedKotStatus } : {}),
        ...(posSendToProductionEnabled
          ? { productionStatus: selectedProductionStatus }
          : {}),
      });
      setOrders(
        (data.items ?? []).filter((o) => {
          const src = String(o.source ?? "POS").toUpperCase();
          if (src === "WEB" && !webEditorEnabled) return false;
          if (src === "QR_MENU" && !diningEnabled) return false;
          return true;
        }),
      );
      setTotalItems(data.total ?? 0);
      const pages = Math.max(1, data.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      if (!opts?.silent) {
        notifyFromError(err, tr("Sifarişləri yükləmək alınmadı", "Failed to load orders"));
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedCustomer,
    selectedStatus,
    selectedPaymentStatus,
    selectedSource,
    selectedKotStatus,
    selectedProductionStatus,
    posSendToProductionEnabled,
    diningEnabled,
    webEditorEnabled,
    sortBy,
    branchRevision,
    currentPage,
    itemsPerPage,
    language,
  ]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if ((!diningEnabled && !webEditorEnabled) || !(isAuthenticated || isDemo) || !canView) return;
    const id = window.setInterval(() => {
      void loadItems({ silent: true });
    }, 8000);
    return () => window.clearInterval(id);
  }, [diningEnabled, webEditorEnabled, isAuthenticated, isDemo, canView, loadItems]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await fetchPosOrder(orderId);
        if (cancelled) return;
        if (detail.source === "WEB") {
          setWebDetailOrder(webOrderFromPosDetail(detail));
        } else {
          setSelectedOrderId(orderId);
          setIsSaleDetailModalOpen(true);
        }
      } catch (err) {
        if (!cancelled) notifyFromError(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "pending":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "cancelled":
      case "canceled":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "held":
      case "draft":
        return "bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    const key = status.toLowerCase().replace(/\s+/g, "_");
    switch (key) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "overdue":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "partial":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "unpaid":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "refunded":
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300";
      case "partially_refunded":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getProductionStatusColor = (status: string) => {
    switch (status) {
      case "IN_PROCESSING":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      case "IN_PRODUCTION":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "COMPLETED":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const statusPillClass =
    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight";

  const translateStatus = (status: string) => {
    const key = status.toLowerCase();
    const statusMap: Record<string, string> = {
      completed: tr("Tamamlandı", "Completed"),
      pending: tr("Gözləyir", "Pending"),
      cancelled: tr("Ləğv Edildi", "Cancelled"),
      canceled: tr("Ləğv Edildi", "Cancelled"),
      held: tr("Qaralama", "Draft"),
      draft: tr("Qaralama", "Draft"),
      processing: tr("İşlənir", "Processing"),
    };
    return statusMap[key] || status;
  };

  const translatePaymentStatus = (status: string) => {
    const key = status.toLowerCase().replace(/\s+/g, "_");
    const statusMap: Record<string, string> = {
      paid: tr("Ödənilib", "Paid"),
      unpaid: tr("Ödənilməyib", "Unpaid"),
      overdue: tr("Gecikmiş", "Overdue"),
      partial: tr("Qismən", "Partial"),
      refunded: tr("Qaytarılıb", "Refunded"),
      partially_refunded: tr("Qismən qaytarılıb", "Partially Refunded"),
    };
    return statusMap[key] || status;
  };

  const translateProductionStatus = (status: string | null | undefined) => {
    if (!status) return "—";
    if (status === "IN_PROCESSING") return tr("Emaldadır", "In Processing");
    if (status === "IN_PRODUCTION") return tr("İstehsaldadır", "In Production");
    if (status === "COMPLETED") return tr("Tamamlandı", "Completed");
    return status;
  };

  const productionStatusOptions = (current: string): ProductionStatusApi[] => {
    if (current === "IN_PROCESSING") return ["IN_PROCESSING", "IN_PRODUCTION", "COMPLETED"];
    if (current === "IN_PRODUCTION") return ["IN_PRODUCTION", "COMPLETED"];
    return ["COMPLETED"];
  };

  const handleProductionStatusChange = async (orderId: string, status: ProductionStatusApi) => {
    if (!canEdit || isDemo) return;
    setUpdatingProductionId(orderId);
    try {
      await updatePosOrderProductionStatus(orderId, status);
      notifySuccess(tr("İstehsal statusu yeniləndi", "Production status updated"));
      await loadItems({ silent: true });
    } catch (err) {
      notifyFromError(err, tr("İstehsal statusu yenilənmədi", "Failed to update production status"));
    } finally {
      setUpdatingProductionId(null);
    }
  };

  const loadExportRows = async () => {
    const data = await fetchPosOrders({
      search: debouncedSearch.trim() || undefined,
      customerId: selectedCustomer !== "all" ? selectedCustomer : undefined,
      status: selectedStatus,
      paymentStatus: selectedPaymentStatus,
      sortBy,
      page: 1,
      pageSize: 200,
    });
    return data.items ?? [];
  };

  const handleExportPDF = async () => {
    try {
      const exportOrders = await loadExportRows();
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(tr("Sifarişlər", "Orders"), 14, 15);
      doc.setFontSize(10);
      doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDate(language)}`, 14, 22);
      autoTable(doc, {
        head: [
          [
            tr("Müştəri", "Customer"),
            "ID",
            tr("Tarix", "Date"),
            tr("Mənbə", "Source"),
            tr("Status", "Status"),
            tr("Ümumi", "Total"),
            tr("Ödənilib", "Paid"),
            tr("Borc", "Due"),
            tr("Ödəniş", "Payment"),
            tr("Kassir", "Biller"),
          ],
        ],
        body: exportOrders.map((order) => [
          order.customerName,
          formatOrderDisplayId(order.reference, order.storeName, order.storeCode),
          formatSalesDate(order.date),
          order.sentToBar ? "BAR" : orderSourceTag(order.source, !!order.table),
          order.status,
          String(order.grandTotal),
          String(order.paid),
          String(order.due),
          order.paymentStatus,
          order.biller,
        ]),
        startY: 28,
        theme: "grid",
        headStyles: { fillColor: [20, 184, 166], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
      });
      doc.save(`orders_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportOrders = await loadExportRows();
      const headers = [
        tr("Müştəri", "Customer"),
        "ID",
        tr("Tarix", "Date"),
        tr("Mənbə", "Source"),
        tr("Status", "Status"),
        tr("Ümumi", "Total"),
        tr("Ödənilib", "Paid"),
        tr("Borc", "Due"),
        tr("Ödəniş", "Payment"),
        tr("Kassir", "Biller"),
      ];
      const rows = exportOrders.map((order) => [
        order.customerName,
        formatOrderDisplayId(order.reference, order.storeName, order.storeCode),
        formatSalesDate(order.date),
        order.sentToBar ? "BAR" : orderSourceTag(order.source, !!order.table),
        order.status,
        order.grandTotal,
        order.paid,
        order.due,
        order.paymentStatus,
        order.biller,
      ]);
      let csvContent = headers.join(";") + "\n";
      rows.forEach((row) => {
        csvContent += row.join(";") + "\n";
      });
      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `orders_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadItems();
    setIsRefreshing(false);
  };

  const isPendingQrOrder = (order: PosOrderListRow) =>
    order.source === "QR_MENU" &&
    !order.kotStatus &&
    (order.status === "Pending" || order.status === "Draft" || isDraftOrderStatus(order.status));

  const handleAcceptQrFromOrders = async (orderId: string) => {
    if (!canEdit || isDemo) return;
    setQrActionBusyId(orderId);
    try {
      await acceptQrPosOrder(orderId);
      notifySuccess(tr("QR sifariş qəbul edildi", "QR order accepted"));
      navigate(`/dashboard/sales/pos?acceptOrder=${encodeURIComponent(orderId)}`);
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
      await loadItems();
    } finally {
      setQrActionBusyId(null);
    }
  };

  const handleRejectQrFromOrders = async (orderId: string) => {
    if (!canEdit || isDemo) return;
    const ok = await askConfirm({
      title: tr("QR sifarişi rədd et?", "Reject QR order?"),
      message: tr(
        "Bu sifariş ləğv olunacaq və müştəriyə göstəriləcək.",
        "This order will be cancelled and shown to the guest.",
      ),
      confirmLabel: tr("Rədd et", "Reject"),
    });
    if (!ok) return;
    setQrActionBusyId(orderId);
    try {
      await rejectQrPosOrder(orderId);
      notifySuccess(tr("QR sifariş rədd edildi", "QR order rejected"));
      await loadItems();
    } catch (err) {
      notifyFromError(err);
      await loadItems();
    } finally {
      setQrActionBusyId(null);
    }
  };

  const handleAddSales = () => {
    if (!posEnabled || !canCreate || isDemo) return;
    setIsAddSalesModalOpen(true);
  };

  const handleViewSaleDetail = (orderId: string) => {
    const row = orders.find((o) => o.id === orderId);
    if (row && isWebOrder(row)) {
      void (async () => {
        try {
          const detail = await fetchPosOrder(orderId);
          setWebDetailOrder(webOrderFromPosDetail(detail, row));
        } catch (err) {
          notifyFromError(err, tr("Sifariş detalları yüklənmədi", "Failed to load order detail"));
        }
      })();
      return;
    }
    setSelectedOrderId(orderId);
    setIsSaleDetailModalOpen(true);
  };

  const handleWebStatusChange = async (id: string, status: WebOrder["status"]) => {
    try {
      const updated = await updateWebOrderApi(id, { status });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                web: {
                  status: updated.status,
                  paymentStatus: updated.paymentStatus,
                  paymentMethod: updated.paymentMethod,
                  customer: updated.customer,
                  shipping: updated.shipping,
                },
                customerName: updated.customer.name || o.customerName,
              }
            : o,
        ),
      );
      setWebDetailOrder((prev) =>
        prev?.id === id
          ? {
              ...prev,
              status: updated.status,
              paymentStatus: updated.paymentStatus,
              paymentMethod: updated.paymentMethod,
              customer: updated.customer,
              shipping: updated.shipping,
              items: updated.items,
              grandTotal: updated.grandTotal,
            }
          : prev,
      );
      notifySuccess(tr("Status yeniləndi", "Status updated"));
    } catch (err) {
      notifyFromError(err, tr("Status yenilənmədi", "Failed to update status"));
    }
  };

  const handleWebPaymentStatusChange = async (
    id: string,
    paymentStatus: WebOrder["paymentStatus"],
  ) => {
    try {
      const updated = await updateWebOrderApi(id, { paymentStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                web: {
                  status: updated.status,
                  paymentStatus: updated.paymentStatus,
                  paymentMethod: updated.paymentMethod,
                  customer: updated.customer,
                  shipping: updated.shipping,
                },
              }
            : o,
        ),
      );
      setWebDetailOrder((prev) =>
        prev?.id === id
          ? {
              ...prev,
              status: updated.status,
              paymentStatus: updated.paymentStatus,
              paymentMethod: updated.paymentMethod,
            }
          : prev,
      );
      notifySuccess(tr("Ödəniş statusu yeniləndi", "Payment status updated"));
    } catch (err) {
      notifyFromError(err, tr("Ödəniş statusu yenilənmədi", "Failed to update payment status"));
    }
  };

  const closeSaleDetailModal = () => {
    setIsSaleDetailModalOpen(false);
    if (searchParams.get("orderId")) {
      const next = new URLSearchParams(searchParams);
      next.delete("orderId");
      setSearchParams(next, { replace: true });
    }
  };

  const handleEditSale = (orderId: string) => {
    if (!posEnabled || !canEdit || isDemo) return;
    navigate(`/dashboard/sales/pos?orderId=${encodeURIComponent(orderId)}`);
  };

  const handleCreatePayment = (orderId: string) => {
    if (!canCreate || isDemo) return;
    const row = orders.find((o) => o.id === orderId);
    if (row && isDraftOrderStatus(row.status)) {
      notifyFromError(
        new Error(tr("Əvvəlcə qaralamanı tamamlayın", "Finalize the draft before recording a payment")),
      );
      return;
    }
    const payKey = (row?.paymentStatus ?? "").toLowerCase().replace(/\s+/g, "_");
    if (payKey === "refunded") {
      notifyFromError(
        new Error(tr("Tam qaytarılmış sifarişə ödəniş yazıla bilməz", "Cannot record payment on a fully refunded order")),
      );
      return;
    }
    setSelectedOrderId(orderId);
    setIsCreatePaymentModalOpen(true);
  };

  const handleSavePayment = async (paymentData: {
    date: string;
    amount: number;
    paymentMethod: string;
    reference: string;
    note: string;
  }) => {
    if (!canCreate || isDemo || !selectedOrderId) return;
    const methodMap: Record<string, PosUiPaymentMethod> = {
      Cash: "cash",
      Card: "card",
    };
    const uiMethod = methodMap[paymentData.paymentMethod] ?? "cash";
    try {
      await recordPosOrderPayment(selectedOrderId, {
        amount: paymentData.amount,
        method: mapPaymentMethodToApi(uiMethod),
        reference: paymentData.reference || null,
        note: paymentData.note || null,
      });
      notifySuccess(tr("Ödəniş uğurla yaradıldı", "Payment created successfully"));
      await loadItems();
    } catch (err) {
      notifyFromError(err, tr("Ödəniş yaradıla bilmədi", "Failed to create payment"));
      throw err;
    }
  };

  const handleDeleteSale = async (order: PosOrderListRow) => {
    if (!canDelete || isDemo) return;
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu satışı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this sale?"),
      variant: "danger",
    }))) {
      return;
    }
    try {
      await deletePosOrder(order.id);
      notifySuccess(tr("Satış silindi", "Sale deleted"));
      await loadItems();
    } catch (err) {
      notifyFromError(err, tr("Satış silinə bilmədi", "Failed to delete sale"));
    }
  };

  const handleOpenInvoicePreview = (order: PosOrderListRow) => {
    setInvoicePreviewOrderId(order.id);
    setIsInvoicePreviewOpen(true);
  };

  const emptyMessage = tr("Sifariş tapılmadı.", "No orders found.");

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Sifarişlər", "Orders")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Sifarişlərinizi idarə edin", "Manage your orders")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm sm:min-w-[220px] shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                inputMode="none"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => openTouchKb()}
                className="w-full pl-9 pr-10 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-[#14b8a6]"
                title={tr("Klaviatura", "Keyboard")}
                onClick={() => openTouchKb(true)}
              >
                <Keyboard className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex gap-2 flex-wrap sm:justify-end shrink-0">
              <div className="relative" ref={columnsMenuRef}>
                <button
                  type="button"
                  onClick={() => setColumnsOpen((v) => !v)}
                  className="flex items-center justify-center w-8 h-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title={tr("Sütunlar", "Columns")}
                >
                  <Columns3 className="w-3.5 h-3.5" />
                </button>
                {columnsOpen && (
                  <div className="absolute right-0 top-full mt-1 z-30 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 max-h-72 overflow-y-auto">
                    <p className="px-3 pb-1 text-[10px] uppercase tracking-wider text-gray-400">
                      {tr("Sütunlar", "Columns")}
                    </p>
                    {columnLabels
                      .filter((c) => c.available)
                      .map((c) => (
                        <label
                          key={c.key}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[c.key]}
                            onChange={() => toggleColumn(c.key)}
                            className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                          />
                          {c.label}
                        </label>
                      ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleExportPDF}
                disabled={orders.length === 0}
                className="flex items-center justify-center w-8 h-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={orders.length === 0}
                className="flex items-center justify-center w-8 h-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Excel İxrac Et", "Export Excel")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center justify-center w-8 h-8 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>

              {posEnabled && canCreate && (
                <button
                  type="button"
                  onClick={handleAddSales}
                  disabled={isDemo}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Satış Əlavə Et", "Add Sales")}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap items-center">
              <ModernSelect
                value={selectedCustomer}
                onChange={setSelectedCustomer}
                placeholder={tr("Müştəri", "Customer")}
                className="w-[160px]"
                minWidth={160}
                options={[
                  { value: "all", label: tr("Müştəri", "Customer") },
                  ...customers.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />

              <ModernSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                placeholder={tr("Status", "Status")}
                className="w-[130px]"
                minWidth={130}
                options={[
                  { value: "all", label: tr("Status", "Status") },
                  { value: "completed", label: tr("Tamamlandı", "Completed") },
                  { value: "pending", label: tr("Gözləyir", "Pending") },
                  { value: "cancelled", label: tr("Ləğv Edildi", "Cancelled") },
                  { value: "held", label: tr("Qaralama", "Draft") },
                ]}
              />

              <ModernSelect
                value={selectedPaymentStatus}
                onChange={setSelectedPaymentStatus}
                placeholder={tr("Ödəniş", "Payment")}
                className="w-[140px]"
                minWidth={140}
                options={[
                  { value: "all", label: tr("Ödəniş", "Payment") },
                  { value: "paid", label: tr("Ödənilib", "Paid") },
                  { value: "partial", label: tr("Qismən", "Partial") },
                  { value: "overdue", label: tr("Gecikmiş", "Overdue") },
                  { value: "unpaid", label: tr("Ödənilməyib", "Unpaid") },
                  { value: "partially_refunded", label: tr("Qismən qaytarılıb", "Partially Refunded") },
                  { value: "refunded", label: tr("Qaytarılıb", "Refunded") },
                ]}
              />

              <ModernSelect
                value={selectedSource}
                onChange={setSelectedSource}
                placeholder={tr("Mənbə", "Source")}
                className="w-[120px]"
                minWidth={120}
                options={[
                  { value: "all", label: tr("Mənbə", "Source") },
                  { value: "POS", label: "POS" },
                  ...(webEditorEnabled
                    ? [{ value: "WEB", label: "Web" }]
                    : []),
                  ...(diningEnabled
                    ? [{ value: "QR_MENU", label: tr("QR Menyu", "QR Menu") }]
                    : []),
                ]}
              />
              {diningEnabled && (
                <ModernSelect
                  value={selectedKotStatus}
                  onChange={setSelectedKotStatus}
                  placeholder={tr("KOT Status", "KOT Status")}
                  className="w-[130px]"
                  minWidth={130}
                  options={[
                    { value: "all", label: tr("KOT Status", "KOT Status") },
                    { value: "none", label: tr("KOT yox", "No KOT") },
                    { value: "PENDING", label: "PENDING" },
                    { value: "PREPARING", label: "PREPARING" },
                    { value: "READY", label: "READY" },
                    { value: "SERVED", label: "SERVED" },
                  ]}
                />
              )}

              {posSendToProductionEnabled && (
                <ModernSelect
                  value={selectedProductionStatus}
                  onChange={setSelectedProductionStatus}
                  placeholder={tr("İstehsal statusu", "Production")}
                  className="w-[140px]"
                  minWidth={140}
                  options={[
                    { value: "all", label: tr("İstehsal statusu", "Production") },
                    { value: "none", label: tr("İstehsal yox", "No production") },
                    {
                      value: "IN_PROCESSING",
                      label: tr("Emaldadır", "In Processing"),
                    },
                    {
                      value: "IN_PRODUCTION",
                      label: tr("İstehsaldadır", "In Production"),
                    },
                    { value: "COMPLETED", label: tr("Tamamlandı", "Completed") },
                  ]}
                />
              )}

              <ModernSelect
                value={sortBy}
                onChange={setSortBy}
                placeholder={tr("Sırala", "Sort")}
                className="w-[140px]"
                minWidth={140}
                options={[
                  { value: "last7days", label: tr("Sırala: 7 gün", "Sort: 7 days") },
                  { value: "last30days", label: tr("Sırala: 30 gün", "Sort: 30 days") },
                  { value: "last90days", label: tr("Sırala: 90 gün", "Sort: 90 days") },
                  { value: "thisyear", label: tr("Sırala: Bu il", "Sort: This year") },
                ]}
              />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  {col("customer") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("MÜŞTƏRİ", "CUSTOMER")}
                    </th>
                  )}
                  {col("id") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      ID
                    </th>
                  )}
                  {col("date") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("TARİX", "DATE")}
                    </th>
                  )}
                  {col("source") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("MƏNBƏ", "SOURCE")}
                    </th>
                  )}
                  {diningEnabled && col("table") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("MASA", "TABLE")}
                    </th>
                  )}
                  {diningEnabled && col("kot") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      KOT
                    </th>
                  )}
                  {showProductionColumn && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("İSTEHSAL", "PRODUCTION")}
                    </th>
                  )}
                  {col("status") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("STATUS", "STATUS")}
                    </th>
                  )}
                  {col("grandTotal") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("ÜMUMİ", "TOTAL")}
                    </th>
                  )}
                  {col("paid") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("ÖDƏNİLİB", "PAID")}
                    </th>
                  )}
                  {col("due") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("BORC", "DUE")}
                    </th>
                  )}
                  {col("paymentStatus") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("ÖDƏNİŞ", "PAYMENT")}
                    </th>
                  )}
                  {col("biller") && (
                    <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                      {tr("KASSİR", "BILLER")}
                    </th>
                  )}
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={visibleColCount} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={visibleColCount} className="px-4 py-8 text-center text-xs text-gray-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => {
                    const sourceTag = orderSourceTag(order.source);
                    const sourceBadgeClass =
                      sourceTag === "POS"
                        ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200 border-teal-200 dark:border-teal-800"
                        : sourceTag === "QR Menu"
                          ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200 border-amber-200 dark:border-amber-800"
                          : "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200 border-sky-200 dark:border-sky-800";
                    const iconBtn =
                      "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors disabled:opacity-40";

                    return (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-75 ${
                        isPendingQrOrder(order)
                          ? "bg-orange-50/80 dark:bg-orange-950/20 ring-1 ring-inset ring-orange-200 dark:ring-orange-900"
                          : index % 2 === 0
                            ? "bg-white dark:bg-gray-900"
                            : "bg-gray-50/30 dark:bg-gray-800/10"
                      }`}
                    >
                      {col("customer") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {isWebOrder(order)
                            ? order.web?.customer.name || order.customerName
                            : order.customerName}
                          {isWebOrder(order) && order.web?.customer.phone ? (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {order.web.customer.phone}
                            </p>
                          ) : null}
                        </td>
                      )}
                      {col("id") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {formatOrderDisplayId(order.reference, order.storeName, order.storeCode)}
                        </td>
                      )}
                      {col("date") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {formatSalesDate(order.date)}
                        </td>
                      )}
                      {col("source") && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {order.sentToBar ? (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight border",
                                "bg-violet-50 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200 border-violet-200 dark:border-violet-800",
                              )}
                            >
                              BAR
                            </span>
                          ) : (
                            <span
                              className={cn(
                                "inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium leading-tight border",
                                sourceBadgeClass,
                              )}
                            >
                              {sourceTag === "QR Menu"
                                ? tr("QR Menyu", "QR Menu")
                                : sourceTag === "Web"
                                  ? "Web"
                                  : "POS"}
                            </span>
                          )}
                        </td>
                      )}
                      {diningEnabled && col("table") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {order.table ? `#${order.table.number}` : "—"}
                        </td>
                      )}
                      {diningEnabled && col("kot") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {order.kotStatus ?? "—"}
                        </td>
                      )}
                      {showProductionColumn && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {order.productionStatus && canEdit && !isDemo ? (
                            <StatusPillDropdown
                              value={order.productionStatus as ProductionStatusApi}
                              disabled={updatingProductionId === order.id}
                              title={tr(
                                "İstehsal statusunu dəyişmək üçün klikləyin",
                                "Click to change production status",
                              )}
                              options={productionStatusOptions(order.productionStatus).map(
                                (s): StatusPillOption<ProductionStatusApi> => ({
                                  value: s,
                                  label: translateProductionStatus(s),
                                  colorClass: getProductionStatusColor(s),
                                }),
                              )}
                              onChange={(next) =>
                                void handleProductionStatusChange(order.id, next)
                              }
                            />
                          ) : (
                            <span
                              className={cn(
                                statusPillClass,
                                order.productionStatus
                                  ? getProductionStatusColor(order.productionStatus)
                                  : "text-gray-600 dark:text-gray-400",
                              )}
                            >
                              {translateProductionStatus(order.productionStatus)}
                            </span>
                          )}
                        </td>
                      )}
                      {col("status") && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWebOrder(order) ? (
                            <WebStatusPill
                              orderId={order.id}
                              status={webStatusFromOrder(order)}
                              onChange={handleWebStatusChange}
                              disabled={!canEdit || isDemo}
                            />
                          ) : (
                            <span
                              className={cn(
                                statusPillClass,
                                getStatusBadgeColor(order.status),
                              )}
                            >
                              {translateStatus(order.status)}
                            </span>
                          )}
                        </td>
                      )}
                      {col("grandTotal") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {order.grandTotal} ₼
                        </td>
                      )}
                      {col("paid") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {order.paid} ₼
                        </td>
                      )}
                      {col("due") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {order.due.toFixed(2)} ₼
                        </td>
                      )}
                      {col("paymentStatus") && (
                        <td className="px-4 py-3 whitespace-nowrap">
                          {isWebOrder(order) ? (
                            <WebPaymentStatusPill
                              orderId={order.id}
                              paymentStatus={webPaymentStatusFromOrder(order)}
                              paymentMethod={order.web?.paymentMethod ?? "cod"}
                              onChange={handleWebPaymentStatusChange}
                              disabled={!canEdit || isDemo}
                            />
                          ) : (
                            <span
                              className={cn(
                                statusPillClass,
                                getPaymentStatusBadgeColor(order.paymentStatus),
                              )}
                            >
                              {translatePaymentStatus(order.paymentStatus)}
                            </span>
                          )}
                        </td>
                      )}
                      {col("biller") && (
                        <td className="px-4 py-3 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                          {isWebOrder(order)
                            ? order.web?.customer.name || order.customerName
                            : order.biller}
                        </td>
                      )}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-0.5">
                          {diningEnabled &&
                            posEnabled &&
                            canEdit &&
                            isPendingQrOrder(order) && (
                              <>
                                <button
                                  type="button"
                                  className={cn(iconBtn, "text-[#0f766e] dark:text-[#5eead4]")}
                                  title={tr("Qəbul et (POS)", "Accept (POS)")}
                                  disabled={qrActionBusyId === order.id}
                                  onClick={() => void handleAcceptQrFromOrders(order.id)}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  className={cn(iconBtn, "text-red-600 dark:text-red-400")}
                                  title={tr("Rədd et", "Reject")}
                                  disabled={qrActionBusyId === order.id}
                                  onClick={() => void handleRejectQrFromOrders(order.id)}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          <button
                            type="button"
                            className={iconBtn}
                            title={
                              isWebOrder(order)
                                ? tr("Veb sifariş detalları", "Web order detail")
                                : tr("Satış Detalları", "Sale Detail")
                            }
                            onClick={() => handleViewSaleDetail(order.id)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isWebOrder(order) && posEnabled && canEdit && isDraftOrderStatus(order.status) && (
                            <button
                              type="button"
                              className={cn(iconBtn, "text-[#0f766e] dark:text-[#5eead4]")}
                              title={tr("Tamamla", "Finalize")}
                              onClick={() => handleViewSaleDetail(order.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isWebOrder(order) &&
                            diningEnabled &&
                            posEnabled &&
                            canEdit &&
                            order.source !== "QR_MENU" &&
                            isDraftOrderStatus(order.status) &&
                            !order.kotStatus && (
                              <button
                                type="button"
                                className={cn(iconBtn, "text-[#0f766e] dark:text-[#5eead4]")}
                                title={tr("KOT-a göndər", "Send to KOT")}
                                onClick={() => {
                                  void (async () => {
                                    try {
                                      const detail = await sendHeldPosOrderToKot(order.id, {
                                        tableId: order.table?.id ?? null,
                                      });
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
                                        });
                                        notifySuccess(
                                          tr(
                                            "KOT-a göndərildi və mətbəx çapı göndərildi",
                                            "Sent to KOT and kitchen ticket printed",
                                          ),
                                        );
                                      } catch (printErr) {
                                        notifyWarning(
                                          tr(
                                            "KOT-a göndərildi, amma çap alınmadı",
                                            "Sent to KOT, but print failed",
                                          ),
                                        );
                                        notifyFromError(printErr);
                                      }
                                      await loadItems();
                                    } catch (err) {
                                      notifyFromError(err);
                                    }
                                  })();
                                }}
                              >
                                <ChefHat className="w-3.5 h-3.5" />
                              </button>
                            )}
                          {!isWebOrder(order) && posEnabled && canEdit && (
                            <button
                              type="button"
                              className={iconBtn}
                              title={tr("Satışı Redaktə Et", "Edit Sale")}
                              onClick={() => handleEditSale(order.id)}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!isWebOrder(order) && canCreate && !isDraftOrderStatus(order.status) && (
                            <button
                              type="button"
                              className={iconBtn}
                              title={tr("Ödəniş Yarat", "Create Payment")}
                              onClick={() => handleCreatePayment(order.id)}
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            className={iconBtn}
                            title={tr("Qaiməni yüklə", "Download Invoice")}
                            onClick={() => handleOpenInvoicePreview(order)}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {canDelete && (
                            <button
                              type="button"
                              className={cn(iconBtn, "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20")}
                              title={tr("Satışı Sil", "Delete Sale")}
                              onClick={() => void handleDeleteSale(order)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-800">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={dataPaginationShowText(tr)}
            />
          </div>
        </div>
      </div>

      <AddSalesModal
        isOpen={isAddSalesModalOpen}
        onClose={() => setIsAddSalesModalOpen(false)}
        onSaved={() => void loadItems()}
      />

      <SaleDetailModal
        orderId={selectedOrderId}
        isOpen={isSaleDetailModalOpen}
        onClose={closeSaleDetailModal}
        canFinalize={canEdit}
        isDemo={isDemo}
        onFinalized={() => void loadItems()}
      />

      <CreatePaymentModal
        orderId={selectedOrderId}
        isOpen={isCreatePaymentModalOpen}
        onClose={() => setIsCreatePaymentModalOpen(false)}
        onSaved={handleSavePayment}
      />

      <InvoicePreviewModal
        orderId={invoicePreviewOrderId}
        isOpen={isInvoicePreviewOpen}
        onClose={() => {
          setIsInvoicePreviewOpen(false);
          setInvoicePreviewOrderId(null);
        }}
      />

      {webDetailOrder && (
        <WebOrderDetailModal
          order={webDetailOrder}
          onClose={() => {
            setWebDetailOrder(null);
            if (searchParams.get("orderId")) {
              const next = new URLSearchParams(searchParams);
              next.delete("orderId");
              setSearchParams(next, { replace: true });
            }
          }}
          onStatusChange={handleWebStatusChange}
          onPaymentStatusChange={handleWebPaymentStatusChange}
        />
      )}

      {touchKbOpen && (
        <TouchKeyboard
          open
          mode="full"
          value={searchQuery}
          onChange={setSearchQuery}
          onClose={() => setTouchKbOpen(false)}
          title={tr("Axtarış", "Search")}
        />
      )}
    </div>
  );
}
