import { formatInventoryDate } from "./inventoryMappers";

export type { PurchaseStatusApi, PaymentMethodApi } from "./salesMappers";
export { mapPurchaseStatusToApi, mapPaymentMethodToApi } from "./salesMappers";

export function formatPurchaseDate(iso: string): string {
  return formatInventoryDate(iso);
}

export function parsePurchaseAmount(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export type PurchasesListQuery = {
  search?: string;
  supplierId?: string;
  status?: string;
  paymentStatus?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
};

export function purchasesListQueryString(q: PurchasesListQuery = {}): string {
  const params = new URLSearchParams();
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.supplierId) params.set("supplierId", q.supplierId);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.paymentStatus && q.paymentStatus !== "all") params.set("paymentStatus", q.paymentStatus);
  // Always send sortBy when set — including "all" (backend default used to be last90days).
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

export type PurchaseOrderStatsQuery = {
  sortBy?: string;
  limit?: number;
};

export function purchaseOrderStatsQueryString(q: PurchaseOrderStatsQuery = {}): string {
  const params = new URLSearchParams();
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}
