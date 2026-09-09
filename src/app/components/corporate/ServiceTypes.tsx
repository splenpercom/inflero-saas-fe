import { useState, useEffect, useCallback } from "react";
import { Search, Plus, RefreshCw, Edit2, Trash2, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchReservationSettings,
  updateReservationSettings,
  type ReservationConfig,
} from "../../api/reservations";
import {
  DEFAULT_SERVICE_TYPES,
  type ServiceTypeOption,
} from "../../lib/serviceTypes";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { DataPagination, dataPaginationShowText } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import { pickLang } from "../../i18n/pickLang";

type ServiceTypeWrite = {
  value?: string;
  label: string;
  labelAz: string;
  labelTr?: string;
};

export function ServiceTypes() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Reservations");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const [config, setConfig] = useState<ReservationConfig | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    labelAz: "",
    labelTr: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setConfig(null);
      setServiceTypes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const cfg = await fetchReservationSettings();
      setConfig(cfg);
      setServiceTypes(
        cfg.serviceTypes && cfg.serviceTypes.length > 0
          ? cfg.serviceTypes
          : [...DEFAULT_SERVICE_TYPES],
      );
    } catch (err) {
      notifyFromError(err, tr("Xidmət növlərini yükləmək alınmadı", "Failed to load service types"));
      setServiceTypes([]);
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, language, branchRevision]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const persist = async (next: ServiceTypeWrite[]) => {
    if (!config) throw new Error("Settings not loaded");
    const saved = await updateReservationSettings({
      ...config,
      serviceTypes: next as ServiceTypeOption[],
    });
    setConfig(saved);
    setServiceTypes(
      saved.serviceTypes && saved.serviceTypes.length > 0
        ? saved.serviceTypes
        : (next as ServiceTypeOption[]),
    );
  };

  const filtered = serviceTypes.filter((s) => {
    const q = debouncedSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.label.toLowerCase().includes(q) ||
      s.labelAz.toLowerCase().includes(q) ||
      (s.labelTr?.toLowerCase().includes(q) ?? false)
    );
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: filtered,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: debouncedSearch,
  });

  const closeModal = () => {
    setShowModal(false);
    setEditingValue(null);
    setFormData({ label: "", labelAz: "", labelTr: "" });
    setFormErrors({});
  };

  const openAdd = () => {
    setEditingValue(null);
    setFormData({ label: "", labelAz: "", labelTr: "" });
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (item: ServiceTypeOption) => {
    setEditingValue(item.value);
    setFormData({
      label: item.label,
      labelAz: item.labelAz,
      labelTr: item.labelTr ?? "",
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (value: string) => {
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr(
          "Bu xidmət növünü silmək istədiyinizə əminsiniz?",
          "Are you sure you want to delete this service type?",
        ),
        variant: "danger",
      }))
    ) {
      return;
    }
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      const next = serviceTypes.filter((s) => s.value !== value);
      await persist(next);
      notifySuccess(tr("Xidmət növü silindi", "Service type deleted"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleSubmit = async () => {
    const label = formData.label.trim();
    const labelAz = formData.labelAz.trim();
    const labelTr = formData.labelTr.trim();
    const errors: Record<string, string> = {};

    if (!label) errors.label = tr("İngilis adı tələb olunur", "English label is required");
    if (!labelAz) errors.labelAz = tr("Azərbaycan adı tələb olunur", "Azerbaijani label is required");

    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (isDemo || !isAuthenticated) return;
    if (editingValue ? !canEdit : !canCreate) return;

    setSaving(true);
    try {
      let next: ServiceTypeWrite[];
      if (editingValue) {
        // Keep existing slug so reservations stay linked.
        next = serviceTypes.map((s) =>
          s.value === editingValue
            ? {
                value: editingValue,
                label,
                labelAz,
                ...(labelTr ? { labelTr } : {}),
              }
            : s,
        );
      } else {
        // Omit value — backend generates unique slug from English label.
        next = [
          ...serviceTypes,
          { label, labelAz, ...(labelTr ? { labelTr } : {}) },
        ];
      }
      await persist(next);
      notifySuccess(
        editingValue
          ? tr("Xidmət növü yeniləndi", "Service type updated")
          : tr("Xidmət növü əlavə edildi", "Service type added"),
      );
      closeModal();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData().finally(() => setIsRefreshing(false));
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Xidmət Növləri", "Service Types")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr(
              "Rezervasiya formasında görünən xidmət növlərini idarə edin",
              "Manage service types shown in the booking form",
            )}
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          {canCreate && (
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Əlavə et", "Add Service Type")}</span>
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder={tr("Axtar...", "Search...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("AD (EN)", "LABEL (EN)")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("AD (AZ)", "LABEL (AZ)")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("AD (TR)", "LABEL (TR)")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 uppercase px-3 py-2">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Yüklənir...", "Loading...")}
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                      {tr("Xidmət növü tapılmadı", "No service types found")}
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item, index) => (
                    <tr
                      key={item.value}
                      className={`border-b border-gray-200 dark:border-gray-800 ${
                        index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"
                      }`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white">{item.label}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{item.labelAz}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {item.labelTr || "—"}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(item.value)}
                              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
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

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingValue
                  ? tr("Xidmət növünü redaktə et", "Edit Service Type")
                  : tr("Xidmət növü əlavə et", "Add Service Type")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Ad (EN)", "Label (EN)")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData((prev) => ({ ...prev, label: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
                {formErrors.label && (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.label}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Ad (AZ)", "Label (AZ)")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.labelAz}
                  onChange={(e) => setFormData((prev) => ({ ...prev, labelAz: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
                {formErrors.labelAz && (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.labelAz}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {tr("Ad (TR)", "Label (TR)")}
                </label>
                <input
                  type="text"
                  value={formData.labelTr}
                  onChange={(e) => setFormData((prev) => ({ ...prev, labelTr: e.target.value }))}
                  className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
                />
              </div>
            </div>

            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
              >
                {tr("Ləğv Et", "Cancel")}
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving || isDemo}
                className="px-4 py-1.5 text-xs bg-[#14b8a6] text-white rounded-lg disabled:opacity-50"
              >
                {saving
                  ? tr("Saxlanılır...", "Saving...")
                  : tr("Yadda saxla", "Save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
