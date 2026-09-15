import { useState, useEffect, useCallback, useMemo } from "react";
import { X, Search } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import {
  createSalesReturn,
  fetchReturnablePosOrders,
  type ReturnablePosOrder,
  type ReturnablePosOrderItem,
} from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { useSalesCustomers } from "../../hooks/useSalesCustomers";
import { notifyFromError, notifySuccess, notifyWarning } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";

interface ReturnLineSelection {
  productId: string;
  name: string;
  sku: string | null;
  unitPrice: number;
  remainingQty: number;
  selected: boolean;
  qty: number;
}

interface AddSalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddSalesReturnModal({ isOpen, onClose, onSaved }: AddSalesReturnModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { branchId, isGlobalMode } = useBranch();

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerMenuOpen, setCustomerMenuOpen] = useState(false);
  const [orderSearch, setOrderSearch] = useState("");
  const [orders, setOrders] = useState<ReturnablePosOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ReturnablePosOrder | null>(null);
  const [lines, setLines] = useState<ReturnLineSelection[]>([]);
  const [saving, setSaving] = useState(false);

  const { customers, loading: customersLoading } = useSalesCustomers(customerSearch, isOpen);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const reset = useCallback(() => {
    setCustomerId("");
    setCustomerSearch("");
    setCustomerMenuOpen(false);
    setOrderSearch("");
    setOrders([]);
    setSelectedOrder(null);
    setLines([]);
    setSaving(false);
  }, []);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);

  const buildLinesFromOrder = (order: ReturnablePosOrder): ReturnLineSelection[] =>
    order.items
      .filter((it) => it.remainingQty > 0)
      .map((it: ReturnablePosOrderItem) => ({
        productId: it.productId,
        name: it.productName,
        sku: it.sku,
        unitPrice: parseFloat(it.unitPrice) || 0,
        remainingQty: it.remainingQty,
        selected: true,
        qty: it.remainingQty,
      }));

  const loadOrders = useCallback(async () => {
    if (!isOpen || !(isAuthenticated || isDemo)) return;
    setOrdersLoading(true);
    try {
      const data = await fetchReturnablePosOrders({
        search: orderSearch.trim() || undefined,
        customerId: customerId || undefined,
        pageSize: 50,
      });
      setOrders(data.items);
      setSelectedOrder((prev) => {
        if (prev && !data.items.some((o) => o.id === prev.id)) {
          setLines([]);
          return null;
        }
        return prev;
      });
    } catch (err) {
      notifyFromError(err, tr("Sifarişlər yüklənmədi", "Failed to load orders"));
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tr uses language; intentional deps are search filters
  }, [isOpen, isAuthenticated, isDemo, orderSearch, customerId]);

  useEffect(() => {
    if (!isOpen) return;
    const t = window.setTimeout(() => {
      void loadOrders();
    }, 250);
    return () => window.clearTimeout(t);
  }, [isOpen, orderSearch, customerId, loadOrders]);

  const handleSelectCustomer = (id: string, name: string) => {
    setCustomerId(id);
    setCustomerSearch(name);
    setCustomerMenuOpen(false);
    setSelectedOrder(null);
    setLines([]);
  };

  const handleClearCustomer = () => {
    setCustomerId("");
    setCustomerSearch("");
    setSelectedOrder(null);
    setLines([]);
  };

  const handleSelectOrder = (order: ReturnablePosOrder) => {
    setSelectedOrder(order);
    setLines(buildLinesFromOrder(order));
    setCustomerMenuOpen(false);
    if (order.customerId && order.customerName && order.customerName !== "—") {
      setCustomerId(order.customerId);
      setCustomerSearch(order.customerName);
    }
  };

  const handleReturnAll = () => {
    setLines((prev) =>
      prev.map((l) => ({ ...l, selected: true, qty: l.remainingQty })),
    );
  };

  const handleClearSelection = () => {
    setLines((prev) => prev.map((l) => ({ ...l, selected: false, qty: 0 })));
  };

  const selectedLines = useMemo(
    () => lines.filter((l) => l.selected && l.qty > 0),
    [lines],
  );

  const returnTotal = selectedLines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

  const canSubmit =
    Boolean(selectedOrder) &&
    selectedLines.length > 0 &&
    selectedLines.every((l) => l.qty > 0 && l.qty <= l.remainingQty) &&
    !saving &&
    !isDemo;

  const handleSave = async () => {
    if (!(isAuthenticated || isDemo)) return;
    if (!selectedOrder) {
      notifyWarning(tr("Sifariş seçin", "Please select an order"));
      return;
    }
    if (selectedLines.length === 0) {
      notifyWarning(tr("Qaytarılacaq məhsul seçin", "Select items to return"));
      return;
    }
    const invalid = selectedLines.some((l) => l.qty <= 0 || l.qty > l.remainingQty);
    if (invalid) {
      notifyWarning(tr("Miqdar düzgün deyil", "Invalid return quantity"));
      return;
    }

    setSaving(true);
    try {
      await createSalesReturn({
        customerId: customerId || selectedOrder.customerId || null,
        posOrderId: selectedOrder.id,
        storeId: !isGlobalMode && branchId ? branchId : selectedOrder.storeId,
        items: selectedLines.map((l) => ({
          productId: l.productId,
          quantity: l.qty,
          unitPrice: l.unitPrice,
        })),
      });
      notifySuccess(tr("Satış qaytarması yaradıldı", "Sales return created"));
      onSaved();
      onClose();
    } catch (err) {
      notifyFromError(err, tr("Qaytarma yaradıla bilmədi", "Failed to create sales return"));
      // Concurrent return may have consumed remaining qty — clear selection and refresh list.
      setSelectedOrder(null);
      setLines([]);
      void loadOrders();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-4xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
            {tr("Satış Qaytarması Əlavə Et", "Add Sales Return")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Müştəri", "Customer")}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    setCustomerId("");
                    setCustomerMenuOpen(true);
                    setSelectedOrder(null);
                    setLines([]);
                  }}
                  onFocus={() => setCustomerMenuOpen(true)}
                  placeholder={tr("Müştəri axtar (istəyə bağlı)", "Search customer (optional)")}
                  className="w-full pl-8 pr-16 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
                {customerId && (
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    {tr("Təmizlə", "Clear")}
                  </button>
                )}
              </div>
              {customerMenuOpen && (
                <div className="absolute z-20 w-full mt-1 max-h-40 overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                  {customersLoading ? (
                    <p className="px-3 py-2 text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
                  ) : customers.length === 0 ? (
                    <p className="px-3 py-2 text-xs text-gray-500">
                      {tr("Müştəri tapılmadı", "No customers found")}
                    </p>
                  ) : (
                    customers.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c.id, c.name)}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 dark:hover:bg-gray-800 ${
                          customerId === c.id
                            ? "bg-[#ccfbf1] dark:bg-[#14b8a6]/20 text-[#14b8a6]"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {c.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                {tr("Sifariş axtar", "Search orders")}
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setCustomerMenuOpen(false);
                  }}
                  placeholder={tr(
                    "ID, istinad və ya müştəri adı",
                    "ID, reference, or customer name",
                  )}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-gray-900 dark:text-white">
                {tr("Sifarişlər", "Orders")} <span className="text-red-500">*</span>
              </label>
              {customerId && (
                <span className="text-[10px] text-gray-500">
                  {tr("Seçilmiş müştərinin sifarişləri", "Orders for selected customer")}
                </span>
              )}
            </div>
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg max-h-44 overflow-y-auto">
              {ordersLoading ? (
                <p className="px-3 py-4 text-xs text-center text-gray-500">
                  {tr("Yüklənir...", "Loading...")}
                </p>
              ) : orders.length === 0 ? (
                <p className="px-3 py-4 text-xs text-center text-gray-500">
                  {tr(
                    "Qaytarıla bilən sifariş tapılmadı",
                    "No returnable orders found",
                  )}
                </p>
              ) : (
                orders.map((order) => {
                  const active = selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleSelectOrder(order)}
                      className={`w-full px-3 py-2.5 text-left border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/60 ${
                        active ? "bg-[#ccfbf1]/60 dark:bg-[#14b8a6]/15" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                            {order.reference}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {order.customerName} · {formatSalesDate(order.date)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs font-medium text-gray-900 dark:text-white">
                            ₼{parseFloat(order.grandTotal).toFixed(2)}
                          </p>
                          <p className="text-[10px] text-gray-500">{order.paymentStatus}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {selectedOrder && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-medium text-gray-900 dark:text-white">
                  {tr("Qaytarılacaq məhsullar", "Items to return")}
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReturnAll}
                    className="px-2.5 py-1 text-[10px] font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {tr("Hamısını qaytar", "Return all remaining")}
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-2.5 py-1 text-[10px] font-medium border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    {tr("Seçimi sil", "Clear selection")}
                  </button>
                </div>
              </div>

              <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-100 dark:bg-gray-800">
                    <tr>
                      <th className="w-8 px-2 py-2" />
                      <th className="text-left px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {tr("Məhsul", "Product")}
                      </th>
                      <th className="text-right px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {tr("Qiymət", "Price")}
                      </th>
                      <th className="text-right px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {tr("Qalıq", "Remaining")}
                      </th>
                      <th className="text-right px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {tr("Qaytar", "Return qty")}
                      </th>
                      <th className="text-right px-2 py-2 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {tr("Cəmi", "Subtotal")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-500">
                          {tr("Qaytarılacaq məhsul qalmayıb", "Nothing left to return")}
                        </td>
                      </tr>
                    ) : (
                      lines.map((line) => (
                        <tr
                          key={line.productId}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={line.selected}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.productId === line.productId
                                      ? {
                                          ...l,
                                          selected: checked,
                                          qty: checked ? Math.max(1, l.qty || l.remainingQty) : 0,
                                        }
                                      : l,
                                  ),
                                );
                              }}
                              className="rounded border-gray-300 text-[#14b8a6] focus:ring-[#14b8a6]"
                            />
                          </td>
                          <td className="px-2 py-2 text-gray-900 dark:text-white">
                            {line.name}
                            {line.sku ? (
                              <span className="text-gray-400 ml-1">({line.sku})</span>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 text-right text-gray-900 dark:text-white">
                            ₼{line.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-2 py-2 text-right text-gray-900 dark:text-white">
                            {line.remainingQty}
                          </td>
                          <td className="px-2 py-2 text-right">
                            <input
                              type="number"
                              min={1}
                              max={line.remainingQty}
                              disabled={!line.selected}
                              value={line.selected ? line.qty : ""}
                              onChange={(e) => {
                                const raw = Number(e.target.value);
                                const qty = Number.isFinite(raw)
                                  ? Math.min(line.remainingQty, Math.max(1, Math.floor(raw)))
                                  : 1;
                                setLines((prev) =>
                                  prev.map((l) =>
                                    l.productId === line.productId ? { ...l, qty, selected: true } : l,
                                  ),
                                );
                              }}
                              className="w-16 ml-auto block px-2 py-1 text-xs border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-40"
                            />
                          </td>
                          <td className="px-2 py-2 text-right text-gray-900 dark:text-white">
                            {line.selected
                              ? `₼${(line.unitPrice * line.qty).toFixed(2)}`
                              : "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <div className="text-xs font-semibold text-gray-900 dark:text-white">
                  {tr("Ümumi qaytarma", "Return total")}: ₼{returnTotal.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2 sticky bottom-0 bg-white dark:bg-gray-900">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            {tr("Ləğv Et", "Cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!canSubmit}
            className="px-4 py-2 text-xs font-medium text-white bg-[#14b8a6] hover:bg-[#0d9488] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? tr("Yadda saxlanılır...", "Saving...") : tr("Təsdiq Et", "Submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
