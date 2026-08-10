import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import {
  purchaseOrderStatsQueryString,
  purchasesListQueryString,
  type PurchaseOrderStatsQuery,
  type PurchasesListQuery,
} from "../lib/purchaseMappers";
import type { PaymentMethodApi, PurchaseStatusApi } from "../lib/salesMappers";

export interface PurchaseListRow {
  id: string;
  productIcon: string;
  productName: string;
  date: string;
  supplierName: string;
  reference: string;
  status: string;
  total: number;
  paid: number;
  due: number;
  paymentStatus: string;
  storeId: string | null;
  stockReceived: boolean;
}

export interface PurchaseLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  quantity: number;
  purchasePrice: string;
  discount: string;
  taxPercent: string;
  taxAmount: string;
  unitCost: string;
  totalCost: string;
}

export interface PurchasePaymentRow {
  targetType: string;
  paymentId: string;
  method: PaymentMethodApi;
  allocatedAmount: string;
  paymentTotal: string;
  date: string;
  note: string | null;
  reference: string | null;
}

export interface PurchaseDetail {
  id: string;
  reference: string | null;
  documentNo: string | null;
  date: string;
  supplierId: string | null;
  supplierName: string | null;
  storeId: string | null;
  storeName: string | null;
  stockReceivedAt: string | null;
  orderTax: string | null;
  discount: string | null;
  shipping: string | null;
  total: string;
  paid: string;
  due: string;
  status: PurchaseStatusApi;
  statusLabel: string;
  paymentStatus: string;
  description: string | null;
  payments: PurchasePaymentRow[];
  items: PurchaseLineItem[];
}

export interface PurchaseReturnListRow {
  id: string;
  productIcon: string;
  productName: string;
  date: string;
  supplierName: string;
  reference: string;
  status: string;
  total: number;
  paid: number;
  due: number;
  paymentStatus: string;
  storeId: string | null;
  stockDeducted: boolean;
  purchaseId: string | null;
  purchaseReference: string | null;
}

export interface PurchaseReturnDetail extends Omit<PurchaseDetail, "stockReceivedAt"> {
  stockDeductedAt: string | null;
  purchaseId: string | null;
  purchaseReference: string | null;
}

export interface PurchaseOrderProductStat {
  productId: string;
  productName: string;
  sku: string;
  purchasedQty: number;
  purchasedAmount: number;
  instockQty: number;
}

export interface PurchaseReturnQuantityLimit {
  productId: string;
  productName: string;
  sku: string | null;
  stockQty: number;
  purchasedQty: number | null;
  alreadyReturnedQty: number | null;
  maxReturnQty: number | null;
}

export type PurchaseReturnQuantityLimitsQuery = {
  purchaseId?: string;
  storeId?: string;
  excludeReturnId?: string;
  productIds?: string[];
  forReceivedStatus?: boolean;
};

export type PurchaseItemInput = {
  productId: string;
  quantity: number;
  purchasePrice: number;
  discount?: number;
  taxPercent?: number;
};

export type CreatePurchaseBody = {
  reference?: string | null;
  documentNo?: string | null;
  supplierId?: string | null;
  storeId?: string | null;
  date?: string;
  orderTax?: number;
  discount?: number;
  shipping?: number;
  status?: PurchaseStatusApi;
  description?: string | null;
  items: PurchaseItemInput[];
};

export type CreatePurchaseReturnBody = CreatePurchaseBody & {
  purchaseId?: string | null;
};

export type RecordPurchasePaymentBody = {
  amount: number;
  method?: PaymentMethodApi;
  note?: string | null;
  reference?: string | null;
};

export async function fetchPurchases(query: PurchasesListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PurchaseListRow[] }>(
    `/tenant/purchases${purchasesListQueryString(query)}`,
  );
  return res.data;
}

export async function fetchPurchase(id: string) {
  const res = await apiGet<{ success: boolean; data: PurchaseDetail }>(`/tenant/purchases/${id}`);
  return res.data;
}

export async function createPurchase(body: CreatePurchaseBody) {
  const res = await apiPost<{ success: boolean; data: PurchaseDetail }>("/tenant/purchases", body);
  return res.data;
}

export async function updatePurchase(id: string, body: Partial<CreatePurchaseBody>) {
  const res = await apiPatch<{ success: boolean; data: PurchaseDetail }>(`/tenant/purchases/${id}`, body);
  return res.data;
}

export async function deletePurchase(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/purchases/${id}`);
}

export async function recordPurchasePayment(id: string, body: RecordPurchasePaymentBody) {
  const res = await apiPost<{ success: boolean; data: PurchaseDetail }>(
    `/tenant/purchases/${id}/payments`,
    body,
  );
  return res.data;
}

export async function fetchPurchaseReturns(query: PurchasesListQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PurchaseReturnListRow[] }>(
    `/tenant/purchases/returns${purchasesListQueryString(query)}`,
  );
  return res.data;
}

export async function fetchPurchaseReturn(id: string) {
  const res = await apiGet<{ success: boolean; data: PurchaseReturnDetail }>(
    `/tenant/purchases/returns/${id}`,
  );
  return res.data;
}

function purchaseReturnLimitsQueryString(q: PurchaseReturnQuantityLimitsQuery): string {
  const p = new URLSearchParams();
  if (q.purchaseId) p.set("purchaseId", q.purchaseId);
  if (q.storeId) p.set("storeId", q.storeId);
  if (q.excludeReturnId) p.set("excludeReturnId", q.excludeReturnId);
  if (q.productIds?.length) p.set("productIds", q.productIds.join(","));
  if (q.forReceivedStatus) p.set("forReceivedStatus", "true");
  const s = p.toString();
  return s ? `?${s}` : "";
}

export async function fetchPurchaseReturnQuantityLimits(query: PurchaseReturnQuantityLimitsQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PurchaseReturnQuantityLimit[] }>(
    `/tenant/purchases/returns/quantity-limits${purchaseReturnLimitsQueryString(query)}`,
  );
  return res.data;
}

export async function createPurchaseReturn(body: CreatePurchaseReturnBody) {
  const res = await apiPost<{ success: boolean; data: PurchaseReturnDetail }>(
    "/tenant/purchases/returns",
    body,
  );
  return res.data;
}

export async function updatePurchaseReturn(id: string, body: Partial<CreatePurchaseReturnBody>) {
  const res = await apiPatch<{ success: boolean; data: PurchaseReturnDetail }>(
    `/tenant/purchases/returns/${id}`,
    body,
  );
  return res.data;
}

export async function deletePurchaseReturn(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/purchases/returns/${id}`);
}

export async function recordPurchaseReturnPayment(id: string, body: RecordPurchasePaymentBody) {
  const res = await apiPost<{ success: boolean; data: PurchaseReturnDetail }>(
    `/tenant/purchases/returns/${id}/payments`,
    body,
  );
  return res.data;
}

export async function fetchPurchaseOrderStats(query: PurchaseOrderStatsQuery = {}) {
  const res = await apiGet<{ success: boolean; data: PurchaseOrderProductStat[] }>(
    `/tenant/purchases/order-stats${purchaseOrderStatsQueryString(query)}`,
  );
  return res.data;
}
