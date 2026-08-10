import { useState } from "react";
import { ArrowLeft, GripVertical, Search } from "lucide-react";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useLanguage } from "../i18n/LanguageContext";
import { useNavigate } from "react-router";
import { useMenu } from "../contexts/MenuContext";

const ItemTypes = {
  MENU: "menu",
  CATEGORY: "category",
  ITEM: "item",
};

interface DraggableMenuProps {
  menu: any;
  index: number;
  moveMenu: (dragIndex: number, hoverIndex: number) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function DraggableMenu({ menu, index, moveMenu, isSelected, onSelect }: DraggableMenuProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.MENU,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.MENU,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveMenu(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      onClick={onSelect}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all cursor-move ${
        isSelected
          ? "bg-[#0026f6] text-white shadow-md"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <GripVertical className="w-4 h-4 opacity-50" />
      <span className="flex-1 text-left font-medium">{menu.name}</span>
      <span className={`text-[10px] ${isSelected ? "opacity-80" : "opacity-60"}`}>
        Drag to reorder
      </span>
    </div>
  );
}

interface DraggableCategoryProps {
  category: any;
  index: number;
  count: number;
  moveCategory: (dragIndex: number, hoverIndex: number) => void;
  isSelected: boolean;
  onSelect: () => void;
}

function DraggableCategory({
  category,
  index,
  count,
  moveCategory,
  isSelected,
  onSelect,
}: DraggableCategoryProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CATEGORY,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.CATEGORY,
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveCategory(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      onClick={onSelect}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all cursor-move ${
        isSelected
          ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-[#0026f6]"
          : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
      }`}
    >
      <GripVertical className="w-4 h-4 opacity-50" />
      <span className="flex-1 text-left font-medium">{category.name}</span>
      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-[#0026f6] dark:text-blue-400 rounded-full text-[10px] font-semibold">
        {count}
      </span>
    </div>
  );
}

interface DraggableItemProps {
  item: any;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  category: any;
  menu: any;
}

function DraggableItem({ item, index, moveItem, category, menu }: DraggableItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.ITEM,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemTypes.ITEM,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all cursor-move bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
    >
      <GripVertical className="w-4 h-4 opacity-50 flex-shrink-0" />
      <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden flex-shrink-0">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">{item.isVeg ? "🥬" : "🍖"}</span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-xs text-gray-900 dark:text-white truncate">
          {item.name}
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          {category && (
            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-[10px]">
              {category.name}
            </span>
          )}
          {menu && (
            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded text-[10px]">
              {menu.name}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MenuOrganizerContent() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { menus, categories, menuItems, getCategoryById } = useMenu();

  const [localMenus, setLocalMenus] = useState(menus);
  const [localCategories, setLocalCategories] = useState(categories);
  const [localItems, setLocalItems] = useState(menuItems);
  const [selectedMenu, setSelectedMenu] = useState<string | null>(
    menus.length > 0 ? menus[0].id : null
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const moveMenu = (dragIndex: number, hoverIndex: number) => {
    const updatedMenus = [...localMenus];
    const [draggedMenu] = updatedMenus.splice(dragIndex, 1);
    updatedMenus.splice(hoverIndex, 0, draggedMenu);
    setLocalMenus(updatedMenus);
  };

  const moveCategory = (dragIndex: number, hoverIndex: number) => {
    const updatedCategories = [...localCategories];
    const [draggedCategory] = updatedCategories.splice(dragIndex, 1);
    updatedCategories.splice(hoverIndex, 0, draggedCategory);
    setLocalCategories(updatedCategories);
  };

  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const filteredItems = getFilteredItems();
    const updatedItems = [...localItems];
    
    // Find the actual indices in the full items array
    const dragItem = filteredItems[dragIndex];
    const hoverItem = filteredItems[hoverIndex];
    const dragActualIndex = updatedItems.findIndex((item) => item.id === dragItem.id);
    const hoverActualIndex = updatedItems.findIndex((item) => item.id === hoverItem.id);

    const [draggedItem] = updatedItems.splice(dragActualIndex, 1);
    updatedItems.splice(hoverActualIndex, 0, draggedItem);
    setLocalItems(updatedItems);
  };

  const getItemsForMenu = (menuId: string) => {
    return localItems;
  };

  const getCategoryCount = (categoryId: string) => {
    if (!selectedMenu) return 0;
    const items = getItemsForMenu(selectedMenu);
    return items.filter((item) => item.categoryId === categoryId).length;
  };

  const getFilteredItems = () => {
    if (!selectedMenu) return [];
    let items = getItemsForMenu(selectedMenu);

    if (selectedCategory) {
      items = items.filter((item) => item.categoryId === selectedCategory);
    }

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  };

  const handleSave = () => {
    // Here you would update the context with new orders
    alert("Order saved successfully!");
    navigate("/menus");
  };

  return (
    <div className="p-4 sm:p-4 xl:p-6 2xl:px-8 py-4 min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/menus")}
          className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Menus
        </button>
        <h1 className="text-lg sm:text-lg xl:text-xl 2xl:text-2xl font-semibold text-gray-900 dark:text-white">
          Menu Organizer
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Drag and drop to organize menus, items and categories. Click a menu or category to filter and focus your item list.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column - Menus */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="font-semibold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                Menus
              </h2>
              <button
                onClick={() => {
                  setSelectedMenu(null);
                  setSelectedCategory(null);
                }}
                className="text-xs text-[#0026f6] hover:text-[#004bb5] font-medium transition-colors"
              >
                Reset Filter
              </button>
            </div>
            <div className="p-2 space-y-2">
              {localMenus.map((menu, index) => (
                <DraggableMenu
                  key={menu.id}
                  menu={menu}
                  index={index}
                  moveMenu={moveMenu}
                  isSelected={selectedMenu === menu.id}
                  onSelect={() => setSelectedMenu(menu.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Middle Column - Categories */}
        <div className="lg:col-span-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <h2 className="font-semibold text-xs text-gray-900 dark:text-white uppercase tracking-wide">
                Item Category
              </h2>
            </div>
            <div className="p-2 space-y-2">
              {localCategories.map((category, index) => {
                const count = getCategoryCount(category.id);
                return (
                  <DraggableCategory
                    key={category.id}
                    category={category}
                    index={index}
                    count={count}
                    moveCategory={moveCategory}
                    isSelected={selectedCategory === category.id}
                    onSelect={() => setSelectedCategory(category.id)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Items */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="p-3 border-b border-gray-200 dark:border-gray-800">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu or category here"
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0026f6] focus:border-transparent"
                />
              </div>
            </div>

            {/* Items List */}
            <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
              {selectedMenu ? (
                getFilteredItems().length > 0 ? (
                  getFilteredItems().map((item, index) => {
                    const category = getCategoryById(item.categoryId);
                    const menu = localMenus.find((m) => m.id === selectedMenu);

                    return (
                      <DraggableItem
                        key={item.id}
                        item={item}
                        index={index}
                        moveItem={moveItem}
                        category={category}
                        menu={menu}
                      />
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-xs text-gray-500 dark:text-gray-400">
                    No items found
                  </div>
                )
              ) : (
                <div className="text-center py-12 text-xs text-gray-500 dark:text-gray-400">
                  Select a menu to view items
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MenuOrganizer() {
  return (
    <DndProvider backend={HTML5Backend}>
      <MenuOrganizerContent />
    </DndProvider>
  );
}