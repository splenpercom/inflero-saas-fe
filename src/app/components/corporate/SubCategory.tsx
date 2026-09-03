import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ChevronDown,
  Upload,
  X,
  Check,
  ArrowUpDown,
  Download,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import {
  fetchCategories,
  fetchSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  type CategoryRecord,
} from "../../api/inventory";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { ModernSelect } from "../ui/ModernSelect";
import { DataPagination } from "../ui/DataPagination";
import { usePagination, DEFAULT_LIST_PAGE_SIZE } from "../../hooks/usePagination";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";
interface SubCategory {
  id: string;
  name: string;
  category: string;
  categoryId: string;
  status: "active" | "inactive";
}

export function SubCategory() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [sortColumn, setSortColumn] = useState<keyof SubCategory | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Add form state
  const [categories, setCategories] = useState<CategoryRecord[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    status: "active" as "active" | "inactive",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setSubCategories([]);
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [catRows, subRows] = await Promise.all([fetchCategories(), fetchSubCategories()]);
      setCategories(catRows);
      setSubCategories(
        subRows.map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category,
          categoryId: r.categoryId,
          status: r.status,
        })),
      );
    } catch (err) {
      notifyFromError(err, tr("Alt kateqoriyaları yükləmək alınmadı", "Failed to load sub categories"));
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

  // Filter items
  const filteredItems = subCategories.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(debouncedSearch.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" ||
      item.category.toLowerCase() === selectedCategory.toLowerCase();

    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortColumn) return 0;
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });

  const {
    currentPage,
    totalPages,
    totalItems,
    paginatedData,
    setCurrentPage,
    itemsPerPage,
  } = usePagination({
    data: sortedItems,
    itemsPerPage: DEFAULT_LIST_PAGE_SIZE,
    resetKey: `${debouncedSearch}|${selectedCategory}|${selectedStatus}`,
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(tr("Alt Kateqoriyalar Hesabatı", "Sub Categories Report"), 14, 20);

    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);

    const tableData = sortedItems.map((item) => [
      item.name,
      item.category,
      item.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive"),
    ]);

    autoTable(doc, {
      head: [[
        tr("Alt Kateqoriya", "Sub Category"),
        tr("Kateqoriya", "Category"),
        tr("Status", "Status")
      ]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [20, 184, 166],
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 35 },
    });

    doc.save(`${tr("alt-kateqoriyalar", "sub-categories")}-${new Date().getTime()}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = [
      tr("Alt Kateqoriya", "Sub Category"),
      tr("Kateqoriya", "Category"),
      tr("Status", "Status")
    ];
    const rows = sortedItems.map((item) => [
      item.name,
      item.category,
      item.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${tr("alt-kateqoriyalar", "sub-categories")}-${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadData().finally(() => setIsRefreshing(false));
  };

  const handleSort = (column: keyof SubCategory) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDownloadDemo = () => {
    const headers = [
      tr("Alt Kateqoriya", "Sub Category"),
      tr("Kateqoriya", "Category"),
      tr("Status", "Status")
    ];
    const demoData = [
      [tr("Demo Alt 1", "Demo Sub 1"), tr("Kompüterlər", "Computers"), tr("Aktiv", "Active")],
      [tr("Demo Alt 2", "Demo Sub 2"), tr("Elektronika", "Electronics"), tr("Aktiv", "Active")],
      [tr("Demo Alt 3", "Demo Sub 3"), tr("Mebel", "Furniture"), tr("Qeyri-aktiv", "Inactive")],
    ];

    const csvContent = [headers, ...demoData]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${tr("alt-kateqoriyalar-demo", "sub-categories-demo")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsImporting(true);
      setImportProgress(0);

      const interval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsImporting(false);
              setImportProgress(0);
              setIsImportModalOpen(false);
              alert(tr("Alt kateqoriyalar uğurla idxal edildi!", "Sub categories imported successfully!"));
            }, 500);
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const closeFormModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setFormData({ name: "", categoryId: "", status: "active" });
    setFormErrors({});
  };

  const handleAddSubCategory = () => {
    setEditingId(null);
    setFormData({ name: "", categoryId: "", status: "active" });
    setFormErrors({});
    setShowAddModal(true);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    const name = formData.name.trim();

    if (!name) {
      errors.name = tr("Alt kateqoriya adı tələb olunur", "Sub category name is required");
    }

    if (!formData.categoryId.trim()) {
      errors.categoryId = tr("Kateqoriya tələb olunur", "Category is required");
    } else if (name) {
      const duplicate = subCategories.some(
        (s) =>
          s.categoryId === formData.categoryId &&
          s.name.trim().toLowerCase() === name.toLowerCase() &&
          s.id !== editingId,
      );
      if (duplicate) {
        errors.name = tr(
          "Bu kateqoriyada eyni adlı alt kateqoriya artıq mövcuddur",
          "A sub-category with this name already exists in this category",
        );
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitSubCategory = async () => {
    if (!validateForm()) return;
    if (isDemo || !isAuthenticated) return;

    const isEdit = editingId != null;
    if (isEdit ? !canEdit : !canCreate) return;

    setSaving(true);
    try {
      if (isEdit) {
        const updated = await updateSubCategory(editingId, {
          name: formData.name.trim(),
          categoryId: formData.categoryId,
          status: formData.status,
        });
        setSubCategories((prev) =>
          prev.map((s) =>
            s.id === editingId
              ? {
                  ...s,
                  name: updated.name,
                  category: updated.category,
                  categoryId: updated.categoryId,
                  status: updated.status,
                }
              : s,
          ),
        );
        notifySuccess(tr("Alt kateqoriya uğurla yeniləndi!", "Sub category updated successfully!"));
      } else {
        const created = await createSubCategory({
          name: formData.name.trim(),
          categoryId: formData.categoryId,
          status: formData.status,
        });
        setSubCategories((prev) => [
          {
            id: created.id,
            name: created.name,
            category: created.category,
            categoryId: created.categoryId,
            status: created.status,
          },
          ...prev,
        ]);
        notifySuccess(tr("Alt kateqoriya uğurla əlavə edildi!", "Sub category added successfully!"));
      }
      closeFormModal();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleView = (id: string) => {
    alert(`View sub category ${id}`);
  };

  const handleEdit = (id: string) => {
    const subCategory = subCategories.find((s) => s.id === id);
    if (!subCategory) return;
    setEditingId(id);
    setFormData({
      name: subCategory.name,
      categoryId: subCategory.categoryId,
      status: subCategory.status,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu alt kateqoriyanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this sub category?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteSubCategory(id);
      setSubCategories((prev) => prev.filter((s) => s.id !== id));
      notifySuccess(tr("Alt kateqoriya silindi", "Sub category deleted"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Alt Kateqoriya", "Sub Category")}
          </h1>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Alt kateqoriya axtar...", "Search sub categories...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <ModernSelect
                value={selectedCategory}
                onChange={setSelectedCategory}
                options={[
                  { value: "all", label: tr("Bütün Kateqoriyalar", "All Categories") },
                  ...categories.map((c) => ({ value: c.name, label: c.name })),
                ]}
              />

              <ModernSelect
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: "all", label: tr("Bütün Statuslar", "All Status") },
                  { value: "active", label: tr("Aktiv", "Active") },
                  { value: "inactive", label: tr("Qeyri-aktiv", "Inactive") },
                ]}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("PDF İxrac Et", "Export PDF")}
              >
                <FileText className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("CSV İxrac Et", "Export CSV")}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-green-500" />
              </button>

              {canCreate && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={tr("CSV İdxal Et", "Import CSV")}
              >
                <Upload className="w-3.5 h-3.5 text-[#14b8a6]" />
              </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                title={tr("Yenilə", "Refresh")}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>

              {canCreate && (
              <button
                onClick={handleAddSubCategory}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr("Alt Kateqoriya Əlavə Et", "Add Sub Category")}</span>
              </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div
          className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden transition-opacity duration-300 ${
            isRefreshing ? "opacity-50" : "opacity-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ŞƏKİL", "IMAGE")}
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("ALT KATEQORİYA", "SUB CATEGORY")}
                      {sortColumn === "name" && (
                        <ArrowUpDown
                          className={`w-3 h-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("category")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("KATEQORİYA", "CATEGORY")}
                      {sortColumn === "category" && (
                        <ArrowUpDown
                          className={`w-3 h-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("STATUS", "STATUS")}
                      {sortColumn === "status" && (
                        <ArrowUpDown
                          className={`w-3 h-3 ${
                            sortDirection === "asc" ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </div>
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap">
                    {tr("ƏMƏLİYYATLAR", "ACTIONS")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((subCategory, index) => (
                  <tr
                    key={subCategory.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="w-8 h-8 rounded-lg bg-[#ccfbf1] dark:bg-[#14b8a6]/20 flex items-center justify-center text-xs font-bold text-[#14b8a6] dark:text-[#14b8a6]">{subCategory.name.charAt(0).toUpperCase()}</div>
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                      {subCategory.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {subCategory.category}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                          subCategory.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                        )}
                      >
                        {subCategory.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                        <button
                          onClick={() => handleEdit(subCategory.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        )}

                        {canDelete && (
                        <button
                          onClick={() => handleDelete(subCategory.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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

        {/* Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tr("Alt Kateqoriyaları İdxal Et", "Import Sub Categories")}
                </h2>
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    {tr("Addım 1: Demo Faylı Yüklə", "Step 1: Download Demo File")}
                  </label>
                  <button
                    onClick={handleDownloadDemo}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ccfbf1] dark:bg-[#14b8a6]/20 border border-[#b3c0ff] dark:border-[#14b8a6] rounded-lg text-sm font-medium text-[#14b8a6] dark:text-[#14b8a6] hover:bg-[#ccfbf1] dark:hover:bg-[#14b8a6]/30 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    {tr("Demo CSV Yüklə", "Download Demo CSV")}
                  </button>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {tr("Düzgün formatı görmək üçün demo faylı yükləyin.", "Download the demo file to see the correct format.")}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white mb-2 block">
                    {tr("Addım 2: Faylınızı Yüklə", "Step 2: Upload Your File")}
                  </label>
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">{tr("Yükləmək üçün klikləyin", "Click to upload")}</span> {tr("və ya sürüyün", "or drag and drop")}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{tr("CSV faylları", "CSV files")}</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={handleImportFileChange}
                        disabled={isImporting}
                      />
                    </label>
                  </div>
                </div>

                {isImporting && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">{tr("İdxal edilir...", "Importing...")}</span>
                      <span className="font-medium text-[#14b8a6] dark:text-[#14b8a6]">
                        {importProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-[#14b8a6] h-2.5 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isImporting ? tr("İdxal edilir...", "Importing...") : tr("Bağla", "Close")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add / Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editingId
                    ? tr("Alt Kateqoriyanı Redaktə Et", "Edit Sub Category")
                    : tr("Alt Kateqoriya Əlavə Et", "Add Sub Category")}
                </h2>
                <button
                  onClick={closeFormModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                    {tr("Alt Kateqoriya Adı *", "Sub Category Name *")}
                  </label>
                  <input
                    type="text"
                    placeholder={tr("Alt kateqoriya adını daxil edin", "Enter sub category name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${
                      formErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                    } rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#14b8a6]`}
                  />
                  {formErrors.name && <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                    {tr("Kateqoriya *", "Category *")}
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${formErrors.categoryId ? "border-red-500" : "border-gray-300 dark:border-gray-700"} rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] appearance-none cursor-pointer`}
                  >
                    <option value="">{tr("Seç", "Select")}</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && <p className="text-[10px] text-red-500 mt-1">{formErrors.categoryId}</p>}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                    {tr("Status", "Status")}
                  </label>
                  <ModernSelect
                    value={formData.status}
                    onChange={(value) => setFormData({ ...formData, status: value as "active" | "inactive" })}
                    options={[
                      { value: "active", label: tr("Aktiv", "Active") },
                      { value: "inactive", label: tr("Qeyri-aktiv", "Inactive") },
                    ]}
                  />
                </div>
              </div>

              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  onClick={closeFormModal}
                  disabled={saving}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {tr("Ləğv Et", "Cancel")}
                </button>
                <button
                  onClick={handleSubmitSubCategory}
                  disabled={saving}
                  className="px-3 py-1.5 bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving
                    ? tr("Yadda saxlanılır...", "Saving...")
                    : editingId
                      ? tr("Yadda Saxla", "Save Changes")
                      : tr("Alt Kateqoriya Əlavə Et", "Add Sub Category")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
