import React from "react";
import { Search, Edit2, Trash2, SlidersHorizontal, Upload, Plus } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { useMenu } from "../contexts/MenuContext";

export function MenuItemsList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { 
    menuItems, 
    menus, 
    getCategoryById, 
    updateMenuItem 
  } = useMenu();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showFilters, setShowFilters] = React.useState(false);

  // Filter items by search query
  const filteredItems = menuItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.menuItems}
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
            placeholder={t.searchMenuItem || "Search your menu item here"}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t.showFilters}
          </button>
          <button
            onClick={() => navigate("/menu-organizer")}
            className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
          >
            {t.organizeMenuItems || "Organize Menu Items"}
          </button>
          <button className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5 whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            {t.bulkUpload || t.bulk}
          </button>
          <button
            onClick={() => navigate("/menus/items/add")}
            className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.addMenuItem}
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
                  {t.itemName}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.price}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.itemCategory}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.menuName}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.isAvailable}
                </th>
                <th className="text-left px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.showOnCustomerSite}
                </th>
                <th className="text-center px-3 py-2 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    {searchQuery ? t.noMenuItemsFound : t.noMenuItems || "No menu items found"}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const category = getCategoryById(item.categoryId);
                  // Find which menu(s) contain this item
                  const itemMenus = menus.filter(menu => menu.menuItemIds.includes(item.id));
                  const menuName = itemMenus.length > 0 ? itemMenus[0].name : "-";

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-lg">
                                {item.isVeg ? "🥬" : "🍖"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              {/* Availability indicator */}
                              {item.isAvailable ? (
                                <span className="text-green-600">●</span>
                              ) : (
                                <span className="text-red-600">●</span>
                              )}
                              <p className="text-xs font-medium text-gray-900 dark:text-white">
                                {item.name}
                              </p>
                            </div>
                            {item.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-900 dark:text-white font-medium">
                        {item.price.toFixed(2)} ₼
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                        {category?.name || "-"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                        {menuName}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMenuItem(item.id, { isAvailable: !item.isAvailable });
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${ 
                              item.isAvailable
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                          >
                            {item.isAvailable && (
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
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateMenuItem(item.id, { showOnCustomerSite: !item.showOnCustomerSite });
                            }}
                            className={`w-4 h-4 rounded flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 ${ 
                              item.showOnCustomerSite !== false
                                ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm"
                                : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                            }`}
                          >
                            {item.showOnCustomerSite !== false && (
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
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => navigate(`/menus/items/edit/${item.id}`)}
                            className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}
