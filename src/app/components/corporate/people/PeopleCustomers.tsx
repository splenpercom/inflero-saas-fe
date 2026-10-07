import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  Car,
  CreditCard,
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
import { CustomerVehiclesModal } from "./CustomerVehiclesModal";
import { CustomerLoyaltyModal } from "../../../../modules/loyalty";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../../hooks/usePagination";
import { ModernSelect } from "../../ui/ModernSelect";
import { formatCurrency } from "../../../utils/currency";

import { pickLang } from "../../../i18n/pickLang";

export function PeopleCustomers() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const autoEnabled = hasModule("AUTO");
  const loyaltyEnabled = hasModule("LOYALTY");
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("People");
  const { canView: canViewLoyalty } = useModulePermissions("Loyalty");
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
  const [vehicleCustomer, setVehicleCustomer] = useState<PeopleCustomer | null>(null);
  const [loyaltyCustomer, setLoyaltyCustomer] = useState<PeopleCustomer | null>(null);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);
  const showLoyaltyCol = loyaltyEnabled && canViewLoyalty;

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

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: customers,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${debouncedSearch}|${selectedStatus}`,
  });

  const translateStatus = (status: string) =>
    status === "Active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive");

  const colCount =
    6 + (autoEnabled ? 1 : 0) + (showLoyaltyCol ? 1 : 0);

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
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg xl:text-xl 2xl:text-2xl">
            {tr("Müştərilər", "Customers")}
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {tr("Müştərilərinizi idarə edin", "Manage your customers")}
          </p>
        </div>

        <div className="mb-4 flex justify-end gap-2">
          <button
            onClick={() =>
              alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF coming soon"))
            }
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <FileText className="h-3.5 w-3.5 text-red-500" />
          </button>
          <button
            onClick={() =>
              alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel coming soon"))
            }
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs dark:border-gray-700 dark:bg-gray-900"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          {canCreate && (
            <button
              onClick={() => {
                setEditingCustomer(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#14b8a6] px-2.5 py-1.5 text-xs text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tr("Müştəri Əlavə Et", "Add Customer")}</span>
            </button>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={
                  showLoyaltyCol
                    ? tr("Ad, telefon, kart...", "Search name, phone, card...")
                    : tr("Ad, telefon ilə axtar...", "Search name, phone...")
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            <div className="ml-auto flex gap-2">
              <ModernSelect
                value={selectedStatus}
                onChange={(value) => setSelectedStatus(value as "all" | "active" | "inactive")}
                options={[
                  { value: "all", label: tr("Status", "Status") },
                  { value: "active", label: tr("Aktiv", "Active") },
                  { value: "inactive", label: tr("Qeyri-aktiv", "Inactive") },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("KOD", "CODE")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("MÜŞTƏRİ", "CUSTOMER")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("E-POÇT", "EMAIL")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("TELEFON", "PHONE")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("STATUS", "STATUS")}
                  </th>
                  {showLoyaltyCol && (
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                      {tr("LOYALTY", "LOYALTY")}
                    </th>
                  )}
                  {autoEnabled && (
                    <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                      {tr("AVTOMOBİLLƏR", "CARS")}
                    </th>
                  )}
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Müştəri tapılmadı", "No customers found")}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600">{customer.code}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                        {customer.name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{customer.email || "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{customer.phone || "—"}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded border border-green-300 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          {translateStatus(customer.status)}
                        </span>
                      </td>
                      {showLoyaltyCol && (
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setLoyaltyCustomer(customer)}
                            title={tr("Kart / cüzdan", "Card / wallet")}
                            className="flex max-w-[11rem] flex-col items-start gap-0.5 rounded-lg border border-gray-300 px-2.5 py-1.5 text-left text-xs hover:border-[#14b8a6] dark:border-gray-700"
                          >
                            <span className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
                              <CreditCard className="h-3 w-3 text-[#14b8a6]" />
                              <span className="truncate font-mono text-[11px]">
                                {customer.loyaltyCardBarcode || tr("Kart yox", "No card")}
                              </span>
                            </span>
                            <span className="pl-4 text-[10px] text-[#14b8a6]">
                              {formatCurrency(Number(customer.walletBalance ?? 0))}
                            </span>
                          </button>
                        </td>
                      )}
                      {autoEnabled && (
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setVehicleCustomer(customer)}
                            className="flex items-center gap-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                          >
                            <Car className="h-3 w-3" /> {customer.vehicleCount}
                          </button>
                        </td>
                      )}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {showLoyaltyCol && (
                            <button
                              type="button"
                              onClick={() => setLoyaltyCustomer(customer)}
                              title={tr("Loyalty", "Loyalty")}
                              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                            >
                              <CreditCard className="h-3 w-3 text-[#14b8a6]" />
                            </button>
                          )}
                          <button
                            onClick={() =>
                              navigate(`/dashboard/people/customers/${customer.id}`)
                            }
                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingCustomer(customer);
                                setIsModalOpen(true);
                              }}
                              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => void handleDelete(customer.id)}
                              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-red-600 dark:border-gray-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-gray-200 px-3 py-3 dark:border-gray-800">
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              showText={{
                showing: tr("Göstərilir", "Showing"),
                to: tr("-", "to"),
                of: tr("/", "of"),
                results: tr("nəticə", "results"),
              }}
            />
          </div>
        </div>

        <AddCustomerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSave={handleSaveCustomer}
          customer={editingCustomer}
          saving={saving}
        />
        {autoEnabled && (
          <CustomerVehiclesModal
            customer={vehicleCustomer}
            onClose={() => setVehicleCustomer(null)}
            onChanged={() => void loadCustomers()}
          />
        )}
        {showLoyaltyCol && (
          <CustomerLoyaltyModal
            customer={loyaltyCustomer}
            onClose={() => setLoyaltyCustomer(null)}
            onChanged={() => void loadCustomers()}
          />
        )}
      </div>
    </div>
  );
}
