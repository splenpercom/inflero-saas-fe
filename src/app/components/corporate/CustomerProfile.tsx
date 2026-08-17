import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Receipt,
  Edit2,
  BadgeCheck,
  Car,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchCustomers,
  fetchCustomerVehicles,
  updateCustomer,
  type CustomerVehicle,
  type PeopleCustomer,
} from "../../api/people";
import { fetchPosOrders, type PosOrderListRow } from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { formatCurrency } from "../../utils/currency";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { AddCustomerModal, type CustomerFormData } from "./people/AddCustomerModal";
import { CustomerVehiclesModal } from "./people/CustomerVehiclesModal";

import { pickLang } from "../../i18n/pickLang";
function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${active ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-300" : "bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-300"}`}>
      <BadgeCheck className="w-3 h-3" />
      {status}
    </span>
  );
}

export function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const autoEnabled = hasModule("AUTO");
  const { canView, canEdit } = useModulePermissions("People");
  const branchRevision = useBranchRevision();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [customer, setCustomer] = useState<PeopleCustomer | null>(null);
  const [purchases, setPurchases] = useState<PosOrderListRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [vehiclesOpen, setVehiclesOpen] = useState(false);

  const loadPurchases = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo)) {
      setPurchases([]);
      return;
    }
    setPurchasesLoading(true);
    try {
      const orders = await fetchPosOrders({
        customerId: id,
        sortBy: "all",
        status: "all",
        paymentStatus: "all",
        page: 1,
        pageSize: 100,
      });
      setPurchases(orders.items ?? []);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [id, isDemo, isAuthenticated, branchRevision]);

  const loadData = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo) || !canView) {
      setCustomer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchCustomers();
      setCustomer(rows.find((c) => c.id === id) ?? null);
    } catch (err) {
      notifyFromError(err);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [id, isDemo, isAuthenticated, canView, branchRevision]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    void loadPurchases();
  }, [loadPurchases]);

  const loadVehicles = useCallback(async () => {
    if (!autoEnabled || !id || !(isAuthenticated || isDemo) || !canView) {
      setVehicles([]);
      return;
    }
    setVehiclesLoading(true);
    try {
      setVehicles(await fetchCustomerVehicles(id));
    } catch (err) {
      notifyFromError(err);
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, [autoEnabled, id, isAuthenticated, isDemo, canView]);

  useEffect(() => {
    void loadVehicles();
  }, [loadVehicles]);

  const totalSpent = purchases.reduce((sum, order) => sum + order.grandTotal, 0);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <p className="text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500">{tr("Müştəri tapılmadı", "Customer not found")}</p>
          <button onClick={() => navigate("/dashboard/people/customers")} className="mt-3 text-xs text-[#0026f6] hover:underline">{tr("Geri qayıt", "Go back")}</button>
        </div>
      </div>
    );
  }

  const handleSaveCustomer = async (data: CustomerFormData) => {
    if (!id || !(isAuthenticated || isDemo) || !canEdit) return;
    setSaving(true);
    try {
      const updated = await updateCustomer(id, {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        ...(data.status ? { status: data.status } : {}),
      });
      setCustomer(updated);
      setEditCustomerOpen(false);
      notifySuccess(tr("Müştəri yeniləndi", "Customer updated"));
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 max-w-5xl">
        <button onClick={() => navigate("/dashboard/people/customers")} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-3.5 h-3.5" />
          {tr("Müştərilər", "Customers")}
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#0026f6] to-[#0026f6] flex items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-white">{customer.name.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                <StatusBadge status={customer.status} />
                <span className="text-xs text-gray-400 font-mono">{customer.code}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-2">
                {customer.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{customer.phone}</span>}
                {customer.email && <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{customer.email}</span>}
                {customer.country && <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{customer.country}</span>}
              </div>
            </div>
            {canEdit && (
            <button onClick={() => setEditCustomerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-300 rounded-lg">
              <Edit2 className="w-3.5 h-3.5" />
              {tr("Redaktə", "Edit")}
            </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-[#0026f6] dark:text-[#0026f6]">{purchases.length}</p>
              <p className="text-[10px] text-gray-400">{tr("Satınalma", "Purchases")}</p>
            </div>
          </div>
          {purchases.length > 0 && (
            <p className="text-[10px] text-gray-500 text-center mt-2">
              {tr("Cəmi xərclənib", "Total spent")}: {formatCurrency(totalSpent)}
            </p>
          )}
        </div>

        {autoEnabled && (
          <div className="mb-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Car className="h-4 w-4 text-[#0026f6]" />
                {tr("Avtomobillər", "Vehicles")}
              </h2>
              <button
                type="button"
                onClick={() => setVehiclesOpen(true)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700"
              >
                {tr("Bax / idarə et", "View / manage")}
              </button>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              {vehiclesLoading ? (
                <p className="p-6 text-center text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
              ) : vehicles.length === 0 ? (
                <p className="p-6 text-center text-xs text-gray-400">{tr("Avtomobil əlavə edilməyib", "No vehicles added")}</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center gap-3 px-4 py-3">
                      <Car className="h-4 w-4 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || tr("Avtomobil", "Vehicle")}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {vehicle.plate || "—"}{vehicle.mileage != null ? ` · ${vehicle.mileage} km` : ""}
                        </p>
                      </div>
                      <StatusBadge status={vehicle.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Receipt className="w-4 h-4 text-[#0026f6]" />
            {tr("Satınalma Tarixçəsi", "Purchase History")}
          </h2>
          {purchasesLoading ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center">
              <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
            </div>
          ) : purchases.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 rounded-xl p-8 text-center">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">{tr("Satınalma tarixçəsi yoxdur", "No purchase history")}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                      <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-4 py-3">{tr("İstinad", "Reference")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-4 py-3">{tr("Tarix", "Date")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-4 py-3">{tr("Status", "Status")}</th>
                      <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-4 py-3">{tr("Ödəniş", "Payment")}</th>
                      <th className="text-right text-[10px] font-medium text-gray-500 uppercase px-4 py-3">{tr("Məbləğ", "Amount")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/dashboard/sales/pos-orders?orderId=${encodeURIComponent(order.id)}`)}
                        className="border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
                      >
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">{order.reference}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatSalesDate(order.date)}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{order.status}</td>
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{order.paymentStatus}</td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white text-right whitespace-nowrap">
                          {formatCurrency(order.grandTotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <AddCustomerModal isOpen={editCustomerOpen} onClose={() => setEditCustomerOpen(false)} onSave={handleSaveCustomer} customer={customer} saving={saving} />
      {autoEnabled && (
        <CustomerVehiclesModal
          customer={vehiclesOpen ? customer : null}
          onClose={() => setVehiclesOpen(false)}
          onChanged={() => void loadVehicles()}
        />
      )}
    </div>
  );
}
