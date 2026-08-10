import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getStorageItem } from "../lib/storageMigration";
import { STORAGE_KEYS } from "../lib/storageKeys";

// ============= TYPES =============

export interface ItemCategory {
  id: string;
  name: string;
  description?: string;
  image?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ItemModifier {
  id: string;
  modifierGroupId: string;
  name: string;
  price: number;
  isDefault: boolean;
  sortOrder: number;
  createdAt: Date;
}

export interface ModifierGroup {
  id: string;
  name: string;
  selectionType: "single" | "multiple";
  isRequired: boolean;
  minSelection?: number;
  maxSelection?: number;
  sortOrder: number;
  createdAt: Date;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  image?: string;
  isAvailable: boolean;
  isVeg: boolean;
  modifierGroupIds: string[];
  preparationTime?: number; // in minutes
  calories?: number;
  allergens?: string[];
  tags?: string[];
  sortOrder: number;
  createdAt: Date;
  showOnCustomerSite?: boolean; // Show/hide item on customer-facing site
}

export interface Menu {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  menuItemIds: string[];
  startTime?: string; // e.g., "09:00"
  endTime?: string; // e.g., "17:00"
  availableDays?: number[]; // 0-6 (Sunday-Saturday)
  sortOrder: number;
  createdAt: Date;
}

// ============= CONTEXT TYPE =============

interface MenuContextType {
  // Item Categories
  categories: ItemCategory[];
  addCategory: (category: Omit<ItemCategory, "id" | "createdAt">) => ItemCategory;
  updateCategory: (id: string, updates: Partial<ItemCategory>) => void;
  deleteCategory: (id: string) => void;
  getCategoryById: (id: string) => ItemCategory | undefined;

  // Modifier Groups
  modifierGroups: ModifierGroup[];
  addModifierGroup: (group: Omit<ModifierGroup, "id" | "createdAt">) => ModifierGroup;
  updateModifierGroup: (id: string, updates: Partial<ModifierGroup>) => void;
  deleteModifierGroup: (id: string) => void;
  getModifierGroupById: (id: string) => ModifierGroup | undefined;

  // Item Modifiers
  modifiers: ItemModifier[];
  addModifier: (modifier: Omit<ItemModifier, "id" | "createdAt">) => ItemModifier;
  updateModifier: (id: string, updates: Partial<ItemModifier>) => void;
  deleteModifier: (id: string) => void;
  getModifierById: (id: string) => ItemModifier | undefined;
  getModifiersByGroupId: (groupId: string) => ItemModifier[];

  // Menu Items
  menuItems: MenuItem[];
  addMenuItem: (item: Omit<MenuItem, "id" | "createdAt">) => MenuItem;
  updateMenuItem: (id: string, updates: Partial<MenuItem>) => void;
  deleteMenuItem: (id: string) => void;
  getMenuItemById: (id: string) => MenuItem | undefined;
  getMenuItemsByCategory: (categoryId: string) => MenuItem[];

  // Menus
  menus: Menu[];
  addMenu: (menu: Omit<Menu, "id" | "createdAt">) => Menu;
  updateMenu: (id: string, updates: Partial<Menu>) => void;
  deleteMenu: (id: string) => void;
  getMenuById: (id: string) => Menu | undefined;
  getMenuItemsForMenu: (menuId: string) => MenuItem[];
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

// ============= PROVIDER =============

export function MenuProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [modifiers, setModifiers] = useState<ItemModifier[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);

  // ============= LOAD FROM LOCALSTORAGE =============

  useEffect(() => {
    // Load Categories
    const storedCategories = getStorageItem(
      localStorage, STORAGE_KEYS.categories);
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        const withDates = parsed.map((cat: any) => ({
          ...cat,
          createdAt: new Date(cat.createdAt),
        }));
        setCategories(withDates);
      } catch (error) {
        console.error("Failed to parse categories:", error);
      }
    } else {
      // Initialize with sample categories
      const sampleCategories: ItemCategory[] = [
        {
          id: "cat-1",
          name: "Appetizers",
          description: "Start your meal right",
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "cat-2",
          name: "Main Course",
          description: "Hearty and delicious main dishes",
          sortOrder: 2,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "cat-3",
          name: "Soups",
          description: "Warm and comforting soups",
          sortOrder: 3,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "cat-4",
          name: "Beverages",
          description: "Refreshing drinks",
          sortOrder: 4,
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: "cat-5",
          name: "Desserts",
          description: "Sweet endings",
          sortOrder: 5,
          isActive: true,
          createdAt: new Date(),
        },
      ];
      setCategories(sampleCategories);
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(sampleCategories));
    }

