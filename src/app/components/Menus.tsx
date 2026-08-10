import { useState } from "react";
import { Plus, Search, Edit2, Trash2, SlidersHorizontal, Upload, ChevronDown, Check, X } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { useMenu } from "../contexts/MenuContext";
import { useNavigate } from "react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { AssignMenuToTableModal } from "./AssignMenuToTableModal";

export function Menus() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    menus,
    addMenu,
    updateMenu,
    deleteMenu,
    getMenuItemsForMenu,
    getCategoryById,
    menuItems,
    updateMenuItem,
  } = useMenu();

  const [selectedMenu, setSelectedMenu] = useState<string | null>(
    menus.length > 0 ? menus[0].id : null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isAddMenuModalOpen, setIsAddMenuModalOpen] = useState(false);
  const [isUpdateMenuModalOpen, setIsUpdateMenuModalOpen] = useState(false);
  const [isAssignMenuToTableModalOpen, setIsAssignMenuToTableModalOpen] = useState(false);
  const [isDeleteMenuDialogOpen, setIsDeleteMenuDialogOpen] = useState(false);
  const [isDeleteMenuItemDialogOpen, setIsDeleteMenuItemDialogOpen] = useState(false);
  const [menuItemToDelete, setMenuItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
  });

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedAvailability, setSelectedAvailability] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("name-asc");
  const [perPage, setPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Get items for selected menu
  const selectedMenuItems = selectedMenu ? getMenuItemsForMenu(selectedMenu) : [];

  // Get all unique categories
  const { categories } = useMenu();

  // Apply all filters
  let filteredItems = selectedMenuItems.filter((item) => {
    // Search filter
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    
    // Type filter (Veg/Non-Veg)
    const matchesType = selectedType === "all" || 
      (selectedType === "veg" && item.isVeg) || 
      (selectedType === "non-veg" && !item.isVeg);
    
    // Availability filter
    const matchesAvailability = selectedAvailability === "all" ||
      (selectedAvailability === "available" && item.isAvailable) ||
      (selectedAvailability === "unavailable" && !item.isAvailable);
    
    return matchesSearch && matchesCategory && matchesType && matchesAvailability;
  });

  // Apply sorting
  filteredItems = [...filteredItems].sort((a, b) => {
    switch (sortOrder) {
      case "name-asc":
        return a.name.localeCompare(b.name);
      case "name-desc":
        return b.name.localeCompare(a.name);
      case "price-asc":
        return a.price - b.price;
      case "price-desc":
        return b.price - a.price;
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      default:
        return 0;
    }
  });

  // Apply pagination
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / perPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Reset to first page when filters change
  const handleFilterChange = (filterSetter: (value: any) => void, value: any) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const handleAddMenu = () => {
    if (formData.name.trim()) {
      const newMenu = addMenu({
        name: formData.name.trim(),
        description: "",
        isActive: true,
        menuItemIds: [],
        sortOrder: menus.length + 1,
      });
      setFormData({ name: "" });
      setIsAddMenuModalOpen(false);
      if (newMenu && !selectedMenu) {
        setSelectedMenu(newMenu.id);
      }
    }
  };

  const handleUpdateMenu = () => {
    if (formData.name.trim() && selectedMenu) {
      updateMenu(selectedMenu, {
        name: formData.name.trim(),
      });
      setFormData({ name: "" });
      setIsUpdateMenuModalOpen(false);
    }
  };

  const handleDeleteMenuItem = (itemId: string) => {
    setMenuItemToDelete(itemId);
    setIsDeleteMenuItemDialogOpen(true);
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          {t.menus}
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
            placeholder={t.searchMenu || "Search your menu here"}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddMenuModalOpen(true)}
            className="px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors whitespace-nowrap"
          >
            {t.addMenu || "Add Menu"}
          </button>
        </div>
      </div>

      {/* Menu Tabs */}
      {menus.length > 0 ? (
        <div className="mb-4 overflow-x-auto">
          <div className="flex gap-2">
            {menus.map((menu) => {
              const itemCount = getMenuItemsForMenu(menu.id).length;
              return (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id)}
                  className={`min-w-[240px] px-6 py-3.5 rounded-lg text-xs whitespace-nowrap transition-colors ${
                    selectedMenu === menu.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">🍽️</span>
                    <div className="text-left">
                      <div className="font-semibold">{menu.name}</div>
                      <div className="text-[10px] opacity-80">{itemCount} {t.items}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-4 text-center py-8 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t.noMenusCreated}</p>
          <button
            onClick={() => setIsAddMenuModalOpen(true)}
            className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            {t.createYourFirstMenu}
          </button>
        </div>
      )}

      {/* Menu Items Section */}
      {selectedMenu && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          {/* All Actions in One Row */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Left: Menu Name and Actions */}
              <div className="flex items-center gap-3">
                <h2 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {menus.find((m) => m.id === selectedMenu)?.name}
                </h2>
                <button 
                  onClick={() => {
                    const currentMenu = menus.find((m) => m.id === selectedMenu);
                    if (currentMenu) {
                      setFormData({ name: currentMenu.name });
                      setIsUpdateMenuModalOpen(true);
                    }
                  }}
                  className="text-xs text-[#0026f6] hover:text-[#004bb5] flex items-center gap-1 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  {t.update}
                </button>
                <button
                  onClick={() => setIsDeleteMenuDialogOpen(true)}
                  className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  {t.delete}
                </button>
              </div>

              {/* Right: All Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate("/menus/items/add")}
                  className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.addMenuItem}
                </button>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchMenuItem}
                    className="pl-7 pr-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-[180px]"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  {showFilters ? t.hideFilters : t.showFilters}
                </button>
                <button
                  onClick={() => navigate("/menu-organizer")}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  {t.organizeMenuItems}
                </button>
                <button className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1 whitespace-nowrap">
                  <Upload className="w-3.5 h-3.5" />
                  {t.bulk}
                </button>
                <button
                  onClick={() => setIsAssignMenuToTableModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
                >
                  {t.assignMenu}
                </button>
              </div>
            </div>
          </div>

          {/* Menu Items Header - Removed duplicate search and buttons */}
          <div className="p-4">{/* Filters Row */}
            {showFilters && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-800">
                {/* Filter by Category */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "category" ? null : "category")}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Filter by Category
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === "category" && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedCategory, "all");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>All Categories</span>
                        {selectedCategory === "all" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            handleFilterChange(setSelectedCategory, category.id);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                        >
                          <span>{category.name}</span>
                          {selectedCategory === category.id && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filter by Type */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "type" ? null : "type")}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Filter by Type
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === "type" && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedType, "all");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>All Types</span>
                        {selectedType === "all" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedType, "veg");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-green-600">●</span> Vegetarian
                        </span>
                        {selectedType === "veg" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedType, "non-veg");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-red-600">●</span> Non-Vegetarian
                        </span>
                        {selectedType === "non-veg" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Filter by Availability */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "availability" ? null : "availability")}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Filter by Availability
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === "availability" && (
                    <div className="absolute top-full left-0 mt-1 w-40 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedAvailability, "all");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>All</span>
                        {selectedAvailability === "all" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedAvailability, "available");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Available</span>
                        {selectedAvailability === "available" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          handleFilterChange(setSelectedAvailability, "unavailable");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Unavailable</span>
                        {selectedAvailability === "unavailable" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Sort Order */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Sort Order
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === "sort" && (
                    <div className="absolute top-full left-0 mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                      <button
                        onClick={() => {
                          setSortOrder("name-asc");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Name (A-Z)</span>
                        {sortOrder === "name-asc" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("name-desc");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Name (Z-A)</span>
                        {sortOrder === "name-desc" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("price-asc");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Price (Low to High)</span>
                        {sortOrder === "price-asc" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("price-desc");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-1.5 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Price (High to Low)</span>
                        {sortOrder === "price-desc" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("newest");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Newest First</span>
                        {sortOrder === "newest" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                      <button
                        onClick={() => {
                          setSortOrder("oldest");
                          setOpenDropdown(null);
                        }}
                        className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                      >
                        <span>Oldest First</span>
                        {sortOrder === "oldest" && <Check className="w-3.5 h-3.5 text-blue-600" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Per Page */}
                <div className="relative">
                  <button
                    onClick={() => setOpenDropdown(openDropdown === "perPage" ? null : "perPage")}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                  >
                    Per Page
                    <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-600 text-white rounded">{perPage}</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  {openDropdown === "perPage" && (
                    <div className="absolute top-full left-0 mt-1 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg z-50">
                      {[10, 25, 50, 100].map((value) => (
                        <button
                          key={value}
                          onClick={() => {
                            handleFilterChange(setPerPage, value);
                            setOpenDropdown(null);
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                        >
                          <span>{value} items</span>
                          {perPage === value && <Check className="w-3.5 h-3.5 text-blue-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowFilters(false)}
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Hide Filters
                </button>
              </div>
            )}

            {/* Table */}
            {paginatedItems.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {searchQuery
                    ? t.noMenuItemsFound
                    : t.noMenuItemsInMenu}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate("/menus/items/add")}
                    className="mt-3 px-2.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {t.addYourFirstMenuItem}
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.itemName}
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.price}
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.itemCategory}
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.menuName}
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.isAvailable}
                      </th>
                      <th className="text-left py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.showOnCustomerSite}
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        {t.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedItems.map((item) => {
                      const category = getCategoryById(item.categoryId);
                      const menu = menus.find((m) => m.id === selectedMenu);

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
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
                                <div className="font-medium text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                  {/* Availability indicator */}
                                  {item.isAvailable ? (
                                    <span className="text-green-600">●</span>
                                  ) : (
                                    <span className="text-red-600">●</span>
                                  )}
                                  {item.name}
                                </div>
                                {item.description && (
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-900 dark:text-white">
                            {item.price.toFixed(2)} ₼
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-900 dark:text-white">
                            {category?.name || "-"}
                          </td>
                          <td className="py-3 px-3 text-xs text-gray-900 dark:text-white">
                            {menu?.name || "-"}
                          </td>
                          <td className="py-3 px-3">
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
                          <td className="py-3 px-3">
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
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => navigate(`/menus/items/edit/${item.id}`)}
                                className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1"
                              >
                                <Edit2 className="w-3 h-3" />
                                {t.update}
                              </button>
                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="px-2.5 py-1.5 text-xs border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {paginatedItems.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Showing {(currentPage - 1) * perPage + 1} to {Math.min(currentPage * perPage, totalItems)} of {totalItems} items
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Menu Modal */}
      {isAddMenuModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddMenuModalOpen(false);
              setFormData({ name: "" });
            }
          }}
        >
          <div
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                {t.addMenuTitle || "ADD MENU"}
              </h2>
              <button
                onClick={() => {
                  setIsAddMenuModalOpen(false);
                  setFormData({ name: "" });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.addMenuDescription || "Enter the menu name below to create a new menu."}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.menuNameEnglish || "Menu Name (English)"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Breakfast"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.name.trim()) {
                      handleAddMenu();
                    }
                  }}
                  className="w-full px-4 py-3 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]/30 focus:border-[#0026f6] transition-all duration-200"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={handleAddMenu}
                disabled={!formData.name.trim()}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-[#0026f6] to-[#004bb5] hover:from-[#004bb5] hover:to-[#003d8f] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#0026f6]/20 hover:shadow-xl hover:shadow-[#0026f6]/30"
              >
                {t.save || "Save"}
              </button>
              <button
                onClick={() => {
                  setIsAddMenuModalOpen(false);
                  setFormData({ name: "" });
                }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Menu Modal */}
      {isUpdateMenuModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsUpdateMenuModalOpen(false);
              setFormData({ name: "" });
            }
          }}
        >
          <div
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50 dark:border-gray-700/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                {t.update} {t.menu}
              </h2>
              <button
                onClick={() => {
                  setIsUpdateMenuModalOpen(false);
                  setFormData({ name: "" });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.addMenuDescription || "Update the menu name below."}
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.menuNameEnglish || "Menu Name (English)"}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Breakfast"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formData.name.trim()) {
                      handleUpdateMenu();
                    }
                  }}
                  className="w-full px-4 py-3 text-sm bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6]/30 focus:border-[#0026f6] transition-all duration-200"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-start gap-3 px-6 py-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <button
                onClick={handleUpdateMenu}
                disabled={!formData.name.trim()}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-r from-[#0026f6] to-[#004bb5] hover:from-[#004bb5] hover:to-[#003d8f] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[#0026f6]/20 hover:shadow-xl hover:shadow-[#0026f6]/30"
              >
                {t.save || "Save"}
              </button>
              <button
                onClick={() => {
                  setIsUpdateMenuModalOpen(false);
                  setFormData({ name: "" });
                }}
                className="px-5 py-2.5 text-sm font-medium border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-all duration-200 backdrop-blur-sm"
              >
                {t.cancel || "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Menu to Table Modal */}
      <AssignMenuToTableModal
        isOpen={isAssignMenuToTableModalOpen}
        onClose={() => setIsAssignMenuToTableModalOpen(false)}
        onSave={(data) => {
          // TODO: Implement table-menu assignment logic
          setIsAssignMenuToTableModalOpen(false);
        }}
        menus={menus.map((menu, index) => {
          // Parse the ID, and if it's NaN or invalid, use the index as fallback
          const parsedId = typeof menu.id === 'string' ? parseInt(menu.id, 10) : menu.id;
          const validId = !isNaN(parsedId) && parsedId !== null && parsedId !== undefined ? parsedId : index + 1000;
          return {
            id: validId,
            name: menu.name
          };
        })}
      />

      {/* Delete Menu Confirmation Dialog */}
      <Dialog open={isDeleteMenuDialogOpen} onOpenChange={setIsDeleteMenuDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold text-gray-900 dark:text-white uppercase">
              {t.deleteMenu}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t.deleteMenuConfirm}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-start gap-2 pt-3">
            <button
              onClick={() => {
                if (selectedMenu) {
                  deleteMenu(selectedMenu);
                  // Select the first remaining menu or null if none
                  const remainingMenus = menus.filter(m => m.id !== selectedMenu);
                  setSelectedMenu(remainingMenus.length > 0 ? remainingMenus[0].id : null);
                }
                setIsDeleteMenuDialogOpen(false);
              }}
              className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              {t.yesDelete}
            </button>
            <button
              onClick={() => setIsDeleteMenuDialogOpen(false)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t.cancel}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Menu Item Confirmation Dialog */}
      <Dialog open={isDeleteMenuItemDialogOpen} onOpenChange={setIsDeleteMenuItemDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xs font-semibold text-gray-900 dark:text-white uppercase">
              {t.deleteMenuItem}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t.deleteMenuItemConfirm}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-start gap-2 pt-3">
            <button
              onClick={() => {
                if (menuItemToDelete) {
                  // TODO: Implement deleteMenuItem in MenuContext
                  setMenuItemToDelete(null);
                }
                setIsDeleteMenuItemDialogOpen(false);
              }}
              className="px-2.5 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              {t.yesDelete}
            </button>
            <button
              onClick={() => setIsDeleteMenuItemDialogOpen(false)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t.cancel}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}