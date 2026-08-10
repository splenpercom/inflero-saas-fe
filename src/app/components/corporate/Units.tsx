import { useState, useEffect, useCallback } from "react";
import { cn } from "../ui/utils";
import {
  Search,
  Plus,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Edit2,
  Trash2,
  ChevronDown,
  Upload,
  X,
  Check,
  ArrowUpDown,
  Download,
  Eye,
} from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { formatNowDate, formatNowDateTime } from "../../lib/dateFormat";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useModulePermissions } from "../../hooks/useModulePermissions";
import { useBranchRevision } from "../../hooks/useBranchRevision";
import { fetchUnits, createUnit, updateUnit, deleteUnit } from "../../api/inventory";
import { formatInventoryDate } from "../../lib/inventoryMappers";
import { notifyFromError, notifySuccess } from "../../lib/toast";
import { useConfirm } from "../../context/ConfirmContext";
import { ModernSelect } from "../ui/ModernSelect";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { pickLang } from "../../i18n/pickLang";
interface Unit {
  id: string;
  name: string;
  shortName: string;
  noOfProducts: number;
  createdDate: string;
  status: "active" | "inactive";
}

export function Units() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { isDemo, isAuthenticated } = useAuth();
  const { canView, canCreate, canEdit, canDelete } = useModulePermissions("Inventory");
  const branchRevision = useBranchRevision();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [sortColumn, setSortColumn] = useState<keyof Unit | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Translation helper
  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  // Add form state
  const [formData, setFormData] = useState({
    name: "",
    shortName: "",
    status: "active" as "active" | "inactive",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUnits = useCallback(async () => {
    if (!(isAuthenticated || isDemo) || !canView) {
      setUnits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await fetchUnits();
      setUnits(
        rows.map((r) => ({
          id: r.id,
          name: r.name,
          shortName: r.shortName,
          noOfProducts: r.noOfProducts,
          createdDate: formatInventoryDate(r.createdDate || r.createdAt),
          status: r.status,
        })),
      );
    } catch (err) {
      notifyFromError(err, tr("Vahidləri yükləmək alınmadı", "Failed to load units"));
    } finally {
      setLoading(false);
    }
  }, [isDemo, isAuthenticated, canView, language, branchRevision]);

  useEffect(() => {
    void loadUnits();
  }, [loadUnits]);

  // Filter items
  const filteredItems = units.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === "all" || item.status === selectedStatus;
    return matchesSearch && matchesStatus;
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
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(tr("Vahidlər Hesabatı", "Units Report"), 14, 20);

    doc.setFontSize(10);
    doc.text(`${tr("Yaradılıb", "Generated")}: ${formatNowDateTime(language)}`, 14, 28);

    const tableData = sortedItems.map((item) => [
      item.name,
      item.shortName,
      item.noOfProducts.toString(),
      item.createdDate,
      item.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive"),
    ]);

    autoTable(doc, {
      head: [[
        tr("Vahid", "Unit"),
        tr("Qısa Ad", "Short Name"),
        tr("Məhsul Sayı", "No of Products"),
        tr("Yaradılma Tarixi", "Created Date"),
        tr("Status", "Status")
      ]],
      body: tableData,
      startY: 35,
      theme: "grid",
      headStyles: {
        fillColor: [0, 38, 246],
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

    doc.save(`${tr("vahidler", "units")}-${new Date().getTime()}.pdf`);
  };

  const handleExportCSV = () => {
    const headers = [
      tr("Vahid", "Unit"),
      tr("Qısa Ad", "Short Name"),
      tr("Məhsul Sayı", "No of Products"),
      tr("Yaradılma Tarixi", "Created Date"),
      tr("Status", "Status")
    ];
    const rows = sortedItems.map((item) => [
      item.name,
      item.shortName,
      item.noOfProducts.toString(),
      item.createdDate,
      item.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive"),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${tr("vahidler", "units")}-${new Date().getTime()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    void loadUnits().finally(() => setIsRefreshing(false));
  };

  const handleSort = (column: keyof Unit) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleDownloadDemo = () => {
    const headers = [
      tr("Vahid", "Unit"),
      tr("Qısa Ad", "Short Name"),
      tr("Məhsul Sayı", "No of Products"),
      tr("Yaradılma Tarixi", "Created Date"),
      tr("Status", "Status")
    ];
    const demoData = [
      [tr("Demo Vahid 1", "Demo Unit 1"), "du1", "15", "11 Mar 2026", tr("Aktiv", "Active")],
      [tr("Demo Vahid 2", "Demo Unit 2"), "du2", "25", "10 Mar 2026", tr("Aktiv", "Active")],
      [tr("Demo Vahid 3", "Demo Unit 3"), "du3", "30", "09 Mar 2026", tr("Qeyri-aktiv", "Inactive")],
    ];

    const csvContent = [headers, ...demoData]
      .map((row) => row.map((cell) => `"${cell}"`).join(";"))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${tr("vahidler-demo", "units-demo")}.csv`);
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
              alert(tr("Vahidlər uğurla idxal edildi!", "Units imported successfully!"));
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
    setFormData({ name: "", shortName: "", status: "active" });
    setFormErrors({});
  };

  const handleAddUnit = () => {
    setEditingId(null);
    setFormData({ name: "", shortName: "", status: "active" });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleView = (id: string) => {
    alert(`View unit ${id}`);
  };

  const handleEdit = (id: string) => {
    const unit = units.find((u) => u.id === id);
    if (!unit) return;
    setEditingId(id);
    setFormData({
      name: unit.name,
      shortName: unit.shortName,
      status: unit.status,
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!(await askConfirm({
      title: tr("Silmə təsdiqi", "Confirm deletion"),
      message: tr("Bu vahidi silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this unit?"),
      variant: "danger",
    }))) return;
    if (isDemo || !isAuthenticated || !canDelete) return;
    try {
      await deleteUnit(id);
      setUnits((prev) => prev.filter((u) => u.id !== id));
      notifySuccess(tr("Vahid silindi", "Unit deleted"));
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleAddFormSubmit = async () => {
    const errors: Record<string, string> = {};
    const name = formData.name.trim();
    const shortName = formData.shortName.trim();
    if (!name) {
      errors.name = tr("Ad tələb olunur", "Name is required");
    } else {
      const duplicateName = units.some(
        (u) => u.name.trim().toLowerCase() === name.toLowerCase() && u.id !== editingId,
      );
      if (duplicateName) {
        errors.name = tr("Bu adda vahid artıq mövcuddur", "A unit with this name already exists");
      }
    }
    if (!shortName) {
      errors.shortName = tr("Qısa ad tələb olunur", "Short name is required");
    } else {
      const duplicateShort = units.some(
        (u) =>
          u.shortName.trim().toLowerCase() === shortName.toLowerCase() && u.id !== editingId,
      );
      if (duplicateShort) {
        errors.shortName = tr(
          "Bu qısa ad artıq mövcuddur",
          "A unit with this short name already exists",
        );
      }
    }
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) return;
    if (isDemo || !isAuthenticated) return;

    const isEdit = editingId != null;
    if (isEdit ? !canEdit : !canCreate) return;

    setSaving(true);
    try {
      if (isEdit) {
        const updated = await updateUnit(editingId, {
          name: formData.name.trim(),
          shortName: formData.shortName.trim(),
          status: formData.status,
        });
        setUnits((prev) =>
          prev.map((u) =>
            u.id === editingId
              ? {
                  ...u,
                  name: updated.name,
                  shortName: updated.shortName,
                  status: updated.status,
                }
              : u,
          ),
        );
        notifySuccess(tr("Vahid uğurla yeniləndi!", "Unit updated successfully!"));
      } else {
        const created = await createUnit({
          name: formData.name.trim(),
          shortName: formData.shortName.trim(),
          status: formData.status,
        });
        setUnits((prev) => [
          {
            id: created.id,
            name: created.name,
            shortName: created.shortName,
            noOfProducts: created.noOfProducts,
            createdDate: formatInventoryDate(created.createdDate || created.createdAt),
            status: created.status,
          },
          ...prev,
        ]);
        notifySuccess(tr("Vahid uğurla əlavə edildi!", "Unit added successfully!"));
      }
      closeFormModal();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {tr("Vahidlər", "Units")}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {tr("Vahidlərinizi idarə edin", "Manage your units")}
          </p>
        </div>

        {/* Search and Actions Bar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder={tr("Vahid axtar...", "Search units...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
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
                <Upload className="w-3.5 h-3.5 text-[#0026f6]" />
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
                onClick={handleAddUnit}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr("Vahid Əlavə Et", "Add Unit")}</span>
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
                  <th
                    className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2 whitespace-nowrap cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("VAHİD", "UNIT")}
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
                    onClick={() => handleSort("shortName")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("QISA AD", "SHORT NAME")}
                      {sortColumn === "shortName" && (
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
                    onClick={() => handleSort("noOfProducts")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("MƏHSUL SAYI", "NO OF PRODUCTS")}
                      {sortColumn === "noOfProducts" && (
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
                    onClick={() => handleSort("createdDate")}
                  >
                    <div className="flex items-center gap-1">
                      {tr("YARADILMA TARİXİ", "CREATED DATE")}
                      {sortColumn === "createdDate" && (
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
                {sortedItems.map((unit, index) => (
                  <tr
                    key={unit.id}
                    className={`border-b border-gray-200 dark:border-gray-800 ${
                      index % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/30"
                    }`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                      {unit.name}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {unit.shortName}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {unit.noOfProducts}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {unit.createdDate}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border",
                          unit.status === "active"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700"
                        )}
                      >
                        {unit.status === "active" ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive")}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {canEdit && (
                        <button
                          onClick={() => handleEdit(unit.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        )}

                        {canDelete && (
                        <button
                          onClick={() => handleDelete(unit.id)}
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
        </div>

        {/* Import Modal */}
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {tr("Vahidləri İdxal Et", "Import Units")}
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
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#e8ebff] dark:bg-[#0026f6]/20 border border-[#b3c0ff] dark:border-[#0026f6] rounded-lg text-sm font-medium text-[#0026f6] dark:text-[#0026f6] hover:bg-[#e8ebff] dark:hover:bg-[#0026f6]/30 transition-colors"
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
                      <span className="font-medium text-[#0026f6] dark:text-[#0026f6]">
                        {importProgress.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#0026f6] to-[#001db8] h-2.5 rounded-full transition-all duration-300 ease-out"
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

        {/* Add / Edit Unit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {editingId ? tr("Vahidi Redaktə Et", "Edit Unit") : tr("Vahid Əlavə Et", "Add Unit")}
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
                    {tr("Vahid Adı *", "Unit Name *")}
                  </label>
                  <input
                    type="text"
                    placeholder={tr("Vahid adını daxil edin", "Enter unit name")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${
                      formErrors.name ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                    } rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]`}
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">
                    {tr("Qısa Ad *", "Short Name *")}
                  </label>
                  <input
                    type="text"
                    placeholder={tr("məs., kg", "e.g., kg")}
                    value={formData.shortName}
                    onChange={(e) => setFormData({ ...formData, shortName: e.target.value })}
                    className={`w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border ${
                      formErrors.shortName ? "border-red-500" : "border-gray-300 dark:border-gray-700"
                    } rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]`}
                  />
                  {formErrors.shortName && (
                    <p className="text-[10px] text-red-500 mt-1">{formErrors.shortName}</p>
                  )}
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
                  onClick={handleAddFormSubmit}
                  disabled={saving}
                  className="px-3 py-1.5 bg-gradient-to-r from-[#0026f6] to-[#001db8] hover:from-[#001fc4] hover:to-[#0018a0] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {saving
                    ? tr("Yadda saxlanılır...", "Saving...")
                    : editingId
                      ? tr("Yadda Saxla", "Save Changes")
                      : tr("Vahid Əlavə Et", "Add Unit")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
