import { formatInventoryDate } from "./inventoryMappers";

export type OrderStatusApi = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | "HELD";
export type PurchaseStatusApi = "ORDERED" | "PENDING" | "RECEIVED";
export type PaymentMethodApi =
  | "CASH"
  | "CARD"
  | "CHEQUE"
  | "BANK_TRANSFER"
  | "PAYPAL"
  | "CREDIT_CARD"
  | "DEBIT_CARD"
  | "CUSTOM";

export type PosUiPaymentMethod = "cash" | "card" | "bank";

export function formatSalesDate(iso: string): string {
  return formatInventoryDate(iso);
}

export function mapPaymentMethodToApi(ui: PosUiPaymentMethod): PaymentMethodApi {
  if (ui === "card") return "CARD";
  if (ui === "bank") return "BANK_TRANSFER";
  return "CASH";
}

export function mapPaymentMethodFromApi(api: string | null | undefined): PosUiPaymentMethod {
  if (api === "CARD" || api === "CREDIT_CARD" || api === "DEBIT_CARD") return "card";
  if (api === "BANK_TRANSFER" || api === "CHEQUE") return "bank";
  return "cash";
}

export function mapOrderStatusToApi(ui: string): OrderStatusApi {
  const s = ui.toLowerCase();
  if (s === "pending") return "PENDING";
  if (s === "processing") return "PROCESSING";
  if (s === "cancelled" || s === "canceled") return "CANCELLED";
  if (s === "held") return "HELD";
  return "COMPLETED";
}

export function mapPurchaseStatusToApi(ui: string): PurchaseStatusApi {
  const s = ui.toLowerCase();
  if (s === "ordered") return "ORDERED";
  if (s === "received") return "RECEIVED";
  return "PENDING";
}

export type SalesListQuery = {
  search?: string;
  customerId?: string;
  status?: string;
  paymentStatus?: string;
  sortBy?: string;
  limit?: number;
};

export function salesListQueryString(q: SalesListQuery = {}): string {
  const params = new URLSearchParams();
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.customerId) params.set("customerId", q.customerId);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.paymentStatus && q.paymentStatus !== "all") params.set("paymentStatus", q.paymentStatus);
  if (q.sortBy && q.sortBy !== "all") params.set("sortBy", q.sortBy);
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}
