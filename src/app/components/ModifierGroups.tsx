import { useState } from "react";
import { Search, Edit2, Trash2, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useLanguage } from "../i18n/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";
import { useMenu } from "../contexts/MenuContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";

export function ModifierGroups() {
  const { t } = useLanguage();
  const askConfirm = useConfirm();
  const navigate = useNavigate();
  const {
    modifierGroups,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    getModifiersByGroupId,
  } = useMenu();

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    selectionType: "single" as "single" | "multiple",
    isRequired: false,
    minSelection: 1,
    maxSelection: 1,
  });

  const filteredGroups = modifierGroups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    if (formData.name.trim()) {
      addModifierGroup({
        name: formData.name.trim(),
        selectionType: formData.selectionType,
        isRequired: formData.isRequired,
        minSelection: formData.selectionType === "single" ? 1 : formData.minSelection,
        maxSelection: formData.selectionType === "single" ? 1 : formData.maxSelection,
        sortOrder: modifierGroups.length + 1,
      });
      resetForm();
      setIsAddModalOpen(false);
    }
  };

  const handleEdit = () => {
    if (editingGroup && formData.name.trim()) {
      updateModifierGroup(editingGroup.id, {
        name: formData.name.trim(),
        selectionType: formData.selectionType,
        isRequired: formData.isRequired,
        minSelection: formData.selectionType === "single" ? 1 : formData.minSelection,
        maxSelection: formData.selectionType === "single" ? 1 : formData.maxSelection,
      });
      resetForm();
      setIsEditModalOpen(false);
      setEditingGroup(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.deleteConfirm || "Are you sure you want to delete this modifier group?",
      variant: "danger",
    })) {
      deleteModifierGroup(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      selectionType: "single",
      isRequired: false,
      minSelection: 1,
      maxSelection: 1,
    });
  };

  const openEditModal = (group: any) => {
    setEditingGroup(group);
    setFormData({
      name: group.name,
      selectionType: group.selectionType,
      isRequired: group.isRequired,
      minSelection: group.minSelection || 1,
      maxSelection: group.maxSelection || 1,
    });
    setIsEditModalOpen(true);
  };

  const badgeColors = [
    "bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300",
    "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300",
    "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
    "bg-pink-100 dark:bg-pink-950 text-pink-700 dark:text-pink-300",
    "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300",
    "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300",
  ];

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.modifierGroups}
        </h1>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchModifierGroup || "Search modifier groups..."}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addModifierGroup}
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t.noDataAvailable || "No modifier groups found"}
            </p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const modifiers = getModifiersByGroupId(group.id);
            return (
              <div
                key={group.id}
                className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:border-red-500 dark:hover:border-red-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                      {group.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {group.selectionType === "single" ? t.singleSelection || "Single" : t.multipleSelection || "Multiple"}
                      </span>
                      {group.isRequired && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                          {t.required || "Required"}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {modifiers.length} {t.modifiers || "modifier(s)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modifiers Preview */}
                {modifiers.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {modifiers.slice(0, 6).map((modifier, idx) => (
                      <span
                        key={modifier.id}
                        className={`text-[10px] px-2 py-1 rounded-md font-medium ${
                          badgeColors[idx % badgeColors.length]
                        }`}
                      >
                        {modifier.name}
                        {modifier.price > 0 && ` +${modifier.price}₼`}
                      </span>
                    ))}
                    {modifiers.length > 6 && (
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        +{modifiers.length - 6} more
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={() => navigate(`/menus/items/modifiers/${group.id}`)}
                    className="flex-1 px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1"
                  >
                    <ArrowRight className="w-3 h-3" />
                    {t.viewModifiers || "View Modifiers"}
                  </button>
                  <button
                    onClick={() => openEditModal(group)}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="px-2.5 py-1.5 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.addModifierGroup}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.addModifierGroupDescription || "Add a new modifier group to your menu."}
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
                placeholder={t.enterModifierGroupName || "Enter modifier group name"}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.selectionType || "Selection Type"}
              </label>
              <select
                value={formData.selectionType}
                onChange={(e) => setFormData({ ...formData, selectionType: e.target.value as "single" | "multiple" })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="single">{t.singleSelection || "Single Selection"}</option>
                <option value="multiple">{t.multipleSelection || "Multiple Selection"}</option>
              </select>
            </div>

            {formData.selectionType === "multiple" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.minSelection || "Min Selection"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minSelection}
                    onChange={(e) => setFormData({ ...formData, minSelection: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.maxSelection || "Max Selection"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxSelection}
                    onChange={(e) => setFormData({ ...formData, maxSelection: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRequired"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="w-3.5 h-3.5 text-red-600 border-gray-300 dark:border-gray-700 rounded focus:ring-red-500"
              />
              <label htmlFor="isRequired" className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                {t.requiredModifierGroup || "This modifier group is required"}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
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

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {t.updateModifierGroup || "Update Modifier Group"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {t.updateModifierGroupDescription || "Update the details of this modifier group."}
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
                placeholder={t.enterModifierGroupName || "Enter modifier group name"}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t.selectionType || "Selection Type"}
              </label>
              <select
                value={formData.selectionType}
                onChange={(e) => setFormData({ ...formData, selectionType: e.target.value as "single" | "multiple" })}
                className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="single">{t.singleSelection || "Single Selection"}</option>
                <option value="multiple">{t.multipleSelection || "Multiple Selection"}</option>
              </select>
            </div>

            {formData.selectionType === "multiple" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.minSelection || "Min Selection"}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minSelection}
                    onChange={(e) => setFormData({ ...formData, minSelection: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t.maxSelection || "Max Selection"}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxSelection}
                    onChange={(e) => setFormData({ ...formData, maxSelection: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRequiredEdit"
                checked={formData.isRequired}
                onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                className="w-3.5 h-3.5 text-red-600 border-gray-300 dark:border-gray-700 rounded focus:ring-red-500"
              />
              <label htmlFor="isRequiredEdit" className="ml-2 text-xs text-gray-700 dark:text-gray-300">
                {t.requiredModifierGroup || "This modifier group is required"}
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingGroup(null);
                resetForm();
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