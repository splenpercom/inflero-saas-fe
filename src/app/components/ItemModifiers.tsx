import React, { useState, useMemo, useCallback } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { useTheme } from "../i18n/ThemeContext";
import { Pencil, Trash2, X } from "lucide-react";

interface ItemModifier {
  id: number;
  itemName: string;
  modifierGroup: string;
  isRequired: boolean;
  allowMultipleSelection: boolean;
}

export const ItemModifiers = React.memo(function ItemModifiers() {
  const { t } = useLanguage();
  const theme = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingModifier, setEditingModifier] = useState<ItemModifier | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [modifierToDelete, setModifierToDelete] = useState<ItemModifier | null>(null);

  // Form states
  const [itemName, setItemName] = useState("");
  const [modifierGroup, setModifierGroup] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [allowMultipleSelection, setAllowMultipleSelection] = useState(false);

  const [modifiers, setModifiers] = useState<ItemModifier[]>([
    {
      id: 1,
      itemName: "Uttapam",
      modifierGroup: "Dips & Sauces",
      isRequired: false,
      allowMultipleSelection: false,
    },
    {
      id: 2,
      itemName: "Paneer Tikka",
      modifierGroup: "Extra Toppings",
      isRequired: false,
      allowMultipleSelection: false,
    },
    {
      id: 3,
      itemName: "Paneer Tikka",
      modifierGroup: "Dips & Sauces",
      isRequired: false,
      allowMultipleSelection: false,
    },
  ]);

  const filteredModifiers = useMemo(() => {
    return modifiers.filter(
      (modifier) =>
        modifier.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        modifier.modifierGroup.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [modifiers, searchQuery]);

  const handleOpenModal = useCallback((modifier?: ItemModifier) => {
    if (modifier) {
      setEditingModifier(modifier);
      setItemName(modifier.itemName);
      setModifierGroup(modifier.modifierGroup);
      setIsRequired(modifier.isRequired);
      setAllowMultipleSelection(modifier.allowMultipleSelection);
    } else {
      setEditingModifier(null);
      setItemName("");
      setModifierGroup("");
      setIsRequired(false);
      setAllowMultipleSelection(false);
    }
    setShowModal(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingModifier(null);
    setItemName("");
    setModifierGroup("");
    setIsRequired(false);
    setAllowMultipleSelection(false);
  }, []);

  const handleSave = useCallback(() => {
    if (!itemName.trim() || !modifierGroup.trim()) {
      return;
    }

    if (editingModifier) {
      // Update existing modifier
      setModifiers(
        modifiers.map((m) =>
          m.id === editingModifier.id
            ? {
                ...m,
                itemName: itemName.trim(),
                modifierGroup: modifierGroup.trim(),
                isRequired,
                allowMultipleSelection,
              }
            : m
        )
      );
    } else {
      // Create new modifier
      const newModifier: ItemModifier = {
        id: Math.max(...modifiers.map((m) => m.id), 0) + 1,
        itemName: itemName.trim(),
        modifierGroup: modifierGroup.trim(),
        isRequired,
        allowMultipleSelection,
      };
      setModifiers([...modifiers, newModifier]);
    }

    handleCloseModal();
  }, [editingModifier, itemName, modifierGroup, isRequired, allowMultipleSelection, modifiers, handleCloseModal]);

  const handleDeleteClick = useCallback((modifier: ItemModifier) => {
    setModifierToDelete(modifier);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (modifierToDelete) {
      setModifiers(modifiers.filter((m) => m.id !== modifierToDelete.id));
      setShowDeleteModal(false);
      setModifierToDelete(null);
    }
  }, [modifierToDelete, modifiers]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
            {t.itemModifiers || "Item Modifiers"}
          </h1>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t.searchItemModifier || "Search your item category here"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-2.5 py-1.5 text-xs rounded-lg font-medium text-white transition-colors whitespace-nowrap"
            style={{ backgroundColor: theme.themeColor }}
          >
            {t.addItemModifier || "Add Item Modifier"}
          </button>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t.itemName || "ITEM NAME"}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t.modifierGroup || "MODIFIER GROUP"}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t.isRequired || "IS REQUIRED"}
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t.allowMultipleSelection || "ALLOW MULTIPLE SELECTION"}
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {t.actions || "ACTIONS"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredModifiers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                      {t.noModifiersFound || "No modifiers found"}
                    </td>
                  </tr>
                ) : (
                  filteredModifiers.map((modifier) => (
                    <tr
                      key={modifier.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                        {modifier.itemName}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-900 dark:text-white">
                        {modifier.modifierGroup}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                            modifier.isRequired
                              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {modifier.isRequired
                            ? t.required || "Required"
                            : t.optional || "Optional"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {modifier.allowMultipleSelection
                            ? t.yes || "Yes"
                            : t.no || "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(modifier)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                            {t.update || "Update"}
                          </button>
                          <button
                            onClick={() => handleDeleteClick(modifier)}
                            className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title={t.delete || "Delete"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {editingModifier
                  ? t.editItemModifier || "Edit Item Modifier"
                  : t.addItemModifier || "Add Item Modifier"}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.itemName || "Item Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  placeholder={t.enterItemName || "Enter item name"}
                />
              </div>

              {/* Modifier Group */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t.modifierGroup || "Modifier Group"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={modifierGroup}
                  onChange={(e) => setModifierGroup(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                  placeholder={t.enterModifierGroup || "Enter modifier group"}
                />
              </div>

              {/* Is Required Checkbox */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequired(!isRequired)}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                    isRequired
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {isRequired && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <label
                  className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                  onClick={() => setIsRequired(!isRequired)}
                >
                  {t.isRequired || "Is Required"}
                </label>
              </div>

              {/* Allow Multiple Selection Checkbox */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAllowMultipleSelection(!allowMultipleSelection)}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${
                    allowMultipleSelection
                      ? "bg-gradient-to-br from-red-500 to-red-600 shadow-sm"
                      : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {allowMultipleSelection && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <label
                  className="text-xs text-gray-700 dark:text-gray-300 cursor-pointer"
                  onClick={() => setAllowMultipleSelection(!allowMultipleSelection)}
                >
                  {t.allowMultipleSelection || "Allow Multiple Selection"}
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={handleCloseModal}
                className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                onClick={handleSave}
                disabled={!itemName.trim() || !modifierGroup.trim()}
                className="px-2.5 py-1.5 text-xs text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: theme.themeColor }}
              >
                {editingModifier ? t.update || "Update" : t.save || "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && modifierToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.deleteModifier || "Delete Modifier"}
              </h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {t.deleteModifierConfirm ||
                  "Are you sure you want to delete this modifier? This action cannot be undone."}
              </p>
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-gray-900 dark:text-white">
                  <span className="font-medium">{t.itemName || "Item"}:</span>{" "}
                  {modifierToDelete.itemName}
                </p>
                <p className="text-xs text-gray-900 dark:text-white mt-1">
                  <span className="font-medium">{t.modifierGroup || "Group"}:</span>{" "}
                  {modifierToDelete.modifierGroup}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-2.5 py-1.5 text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                {t.cancel || "Cancel"}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                {t.delete || "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});