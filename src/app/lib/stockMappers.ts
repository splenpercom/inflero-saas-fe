import { formatInventoryDate } from "./inventoryMappers";

export type TransferApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export function formatStockDate(iso: string): string {
  return formatInventoryDate(iso);
}

export function branchLabel(store: string): string {
  if (store && store !== "—") return store;
  return "—";
}

/** @deprecated Use branchLabel — stock is branch-scoped only in this product */
export function locationLabel(_warehouse: string, store: string): string {
  return branchLabel(store);
}

export type StockPagedQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  storeId?: string;
  fromStoreId?: string;
  toStoreId?: string;
};

export function stockQueryString(q: StockPagedQuery = {}): string {
  const params = new URLSearchParams();
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.storeId) params.set("storeId", q.storeId);
  if (q.fromStoreId) params.set("fromStoreId", q.fromStoreId);
  if (q.toStoreId) params.set("toStoreId", q.toStoreId);
  const s = params.toString();
  return s ? `?${s}` : "";
}
