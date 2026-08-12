import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { salesListQueryString, type SalesListQuery } from "../lib/salesMappers";
import type { OrderStatusApi, PaymentMethodApi, PurchaseStatusApi } from "../lib/salesMappers";

export interface PosOrderListRow {
  id: string;
  customerId: string | null;
  customerAvatar: string;
  customerName: string;
  reference: string;
  date: string;
  status: string;
  grandTotal: number;
  paid: number;
  due: number;
  paymentStatus: string;
  biller: string;
  storeId: string | null;
}

export interface SalesBillerRow {
  id: string;
  code: string;
  name: string;
  email: string | null;
  commissionType?: "FIXED" | "PERCENT" | null;
  commissionValue?: string | null;
}

export interface PosOrderLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  price: string;
}

export interface PosOrderPaymentRow {
  targetType: string;
  paymentId: string;
  method: PaymentMethodApi;
  allocatedAmount: string;
  paymentTotal: string;
  date: string;
  note: string | null;
  reference: string | null;
}

export interface PosOrderDetail {
  id: string;
  reference: string;
  documentNo: string | null;
  date: string;
  status: OrderStatusApi;
  statusLabel: string;
  grandTotal: string;
  paid: string;
  due: string;
  paymentStatus: string;
  paymentMethod: PaymentMethodApi | null;
  shipping: string | null;
  taxPercent: string | null;
  discount: string | null;
  serviceFee?: string | null;
  commissionEnabled?: boolean;
  commissionType?: "FIXED" | "PERCENT" | null;
  commissionValue?: string | null;
  commissionAmount?: string | null;
  storeId: string | null;
  customerId: string | null;
  customerName: string | null;
  billerId: string | null;
  billerName: string | null;
  vehicleId: string | null;
  vehicleLabel: string | null;
  mileageAtService: number | null;
  stockDeducted: boolean;
  payments: PosOrderPaymentRow[];
  items: PosOrderLineItem[];
}

export interface InvoiceListRow {
  id: string;
  invoiceNo: string;
  customerAvatar: string;
  customerName: string;
  dueDate: string;
  amount: number;
  paid: number;
  amountDue: number;
  status: string;
}

export interface InvoiceLineItem {
  id: string;
  productId: string | null;
  productName?: string | null;
  description: string;
  quantity: number;
  unitPrice: string;
  total: string;
  sku?: string | null;
}

export interface InvoicePaymentRow {
  targetType: string;
  paymentId: string;
  method: PaymentMethodApi;
  allocatedAmount: string;
  paymentTotal: string;
  date: string;
  note: string | null;
  reference: string | null;
}

export interface InvoiceDetail {
  id: string;
  invoiceNo: string;
  documentNo: string | null;
  createdAt: string;
  dueDate: string;
  customerId: string | null;
  customer: {
    id: string;
    code: string;
    name: string;
    email: string | null;
    phone: string | null;
    country: string | null;
  } | null;
  notes: string | null;
  subtotal: string;
  tax: string;
  discount: string;
  total: string;
  paid: string;
  amountDue: string;
  status: string;
  items: InvoiceLineItem[];
  payments: InvoicePaymentRow[];
  posOrderId: string | null;
}

export interface SalesReturnListRow {
  id: string;
  productIcon: string;
  productName: string;
  date: string;
  customerAvatar: string;
  customerName: string;
  status: string;
  total: number;
  paid: number;
  due: number;
  paymentStatus: string;
  storeId: string | null;
  posOrderReference: string | null;
  restocked: boolean;
}

export interface SalesReturnLineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  discount: string | null;
  taxPercent: string | null;
}

export interface SalesReturnDetail {
  id: string;
  reference: string | null;
  documentNo: string | null;
  date: string;
  customerId: string | null;
  customerName: string | null;
  storeId: string | null;
  storeName: string | null;
  posOrderId: string | null;
  posOrderReference: string | null;
  restockedAt: string | null;
  orderTax: string | null;
  discount: string | null;
  shipping: string | null;
  total: string;
  paid: string;
  due: string;
  status: PurchaseStatusApi;
  statusLabel: string;
  paymentStatus: string;
  items: SalesReturnLineItem[];
}

export type PosOrderItemInput = { productId: string; quantity: number; price?: number };

export type CreatePosOrderBody = {
  status?: OrderStatusApi;
  customerId?: string | null;
  billerId?: string | null;
  paymentMethod?: PaymentMethodApi;
  shipping?: number;
  taxPercent?: number;
  discount?: number;
  serviceFee?: number;
  items?: PosOrderItemInput[];
  reference?: string | null;
  documentNo?: string | null;
  date?: string;
  initialPaymentAmount?: number;
  storeId?: string | null;
  vehicleId?: string | null;
  mileageAtService?: number | null;
};

