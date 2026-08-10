import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getStorageItem } from "../lib/storageMigration";
import { STORAGE_KEYS } from "../lib/storageKeys";

export type OrderStatus = "paid" | "pending" | "cancelled" | "billed";
export type OrderType = "pos" | "delivery" | "dineIn";
export type PaymentMethod = "cash" | "card" | "upi" | "other";
export type CookingStatus = "confirmed" | "preparing" | "ready" | "served";
export type BillingStatus = "active" | "billed" | "paid";

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerInitials?: string;
  orderDate: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  type: OrderType;
  location: string;
  waiter: string;
  items: OrderItem[];
  subTotal: number;
  sgst?: number;
  cgst?: number;
  balanceReturned?: number;
  paymentMethod: PaymentMethod;
  tableNumber?: string;
  createdAt: Date;
  cookingStatus?: CookingStatus;
  billingStatus?: BillingStatus;
  kotCount?: number;
}

interface OrderContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  getOrderById: (id: string) => Order | undefined;
  getTodayOrders: () => Order[];
  getTodayEarnings: () => number;
  getTodayCustomers: () => number;
  getMonthlyEarnings: () => number;
  getAverageDailyEarnings: () => number;
  getPaymentMethodTotals: () => { cash: number; card: number };
  getTopSellingDishes: (limit?: number) => Array<{ name: string; quantity: number; total: number; image?: string }>;
  getTopSellingTables: (limit?: number) => Array<{ table: string; total: number }>;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load orders from localStorage on mount
  useEffect(() => {
    const storedOrders = getStorageItem(
      localStorage, STORAGE_KEYS.orders);
    if (storedOrders) {
      try {
        const parsed = JSON.parse(storedOrders);
        // Convert date strings back to Date objects
        const ordersWithDates = parsed.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          // Ensure all orders have billingStatus and kotCount fields
          billingStatus: order.billingStatus || "active",
          kotCount: order.kotCount || 0,
        }));
        setOrders(ordersWithDates);
        setIsInitialized(true);
        return; // Exit early if we loaded from localStorage
      } catch (error) {
        console.error("Failed to parse orders from localStorage:", error);
        // If parsing fails, clear localStorage and continue to sample data
        localStorage.removeItem(STORAGE_KEYS.orders);
      }
    }
    
    // Initialize with sample data if no valid orders exist in localStorage
    const sampleOrders: Order[] = [
      {
        id: "1",
        orderNumber: "Order #14",
        customerName: "John Doe",
        orderDate: "25/02/2026 03:17 AM",
        itemCount: 1,
        total: 504.0,
        status: "paid",
        type: "dineIn",
        location: "Order Served",
        waiter: "John Doe",
        items: [
          { id: "1", name: "Paneer Tikka", quantity: 5, price: 250.0, category: "Appetizers" },
          { id: "2", name: "Butter Chicken", quantity: 1, price: 320.0, category: "Main Course" },
        ],
        subTotal: 5200.0,
        sgst: 140.5,
        cgst: 140.5,
        balanceReturned: 0,
        paymentMethod: "cash",
        tableNumber: "--",
        createdAt: new Date(),
        cookingStatus: "served",
        billingStatus: "paid",
        kotCount: 0,
      },
      {
        id: "2",
        orderNumber: "Order #13",
        customerName: "Jane Smith",
        orderDate: "25/02/2026 03:16 AM",
        itemCount: 1,
        total: 84.0,
        status: "billed",
        type: "dineIn",
        location: "Order Confirmed",
        waiter: "John Doe",
        items: [
          { id: "3", name: "Butter Chicken", quantity: 2, price: 320.0, category: "Main Course" },
          { id: "4", name: "Vegetable Hakka Noodles", quantity: 1, price: 180.0, category: "Main Course" },
        ],
        subTotal: 3100.0,
        sgst: 81.905,
        cgst: 81.905,
        balanceReturned: 0,
        paymentMethod: "card",
        tableNumber: "T-8",
        createdAt: new Date(new Date().getTime() - 1 * 60000),
        cookingStatus: "confirmed",
        billingStatus: "billed",
        kotCount: 0,
      },
      {
        id: "3",
        orderNumber: "Order #12",
        customerName: "Bob Wilson",
        orderDate: "25/02/2026 03:16 AM",
        itemCount: 1,
        total: 220.5,
        status: "pending",
        type: "dineIn",
        location: "Order Served",
        waiter: "John Doe",
        items: [
          { id: "5", name: "Veg Manchow Soup", quantity: 4, price: 120.0, category: "Soups" },
        ],
        subTotal: 808.1,
        sgst: 21.2,
        cgst: 21.2,
        balanceReturned: 0,
        paymentMethod: "cash",
        tableNumber: "--",
        createdAt: new Date(new Date().getTime() - 2 * 60000),
        cookingStatus: "served",
        billingStatus: "active",
        kotCount: 1,
      },
      {
        id: "4",
        orderNumber: "Order #11",
        customerName: "Alice Brown",
        orderDate: "25/02/2026 03:09 AM",
        itemCount: 1,
        total: 84.0,
        status: "pending",
        type: "dineIn",
        location: "Order Preparing",
        waiter: "John Doe",
        items: [
          { id: "6", name: "Spring Rolls", quantity: 1, price: 150.0, category: "Appetizers" },
        ],
        subTotal: 179.25,
        sgst: 4.875,
        cgst: 4.875,
        balanceReturned: 0,
        paymentMethod: "card",
        tableNumber: "T-6",
        createdAt: new Date(new Date().getTime() - 7 * 60000),
        cookingStatus: "preparing",
        billingStatus: "active",
        kotCount: 1,
      },
      {
        id: "5",
        orderNumber: "Order #10",
        customerName: "Mike Johnson",
        orderDate: "25/02/2026 03:05 AM",
        itemCount: 3,
        total: 1372.63,
        status: "pending",
        type: "dineIn",
        location: "Order Placed",
        waiter: "John Doe",
        items: [
          { id: "7", name: "Vegetable Hakka Noodles", quantity: 2, price: 180.0, category: "Main Course" },
          { id: "8", name: "Spring Rolls", quantity: 2, price: 150.0, category: "Appetizers" },
        ],
        subTotal: 1303.45,
        sgst: 34.59,
        cgst: 34.59,
        balanceReturned: 0,
        paymentMethod: "cash",
        tableNumber: "T-4",
        createdAt: new Date(new Date().getTime() - 10 * 60000),
        cookingStatus: "confirmed",
        billingStatus: "active",
        kotCount: 2,
      },
      {
        id: "6",
        orderNumber: "Order #5",
        customerName: "Katrina Robel",
        orderDate: "10/02/2026 10:45 AM",
        itemCount: 2,
        total: 704.25,
        status: "paid",
        type: "pos",
        location: "Order Served",
        waiter: "Jane Smith",
        items: [
          { id: "9", name: "Paneer Tikka", quantity: 2, price: 250.0, category: "Appetizers" },
        ],
        subTotal: 669.0,
        sgst: 17.625,
        cgst: 17.625,
        balanceReturned: 0,
        paymentMethod: "card",
        tableNumber: "T-7",
        createdAt: new Date(new Date().getTime() - 94 * 60000),
        cookingStatus: "served",
        billingStatus: "paid",
        kotCount: 1,
      },
    ];
    setOrders(sampleOrders);
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(sampleOrders));
  }, []);

  // Save orders to localStorage whenever they change
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
    }
  }, [orders]);

  const addOrder = (order: Order) => {
    const newOrder = {
      ...order,
      createdAt: new Date(),
    };
    setOrders((prev) => [...prev, newOrder]);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...updates } : order))
    );
  };

  const deleteOrder = (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id));
  };

  const getOrderById = (id: string) => {
    return orders.find((order) => order.id === id);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getTodayOrders = () => {
    return orders.filter((order) => isToday(order.createdAt));
  };

  const getTodayEarnings = () => {
    return getTodayOrders().reduce((sum, order) => {
      if (order.status === "paid") {
        return sum + order.total;
      }
      return sum;
    }, 0);
  };

  const getTodayCustomers = () => {
    const todayOrders = getTodayOrders();
    const uniqueCustomers = new Set(todayOrders.map((order) => order.customerName));
    return uniqueCustomers.size;
  };

  const isThisMonth = (date: Date) => {
    const today = new Date();
    return (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getMonthlyEarnings = () => {
    return orders
      .filter((order) => isThisMonth(order.createdAt) && order.status === "paid")
      .reduce((sum, order) => sum + order.total, 0);
  };

  const getAverageDailyEarnings = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Get all days in current month up to today
    const daysInMonth = today.getDate();
    
    const monthlyTotal = getMonthlyEarnings();
    
    return daysInMonth > 0 ? monthlyTotal / daysInMonth : 0;
  };

  const getPaymentMethodTotals = () => {
    const todayOrders = getTodayOrders().filter((order) => order.status === "paid");
    
    const cash = todayOrders
      .filter((order) => order.paymentMethod === "cash")
      .reduce((sum, order) => sum + order.total, 0);
    
    const card = todayOrders
      .filter((order) => order.paymentMethod === "card" || order.paymentMethod === "upi")
      .reduce((sum, order) => sum + order.total, 0);
    
    return { cash, card };
  };

  const getTopSellingDishes = (limit = 5) => {
    const todayOrders = getTodayOrders().filter((order) => order.status === "paid");
    
    const dishMap = new Map<string, { name: string; quantity: number; total: number }>();
    
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        const existing = dishMap.get(item.name);
        if (existing) {
          existing.quantity += item.quantity;
          existing.total += item.quantity * item.price;
        } else {
          dishMap.set(item.name, {
            name: item.name,
            quantity: item.quantity,
            total: item.quantity * item.price,
          });
        }
      });
    });
    
    return Array.from(dishMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  };

  const getTopSellingTables = (limit = 5) => {
    const todayOrders = getTodayOrders().filter(
      (order) => order.status === "paid" && order.tableNumber
    );
    
    const tableMap = new Map<string, number>();
    
    todayOrders.forEach((order) => {
      if (order.tableNumber) {
        const existing = tableMap.get(order.tableNumber);
        tableMap.set(order.tableNumber, (existing || 0) + order.total);
      }
    });
    
    return Array.from(tableMap.entries())
      .map(([table, total]) => ({ table, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  };

  const value: OrderContextType = {
    orders,
    addOrder,
    updateOrder,
    deleteOrder,
    getOrderById,
    getTodayOrders,
    getTodayEarnings,
    getTodayCustomers,
    getMonthlyEarnings,
    getAverageDailyEarnings,
    getPaymentMethodTotals,
    getTopSellingDishes,
    getTopSellingTables,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    // Instead of throwing, return a safe default during initial render
    console.warn("useOrders must be used within an OrderProvider");
    return {
      orders: [],
      addOrder: () => {},
      updateOrder: () => {},
      deleteOrder: () => {},
      getOrderById: () => undefined,
      getTodayOrders: () => [],
      getTodayEarnings: () => 0,
      getTodayCustomers: () => 0,
      getMonthlyEarnings: () => 0,
      getAverageDailyEarnings: () => 0,
      getPaymentMethodTotals: () => ({ cash: 0, card: 0 }),
      getTopSellingDishes: () => [],
      getTopSellingTables: () => [],
    };
  }
  return context;
}