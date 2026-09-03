import { useState, useEffect, useCallback } from "react";
import { X, Plus, Edit2, Trash2 } from "lucide-react";
import { useLanguage } from "../../i18n/LanguageContext";
import { useConfirm } from "../../context/ConfirmContext";
import { useAuth } from "../../context/AuthContext";
import {
  createExpenseCategory,
  deleteExpenseCategory,
  fetchExpenseCategories,
  updateExpenseCategory,
  type FinanceCategory,
} from "../../api/finance";
import { notifyFromError, notifySuccess } from "../../lib/toast";

import { pickLang } from "../../i18n/pickLang";
interface ManageExpenseCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
}

export function ManageExpenseCategoriesModal({
  isOpen,
  onClose,
  onChanged,
}: ManageExpenseCategoriesModalProps) {
  const { language } = useLanguage();
  const { isDemo, isAuthenticated } = useAuth();
  const askConfirm = useConfirm();
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newStatus, setNewStatus] = useState(true);
  const [saving, setSaving] = useState(false);

  const tr = (az: string, en: string, ru?: string) => pickLang(language, az, en, ru);

  const load = useCallback(async () => {
    if (!isOpen || !(isAuthenticated || isDemo)) return;
    setLoading(true);
    try {
      const rows = await fetchExpenseCategories();
      setCategories(rows);
    } catch (err) {
      notifyFromError(err, tr("Kateqoriyaları yükləmək alınmadı", "Failed to load categories"));
    } finally {
      setLoading(false);
    }
  }, [isOpen, isDemo, isAuthenticated, language]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleAddCategory = async () => {
    if (!newCategory.trim() || isDemo) return;
    setSaving(true);
    try {
      if (isEditMode && editingId) {
        await updateExpenseCategory(editingId, {
          name: newCategory.trim(),
          description: newDescription.trim() || null,
          isActive: newStatus,
        });
        notifySuccess(tr("Kateqoriya yeniləndi", "Category updated"));
      } else {
        await createExpenseCategory({
          name: newCategory.trim(),
          description: newDescription.trim() || null,
          isActive: newStatus,
        });
        notifySuccess(tr("Kateqoriya əlavə edildi", "Category added"));
      }
      setIsEditMode(false);
      setEditingId(null);
      setNewCategory("");
      setNewDescription("");
      setNewStatus(true);
      setIsAddCategoryOpen(false);
      await load();
      onChanged?.();
    } catch (err) {
      notifyFromError(err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (category: FinanceCategory) => {
    setIsEditMode(true);
    setEditingId(category.id);
    setNewCategory(category.name);
    setNewDescription(category.description ?? "");
    setNewStatus(category.isActive);
    setIsAddCategoryOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (isDemo) return;
    if (
      !(await askConfirm({
        title: tr("Silmə təsdiqi", "Confirm deletion"),
        message: tr("Bu kateqoriyanı silmək istədiyinizə əminsiniz?", "Are you sure you want to delete this category?"),
        variant: "danger",
      }))
    ) {
      return;
    }
    try {
      await deleteExpenseCategory(id);
      notifySuccess(tr("Kateqoriya silindi", "Category deleted"));
      await load();
      onChanged?.();
    } catch (err) {
      notifyFromError(err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={handleBackdropClick}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{tr("Xərc Kateqoriyalarını İdarə Et", "Manage Expense Categories")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!isDemo && !isAddCategoryOpen && (
            <button onClick={() => setIsAddCategoryOpen(true)} className="w-full mb-4 flex items-center justify-center gap-2 px-3 py-2 text-xs bg-[#14b8a6] hover:bg-[#0d9488] text-white rounded-lg font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              <span>{tr("Yeni Kateqoriya Əlavə Et", "Add New Category")}</span>
            </button>
          )}

          {isAddCategoryOpen && (
            <div className="mb-4 p-3 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/30">
              <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-3">
                {isEditMode ? tr("Kateqoriyanı Redaktə Et", "Edit Category") : tr("Xərc Kateqoriyası Əlavə Et", "Add Expense Category")}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Kateqoriya", "Category")} <span className="text-red-500">*</span></label>
                  <input type="text" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-900 dark:text-white mb-1.5 block">{tr("Təsvir", "Description")}</label>
                  <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} rows={2} className="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#14b8a6] resize-none" />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-gray-900 dark:text-white">{tr("Status", "Status")}</label>
                  <button onClick={() => setNewStatus(!newStatus)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${newStatus ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newStatus ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { setIsAddCategoryOpen(false); setIsEditMode(false); setEditingId(null); setNewCategory(""); setNewDescription(""); setNewStatus(true); }} className="flex-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors">{tr("Ləğv Et", "Cancel")}</button>
                  <button onClick={() => void handleAddCategory()} disabled={saving || !newCategory.trim()} className="flex-1 px-3 py-1.5 bg-[#14b8a6] text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50">{saving ? tr("Saxlanılır...", "Saving...") : tr("Yadda Saxla", "Save")}</button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <p className="text-xs text-gray-500 text-center py-4">{tr("Yüklənir...", "Loading...")}</p>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{category.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${category.isActive ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"}`}>
                      {category.isActive ? tr("Aktiv", "Active") : tr("Qeyri-aktiv", "Inactive")}
                    </span>
                    {!isDemo && (
                      <>
                        <button onClick={() => handleEditClick(category)} className="p-1.5 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors" title={tr("Redaktə Et", "Edit")}><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => void handleDelete(category.id)} className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title={tr("Sil", "Delete")}><Trash2 className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end">
          <button onClick={onClose} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-xs font-medium transition-colors">{tr("Bağla", "Close")}</button>
        </div>
      </div>
    </div>
  );
}
