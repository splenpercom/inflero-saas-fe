// Shared localStorage helpers for the dining module.
// Staff pages and public QR / book-table routes must use this file only.

export interface RestaurantTable {
  id: string;
  number: number;
  name: string;
  seats: number;
  area: string;
  status: "available" | "occupied" | "reserved";
  qrUrl: string;
}

export interface RestaurantInfo {
  name: string;
  tagline: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  wifiSsid: string;
  wifiPassword: string;
}

export interface ActiveTableOrder {
  tableId: string;
  items: { name: string; qty: number; price: number }[];
  orderedAt: string;
  status: "active" | "paid";
}

export interface MenuItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
}

export interface MenuCategory {
  id: string;
  name: string;
  icon: string;
  items: MenuItem[];
}

export interface TableBooking {
  id: string;
  tableId: string;
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  notes: string;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}

export interface BookingSettings {
  openTime: string;
  closeTime: string;
  expiryHours: number;
  maxGuestsPerBooking: number;
  advanceBookingDays: number;
  minNoticeHours: number;
  enableAutoCancel: boolean;
  timeSlotDuration: number;
  weekdaysOpen: boolean[];
}

const TABLES_KEY = "inflero_restaurant_tables";
const INFO_KEY = "inflero_restaurant_info";
const ORDERS_KEY = "inflero_table_active_orders";
const MENU_KEY = "inflero_restaurant_menu";
const BOOKINGS_KEY = "inflero_table_bookings";
const BOOKING_SETTINGS_KEY = "inflero_booking_settings";

export const makeTableQrUrl = (id: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/menu/table/${id}`;

export const DEFAULT_TABLES: RestaurantTable[] = [
  { id: "t1", number: 1, name: "Table 1", seats: 2, area: "Indoor", status: "available", qrUrl: "" },
  { id: "t2", number: 2, name: "Table 2", seats: 4, area: "Indoor", status: "occupied", qrUrl: "" },
  { id: "t3", number: 3, name: "Table 3", seats: 4, area: "Indoor", status: "reserved", qrUrl: "" },
  { id: "t4", number: 4, name: "Table 4", seats: 6, area: "Outdoor", status: "available", qrUrl: "" },
  { id: "t5", number: 5, name: "Table 5", seats: 2, area: "Bar", status: "available", qrUrl: "" },
].map((t) => ({ ...t, qrUrl: makeTableQrUrl(t.id) }));

export const DEFAULT_INFO: RestaurantInfo = {
  name: "My Restaurant",
  tagline: "Fresh food, great vibes",
  logoUrl: "",
  address: "123 Main Street, Baku",
  phone: "+994 50 000 0000",
  email: "info@restaurant.com",
  instagram: "",
  facebook: "",
  twitter: "",
  tiktok: "",
  wifiSsid: "Restaurant_WiFi",
  wifiPassword: "welcome123",
};

export const DEFAULT_MENU: MenuCategory[] = [
  {
    id: "cat1",
    name: "Breakfast",
    icon: "🍳",
    items: [
      { id: "i1", productId: "p9", name: "Pancakes", description: "Fluffy pancakes with maple syrup", price: 10.0, image: "", available: true },
      { id: "i2", productId: "p10", name: "Eggs Benedict", description: "Poached eggs on English muffin", price: 13.0, image: "", available: true },
      { id: "i3", productId: "p11", name: "Avocado Toast", description: "Sourdough with smashed avocado", price: 11.0, image: "", available: true },
    ],
  },
  {
    id: "cat2",
    name: "Mains",
    icon: "🍽️",
    items: [
      { id: "i4", productId: "p3", name: "Grilled Chicken", description: "Herb sauce & seasonal vegetables", price: 22.0, image: "", available: true },
      { id: "i5", productId: "p2", name: "Margherita Pizza", description: "San Marzano tomato, fresh basil", price: 18.0, image: "", available: true },
      { id: "i6", productId: "p1", name: "Caesar Salad", description: "Romaine, parmesan, croutons", price: 12.5, image: "", available: false },
    ],
  },
  {
    id: "cat3",
    name: "Desserts",
    icon: "🍰",
    items: [
      { id: "i7", productId: "p4", name: "Chocolate Lava Cake", description: "Warm with vanilla ice cream", price: 9.0, image: "", available: true },
      { id: "i8", productId: "p5", name: "Tiramisu", description: "Classic Italian dessert", price: 8.5, image: "", available: true },
    ],
  },
  {
    id: "cat4",
    name: "Drinks",
    icon: "🥤",
    items: [
      { id: "i9", productId: "p6", name: "Espresso", description: "Double shot", price: 4.0, image: "", available: true },
      { id: "i10", productId: "p7", name: "Cappuccino", description: "Espresso & steamed milk", price: 5.0, image: "", available: true },
      { id: "i11", productId: "p8", name: "Fresh OJ", description: "Freshly squeezed", price: 6.0, image: "", available: true },
    ],
  },
];

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  openTime: "12:00",
  closeTime: "22:00",
  expiryHours: 1,
  maxGuestsPerBooking: 20,
  advanceBookingDays: 30,
  minNoticeHours: 2,
  enableAutoCancel: false,
  timeSlotDuration: 30,
  weekdaysOpen: [false, true, true, true, true, true, true],
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const getTables = (): RestaurantTable[] => {
  const parsed = readJson<RestaurantTable[] | null>(TABLES_KEY, null);
  if (!parsed?.length) return DEFAULT_TABLES;
  return parsed.map((t) => ({ ...t, qrUrl: makeTableQrUrl(t.id) }));
};

export const saveTables = (tables: RestaurantTable[]) =>
  localStorage.setItem(TABLES_KEY, JSON.stringify(tables));

export const getRestaurantInfo = (): RestaurantInfo => {
  const parsed = readJson<Partial<RestaurantInfo> | null>(INFO_KEY, null);
  return parsed ? { ...DEFAULT_INFO, ...parsed } : DEFAULT_INFO;
};

export const saveRestaurantInfo = (info: RestaurantInfo) =>
  localStorage.setItem(INFO_KEY, JSON.stringify(info));

export const getActiveOrders = (): Record<string, ActiveTableOrder> =>
  readJson(ORDERS_KEY, {});

export const saveActiveOrders = (orders: Record<string, ActiveTableOrder>) =>
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

export const clearActiveOrder = (tableId: string) => {
  const orders = getActiveOrders();
  delete orders[tableId];
  saveActiveOrders(orders);
};

export const getMenuCategories = (): MenuCategory[] => {
  const parsed = readJson<MenuCategory[] | null>(MENU_KEY, null);
  return parsed?.length ? parsed : DEFAULT_MENU;
};

export const saveMenuCategories = (categories: MenuCategory[]) =>
  localStorage.setItem(MENU_KEY, JSON.stringify(categories));

export const getBookings = (): TableBooking[] => {
  const parsed = readJson<TableBooking[] | null>(BOOKINGS_KEY, null);
  return Array.isArray(parsed) ? parsed : [];
};

export const saveBookings = (bookings: TableBooking[]) =>
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));

export const saveBooking = (b: TableBooking) => {
  saveBookings([...getBookings(), b]);
};

export const getBookingSettings = (): BookingSettings => {
  const parsed = readJson<Partial<BookingSettings> | null>(BOOKING_SETTINGS_KEY, null);
  return parsed ? { ...DEFAULT_BOOKING_SETTINGS, ...parsed } : DEFAULT_BOOKING_SETTINGS;
};

export const saveBookingSettings = (s: BookingSettings) =>
  localStorage.setItem(BOOKING_SETTINGS_KEY, JSON.stringify(s));
