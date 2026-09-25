import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import { salesListQueryString, type SalesListQuery } from "../lib/salesMappers";
import type { OrderStatusApi, PaymentMethodApi, PurchaseStatusApi } from "../lib/salesMappers";

export type ProductionStatusApi = "IN_PROCESSING" | "IN_PRODUCTION" | "COMPLETED";

export interface PosOrderWebMeta {
  status: "pending" | "confirmed" | "shipped" | "completed" | "cancelled";
  paymentStatus: "paid" | "unpaid" | "refunded";
  paymentMethod: "epoint" | "cod";
  customer: { name: string; email: string; phone: string };
  shipping: {
    address: string;
    city: string;
    country: string;
    postalCode: string;
    notes?: string;
  };
}

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
  storeCode?: string | null;
  storeName?: string | null;
  source?: string;
  kotStatus?: string | null;
  sentToBar?: boolean;
  productionStatus?: string | null;
  table?: { id: string; number: number; name: string } | null;
  /** Present when source === WEB */
  web?: PosOrderWebMeta | null;
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
  productType?: "SINGLE" | "VARIABLE" | "SERVICE";
  trackStock?: boolean;
  /** Units already returned for this product on the order (product-level). */
  returnedQty?: number;
  /** quantity - returnedQty, floored at 0. */
  remainingQty?: number;
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
  /** Cash refunded via linked sales returns (auto refund payments). */
  refunded?: string;
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
  source?: string;
  kotStatus?: string | null;
  kotSentAt?: string | null;
  kotUpdatedAt?: string | null;
  sentToBar?: boolean;
  productionStatus?: ProductionStatusApi | null;
  productionSentAt?: string | null;
  productionUpdatedAt?: string | null;
  table?: { id: string; number: number; name: string } | null;
  payments: PosOrderPaymentRow[];
  items: PosOrderLineItem[];
  /** Present when source === WEB */
  web?: PosOrderWebMeta | null;
  /** Linked sales invoice when one exists for this order. */
  invoiceId?: string | null;
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
  /** Linked order refund status: Refunded / Partially Refunded / — */
  orderPaymentStatus?: string;
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
  /** Dining: optional table (requires DINING module). */
  tableId?: string | null;
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
  posOrderId: string;
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

export type ReturnablePosOrderItem = {
  productId: string;
  productName: string;
  sku: string | null;
  orderedQty: number;
  alreadyReturnedQty: number;
  remainingQty: number;
  unitPrice: string;
  lineTotal: string;
};

export type ReturnablePosOrder = {
  id: string;
  reference: string;
  date: string;
  customerId: string | null;
  customerName: string;
  grandTotal: string;
  paymentStatus: string;
  status: string;
  storeId: string | null;
  hasReturnableItems: boolean;
  items: ReturnablePosOrderItem[];
};

export type SalesReturnQuantityLimit = {
  productId: string;
  productName: string;
  sku: string | null;
  orderedQty: number;
  alreadyReturnedQty: number;
  remainingQty: number;
  unitPrice: string;
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

/** Complete sale and send to digital kitchen board (DINING). Paper KOT is printed by the client. */
export async function sendPosOrderToKot(body: CreatePosOrderBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>("/tenant/sales/pos/send-to-kot", body);
  return res.data;
}

/** Same as KOT flow, tagged BAR; client prints via billing/receipt printer. */
export async function sendPosOrderToBar(body: CreatePosOrderBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>("/tenant/sales/pos/send-to-bar", body);
  return res.data;
}

/** Complete sale + start production track. */
export async function sendPosOrderToProduction(body: CreatePosOrderBody) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>(
    "/tenant/sales/pos/send-to-production",
    body,
  );
  return res.data;
}

/** Forward-only production status update. */
export async function updatePosOrderProductionStatus(id: string, status: ProductionStatusApi) {
  const res = await apiPatch<{ success: boolean; data: PosOrderDetail }>(
    `/tenant/sales/pos-orders/${id}/production-status`,
    { status },
  );
  return res.data;
}

/** Finalize a HELD draft onto the kitchen board. */
export async function sendHeldPosOrderToKot(id: string, body?: { tableId?: string | null }) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>(
    `/tenant/sales/pos-orders/${id}/send-to-kot`,
    body ?? {},
  );
  return res.data;
}

export type PendingQrClaimStatus = "open" | "claimed" | "mine";

export interface PendingQrPosOrderRow {
  id: string;
  reference: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  table: { id: string; number: number; name: string } | null;
  itemCount: number;
  itemSummary: string;
  claimStatus: PendingQrClaimStatus;
  claimedByName: string | null;
  acceptanceExpiresAt: string | null;
}

export async function fetchPendingQrPosOrders() {
  const res = await apiGet<{ success: boolean; data: PendingQrPosOrderRow[] }>(
    "/tenant/sales/pos-orders/pending-qr",
  );
  return res.data;
}

export async function fetchPendingQrPosOrderCount() {
  const res = await apiGet<{ success: boolean; data: { count: number } }>(
    "/tenant/sales/pos-orders/pending-qr-count",
  );
  return res.data;
}

export async function acceptQrPosOrder(id: string) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>(
    `/tenant/sales/pos-orders/${id}/accept-qr`,
    {},
  );
  return res.data;
}

export async function releaseQrPosOrder(id: string) {
  const res = await apiPost<{ success: boolean; data: { id: string; status: string } }>(
    `/tenant/sales/pos-orders/${id}/release-qr`,
    {},
  );
  return res.data;
}

export async function rejectQrPosOrder(id: string) {
  const res = await apiPost<{ success: boolean; data: { id: string; status: string } }>(
    `/tenant/sales/pos-orders/${id}/reject-qr`,
    {},
  );
  return res.data;
}

export async function approveQrAndSendToKot(
  id: string,
  body: Partial<CreatePosOrderBody> = {},
) {
  const res = await apiPost<{ success: boolean; data: PosOrderDetail }>(
    `/tenant/sales/pos-orders/${id}/approve-and-send-to-kot`,
    body,
  );
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

export async function fetchReturnablePosOrders(query: {
  search?: string;
  customerId?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const params = new URLSearchParams();
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  const res = await apiGet<{
    success: boolean;
    data: {
      items: ReturnablePosOrder[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }>(`/tenant/sales/pos-orders/returnable${qs ? `?${qs}` : ""}`);
  return res.data;
}

export async function fetchSalesReturnQuantityLimits(posOrderId: string) {
  const params = new URLSearchParams({ posOrderId });
  const res = await apiGet<{ success: boolean; data: SalesReturnQuantityLimit[] }>(
    `/tenant/sales/returns/quantity-limits?${params.toString()}`,
  );
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