    // Load Modifier Groups
    const storedModifierGroups = getStorageItem(
      localStorage, STORAGE_KEYS.modifierGroups);
    if (storedModifierGroups) {
      try {
        const parsed = JSON.parse(storedModifierGroups);
        const withDates = parsed.map((group: any) => ({
          ...group,
          createdAt: new Date(group.createdAt),
        }));
        setModifierGroups(withDates);
      } catch (error) {
        console.error("Failed to parse modifier groups:", error);
      }
    } else {
      // Initialize with sample modifier groups
      const sampleModifierGroups: ModifierGroup[] = [
        {
          id: "mg-1",
          name: "Spice Level",
          selectionType: "single",
          isRequired: true,
          minSelection: 1,
          maxSelection: 1,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "mg-2",
          name: "Size",
          selectionType: "single",
          isRequired: true,
          minSelection: 1,
          maxSelection: 1,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "mg-3",
          name: "Extra Toppings",
          selectionType: "multiple",
          isRequired: false,
          maxSelection: 5,
          sortOrder: 3,
          createdAt: new Date(),
        },
      ];
      setModifierGroups(sampleModifierGroups);
      localStorage.setItem(STORAGE_KEYS.modifierGroups, JSON.stringify(sampleModifierGroups));
    }

    // Load Modifiers
    const storedModifiers = getStorageItem(
      localStorage, STORAGE_KEYS.modifiers);
    if (storedModifiers) {
      try {
        const parsed = JSON.parse(storedModifiers);
        const withDates = parsed.map((mod: any) => ({
          ...mod,
          createdAt: new Date(mod.createdAt),
        }));
        setModifiers(withDates);
      } catch (error) {
        console.error("Failed to parse modifiers:", error);
      }
    } else {
      // Initialize with sample modifiers
      const sampleModifiers: ItemModifier[] = [
        // Spice Level modifiers
        { id: "mod-1", modifierGroupId: "mg-1", name: "Mild", price: 0, isDefault: true, sortOrder: 1, createdAt: new Date() },
        { id: "mod-2", modifierGroupId: "mg-1", name: "Medium", price: 0, isDefault: false, sortOrder: 2, createdAt: new Date() },
        { id: "mod-3", modifierGroupId: "mg-1", name: "Hot", price: 0, isDefault: false, sortOrder: 3, createdAt: new Date() },
        { id: "mod-4", modifierGroupId: "mg-1", name: "Extra Hot", price: 0, isDefault: false, sortOrder: 4, createdAt: new Date() },
        // Size modifiers
        { id: "mod-5", modifierGroupId: "mg-2", name: "Small", price: 0, isDefault: false, sortOrder: 1, createdAt: new Date() },
        { id: "mod-6", modifierGroupId: "mg-2", name: "Regular", price: 0, isDefault: true, sortOrder: 2, createdAt: new Date() },
        { id: "mod-7", modifierGroupId: "mg-2", name: "Large", price: 50, isDefault: false, sortOrder: 3, createdAt: new Date() },
        // Extra Toppings modifiers
        { id: "mod-8", modifierGroupId: "mg-3", name: "Extra Cheese", price: 30, isDefault: false, sortOrder: 1, createdAt: new Date() },
        { id: "mod-9", modifierGroupId: "mg-3", name: "Extra Paneer", price: 40, isDefault: false, sortOrder: 2, createdAt: new Date() },
        { id: "mod-10", modifierGroupId: "mg-3", name: "Extra Vegetables", price: 25, isDefault: false, sortOrder: 3, createdAt: new Date() },
      ];
      setModifiers(sampleModifiers);
      localStorage.setItem(STORAGE_KEYS.modifiers, JSON.stringify(sampleModifiers));
    }

