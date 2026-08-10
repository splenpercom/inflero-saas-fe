import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { stockQueryString, type StockPagedQuery, type TransferApprovalStatus } from "../lib/stockMappers";

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface StockLevelRow {
  id: string;
  warehouse: string;
  store: string;
  warehouseId: string | null;
  storeId: string | null;
  productId: string;
  productName: string;
  productSku: string;
  productImage: string;
  date: string;
  qty: number;
  managedById: string | null;
  personName: string;
}

export interface StockAdjustmentRow {
  id: string;
  warehouse: string;
  store: string;
  productName: string;
  productImage: string;
  date: string;
  personName: string;
  customerName: string | null;
  qty: number;
}

export interface StockTransferRow {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  noOfProducts: number;
  quantityTransferred: number;
  refNumber: string;
  date: string;
  isDeposited: boolean;
  approvalStatus: TransferApprovalStatus;
}

export interface StockTransferDetail {
  id: string;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  fromWarehouse: string;
  toWarehouse: string;
  referenceNumber: string | null;
  documentNo: string | null;
  notes: string | null;
  date: string;
  isDeposited: boolean;
  approvalStatus: TransferApprovalStatus;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  createdBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  rejectedBy: { id: string; name: string } | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    transferredQty: number;
    soldQty: number;
    returnedQty: number;
    remainingQty: number;
  }[];
}

export type CreateStockAdjustmentBody = {
  productId: string;
  warehouseId?: string | null;
  storeId?: string | null;
  quantity: number;
  referenceNumber?: string | null;
  documentNo?: string | null;
  reason?: string | null;
  personId?: string | null;
  customerId?: string | null;
  notes?: string | null;
  date?: string | null;
};

export type CreateStockTransferBody = {
  fromWarehouseId?: string | null;
  fromStoreId?: string | null;
  toWarehouseId?: string | null;
  toStoreId?: string | null;
  referenceNumber?: string | null;
  documentNo?: string | null;
  notes?: string | null;
  date?: string | null;
  isDeposited?: boolean;
  items: { productId: string; quantity: number }[];
};

export async function fetchStockLevels(query: StockPagedQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedResult<StockLevelRow> }>(
    `/tenant/stock/levels${stockQueryString(query)}`,
  );
  return res.data;
}

export async function patchStockLevel(
  id: string,
  body: {
    quantity?: number;
    managedById?: string | null;
    warehouseId?: string;
    storeId?: string;
  },
) {
  const res = await apiPatch<{ success: boolean; data: StockLevelRow }>(`/tenant/stock/levels/${id}`, body);
  return res.data;
}

export async function fetchStockAdjustments(query: StockPagedQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedResult<StockAdjustmentRow> }>(
    `/tenant/stock/adjustments${stockQueryString(query)}`,
  );
  return res.data;
}

export async function createStockAdjustment(body: CreateStockAdjustmentBody) {
  const res = await apiPost<{ success: boolean; data: StockAdjustmentRow }>("/tenant/stock/adjustments", body);
  return res.data;
}

export async function deleteStockAdjustment(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/stock/adjustments/${id}`);
}

export async function fetchStockTransfers(query: StockPagedQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PagedResult<StockTransferRow> }>(
    `/tenant/stock/transfers${stockQueryString(query)}`,
  );
  return res.data;
}

export async function createStockTransfer(body: CreateStockTransferBody) {
  const res = await apiPost<{ success: boolean; data: StockTransferRow }>("/tenant/stock/transfers", body);
  return res.data;
}

export async function fetchStockTransferDetail(id: string) {
  const res = await apiGet<{ success: boolean; data: StockTransferDetail }>(
    `/tenant/stock/transfers/${id}/detail`,
  );
  return res.data;
}

export async function deleteStockTransfer(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/stock/transfers/${id}`);
}

export async function approveDepositedTransfer(id: string) {
  const res = await apiPost<{ success: boolean; data: StockTransferRow }>(
    `/tenant/stock/transfers/${id}/approve`,
  );
  return res.data;
}

export async function rejectDepositedTransfer(id: string, body: { reason?: string | null }) {
  const res = await apiPost<{ success: boolean; data: StockTransferRow }>(
    `/tenant/stock/transfers/${id}/reject`,
    body,
  );
  return res.data;
}

export async function sellDepositedTransfer(
  id: string,
  body: {
    items: { transferItemId: string; quantity: number; unitPrice: number }[];
    notes?: string | null;
    date?: string | null;
  },
) {
  const res = await apiPost<{ success: boolean; data: unknown }>(
    `/tenant/stock/transfers/${id}/deposited/sell`,
    body,
  );
  return res.data;
}

export async function returnDepositedTransfer(
  id: string,
  body: {
    items: { transferItemId: string; quantity: number }[];
    notes?: string | null;
    date?: string | null;
  },
) {
  const res = await apiPost<{ success: boolean; data: unknown }>(
    `/tenant/stock/transfers/${id}/deposited/return`,
    body,
  );
  return res.data;
}
