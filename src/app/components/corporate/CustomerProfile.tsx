import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  Car,
  Phone,
  Mail,
  MapPin,
  Plus,
  Gauge,
  Receipt,
  Edit2,
  Trash2,
  BadgeCheck,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchCustomers,
  updateCustomer,
  fetchCustomerVehicles,
  createCustomerVehicle,
  updateCustomerVehicle,
  deleteCustomerVehicle,
  type PeopleCustomer,
  type CustomerVehicle,
} from "../../api/people";
import { fetchPosOrders, type PosOrderListRow } from "../../api/sales";
import { formatSalesDate } from "../../lib/salesMappers";
import { formatCurrency } from "../../utils/currency";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { AddCustomerModal, type CustomerFormData } from "./people/AddCustomerModal";
import { AddVehicleModal, type VehicleFormData } from "./people/AddVehicleModal";

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

function vehicleBody(data: VehicleFormData, includeStatus: boolean) {
  const body: Record<string, unknown> = {
    make: data.make.trim() || null,
    model: data.model.trim() || null,
    year: data.year ? Number(data.year) : null,
    plate: data.plate.trim() || null,
    mileage: data.mileage ? Number(data.mileage) : null,
    vin: data.vin.trim() || null,
    notes: data.notes.trim() || null,
  };
  if (includeStatus) body.status = data.status;
  return body;
}

export function CustomerProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("People");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [customer, setCustomer] = useState<PeopleCustomer | null>(null);
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([]);
  const [purchases, setPurchases] = useState<PosOrderListRow[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editCustomerOpen, setEditCustomerOpen] = useState(false);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<CustomerVehicle | null>(null);
  const [saving, setSaving] = useState(false);

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
        limit: 100,
      });
      setPurchases(orders);
    } catch {
      setPurchases([]);
    } finally {
      setPurchasesLoading(false);
    }
  }, [id, isDemo, isAuthenticated, branchRevision]);

  const loadData = useCallback(async () => {
    if (!id || !(isAuthenticated || isDemo) || !canView) {
      setCustomer(null);
      setVehicles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [rows, veh] = await Promise.all([
        fetchCustomers(),
        fetchCustomerVehicles(id),
      ]);
      setCustomer(rows.find((c) => c.id === id) ?? null);
      setVehicles(veh);
    } catch (err) {
      notifyFromError(err);
      setCustomer(null);
      setVehicles([]);
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

  const handleSaveVehicle = async (data: VehicleFormData) => {
    if (!id || !(isAuthenticated || isDemo)) return;
    if (editingVehicle ? !canEdit : !canCreate) return;
    setSaving(true);
    try {
      if (editingVehicle) {
        await updateCustomerVehicle(id, editingVehicle.id, vehicleBody(data, true));
        notifySuccess(tr("Avtomobil yeniləndi", "Vehicle updated"));
      } else {
        await createCustomerVehicle(id, vehicleBody(data, false));
        notifySuccess(tr("Avtomobil əlavə edildi", "Vehicle added"));
      }
      setVehicleModalOpen(false);
      setEditingVehicle(null);
      const veh = await fetchCustomerVehicles(id);
      setVehicles(veh);
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!id || !(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu avtomobili silmək istədiyinizə əminsiniz?", "Delete this vehicle?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteCustomerVehicle(id, vehicleId);
      notifySuccess(tr("Avtomobil silindi", "Vehicle deleted"));
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
    } catch (err) {
      notifyFromError(err);
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
          <div className="grid grid-cols-2 gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
            <div className="text-center">
              <p className="text-lg font-bold text-[#0026f6] dark:text-[#0026f6]">{vehicles.length}</p>
              <p className="text-[10px] text-gray-400">{tr("Avtomobil", "Vehicles")}</p>
            </div>
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

        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Car className="w-4 h-4 text-[#0026f6]" />
              {tr("Avtomobillər", "Vehicles")}
            </h2>
            {canCreate && (
            <button onClick={() => { setEditingVehicle(null); setVehicleModalOpen(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg">
              <Plus className="w-3 h-3" />
              {tr("Avtomobil əlavə et", "Add Vehicle")}
            </button>
            )}
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {vehicles.map((car) => (
              <div key={car.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0"><Car className="w-5 h-5 text-gray-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{car.year ? `${car.year} ` : ""}{car.make} {car.model}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">{car.plate || "—"}</p>
                  {car.mileage != null && (
                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-1"><Gauge className="w-3 h-3" />{car.mileage.toLocaleString()} km</p>
                  )}
                </div>
                <div className="flex gap-1.5">
                  {canEdit && (
                  <button onClick={() => { setEditingVehicle(car); setVehicleModalOpen(true); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                  )}
                  {canDelete && (
                  <button onClick={() => void handleDeleteVehicle(car.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </div>
            ))}
            {vehicles.length === 0 && (
              <div className="sm:col-span-2 bg-white dark:bg-gray-900 border border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Car className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">{tr("Avtomobil yoxdur", "No vehicles registered")}</p>
              </div>
            )}
          </div>
        </div>

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
      <AddVehicleModal isOpen={vehicleModalOpen} onClose={() => { setVehicleModalOpen(false); setEditingVehicle(null); }} onSave={handleSaveVehicle} vehicle={editingVehicle} saving={saving} />
    </div>
  );
}
