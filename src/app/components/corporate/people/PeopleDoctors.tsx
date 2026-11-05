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
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import { useBranch } from "../../../context/BranchContext";
import {
  fetchDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  type PeopleDoctor,
} from "../../../api/people";
import { notifyFromError, notifySuccess } from "../../../lib/toast";
import { useConfirm } from "../../../context/ConfirmContext";
import { AddDoctorModal, type DoctorFormData } from "./AddDoctorModal";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../../hooks/usePagination";
import { ModernSelect } from "../../ui/ModernSelect";
import { pickLang } from "../../../i18n/pickLang";

export function PeopleDoctors() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated, hasModule } = useAuth();
  const opticsEnabled = hasModule("OPTICS");
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Customers");
  const branchRevision = useBranchRevision();
  const { isGlobalMode, branchManagementEnabled } = useBranch();
  const canEditBranchPeople = !branchManagementEnabled || !isGlobalMode;
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<PeopleDoctor | null>(null);
  const [doctors, setDoctors] = useState<PeopleDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    if (!opticsEnabled) {
      navigate("/dashboard/people/customers", { replace: true });
    }
  }, [opticsEnabled, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadDoctors = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView || !opticsEnabled) {
      setDoctors([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchDoctors({
        search: debouncedSearch || undefined,
        status: selectedStatus,
      });
      setDoctors(rows);
    } catch (err) {
      notifyFromError(err, tr("Həkimləri yükləmək alınmadı", "Failed to load doctors"));
    } finally {
      setLoading(false);
    }
  }, [
    isDemo,
    isAuthenticated,
    canView,
    opticsEnabled,
    debouncedSearch,
    selectedStatus,
    language,
    branchRevision,
  ]);

  useEffect(() => {
    void loadDoctors();
  }, [loadDoctors]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: doctors,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${debouncedSearch}|${selectedStatus}`,
  });

  const translateStatus = (status: string) =>
    status === "Active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive");

  const formatCommission = (d: PeopleDoctor) => {
    if (!d.commissionType || d.commissionValue == null) return "—";
    if (d.commissionType === "PERCENT") return `${d.commissionValue}%`;
    return `${d.commissionValue} ₼`;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadDoctors().finally(() => setIsRefreshing(false));
  };

  const handleSaveDoctor = async (data: DoctorFormData) => {
    if (isDemo || !isAuthenticated) return;
    if (editingDoctor ? !canEdit : !canCreate) return;
    setSaving(true);
    try {
      const commissionType = data.commissionType === "" ? null : data.commissionType;
      const commissionValue =
        commissionType == null || data.commissionValue.trim() === ""
          ? null
          : Number(data.commissionValue);
      if (commissionType != null && (commissionValue == null || Number.isNaN(commissionValue))) {
        notifyFromError(null, tr("Komissiya dəyəri düzgün deyil", "Invalid commission value"));
        return;
      }
      const body = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        commissionType,
        commissionValue,
        ...(editingDoctor && data.status ? { status: data.status } : {}),
      };
      if (editingDoctor) {
        await updateDoctor(editingDoctor.id, body);
        notifySuccess(tr("Həkim yeniləndi", "Doctor updated"));
      } else {
        await createDoctor(body);
        notifySuccess(tr("Həkim əlavə edildi", "Doctor added"));
      }
      setIsModalOpen(false);
      setEditingDoctor(null);
      void loadDoctors();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr(
          "Bu həkimi silmək istədiyinizə əminsiniz? Keçmiş sifarişlər saxlanılacaq.",
          "Are you sure you want to delete this doctor? Past orders will keep their history.",
        ),
        variant: "danger",
      }))
    )
      return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteDoctor(id);
      notifySuccess(tr("Həkim silindi", "Doctor deleted"));
      void loadDoctors();
    } catch (err) {
      notifyFromError(err);
    }
  };

  if (!opticsEnabled) return null;

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-lg xl:text-xl 2xl:text-2xl">
            {tr("Həkimlər", "Doctors")}
          </h1>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {tr("Optics həkimlərini idarə edin", "Manage Optics doctors")}
          </p>
        </div>

        {!canEditBranchPeople && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {tr(
              "Filialın həkimlərini görmək və redaktə etmək üçün yuxarıdan filial seçin.",
              "Select a branch in the header to view and manage doctors for that branch.",
            )}
          </div>
        )}

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
          {canCreate && canEditBranchPeople && (
            <button
              onClick={() => {
                setEditingDoctor(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-[#14b8a6] px-2.5 py-1.5 text-xs text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{tr("Həkim Əlavə Et", "Add Doctor")}</span>
            </button>
          )}
        </div>

        <div className="mb-4 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Ad, telefon ilə axtar...", "Search name, phone...")}
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
                    {tr("HƏKİM", "DOCTOR")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("E-POÇT", "EMAIL")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("TELEFON", "PHONE")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("KOMİSSİYA", "COMMISSION")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("STATUS", "STATUS")}
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-medium uppercase text-gray-500">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : doctors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Həkim tapılmadı", "No doctors found")}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((doctor, index) => (
                    <tr
                      key={doctor.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0
                          ? "bg-white dark:bg-gray-900"
                          : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600">{doctor.code}</td>
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">
                        {doctor.name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">{doctor.email || "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{doctor.phone || "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600">{formatCommission(doctor)}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex rounded border border-green-300 bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                          {translateStatus(doctor.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/people/doctors/${doctor.id}`)}
                            className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingDoctor(doctor);
                                setIsModalOpen(true);
                              }}
                              className="rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs dark:border-gray-700"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => void handleDelete(doctor.id)}
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

        <AddDoctorModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDoctor(null);
          }}
          onSave={handleSaveDoctor}
          doctor={editingDoctor}
          saving={saving}
        />
      </div>
    </div>
  );
}