export type CreateInvoiceBody = {
  invoiceNo?: string;
  documentNo?: string | null;
  customerId?: string | null;
  dueDate: string;
  saleId?: string | null;
  posOrderId?: string | null;
  notes?: string | null;
  subtotal?: number;
  tax?: number;
  discount?: number;
  items: {
    productId?: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
  }[];
};

export type CreateSalesReturnBody = {
  reference?: string | null;
  documentNo?: string | null;
  customerId?: string | null;
  posOrderId?: string | null;
  storeId?: string | null;
  date?: string;
  orderTax?: number;
  discount?: number;
  shipping?: number;
  status?: PurchaseStatusApi;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxPercent?: number;
  }[];
};

export type RecordPaymentBody = {
  amount: number;
  method?: PaymentMethodApi;
  note?: string | null;
  reference?: string | null;
};

export async function fetchSalesBillers() {
  const res = await apiGet<{ success: boolean; data: SalesBillerRow[] }>("/tenant/sales/billers");
  return res.data;
}

export async function updateSalesBiller(
  id: string,
  body: {
    commissionType?: "FIXED" | "PERCENT" | null;
    commissionValue?: number | null;
  },
) {
  const res = await apiPatch<{ success: boolean; data: SalesBillerRow }>(
    `/tenant/sales/billers/${id}`,
    body,
  );
  return res.data;
}

export async function fetchPosOrders(query: SalesListQuery = {}) {
  const res = await apiGet<{
    success: boolean;
    data: {
      items: PosOrderListRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(`/tenant/sales/pos-orders${salesListQueryString(query)}`);
  return res.data;
}

export async function fetchPosOrder(id: string) {
  const res = await apiGet<{ success: boolean; data: PosOrderDetail }>(`/tenant/sales/pos-orders/${id}`);
  return res.data;
}

export async function createPosOrder(body: CreatePosOrderBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>("/tenant/sales/pos-orders", body);
  return res.data;
}

export async function posCheckout(body: CreatePosOrderBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>("/tenant/sales/pos/checkout", body);
  return res.data;
}

export async function updatePosOrder(id: string, body: Partial<CreatePosOrderBody>) {
  const res = await apiPatch<{ success: boolean; data: PosOrderDetail }>(`/tenant/sales/pos-orders/${id}`, body);
  return res.data;
}

export async function deletePosOrder(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/sales/pos-orders/${id}`);
}

export async function recordPosOrderPayment(id: string, body: RecordPaymentBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>(
    `/tenant/sales/pos-orders/${id}/payments`,
    body,
  );
  return res.data;
}

export async function fetchInvoices(query: SalesListQuery = {}) {
  const res = await apiGet<{
    success: boolean;
    data: {
      items: InvoiceListRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(`/tenant/sales/invoices${salesListQueryString(query)}`);
  return res.data;
}

export async function fetchInvoice(id: string) {
  const res = await apiGet<{ success: boolean; data: InvoiceDetail }>(`/tenant/sales/invoices/${id}`);
  return res.data;
}

export async function createInvoice(body: CreateInvoiceBody) {
  const res = await apiPost<{ success: boolean; data: InvoiceDetail }>("/tenant/sales/invoices", body);
  return res.data;
}

export async function updateInvoice(id: string, body: Partial<CreateInvoiceBody>) {
  const res = await apiPatch<{ success: boolean; data: InvoiceDetail }>(`/tenant/sales/invoices/${id}`, body);
  return res.data;
}

export async function deleteInvoice(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/sales/invoices/${id}`);
}

export async function recordInvoicePayment(id: string, body: RecordPaymentBody) {
  const res = await apiPost<{ success: boolean; data: InvoiceDetail }>(
    `/tenant/sales/invoices/${id}/payments`,
    body,
  );
  return res.data;
}

export async function fetchSalesReturns(query: SalesListQuery = {}) {
  const res = await apiGet<{
    success: boolean;
    data: {
      items: SalesReturnListRow[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(`/tenant/sales/returns${salesListQueryString(query)}`);
  return res.data;
}

export async function fetchSalesReturn(id: string) {
  const res = await apiGet<{ success: boolean; data: SalesReturnDetail }>(`/tenant/sales/returns/${id}`);
  return res.data;
}

export async function createSalesReturn(body: CreateSalesReturnBody) {
  const res = await apiPost<{ success: boolean; data: SalesReturnDetail }>("/tenant/sales/returns", body);
  return res.data;
}

export async function updateSalesReturn(id: string, body: Partial<CreateSalesReturnBody>) {
  const res = await apiPatch<{ success: boolean; data: SalesReturnDetail }>(`/tenant/sales/returns/${id}`, body);
  return res.data;
}

export async function deleteSalesReturn(id: string) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/sales/returns/${id}`);
}

export async function recordSalesReturnPayment(id: string, body: RecordPaymentBody) {
  const res = await apiPost<{ success: boolean; data: SalesReturnDetail }>(
    `/tenant/sales/returns/${id}/payments`,
    body,
  );
  return res.data;
}
