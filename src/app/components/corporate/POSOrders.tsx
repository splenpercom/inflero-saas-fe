import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router";
import { cn } from "../ui/utils";
import {
  FileSpreadsheet,
  FileText,
  RefreshCw,
  Search,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
  Plus,
  MoreVertical,
  DollarSign,
  Download,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { AddSalesModal } from "./AddSalesModal";
import { SaleDetailModal } from "./SaleDetailModal";
import { EditSaleModal } from "./EditSaleModal";
import { ShowPaymentsModal } from "./ShowPaymentsModal";
import { CreatePaymentModal } from "./CreatePaymentModal";
import {
  fetchPosOrders,
  deletePosOrder,
  recordPosOrderPayment,
  fetchPosOrder,
  type PosOrderListRow,
} from "../../api/sales";
import { formatSalesDate, mapPaymentMethodToApi, type PosUiPaymentMethod } from "../../lib/salesMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";
export function POSOrders() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Sales");
  const branchRevision = useBranchRevision();
  const { customers } = useSalesCustomers("", true);
  const askConfirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState("all");
  const [sortBy, setSortBy] = useState("last7days");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isAddSalesModalOpen, setIsAddSalesModalOpen] = useState(false);
  const [isSaleDetailModalOpen, setIsSaleDetailModalOpen] = useState(false);
  const [isEditSaleModalOpen, setIsEditSaleModalOpen] = useState(false);
  const [isShowPaymentsModalOpen, setIsShowPaymentsModalOpen] = useState(false);
  const [isCreatePaymentModalOpen, setIsCreatePaymentModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<PosOrderListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [paymentsReloadKey, setPaymentsReloadKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = DEFAULT_LIST_PAGE_SIZE;

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedCustomer, selectedStatus, selectedPaymentStatus, sortBy]);

  const loadItems = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setOrders([]);
      setTotalItems(0);
      setTotalPages(1);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await fetchPosOrders({
        search: debouncedSearch.trim() || undefined,
        customerId: selectedCustomer !== "all" ? selectedCustomer : undefined,
        status: selectedStatus,
        paymentStatus: selectedPaymentStatus,
        sortBy,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      setOrders(data.items ?? []);
      setTotalItems(data.total ?? 0);
      const pages = Math.max(1, data.totalPages || 1);
      setTotalPages(pages);
      if (pages > 0 && currentPage > pages) setCurrentPage(pages);
    } catch (err) {
      notifyFromError(err, tr("Sifarişləri yükləmək alınmadı", "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    debouncedSearch,
    selectedCustomer,
    selectedStatus,
    selectedPaymentStatus,
    sortBy,
    branchRevision,
    currentPage,
    itemsPerPage,
  ]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) return;
    setSelectedOrderId(orderId);
    setIsSaleDetailModalOpen(true);
  }, [searchParams]);

  useEffect(() => {
    if (!openMenuId) return;
    const close = () => closeActionMenu();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [openMenuId]);

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
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "overdue":
        return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
      case "partial":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "unpaid":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400";
    }
  };

  const translateStatus = (status: string) => {
    const key = status.toLowerCase();
    const statusMap: Record<string, string> = {
      completed: tr("Tamamlandı", "Completed"),
      pending: tr("Gözləyir", "Pending"),
      cancelled: tr("Ləğv Edildi", "Cancelled"),
      canceled: tr("Ləğv Edildi", "Cancelled"),
      held: tr("Saxlanılıb", "Held"),
      processing: tr("İşlənir", "Processing"),
    };
    return statusMap[key] || status;
  };

  const translatePaymentStatus = (status: string) => {
    const key = status.toLowerCase();
    const statusMap: Record<string, string> = {
      paid: tr("Ödənilib", "Paid"),
      unpaid: tr("Ödənilməyib", "Unpaid"),
      overdue: tr("Gecikmiş", "Overdue"),
      partial: tr("Qismən", "Partial"),
    };
    return statusMap[key] || status;
  };

  const closeActionMenu = () => {
    setOpenMenuId(null);
    setMenuPosition(null);
  };

  const openActionMenu = (orderId: string, button: HTMLButtonElement) => {
    if (openMenuId === orderId) {
      closeActionMenu();
      return;
    }
    const rect = button.getBoundingClientRect();
    const menuWidth = 192;
    const menuHeight = menuRef.current?.offsetHeight ?? 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;
    setMenuPosition({
      top: openUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
    });
    setOpenMenuId(orderId);
  };

  const openMenuOrder = openMenuId ? orders.find((o) => o.id === openMenuId) : null;

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
      doc.text(tr("POS Sifarişləri", "POS Orders"), 14, 15);
      doc.setFontSize(10);
      doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDate(language)}`, 14, 22);
      autoTable(doc, {
        head: [
          [
            tr("Müştəri", "Customer"),
            tr("İstinad", "Reference"),
            tr("Tarix", "Date"),
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
          order.reference,
          formatSalesDate(order.date),
          order.status,
          String(order.grandTotal),
          String(order.paid),
          String(order.due),
          order.paymentStatus,
          order.biller,
        ]),
        startY: 28,
        theme: "grid",
        headStyles: { fillColor: [0, 38, 246], fontSize: 8 },
        bodyStyles: { fontSize: 7 },
      });
      doc.save(`pos_orders_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleExportExcel = async () => {
    try {
      const exportOrders = await loadExportRows();
      const headers = [
        tr("Müştəri", "Customer"),
        tr("İstinad", "Reference"),
        tr("Tarix", "Date"),
        tr("Status", "Status"),
        tr("Ümumi Cəmi", "Grand Total"),
        tr("Ödənilib", "Paid"),
        tr("Borc", "Due"),
        tr("Ödəniş Statusu", "Payment Status"),
        tr("Kassir", "Biller"),
      ];
      const rows = exportOrders.map((order) => [
        order.customerName,
        order.reference,
        formatSalesDate(order.date),
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
      link.download = `pos_orders_${new Date().toISOString().split("T")[0]}.csv`;
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

  const handleAddSales = () => {
    if (!canCreate || isDemo) return;
    setIsAddSalesModalOpen(true);
  };

  const handleViewSaleDetail = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsSaleDetailModalOpen(true);
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
    if (!canEdit || isDemo) return;
    setSelectedOrderId(orderId);
    setIsEditSaleModalOpen(true);
  };

  const handleShowPayments = (orderId: string) => {
    setSelectedOrderId(orderId);
    setIsShowPaymentsModalOpen(true);
  };

  const handleCreatePayment = (orderId: string) => {
    if (!canCreate || isDemo) return;
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
      "Bank Transfer": "bank",
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
      setPaymentsReloadKey((k) => k + 1);
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

  const handleDownloadPDF = async (order: PosOrderListRow) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      notifyFromError(
        null,
        tr("Popup bloklandı. Popup bloklayıcınızı deaktiv edin.", "Popup blocked. Please disable your popup blocker."),
      );
      return;
    }

    let itemsHtml = `<tr><td colspan="4" style="text-align: center; color: #999; padding: 20px;">${tr("Məhsul detalları mövcud deyil", "Product details not available")}</td></tr>`;
    try {
      const detail = await fetchPosOrder(order.id);
      if (detail.items.length > 0) {
        itemsHtml = detail.items
          .map(
            (item) => `
            <tr>
              <td>${item.productName}</td>
              <td>${item.quantity}</td>
              <td>₼${parseFloat(item.price).toFixed(2)}</td>
              <td style="text-align: right">₼${(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
            </tr>`,
          )
          .join("");
      }
    } catch {
      // keep fallback row
    }

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${tr("Satış Qaiməsi", "Sales Invoice")} - ${order.reference}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .invoice-header { border-bottom: 3px solid #0026f6; padding-bottom: 20px; margin-bottom: 30px; }
          .invoice-header h1 { color: #0026f6; font-size: 28px; margin-bottom: 5px; }
          .invoice-header p { color: #666; font-size: 14px; }
          .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .info-block { flex: 1; }
          .info-block h3 { font-size: 12px; text-transform: uppercase; color: #666; margin-bottom: 10px; }
          .info-block p { font-size: 14px; margin-bottom: 5px; }
          .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .invoice-table th { background-color: #f5f5f5; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #ddd; }
          .invoice-table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .totals { margin-left: auto; width: 300px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
          .totals-row.grand-total { border-top: 2px solid #0026f6; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: bold; color: #0026f6; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <h1>${tr("SATIŞ QAİMƏSİ", "SALES INVOICE")}</h1>
          <p>${tr("Qaimə Nömrəsi", "Invoice Number")}: ${order.reference}</p>
        </div>
        <div class="invoice-info">
          <div class="info-block">
            <h3>${tr("Müştəri Məlumatları", "Customer Information")}</h3>
            <p><strong>${order.customerName}</strong></p>
          </div>
          <div class="info-block">
            <h3>${tr("Qaimə Detalları", "Invoice Details")}</h3>
            <p>${tr("Tarix", "Date")}: ${formatSalesDate(order.date)}</p>
            <p>${tr("Status", "Status")}: ${order.status}</p>
            <p>${tr("Kassir", "Biller")}: ${order.biller}</p>
          </div>
        </div>
        <table class="invoice-table">
          <thead>
            <tr>
              <th>${tr("Məhsul", "Product")}</th>
              <th>${tr("Miqdar", "Quantity")}</th>
              <th>${tr("Qiymət", "Price")}</th>
              <th style="text-align: right">${tr("Cəmi", "Total")}</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="totals">
          <div class="totals-row grand-total">
            <span>${tr("Ümumi Cəmi", "Grand Total")}:</span>
            <span>₼${order.grandTotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>${tr("Ödənilib", "Paid")}:</span>
            <span style="color: #28a745;">₼${order.paid.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>${tr("Qalan Borc", "Due")}:</span>
            <span style="color: #dc3545;">₼${order.due.toFixed(2)}</span>
          </div>
        </div>
        <div class="footer">
          <p>${tr("Təşəkkür edirik!", "Thank you for your business!")}</p>
        </div>
        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `;

    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  };

  const emptyMessage = tr("Sifariş tapılmadı.", "No orders found.");

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("POS Sifarişləri", "POS Orders")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("POS sifarişlərinizi idarə edin", "Manage your POS orders")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Müştəri", "Customer")}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="completed">{tr("Tamamlandı", "Completed")}</option>
                  <option value="pending">{tr("Gözləyir", "Pending")}</option>
                  <option value="cancelled">{tr("Ləğv Edildi", "Cancelled")}</option>
                  <option value="held">{tr("Saxlanılıb", "Held")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Ödəniş Statusu", "Payment Status")}</option>
                  <option value="paid">{tr("Ödənilib", "Paid")}</option>
                  <option value="overdue">{tr("Gecikmiş", "Overdue")}</option>
                  <option value="unpaid">{tr("Ödənilməyib", "Unpaid")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="last7days">{tr("Sırala : Son 7 Gün", "Sort By : Last 7 Days")}</option>
                  <option value="last30days">{tr("Sırala : Son 30 Gün", "Sort By : Last 30 Days")}</option>
                  <option value="last90days">{tr("Sırala : Son 90 Gün", "Sort By : Last 90 Days")}</option>
                  <option value="thisyear">{tr("Sırala : Bu İl", "Sort By : This Year")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPDF}
                disabled={orders.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                type="button"
                onClick={handleExportExcel}
                disabled={orders.length === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Excel İxrac Et", "Export Excel")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={handleAddSales}
                  disabled={isDemo}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Satış Əlavə Et", "Add Sales")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("MÜŞTƏRİ", "CUSTOMER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("İSTİNAD", "REFERENCE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("TARİX", "DATE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÜMUMİ CƏMI", "GRAND TOTAL")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÖDƏNİLİB", "PAID")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("BORC", "DUE")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("ÖDƏNİŞ STATUSU", "PAYMENT STATUS")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                    {tr("KASSİR", "BILLER")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap" />
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-xs text-gray-500">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  orders.map((order, index) => (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all duration-75 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/30 dark:bg-gray-800/10"
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-900 dark:text-white font-medium">
                          {order.customerName}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {order.reference}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {formatSalesDate(order.date)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium",
                            getStatusBadgeColor(order.status),
                          )}
                        >
                          {translateStatus(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {order.grandTotal} ₼
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {order.paid} ₼
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white font-medium whitespace-nowrap">
                        {order.due.toFixed(2)} ₼
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded text-[10px] font-medium",
                            getPaymentStatusBadgeColor(order.paymentStatus),
                          )}
                        >
                          {translatePaymentStatus(order.paymentStatus)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {order.biller}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => openActionMenu(order.id, e.currentTarget)}
                          className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 smooth-transition bg-gray-500/10 dark:bg-gray-500/20 border border-gray-500/20 dark:border-gray-500/30"
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  ))
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
      />

      <EditSaleModal
        orderId={selectedOrderId}
        isOpen={isEditSaleModalOpen}
        onClose={() => setIsEditSaleModalOpen(false)}
        onSaved={() => void loadItems()}
      />

      <ShowPaymentsModal
        orderId={selectedOrderId}
        isOpen={isShowPaymentsModalOpen}
        onClose={() => setIsShowPaymentsModalOpen(false)}
        reloadKey={paymentsReloadKey}
        onCreatePayment={() => {
          setIsShowPaymentsModalOpen(false);
          if (selectedOrderId) handleCreatePayment(selectedOrderId);
        }}
      />

      <CreatePaymentModal
        orderId={selectedOrderId}
        isOpen={isCreatePaymentModalOpen}
        onClose={() => setIsCreatePaymentModalOpen(false)}
        onSaved={handleSavePayment}
      />

      {openMenuOrder &&
        menuPosition &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[100]" onClick={closeActionMenu} aria-hidden />
            <div
              ref={menuRef}
              className="fixed z-[110] w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1"
              style={{ top: menuPosition.top, left: menuPosition.left }}
            >
              <button
                type="button"
                onClick={() => {
                  closeActionMenu();
                  handleViewSaleDetail(openMenuOrder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-75 text-left"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{tr("Satış Detalları", "Sale Detail")}</span>
              </button>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    closeActionMenu();
                    handleEditSale(openMenuOrder.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-75 text-left"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{tr("Satışı Redaktə Et", "Edit Sale")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  closeActionMenu();
                  handleShowPayments(openMenuOrder.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-75 text-left"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>{tr("Ödənişləri Göstər", "Show Payments")}</span>
              </button>

              {canCreate && (
                <button
                  type="button"
                  onClick={() => {
                    closeActionMenu();
                    handleCreatePayment(openMenuOrder.id);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-75 text-left"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("Ödəniş Yarat", "Create Payment")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  closeActionMenu();
                  void handleDownloadPDF(openMenuOrder);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-75 text-left"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{tr("PDF Yüklə", "Download pdf")}</span>
              </button>

              {canDelete && (
                <button
                  type="button"
                  onClick={() => {
                    closeActionMenu();
                    void handleDeleteSale(openMenuOrder);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-75 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{tr("Satışı Sil", "Delete Sale")}</span>
                </button>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
