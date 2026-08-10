import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getStorageItem } from "../lib/storageMigration";
import { STORAGE_KEYS } from "../lib/storageKeys";

// ============= TYPES =============

export interface KitchenType {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// ============= CONTEXT TYPE =============

interface RestaurantContextType {
  // Kitchen Types
  kitchenTypes: KitchenType[];
  addKitchenType: (kitchenType: Omit<KitchenType, "id" | "createdAt">) => KitchenType;
  updateKitchenType: (id: string, updates: Partial<KitchenType>) => void;
  deleteKitchenType: (id: string) => void;
  getKitchenTypeById: (id: string) => KitchenType | undefined;
}

const RestaurantContext = createContext<RestaurantContextType | undefined>(undefined);

// ============= PROVIDER =============

export function RestaurantProvider({ children }: { children: ReactNode }) {
  const [kitchenTypes, setKitchenTypes] = useState<KitchenType[]>([]);

  // ============= LOAD FROM LOCALSTORAGE =============

  useEffect(() => {
    // Load Kitchen Types
    const storedKitchenTypes = getStorageItem(
      localStorage, STORAGE_KEYS.kitchenTypes);
    if (storedKitchenTypes) {
      try {
        const parsed = JSON.parse(storedKitchenTypes);
        const withDates = parsed.map((type: any) => ({
          ...type,
          createdAt: new Date(type.createdAt),
        }));
        setKitchenTypes(withDates);
      } catch (error) {
        console.error("Failed to parse kitchen types:", error);
      }
    } else {
      // Initialize with sample kitchen types
      const sampleKitchenTypes: KitchenType[] = [
        {
          id: "kt-1",
          name: "Hot Kitchen",
          description: "Main cooking station for hot dishes",
          isActive: true,
          sortOrder: 1,
          createdAt: new Date(),
        },
        {
          id: "kt-2",
          name: "Cold Kitchen",
          description: "Station for cold dishes and salads",
          isActive: true,
          sortOrder: 2,
          createdAt: new Date(),
        },
        {
          id: "kt-3",
          name: "Bar",
          description: "Beverage and cocktail preparation",
          isActive: true,
          sortOrder: 3,
          createdAt: new Date(),
        },
        {
          id: "kt-4",
          name: "Grill",
          description: "Grilled and barbecue items",
          isActive: true,
          sortOrder: 4,
          createdAt: new Date(),
        },
        {
          id: "kt-5",
          name: "Pastry",
          description: "Desserts and baked goods",
          isActive: true,
          sortOrder: 5,
          createdAt: new Date(),
        },
      ];
      setKitchenTypes(sampleKitchenTypes);
      localStorage.setItem(STORAGE_KEYS.kitchenTypes, JSON.stringify(sampleKitchenTypes));
    }
  }, []);

  // ============= SAVE TO LOCALSTORAGE =============

  useEffect(() => {
    if (kitchenTypes.length > 0) {
      localStorage.setItem(STORAGE_KEYS.kitchenTypes, JSON.stringify(kitchenTypes));
    }
  }, [kitchenTypes]);

  // ============= KITCHEN TYPE METHODS =============

  const addKitchenType = (kitchenType: Omit<KitchenType, "id" | "createdAt">) => {
    const newKitchenType: KitchenType = {
      ...kitchenType,
      id: `kt-${Date.now()}`,
      createdAt: new Date(),
    };
    setKitchenTypes((prev) => [...prev, newKitchenType]);
    return newKitchenType;
  };

  const updateKitchenType = (id: string, updates: Partial<KitchenType>) => {
    setKitchenTypes((prev) =>
      prev.map((type) => (type.id === id ? { ...type, ...updates } : type))
    );
  };

  const deleteKitchenType = (id: string) => {
    setKitchenTypes((prev) => prev.filter((type) => type.id !== id));
  };

  const getKitchenTypeById = (id: string) => {
    return kitchenTypes.find((type) => type.id === id);
  };

  const value: RestaurantContextType = {
    kitchenTypes,
    addKitchenType,
    updateKitchenType,
    deleteKitchenType,
    getKitchenTypeById,
  };

  return <RestaurantContext.Provider value={value}>{children}</RestaurantContext.Provider>;
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);
  if (context === undefined) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return context;
}
