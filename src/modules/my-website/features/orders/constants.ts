import type { ComponentType } from "react";
import { Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import type { WebOrder } from "./types";

export const STATUS_COLORS: Record<WebOrder["status"], string> = {
  pending: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  confirmed: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  shipped: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  completed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

export const STATUS_ICONS: Record<
  WebOrder["status"],
  ComponentType<{ className?: string }>
> = {
  pending: Clock,
  confirmed: CheckCircle2,
  shipped: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export const PAYMENT_STATUS_COLORS: Record<WebOrder["paymentStatus"], string> = {
  paid: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  unpaid: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  refunded: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

export const ALL_STATUSES: WebOrder["status"][] = [
  "pending",
  "confirmed",
  "shipped",
  "completed",
  "cancelled",
];

export const ALL_PAYMENT_STATUSES: WebOrder["paymentStatus"][] = [
  "paid",
  "unpaid",
  "refunded",
];

export const STATUS_LABELS: Record<
  "az" | "en",
  Record<WebOrder["status"], string>
> = {
  en: {
    pending: "Pending",
    confirmed: "Confirmed",
    shipped: "Shipped",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  az: {
    pending: "Gözləyir",
    confirmed: "Təsdiqləndi",
    shipped: "Göndərildi",
    completed: "Tamamlandı",
    cancelled: "Ləğv edildi",
  },
};

export const PAYMENT_STATUS_LABELS: Record<
  "az" | "en",
  Record<WebOrder["paymentStatus"], string>
> = {
  en: { paid: "Paid", unpaid: "Unpaid", refunded: "Refunded" },
  az: { paid: "Ödənilib", unpaid: "Ödənilməyib", refunded: "Qaytarılıb" },
};
