import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import { Search, Plus, RefreshCw, Edit2, Trash2, X } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type ProductListItem,
} from "../../api/inventory";
import { parsePrice } from "../../lib/inventoryMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { useAsyncGuard } from "../../hooks/useAsyncGuard";
import { DataPagination } from "../ui/DataPagination";
import { ModernSelect } from "../ui/ModernSelect";
import { pickLang, mapLang } from "../../i18n/pickLang";

import { DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";

const PAGE_SIZE = DEFAULT_LIST_PAGE_SIZE;

function formatMoney(value: string | number): string {
  const n = typeof value === "number" ? value : parsePrice(value);
  return Number.isFinite(n) ? n.toFixed(2) : "0.00";
}

export function Services() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [currentPage, setCurrentPage] = useState(1);

  const tr = (az: string, en: string) => pickLang(language, az, en);
  const st = (key: string) => {
    const translations: Record<string, { en: string; az: string }> = {
      title: { en: "Services", az: "Xidmətlər" },
      searchPlaceholder: { en: "Search by name...", az: "Ad üzrə axtarın..." },
      addService: { en: "Create", az: "Yarat" },
      name: { en: "NAME", az: "AD" },
      price: { en: "SALE PRICE", az: "SATIŞ QİYMƏTİ" },
      status: { en: "STATUS", az: "STATUS" },
      actions: { en: "ACTIONS", az: "ƏMƏLİYYATLAR" },
      active: { en: "Active", az: "Aktiv" },
      inactive: { en: "Inactive", az: "Passiv" },
      empty: { en: "No services yet", az: "Hələ xidmət yoxdur" },
      deleteTitle: { en: "Delete service?", az: "Xidməti silmək?" },
      deleteBody: { en: "This cannot be undone.", az: "Bu əməliyyat geri qaytarıla bilməz." },
      modalCreate: { en: "Create Service", az: "Xidmət Yarat" },
      modalEdit: { en: "Edit Service", az: "Xidməti Redaktə Et" },
      fieldName: { en: "Name", az: "Ad" },
      fieldPrice: { en: "Sale price", az: "Satış qiyməti" },
      fieldStatus: { en: "Status", az: "Status" },
      save: { en: "Save", az: "Saxla" },
      cancel: { en: "Cancel", az: "Ləğv et" },
      saving: { en: "Saving...", az: "Saxlanılır..." },
    };
    return mapLang(language, translations[key], key);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [services, setServices] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [formErrors, setFormErrors] = useState<{ name?: string; price?: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const isLatestLoad = useAsyncGuard();

  const loadServices = useCallback(async () => {
    const isStale = isLatestLoad();
    if (!(isAuthenticated || isDemo) || !canView) {
      if (!isStale()) {
        setServices([]);
        setTotalItems(0);
        setTotalPages(0);
        setLoading(false);
      }
      return;
    }
    if (!isStale()) setLoading(true);
    try {
      const data = await fetchProducts({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: debouncedSearch || undefined,
        productType: "SERVICE",
        sortBy: "name",
        sortOrder: "asc",
      });
      if (isStale()) return;
      setServices(data.items);
      setTotalItems(data.total);
      setTotalPages(data.totalPages);
      if (data.totalPages > 0 && currentPage > data.totalPages) {
        setCurrentPage(data.totalPages);
      }
    } catch (err) {
      if (isStale()) return;
      notifyFromError(err, tr("Xidmətləri yükləmək alınmadı", "Failed to load services"));
      setServices([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [
    isAuthenticated,
    isDemo,
    canView,
    currentPage,
    debouncedSearch,
    branchRevision,
    isLatestLoad,
    language,
  ]);

  useEffect(() => {
    void loadServices();
  }, [loadServices]);

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormName("");
    setFormPrice("");
    setFormStatus("ACTIVE");
    setFormErrors({});
  };

  const openCreate = () => {
    setEditingId(null);
    setFormName("");
    setFormPrice("");
    setFormStatus("ACTIVE");
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (row: ProductListItem) => {
    setEditingId(row.id);
    setFormName(row.name);
    setFormPrice(String(parsePrice(row.price)));
    setFormStatus(row.status === "inactive" ? "INACTIVE" : "ACTIVE");
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errors: { name?: string; price?: string } = {};
    if (!formName.trim()) {
      errors.name = tr("Ad tələb olunur", "Name is required");
    }
    if (!formPrice.trim()) {
      errors.price = tr("Qiymət tələb olunur", "Price is required");
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
    if (isDemo || !isAuthenticated) return;

    const isEdit = editingId != null;
    if (isEdit ? !canEdit : !canCreate) return;

    setSaving(true);
    try {
      const price = String(parsePrice(formPrice));
      if (isEdit) {
        await updateProduct(editingId, {
          name: formName.trim(),
          price,
          status: formStatus,
          productType: "SERVICE",
        });
        notifySuccess(tr("Xidmət yeniləndi", "Service updated"));
      } else {
        await createProduct({
          name: formName.trim(),
          price,
          productType: "SERVICE",
          status: formStatus,
        });
        notifySuccess(tr("Xidmət yaradıldı", "Service created"));
      }
      closeModal();
      await loadServices();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadServices();
    setIsRefreshing(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete) return;
    const ok = await askConfirm({
      title: st("deleteTitle"),
      message: `${name} — ${st("deleteBody")}`,
      variant: "danger",
    });
    if (!ok) return;
    try {
      await deleteProduct(id);
      notifySuccess(tr("Xidmət silindi", "Service deleted"));
      await loadServices();
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {st("title")}
          </h1>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={st("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#001058]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void handleRefresh()}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </button>
              {canCreate && (
                <button
                  type="button"
                  onClick={openCreate}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#001058] to-[#000844] hover:from-[#000C70] hover:to-[#000A60] text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{st("addService")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-opacity duration-500",
            isRefreshing && "opacity-50",
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {st("name")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {st("price")}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {st("status")}
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {st("actions")}
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
                ) : services.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500">
                      {st("empty")}
                    </td>
                  </tr>
                ) : (
                  services.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="px-3 py-2.5 text-xs font-medium text-gray-900 dark:text-white">
                        {row.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-700 dark:text-gray-300">
                        {formatMoney(row.price)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={cn(
                            "inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium",
                            row.status === "active"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                          )}
                        >
                          {row.status === "active" ? st("active") : st("inactive")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(row)}
                              className="p-1.5 text-gray-500 hover:text-[#001058] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                              aria-label={tr("Redaktə", "Edit")}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => void handleDelete(row.id, row.name)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              aria-label={tr("Sil", "Delete")}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          {totalPages > 1 && (
            <DataPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={totalItems}
              itemsPerPage={PAGE_SIZE}
              loading={loading}
              className="px-3 py-2 border-t border-gray-200 dark:border-gray-800"
            />
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingId ? st("modalEdit") : st("modalCreate")}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                aria-label={st("cancel")}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {st("fieldName")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className={cn(
                    "w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#001058]",
                    formErrors.name
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-700",
                  )}
                />
                {formErrors.name && (
                  <p className="mt-1 text-[10px] text-red-500">{formErrors.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {st("fieldPrice")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className={cn(
                    "w-full px-2.5 py-1.5 text-xs border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#001058]",
                    formErrors.price
                      ? "border-red-400 dark:border-red-600"
                      : "border-gray-300 dark:border-gray-700",
                  )}
                />
                {formErrors.price && (
                  <p className="mt-1 text-[10px] text-red-500">{formErrors.price}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                  {st("fieldStatus")}
                </label>
                <ModernSelect
                  value={formStatus}
                  onChange={(v) => setFormStatus(v as "ACTIVE" | "INACTIVE")}
                  options={[
                    { value: "ACTIVE", label: st("active") },
                    { value: "INACTIVE", label: st("inactive") },
                  ]}
                />
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {st("cancel")}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-[#001058] to-[#000844] text-white hover:from-[#000C70] hover:to-[#000A60] disabled:opacity-50"
              >
                {saving ? st("saving") : st("save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
