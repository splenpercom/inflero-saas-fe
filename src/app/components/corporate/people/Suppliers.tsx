import { useState, useEffect, useCallback } from "react";
import { cn } from "../../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  ChevronDown,
  Edit2,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../../../i18n/LanguageContext";
import { useAuth } from "../../../context/AuthContext";
import { useModulePermissions } from "../../../hooks/useModulePermissions";
import { useBranchRevision } from "../../../hooks/useBranchRevision";
import {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  type PeopleSupplier,
} from "../../../api/people";
import { notifyFromError, notifySuccess } from "../../../lib/toast";
import { useConfirm } from "../../../context/ConfirmContext";
import { AddSupplierModal, type SupplierFormData } from "./AddSupplierModal";
import { DataPagination } from "../../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../../hooks/usePagination";

import { pickLang } from "../../../i18n/pickLang";
export function Suppliers() {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("People");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<PeopleSupplier | null>(null);
  const [suppliers, setSuppliers] = useState<PeopleSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadSuppliers = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setSuppliers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchSuppliers({
        search: debouncedSearch || undefined,
        status: selectedStatus,
      });
      setSuppliers(rows);
    } catch (err) {
      notifyFromError(err, tr("Təchizatçıları yükləmək alınmadı", "Failed to load suppliers"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, debouncedSearch, selectedStatus, language, branchRevision]);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: suppliers,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${debouncedSearch}|${selectedStatus}`,
  });

  const translateStatus = (status: string) => {
    const statusMap: Record<string, string> = {
      Active: tr("Aktiv", "Active"),
      Inactive: tr("Qeyri-aktiv", "Inactive"),
    };
    return statusMap[status] || status;
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadSuppliers().finally(() => setIsRefreshing(false));
  };

  const handleAddSupplier = () => {
    if (!canCreate) return;
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    if (!canEdit) return;
    const row = suppliers.find((s) => s.id === id);
    if (row) {
      setEditingSupplier(row);
      setIsModalOpen(true);
    }
  };

  const handleSaveSupplier = async (data: SupplierFormData) => {
    if (isDemo || !isAuthenticated) return;
    if (editingSupplier ? !canEdit : !canCreate) return;
    setSaving(true);
    try {
      const body = {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        country: data.country || null,
        company: data.company || null,
        status: data.status,
      };
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, body);
        notifySuccess(tr("Təchizatçı yeniləndi", "Supplier updated"));
      } else {
        await createSupplier(body);
        notifySuccess(tr("Təchizatçı əlavə edildi", "Supplier added"));
      }
      setIsModalOpen(false);
      setEditingSupplier(null);
      void loadSuppliers();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu təchizatçını silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this supplier?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteSupplier(id);
      notifySuccess(tr("Təchizatçı silindi", "Supplier deleted"));
      void loadSuppliers();
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Təchizatçılar", "Suppliers")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Təchizatçılarınızı idarə edin", "Manage your suppliers")}
          </p>
        </div>

        <div className="flex justify-end gap-2 mb-4">
          <button
            onClick={() => alert(tr("PDF ixrac funksiyası tezliklə əlavə olunacaq", "Export PDF functionality coming soon"))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("PDF İxrac Et", "Export PDF")}
          >
            <FileText className="w-3.5 h-3.5 text-red-500" />
          </button>
          <button
            onClick={() => alert(tr("Excel ixrac funksiyası tezliklə əlavə olunacaq", "Export Excel functionality coming soon"))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title={tr("Excel İxrac Et", "Export Excel")}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            title={tr("Yenilə", "Refresh")}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
          </button>
          {canCreate && (
          <button
            onClick={handleAddSupplier}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{tr("Təchizatçı Əlavə Et", "Add Supplier")}</span>
          </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="flex-1 relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Axtar...", "Search...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>
            <div className="flex gap-2 ml-auto">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as "all" | "active" | "inactive")}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0026f6] cursor-pointer"
                >
                  <option value="all">{tr("Status", "Status")}</option>
                  <option value="active">{tr("Aktiv", "Active")}</option>
                  <option value="inactive">{tr("Qeyri-aktiv", "Inactive")}</option>
                </select>
                <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("KOD", "CODE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("TƏCHİZATÇI", "SUPPLIER")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("E-POÇT", "EMAIL")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("TELEFON", "PHONE")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("ŞİRKƏT", "COMPANY")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("STATUS", "STATUS")}</th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">{tr("ƏMƏLİYYATLAR", "ACTIONS")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">{tr("Yüklənir...", "Loading...")}</td>
                  </tr>
                ) : suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500">{tr("Təchizatçı tapılmadı", "No suppliers found")}</td>
                  </tr>
                ) : (
                  paginatedData.map((supplier, index) => (
                    <tr
                      key={supplier.id}
                      className={`border-b border-gray-200 dark:border-gray-800 ${index % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/30"}`}
                    >
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{supplier.code}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><span className="text-xs text-gray-900 dark:text-white">{supplier.name}</span></td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{supplier.email || "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{supplier.phone || "—"}</td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{supplier.company || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                          supplier.status === "Active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700",
                        )}>
                          {translateStatus(supplier.status)}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {canEdit && (
                          <button onClick={() => handleEdit(supplier.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors" title={tr("Redaktə Et", "Edit")}>
                            <Edit2 className="w-3 h-3" />
                          </button>
                          )}
                          {canDelete && (
                          <button onClick={() => void handleDelete(supplier.id)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title={tr("Sil", "Delete")}>
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
              showText={{
                showing: tr("Göstərilir", "Showing"),
                to: tr("-", "to"),
                of: tr("/", "of"),
                results: tr("nəticə", "results"),
              }}
            />
          </div>
        </div>

        <AddSupplierModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingSupplier(null); }}
          onSave={handleSaveSupplier}
          supplier={editingSupplier}
          saving={saving}
        />
      </div>
    </div>
  );
}
