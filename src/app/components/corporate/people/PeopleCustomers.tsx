import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  type PeopleCustomer,
} from "../../../api/people";
import { notifyFromError, notifySuccess } from "../../../lib/toast";
import { useConfirm } from "../../../context/ConfirmContext";
import { AddCustomerModal, type CustomerFormData } from "./AddCustomerModal";

import { pickLang } from "../../../i18n/pickLang";
export function PeopleCustomers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("People");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<PeopleCustomer | null>(null);
  const [customers, setCustomers] = useState<PeopleCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCustomers = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setCustomers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchCustomers({
        search: debouncedSearch || undefined,
        status: selectedStatus,
      });
      setCustomers(rows);
    } catch (err) {
      notifyFromError(err, tr("Müştəriləri yükləmək alınmadı", "Failed to load customers"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, debouncedSearch, selectedStatus, language, branchRevision]);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const translateStatus = (status: string) =>
    status === "Active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive");

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadCustomers().finally(() => setIsRefreshing(false));
  };

  const handleSaveCustomer = async (data: CustomerFormData) => {
    if (isDemo || !isAuthenticated) return;
    if (editingCustomer ? !canEdit : !canCreate) return;
    setSaving(true);
    try {
      const body = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        ...(editingCustomer && data.status ? { status: data.status } : {}),
      };
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, body);
        notifySuccess(tr("Müştəri yeniləndi", "Customer updated"));
      } else {
        await createCustomer(body);
        notifySuccess(tr("Müştəri əlavə edildi", "Customer added"));
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      void loadCustomers();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu müştərini silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this customer?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteCustomer(id);
      notifySuccess(tr("Müştəri silindi", "Customer deleted"));
      void loadCustomers();
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">{tr("Müştərilər", "Customers")}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{tr("Müştərilərinizi idarə edin", "Manage your customers")}</p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button onClick={() => alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF coming soon"))} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"><FileText className="w-3.5 h-3.5 text-red-500" /></button>
          <button onClick={() => alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel coming soon"))} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg"><FileSpreadsheet className="w-3.5 h-3.5 text-green-500" /></button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"><RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /></button>
          {canCreate && (
          <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] text-white rounded-lg"><Plus className="w-3.5 h-3.5" /><span>{tr("Müştəri Əlavə Et", "Add Customer")}</span></button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input type="text" placeholder={tr("Ad, telefon, nömrə ilə axtar...", "Search name, phone, plate...")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white" />
            </div>
            <div className="flex gap-2 ml-auto">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as "all" | "active" | "inactive")} className="pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white">
                <option value="all">{tr("Status", "Status")}</option>
                <option value="active">{tr("Aktiv", "Active")}</option>
                <option value="inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("KOD", "CODE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("MÜŞTƏRİ", "CUSTOMER")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("E-POÇT", "EMAIL")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("TELEFON", "PHONE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("AVTOMOBİL", "VEHICLES")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("NÖMRƏLƏR", "PLATES")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={8} className="px-3 py-8 text-center text-xs text-gray-500">{tr("Müştəri tapılmadı", "No customers found")}</td></tr>
                ) : customers.map((customer, index) => (
                  <tr key={customer.id} className={`border-b border-gray-200 dark:border-gray-800 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}>
                    <td className="px-3 py-2 text-xs text-gray-600">{customer.code}</td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{customer.name}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{customer.email || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{customer.phone || "—"}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">{customer.vehicleCount ?? 0}</td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {customer.plates?.length ? (
                        <span className="inline-flex flex-wrap gap-1">
                          {customer.plates.map((plate) => (
                            <span key={plate} className="inline-flex px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-[10px] font-medium text-gray-700 dark:text-gray-300">
                              {plate}
                            </span>
                          ))}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2"><span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 border border-green-300">{translateStatus(customer.status)}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate(`/dashboard/people/customers/${customer.id}`)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"><Eye className="w-3 h-3" /></button>
                        {canEdit && (
                        <button onClick={() => { setEditingCustomer(customer); setIsModalOpen(true); }} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg"><Edit2 className="w-3 h-3" /></button>
                        )}
                        {canDelete && (
                        <button onClick={() => void handleDelete(customer.id)} className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg text-red-600"><Trash2 className="w-3 h-3" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <AddCustomerModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
          onSave={handleSaveCustomer}
          customer={editingCustomer}
          saving={saving}
        />
      </div>
    </div>
  );
}
