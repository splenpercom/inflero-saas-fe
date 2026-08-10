import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Tag } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useConfirm } from "../context/ConfirmContext";

interface ExpenseCategory {
  id: string;
  name: string;
  description: string;
}

export function ExpenseCategories() {
  const { t } = useLanguage();
  const askConfirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  const [categories, setCategories] = useState<ExpenseCategory[]>([
    {
      id: "1",
      name: t.expenseCategoriesPage.rent,
      description: "Monthly rent for restaurant space",
    },
    {
      id: "2",
      name: t.expenseCategoriesPage.utilities,
      description: "Electricity, water, gas, and other utilities",
    },
    {
      id: "3",
      name: t.expenseCategoriesPage.salaries,
      description: "Employee salaries and wages",
    },
    {
      id: "4",
      name: t.expenseCategoriesPage.ingredients,
      description: "Food ingredients and raw materials",
    },
    {
      id: "5",
      name: t.expenseCategoriesPage.equipment,
      description: "Kitchen equipment and appliances",
    },
    {
      id: "6",
      name: t.expenseCategoriesPage.marketing,
      description: "Advertising and promotional expenses",
    },
    {
      id: "7",
      name: t.expenseCategoriesPage.insurance,
      description: "Business insurance and liability coverage",
    },
    {
      id: "8",
      name: t.expenseCategoriesPage.maintenance,
      description: "Repairs and maintenance costs",
    },
  ]);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
  });

  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    if (newCategory.name && newCategory.description) {
      const category: ExpenseCategory = {
        id: Date.now().toString(),
        name: newCategory.name,
        description: newCategory.description,
      };
      setCategories([...categories, category]);
      setNewCategory({ name: "", description: "" });
      setIsAddCategoryModalOpen(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (await askConfirm({
      title: "Confirm deletion",
      message: t.expenseCategoriesPage.confirmDelete,
      variant: "danger",
    })) {
      setCategories(categories.filter((category) => category.id !== id));
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white mb-3">
            {t.expenseCategoriesPage.title}
          </h1>

          {/* Search and Actions */}
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder={t.expenseCategoriesPage.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Button */}
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.expenseCategoriesPage.addCategory}</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expenseCategoriesPage.categoryName}
                  </th>
                  <th className="text-left text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expenseCategoriesPage.description}
                  </th>
                  <th className="text-right text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider px-3 py-2">
                    {t.expenseCategoriesPage.action}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredCategories.map((category) => (
                  <tr
                    key={category.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                  >
                    {/* Category Name */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {category.description}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-2 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button className="flex items-center gap-1 px-2 py-1 text-[10px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                          <Pencil className="w-3 h-3" />
                          <span>{t.expenseCategoriesPage.update}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredCategories.length === 0 && (
            <div className="text-center py-8">
              <Tag className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2 opacity-50" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t.expenseCategoriesPage.noCategoriesFound}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg w-full max-w-md shadow-xl">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t.expenseCategoriesPage.addNewCategory}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-4 py-3 space-y-3">
              {/* Category Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expenseCategoriesPage.categoryName}
                </label>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    placeholder={t.expenseCategoriesPage.enterCategoryName}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.expenseCategoriesPage.description}
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, description: e.target.value })
                  }
                  placeholder={t.expenseCategoriesPage.enterDescription}
                  rows={3}
                  className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex gap-2 justify-end">
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t.expenseCategoriesPage.cancel}
              </button>
              <button
                onClick={handleAddCategory}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {t.expenseCategoriesPage.addCategory}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}