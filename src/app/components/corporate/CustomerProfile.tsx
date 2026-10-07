import { useState, useEffect, useCallback, useMemo } from "react";
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
  CreditCard,
  User,
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
import { CustomerLoyaltyPanel } from "../../../modules/loyalty";
import { cn } from "../ui/utils";

import { pickLang } from "../../i18n/pickLang";

type ProfileTab = "overview" | "purchases" | "loyalty" | "vehicles";

function StatusBadge({ status }: { status: string }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
        active
          ? "border-green-300 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "border-gray-300 bg-gray-100 text-gray-500 dark:bg-gray-800"
      }`}
    >
      <BadgeCheck className="h-3 w-3" />
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
  const loyaltyEnabled = hasModule("LOYALTY");
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
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");

  const tabs = useMemo(() => {
    const list: { id: ProfileTab; label: string; icon: typeof User }[] = [
      { id: "overview", label: tr("Ümumi", "Overview"), icon: User },
      { id: "purchases", label: tr("Satınalmalar", "Purchases"), icon: Receipt },
    ];
    if (loyaltyEnabled) {
      list.push({ id: "loyalty", label: tr("Loyalty", "Loyalty"), icon: CreditCard });
    }
    if (autoEnabled) {
      list.push({ id: "vehicles", label: tr("Avtomobillər", "Vehicles"), icon: Car });
    }
    return list;
  }, [loyaltyEnabled, autoEnabled, language]);

  useEffect(() => {
    if (!tabs.some((t) => t.id === activeTab)) {
      setActiveTab("overview");
    }
  }, [tabs, activeTab]);

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
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-sm text-gray-500">{tr("Yüklənir...", "Loading...")}</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-gray-500">{tr("Müştəri tapılmadı", "Customer not found")}</p>
          <button
            onClick={() => navigate("/dashboard/people/customers")}
            className="mt-3 text-xs text-[#14b8a6] hover:underline"
          >
            {tr("Geri qayıt", "Go back")}
          </button>
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
      <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-6">
        <button
          onClick={() => navigate("/dashboard/people/customers")}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {tr("Müştərilər", "Customers")}
        </button>

        {/* Header — always visible */}
        <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#14b8a6]">
              <span className="text-xl font-bold text-white">{customer.name.charAt(0)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{customer.name}</h1>
                <StatusBadge status={customer.status} />
                <span className="font-mono text-xs text-gray-400">{customer.code}</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                {customer.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {customer.email}
                  </span>
                )}
                {customer.country && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {customer.country}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <button
                onClick={() => setEditCustomerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs dark:border-gray-700"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {tr("Redaktə", "Edit")}
              </button>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div className="overflow-x-auto">
          <div className="inline-flex min-w-full gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900 sm:min-w-0">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const on = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:flex-none",
                    on
                      ? "bg-[#14b8a6] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab panels */}
        {activeTab === "overview" && (
          <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setActiveTab("purchases")}
                className="rounded-lg bg-gray-50 px-3 py-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
              >
                <p className="text-lg font-bold text-[#14b8a6]">{purchases.length}</p>
                <p className="text-[10px] text-gray-400">{tr("Satınalma", "Purchases")}</p>
              </button>
              <div className="rounded-lg bg-gray-50 px-3 py-3 text-center dark:bg-gray-800/50">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatCurrency(totalSpent)}
                </p>
                <p className="text-[10px] text-gray-400">{tr("Cəmi xərclənib", "Total spent")}</p>
              </div>
              {loyaltyEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab("loyalty")}
                  className="col-span-2 rounded-lg bg-gray-50 px-3 py-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800 sm:col-span-1"
                >
                  <p className="truncate font-mono text-sm font-semibold text-gray-900 dark:text-white">
                    {customer.loyaltyCardBarcode || "—"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {tr("Kart", "Card")} · {formatCurrency(Number(customer.walletBalance ?? 0))}
                  </p>
                </button>
              )}
              {autoEnabled && (
                <button
                  type="button"
                  onClick={() => setActiveTab("vehicles")}
                  className="rounded-lg bg-gray-50 px-3 py-3 text-center transition-colors hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800"
                >
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{vehicles.length}</p>
                  <p className="text-[10px] text-gray-400">{tr("Avtomobil", "Vehicles")}</p>
                </button>
              )}
            </div>

            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                {tr("Əlaqə", "Contact")}
              </p>
              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <dt className="text-gray-400">{tr("Telefon", "Phone")}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{customer.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">{tr("E-poçt", "Email")}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{customer.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">{tr("Ölkə", "Country")}</dt>
                  <dd className="font-medium text-gray-900 dark:text-white">{customer.country || "—"}</dd>
                </div>
                <div>
                  <dt className="text-gray-400">{tr("Kod", "Code")}</dt>
                  <dd className="font-mono font-medium text-gray-900 dark:text-white">{customer.code}</dd>
                </div>
              </dl>
            </div>
          </section>
        )}

        {activeTab === "purchases" && (
          <section>
            {purchasesLoading ? (
              <div className="rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
                <p className="text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
              </div>
            ) : purchases.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-900">
                <Receipt className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                <p className="text-xs text-gray-400">
                  {tr("Satınalma tarixçəsi yoxdur", "No purchase history")}
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                          {tr("İstinad", "Reference")}
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                          {tr("Tarix", "Date")}
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                          {tr("Status", "Status")}
                        </th>
                        <th className="px-4 py-3 text-left text-[10px] font-medium uppercase text-gray-500">
                          {tr("Ödəniş", "Payment")}
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-medium uppercase text-gray-500">
                          {tr("Məbləğ", "Amount")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() =>
                            navigate(
                              `/dashboard/sales/pos-orders?orderId=${encodeURIComponent(order.id)}`,
                            )
                          }
                          className="cursor-pointer border-b border-gray-100 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/40"
                        >
                          <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">
                            {order.reference}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {formatSalesDate(order.date)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {order.status}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                            {order.paymentStatus}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-medium text-gray-900 dark:text-white">
                            {formatCurrency(order.grandTotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === "loyalty" && loyaltyEnabled && (
          <CustomerLoyaltyPanel
            customerId={customer.id}
            onChanged={(summary) =>
              setCustomer((c) =>
                c
                  ? {
                      ...c,
                      loyaltyCardBarcode: summary.loyaltyCardBarcode,
                      walletBalance: summary.walletBalance,
                    }
                  : c,
              )
            }
          />
        )}

        {activeTab === "vehicles" && autoEnabled && (
          <section className="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                <Car className="h-4 w-4 text-[#14b8a6]" />
                {tr("Avtomobillər", "Vehicles")}
              </h2>
              <button
                type="button"
                onClick={() => setVehiclesOpen(true)}
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs dark:border-gray-700"
              >
                {tr("İdarə et", "Manage")}
              </button>
            </div>
            <div className="p-2">
              {vehiclesLoading ? (
                <p className="p-6 text-center text-xs text-gray-400">{tr("Yüklənir...", "Loading...")}</p>
              ) : vehicles.length === 0 ? (
                <p className="p-6 text-center text-xs text-gray-400">
                  {tr("Avtomobil əlavə edilməyib", "No vehicles added")}
                </p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {vehicles.map((vehicle) => (
                    <div key={vehicle.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Car className="h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-900 dark:text-white">
                          {[vehicle.make, vehicle.model].filter(Boolean).join(" ") ||
                            tr("Avtomobil", "Vehicle")}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {vehicle.plate || "—"}
                          {vehicle.mileage != null ? ` · ${vehicle.mileage} km` : ""}
                        </p>
                      </div>
                      <StatusBadge status={vehicle.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      <AddCustomerModal
        isOpen={editCustomerOpen}
        onClose={() => setEditCustomerOpen(false)}
        onSave={handleSaveCustomer}
        customer={customer}
        saving={saving}
      />
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
