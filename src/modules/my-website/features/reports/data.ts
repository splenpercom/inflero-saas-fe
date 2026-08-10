export type Period = "daily" | "weekly" | "monthly";

// ── Dummy data ────────────────────────────────────────────────────────────────

export const DAILY_REVENUE = [
  { label: "00:00", revenue: 0,   orders: 0 },
  { label: "03:00", revenue: 120, orders: 1 },
  { label: "06:00", revenue: 340, orders: 3 },
  { label: "09:00", revenue: 890, orders: 7 },
  { label: "12:00", revenue: 1540,orders: 12 },
  { label: "15:00", revenue: 2100,orders: 17 },
  { label: "18:00", revenue: 2760,orders: 22 },
  { label: "21:00", revenue: 3190,orders: 26 },
  { label: "23:59", revenue: 3490,orders: 29 },
];

export const WEEKLY_REVENUE_AZ = [
  { label: "BE",  revenue: 1820, orders: 14 },
  { label: "ÇA",  revenue: 2340, orders: 19 },
  { label: "ÇƏ",  revenue: 1980, orders: 16 },
  { label: "CA",  revenue: 3100, orders: 25 },
  { label: "CÜ",  revenue: 4200, orders: 34 },
  { label: "ŞƏ",  revenue: 5800, orders: 47 },
  { label: "B",   revenue: 3900, orders: 31 },
];

export const WEEKLY_REVENUE_EN = [
  { label: "Mon", revenue: 1820, orders: 14 },
  { label: "Tue", revenue: 2340, orders: 19 },
  { label: "Wed", revenue: 1980, orders: 16 },
  { label: "Thu", revenue: 3100, orders: 25 },
  { label: "Fri", revenue: 4200, orders: 34 },
  { label: "Sat", revenue: 5800, orders: 47 },
  { label: "Sun", revenue: 3900, orders: 31 },
];

/** @deprecated Prefer language-aware WEEKLY_REVENUE_AZ / _EN */
export const WEEKLY_REVENUE = WEEKLY_REVENUE_AZ;

export const MONTHLY_REVENUE_AZ = [
  { label: "Yan", revenue: 18400, orders: 142 },
  { label: "Fev", revenue: 22100, orders: 178 },
  { label: "Mar", revenue: 19800, orders: 159 },
  { label: "Apr", revenue: 28600, orders: 231 },
  { label: "May", revenue: 31200, orders: 254 },
  { label: "İyn", revenue: 26900, orders: 216 },
  { label: "İyl", revenue: 34800, orders: 281 },
];

export const MONTHLY_REVENUE_EN = [
  { label: "Jan", revenue: 18400, orders: 142 },
  { label: "Feb", revenue: 22100, orders: 178 },
  { label: "Mar", revenue: 19800, orders: 159 },
  { label: "Apr", revenue: 28600, orders: 231 },
  { label: "May", revenue: 31200, orders: 254 },
  { label: "Jun", revenue: 26900, orders: 216 },
  { label: "Jul", revenue: 34800, orders: 281 },
];

/** @deprecated Prefer language-aware MONTHLY_REVENUE_AZ / _EN */
export const MONTHLY_REVENUE = MONTHLY_REVENUE_AZ;

export const STATUS_BREAKDOWN_AZ = [
  { name: "Tamamlandı", value: 61, color: "#22c55e" },
  { name: "Göndərildi",  value: 18, color: "#a855f7" },
  { name: "Gözləyir",   value: 12, color: "#eab308" },
  { name: "Təsdiqləndi",value: 6,  color: "#3b82f6" },
  { name: "Ləğv edildi",value: 3,  color: "#ef4444" },
];

export const STATUS_BREAKDOWN_EN = [
  { name: "Completed", value: 61, color: "#22c55e" },
  { name: "Shipped",   value: 18, color: "#a855f7" },
  { name: "Pending",   value: 12, color: "#eab308" },
  { name: "Confirmed", value: 6,  color: "#3b82f6" },
  { name: "Cancelled", value: 3,  color: "#ef4444" },
];

/** @deprecated Prefer language-aware STATUS_BREAKDOWN_AZ / _EN */
export const STATUS_BREAKDOWN = STATUS_BREAKDOWN_AZ;

export const PAYMENT_BREAKDOWN = [
  { name: "Epoint",          value: 68, color: "#3b82f6" },
  { name: "Cash on Delivery",value: 32, color: "#f97316" },
];

export const TOP_PRODUCTS = [
  { name: "Wireless Headphones", orders: 47, revenue: 6109.53, trend: +12 },
  { name: "Smart Watch",         orders: 38, revenue: 7599.62, trend: +8  },
  { name: "Running Shoes",       orders: 34, revenue: 3059.66, trend: -3  },
  { name: "Fitness Tracker",     orders: 29, revenue: 2609.71, trend: +21 },
  { name: "Yoga Mat",            orders: 22, revenue: 879.78,  trend: +5  },
];

export const RECENT_ORDERS = [
  { ref: "WO-1001", customer: "Ayla Mammadova",  total: 259.98, status: "pending",   time: "10:42" },
  { ref: "WO-1002", customer: "Elchin Huseynov", total: 129.99, status: "confirmed", time: "15:08" },
  { ref: "WO-1003", customer: "Sara Aliyeva",    total: 349.97, status: "shipped",   time: "09:31" },
  { ref: "WO-1004", customer: "Kamran Quliyev",  total: 89.99,  status: "completed", time: "18:20" },
  { ref: "WO-1005", customer: "Nigar Rzayeva",   total: 199.99, status: "cancelled", time: "11:55" },
];

export const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  shipped:   "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export const STATUS_LABELS_AZ: Record<string, string> = {
  pending: "Gözləyir", confirmed: "Təsdiqləndi", shipped: "Göndərildi",
  completed: "Tamamlandı", cancelled: "Ləğv edildi",
};

export const STATUS_LABELS_EN: Record<string, string> = {
  pending: "Pending", confirmed: "Confirmed", shipped: "Shipped",
  completed: "Completed", cancelled: "Cancelled",
};

/** @deprecated Prefer STATUS_LABELS_AZ / _EN */
export const STATUS_LABELS = STATUS_LABELS_AZ;