    // Load Menu Items
    const storedMenuItems = getStorageItem(
      localStorage, STORAGE_KEYS.menuItems);
    if (storedMenuItems) {
      try {
        const parsed = JSON.parse(storedMenuItems);
        const withDates = parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        }));
        setMenuItems(withDates);
      } catch (error) {
        console.error("Failed to parse menu items:", error);
      }
    } else {
      // Initialize with sample menu items
      const sampleMenuItems: MenuItem[] = [
        {
          id: "item-1",
          name: "Paneer Tikka",
          description: "Grilled cottage cheese marinated in spices",
          categoryId: "cat-1",
          price: 250,
          image: "https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=400&h=400&fit=crop",
          isAvailable: true,
          isVeg: true,
          modifierGroupIds: ["mg-1", "mg-3"],
          preparationTime: 20,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "item-2",
          name: "Spring Rolls",
          description: "Crispy vegetable spring rolls",
          categoryId: "cat-1",
          price: 150,
          image: "https://images.unsplash.com/photo-1619895092538-128341789043?w=400&h=400&fit=crop",
          isAvailable: true,
          isVeg: true,
          modifierGroupIds: [],
          preparationTime: 15,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "item-3",
          name: "Butter Chicken",
          description: "Tender chicken in rich creamy tomato gravy",
          categoryId: "cat-2",
          price: 320,
          image: "https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=400&fit=crop",
          isAvailable: true,
          isVeg: false,
          modifierGroupIds: ["mg-1"],
          preparationTime: 30,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "item-4",
          name: "Vegetable Hakka Noodles",
          description: "Stir-fried noodles with vegetables",
          categoryId: "cat-2",
          price: 180,
          image: "https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=400&fit=crop",
          isAvailable: true,
          isVeg: true,
          modifierGroupIds: ["mg-1"],
          preparationTime: 20,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "item-5",
          name: "Veg Manchow Soup",
          description: "Spicy and tangy vegetable soup",
          categoryId: "cat-3",
          price: 120,
          image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop",
          isAvailable: true,
          isVeg: true,
          modifierGroupIds: ["mg-2"],
          preparationTime: 15,
          sortOrder: 1,
          createdAt: new Date(),
        },
      ];
      setMenuItems(sampleMenuItems);
      localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify(sampleMenuItems));
    }

    // Load Menus
    const storedMenus = getStorageItem(
      localStorage, STORAGE_KEYS.menus);
    if (storedMenus) {
      try {
        const parsed = JSON.parse(storedMenus);
        const withDates = parsed.map((menu: any) => ({
          ...menu,
          createdAt: new Date(menu.createdAt),
        }));
        setMenus(withDates);
      } catch (error) {
        console.error("Failed to parse menus:", error);
      }
    } else {
      // Initialize with sample menus
      const sampleMenus: Menu[] = [
        {
          id: "menu-1",
          name: "All Day Menu",
          description: "Available throughout the day",
          isActive: true,
          menuItemIds: ["item-1", "item-2", "item-3", "item-4", "item-5"],
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "menu-2",
          name: "Lunch Special",
          description: "Special lunch offerings",
          isActive: true,
          menuItemIds: ["item-3", "item-4", "item-5"],
          startTime: "11:00",
          endTime: "15:00",
          availableDays: [1, 2, 3, 4, 5], // Monday to Friday
          sortOrder: 2,
          createdAt: new Date(),
        },
      ];
      setMenus(sampleMenus);
      localStorage.setItem(STORAGE_KEYS.menus, JSON.stringify(sampleMenus));
    }
  }, []);

  // ============= SAVE TO LOCALSTORAGE =============

  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
    }
  }, [categories]);

  useEffect(() => {
    if (modifierGroups.length > 0) {
      localStorage.setItem(STORAGE_KEYS.modifierGroups, JSON.stringify(modifierGroups));
    }
  }, [modifierGroups]);

  useEffect(() => {
    if (modifiers.length > 0) {
      localStorage.setItem(STORAGE_KEYS.modifiers, JSON.stringify(modifiers));
    }
  }, [modifiers]);

  useEffect(() => {
    if (menuItems.length > 0) {
      localStorage.setItem(STORAGE_KEYS.menuItems, JSON.stringify(menuItems));
    }
  }, [menuItems]);

  useEffect(() => {
    if (menus.length > 0) {
      localStorage.setItem(STORAGE_KEYS.menus, JSON.stringify(menus));
    }
  }, [menus]);

  // ============= CATEGORY METHODS =============

  const addCategory = (category: Omit<ItemCategory, "id" | "createdAt">) => {
    const newCategory: ItemCategory = {
      ...category,
      id: `cat-${Date.now()}`,
      createdAt: new Date(),
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<ItemCategory>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
    // Also remove this category from menu items
    setMenuItems((prev) =>
      prev.map((item) =>
        item.categoryId === id ? { ...item, categoryId: "" } : item
      )
    );
  };

  const getCategoryById = (id: string) => {
    return categories.find((cat) => cat.id === id);
  };

  // ============= MODIFIER GROUP METHODS =============

  const addModifierGroup = (group: Omit<ModifierGroup, "id" | "createdAt">) => {
    const newGroup: ModifierGroup = {
      ...group,
      id: `mg-${Date.now()}`,
      createdAt: new Date(),
    };
    setModifierGroups((prev) => [...prev, newGroup]);
    return newGroup;
  };

  const updateModifierGroup = (id: string, updates: Partial<ModifierGroup>) => {
    setModifierGroups((prev) =>
      prev.map((group) => (group.id === id ? { ...group, ...updates } : group))
    );
  };

  const deleteModifierGroup = (id: string) => {
    setModifierGroups((prev) => prev.filter((group) => group.id !== id));
    // Remove all modifiers in this group
    setModifiers((prev) => prev.filter((mod) => mod.modifierGroupId !== id));
    // Remove this modifier group from menu items
    setMenuItems((prev) =>
      prev.map((item) => ({
        ...item,
        modifierGroupIds: item.modifierGroupIds.filter((gId) => gId !== id),
      }))
    );
  };

  const getModifierGroupById = (id: string) => {
    return modifierGroups.find((group) => group.id === id);
  };

  // ============= MODIFIER METHODS =============

  const addModifier = (modifier: Omit<ItemModifier, "id" | "createdAt">) => {
    const newModifier: ItemModifier = {
      ...modifier,
      id: `mod-${Date.now()}`,
      createdAt: new Date(),
    };
    setModifiers((prev) => [...prev, newModifier]);
    return newModifier;
  };

  const updateModifier = (id: string, updates: Partial<ItemModifier>) => {
    setModifiers((prev) =>
      prev.map((mod) => (mod.id === id ? { ...mod, ...updates } : mod))
    );
  };

  const deleteModifier = (id: string) => {
    setModifiers((prev) => prev.filter((mod) => mod.id !== id));
  };

  const getModifierById = (id: string) => {
    return modifiers.find((mod) => mod.id === id);
  };

  const getModifiersByGroupId = (groupId: string) => {
    return modifiers
      .filter((mod) => mod.modifierGroupId === groupId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // ============= MENU ITEM METHODS =============

  const addMenuItem = (item: Omit<MenuItem, "id" | "createdAt">) => {
    const newItem: MenuItem = {
      ...item,
      id: `item-${Date.now()}`,
      createdAt: new Date(),
    };
    setMenuItems((prev) => [...prev, newItem]);
    return newItem;
  };

  const updateMenuItem = (id: string, updates: Partial<MenuItem>) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
    // Remove this item from all menus
    setMenus((prev) =>
      prev.map((menu) => ({
        ...menu,
        menuItemIds: menu.menuItemIds.filter((itemId) => itemId !== id),
      }))
    );
  };

  const getMenuItemById = (id: string) => {
    return menuItems.find((item) => item.id === id);
  };

  const getMenuItemsByCategory = (categoryId: string) => {
    return menuItems
      .filter((item) => item.categoryId === categoryId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  };

  // ============= MENU METHODS =============

  const addMenu = (menu: Omit<Menu, "id" | "createdAt">) => {
    const newMenu: Menu = {
      ...menu,
      id: `menu-${Date.now()}`,
      createdAt: new Date(),
    };
    setMenus((prev) => [...prev, newMenu]);
    return newMenu;
  };

  const updateMenu = (id: string, updates: Partial<Menu>) => {
    setMenus((prev) =>
      prev.map((menu) => (menu.id === id ? { ...menu, ...updates } : menu))
    );
  };

  const deleteMenu = (id: string) => {
    setMenus((prev) => prev.filter((menu) => menu.id !== id));
  };

  const getMenuById = (id: string) => {
    return menus.find((menu) => menu.id === id);
  };

  const getMenuItemsForMenu = (menuId: string) => {
    const menu = getMenuById(menuId);
    if (!menu) return [];
    return menuItems.filter((item) => menu.menuItemIds.includes(item.id));
  };

  const value: MenuContextType = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    modifierGroups,
    addModifierGroup,
    updateModifierGroup,
    deleteModifierGroup,
    getModifierGroupById,
    modifiers,
    addModifier,
    updateModifier,
    deleteModifier,
    getModifierById,
    getModifiersByGroupId,
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getMenuItemById,
    getMenuItemsByCategory,
    menus,
    addMenu,
    updateMenu,
    deleteMenu,
    getMenuById,
    getMenuItemsForMenu,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
}