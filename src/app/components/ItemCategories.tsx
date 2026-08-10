import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { useState } from "react";
import { Search, Edit2, Trash2, Plus, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import { useMenu } from "../contexts/MenuContext";

export function ItemCategories() {
  const { t } = useLanguage();
  const askConfirm = useConfirm();
  const {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getMenuItemsByCategory,
  } = useMenu();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (formData.name.trim()) {
      addCategory({
        name: formData.name.trim(),
        description: formData.description.trim(),
        sortOrder: categories.length + 1,
        isActive: true,
      });
      setFormData({ name: "", description: "" });
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingCategory && formData.name.trim()) {
      updateCategory(editingCategory.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
      setFormData({ name: "", description: "" });
      setIsEditModalOpen(false);
      setEditingCategory(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.deleteConfirm || "Are you sure you want to delete this category?",
      variant: "danger",
    })) {
      deleteCategory(id);
    }
  };

  const openEditModal = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
    });
    setIsEditModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.itemCategories}
        </h1>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchItemCategory}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addItemCategory}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.itemCategory}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.description || "Description"}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.menuItems}
                </th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.action}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {t.noDataAvailable || "No categories found"}
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => {
                  const itemCount = getMenuItemsByCategory(category.id).length;
                  return (
                    <tr
                      key={category.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">
                        {category.name}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {category.description || "-"}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {itemCount} Item(s)
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditModal(category)}
                            className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            {t.update}
                          </button>
                          <button
                            onClick={() => handleDelete(category.id)}
                            className="px-2.5 py-1.5 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            {t.delete}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Category Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.addItemCategory}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.addCategoryDescription || "Add a new category to your menu."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.name || "Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.enterCategoryName || "Enter category name"}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.description || "Description"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.enterDescription || "Enter description"}
                rows={3}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                setFormData({ name: "", description: "" });
              }}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleAdd}
              disabled={!formData.name.trim()}
              className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.add}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.updateItemCategory || "Update Category"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.updateCategoryDescription || "Update the category details."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.name || "Name"} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t.enterCategoryName || "Enter category name"}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.description || "Description"}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t.enterDescription || "Enter description"}
                rows={3}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingCategory(null);
                setFormData({ name: "", description: "" });
              }}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleEdit}
              disabled={!formData.name.trim()}
              className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t.update}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}