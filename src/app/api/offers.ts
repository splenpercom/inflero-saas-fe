import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

export type OfferStatusUi =
  | "active"
  | "inactive"
  | "sent"
  | "expired"
  | "accepted"
  | "rejected"
  | "changing";

export interface OfferFinancialRow {
  amount: string;
  currency: string;
  rate: string;
  date: string;
}

export interface OfferPassenger {
  id: string;
  fullName: string;
  dob: string;
  passportNo: string;
  passportExpiry: string;
}

export type OfferDocSide = "bio" | "extra" | "front" | "back";

export interface OfferDocumentRow {
  id: string;
  type: string;
  side: OfferDocSide | null;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  uploadedVia: string;
  createdAt: string;
  offerId?: string | null;
  offerDisplayCode?: string | null;
  offerPublicToken?: string | null;
}

export function offerDocSideLabel(type: string, side: string | null | undefined): string {
  if (!side) return "";
  if (type === "Passport") return side === "extra" ? "Extra page" : "Bio page";
  if (type === "ID Card") return side === "back" ? "Back" : "Front";
  return side;
}

export type OfferPaymentMethod = "card" | "bank";
export type OfferPaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export interface OfferPaymentRow {
  id: string;
  method: OfferPaymentMethod;
  status: OfferPaymentStatus;
  amount: number;
  currency: string;
  orderId: string;
  epointTransactionId: string | null;
  clientNote: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferChangeRequestRow {
  id: string;
  note: string;
  rating: number | null;
  createdAt: string;
}

export interface OfferBankDetails {
  bank: string;
  accountName: string;
  iban: string;
  reference: string;
}

export interface TravelOfferRow {
  id: string;
  displayCode: string;
  publicToken: string;
  customerId: string | null;
  clientName: string;
  clientPhone: string;
  saleType: string;
  saleDate: string;
  status: OfferStatusUi;
  from: string;
  to: string;
  country: string;
  city: string;
  hotelName: string;
  numAdults: number;
  numChildren: number;
  flight: string;
  transfer: string;
  insurance: string;
  meal: string;
  supplier: string;
  agent: string;
  createdByUserId?: string | null;
  createdByName?: string | null;
  paymentDeadline: string;
  costPrice: OfferFinancialRow;
  salePrice: OfferFinancialRow;
  paidByCash: OfferFinancialRow;
  paidByTransfer: OfferFinancialRow;
  passengers: OfferPassenger[];
  expectedIncome: number;
  debt: number;
  actualIncome: number;
  clientResponseNote?: string | null;
  clientResponseRating?: number | null;
  clientRespondedAt?: string | null;
  documentsSubmittedAt?: string | null;
  documents?: OfferDocumentRow[];
  pendingBankPaymentCount?: number;
  changeRequestCount?: number;
  latestChangeNote?: string | null;
  latestChangeAt?: string | null;
  changeRequests?: OfferChangeRequestRow[];
  payments?: OfferPaymentRow[];
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

export interface OffersPagedResult {
  items: TravelOfferRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OffersListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: OfferStatusUi | "all";
  clientName?: string;
  customerId?: string;
  createdByUserId?: string;
}

export type OfferWriteBody = {
  clientName: string;
  clientPhone?: string | null;
  customerId?: string | null;
  saleType: string;
  saleDate?: string | null;
  status?: OfferStatusUi;
  from?: string | null;
  to?: string | null;
  country?: string | null;
  city?: string | null;
  hotelName?: string | null;
  numAdults?: number;
  numChildren?: number;
  flight?: string | null;
  transfer?: string | null;
  insurance?: string | null;
  meal?: string | null;
  supplier?: string | null;
  agent?: string | null;
  paymentDeadline?: string | null;
  costPrice: OfferFinancialRow;
  salePrice: OfferFinancialRow;
  paidByCash: OfferFinancialRow;
  paidByTransfer: OfferFinancialRow;
  passengers: OfferPassenger[];
  expectedIncome?: number;
  debt?: number;
  actualIncome?: number;
};

const publicOpts = { skipAuth: true as const, skipBranch: true as const };

function offersQueryString(query: OffersListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.clientName?.trim()) params.set("clientName", query.clientName.trim());
  if (query.customerId?.trim()) params.set("customerId", query.customerId.trim());
  if (query.createdByUserId?.trim()) params.set("createdByUserId", query.createdByUserId.trim());
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function fetchOffers(query: OffersListQuery = {}): Promise<OffersPagedResult> {
  const res = await apiGet<ApiEnvelope<OffersPagedResult>>(
    `/tenant/travel/offers${offersQueryString(query)}`,
  );
  return res.data;
}

export type OfferCalendarEventType =
  | "departure"
  | "return"
  | "hotel_checkin"
  | "hotel_checkout"
  | "invoice_due"
  | "passport_expiry"
  | "visa_expiry"
  | "insurance_expiry"
  | "booking";

export interface OfferCalendarEvent {
  id: string;
  type: OfferCalendarEventType;
  date: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientStatus: "vip" | "active" | "inactive";
  title: string;
  detail: string;
  amount?: number;
  destination?: string;
  urgent?: boolean;
  offerId: string;
  displayCode: string;
  publicToken: string;
  customerId: string | null;
}

export async function fetchOfferCalendar(query: {
  from: string;
  to: string;
}): Promise<OfferCalendarEvent[]> {
  const params = new URLSearchParams();
  params.set("from", query.from);
  params.set("to", query.to);
  const res = await apiGet<ApiEnvelope<{ events: OfferCalendarEvent[] }>>(
    `/tenant/travel/offers/calendar?${params.toString()}`,
  );
  return Array.isArray(res.data?.events) ? res.data.events : [];
}

export interface OfferInvoicePayment {
  id: string;
  amount: number;
  method: string;
  date: string;
  notes: string;
  status: OfferPaymentStatus;
}

export interface OfferInvoice {
  id: string;
  offerId: string;
  publicToken: string;
  customerId: string | null;
  clientName: string;
  clientPhone: string;
  offerTitle: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: "paid" | "partial" | "unpaid";
  payments: OfferInvoicePayment[];
  createdAt: string;
  month: string;
  offerStatus: OfferStatusUi | string;
  saleDate: string;
}

export async function fetchOfferInvoices(query?: {
  month?: string;
}): Promise<OfferInvoice[]> {
  const params = new URLSearchParams();
  if (query?.month?.trim()) params.set("month", query.month.trim());
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await apiGet<ApiEnvelope<{ items: OfferInvoice[] }>>(
    `/tenant/travel/offers/invoices${suffix}`,
  );
  return Array.isArray(res.data?.items) ? res.data.items : [];
}

export async function recordOfferStaffPayment(
  offerId: string,
  body: {
    amount: number;
    method: "cash" | "card" | "bank" | "online";
    date?: string;
    notes?: string | null;
  },
): Promise<OfferPaymentRow> {
  const res = await apiPost<ApiEnvelope<OfferPaymentRow>>(
    `/tenant/travel/offers/${encodeURIComponent(offerId)}/payments`,
    body,
  );
  return res.data;
}

export async function fetchOfferClientNames(q?: string): Promise<string[]> {
  const params = new URLSearchParams();
  if (q?.trim()) params.set("q", q.trim());
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await apiGet<ApiEnvelope<string[]>>(`/tenant/travel/offers/client-names${suffix}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchOffer(id: string): Promise<TravelOfferRow> {
  const res = await apiGet<ApiEnvelope<TravelOfferRow>>(`/tenant/travel/offers/${id}`);
  return res.data;
}

export async function createOffer(body: OfferWriteBody): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>("/tenant/travel/offers", body);
  return res.data;
}

export async function updateOffer(id: string, body: Partial<OfferWriteBody>): Promise<TravelOfferRow> {
  const res = await apiPatch<ApiEnvelope<TravelOfferRow>>(`/tenant/travel/offers/${id}`, body);
  return res.data;
}

export async function deleteOffer(id: string): Promise<void> {
  await apiDelete(`/tenant/travel/offers/${id}`);
}

export async function publishOffer(id: string): Promise<{
  id: string;
  displayCode: string;
  publicToken: string;
  publicPath: string;
  status: OfferStatusUi;
}> {
  const res = await apiPost<
    ApiEnvelope<{
      id: string;
      displayCode: string;
      publicToken: string;
      publicPath: string;
      status: OfferStatusUi;
    }>
  >(`/tenant/travel/offers/${id}/publish`);
  return res.data;
}

/** Staff resolves an open change request → status becomes sent (public unlock). */
export async function resolveOfferChanges(id: string): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>(
    `/tenant/travel/offers/${encodeURIComponent(id)}/resolve-changes`,
    {},
  );
  return res.data;
}

export async function fetchOfferDocuments(query: {
  customerId?: string;
  offerId?: string;
}): Promise<OfferDocumentRow[]> {
  const params = new URLSearchParams();
  if (query.customerId) params.set("customerId", query.customerId);
  if (query.offerId) params.set("offerId", query.offerId);
  const suffix = params.toString() ? `?${params.toString()}` : "";
  const res = await apiGet<ApiEnvelope<OfferDocumentRow[]>>(
    `/tenant/travel/offer-documents${suffix}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function deleteOfferDocument(id: string): Promise<void> {
  await apiDelete(`/tenant/travel/offer-documents/${id}`);
}

/** Unauthenticated public offer by opaque token. */
export async function fetchPublicOffer(publicToken: string): Promise<TravelOfferRow> {
  const res = await apiGet<ApiEnvelope<TravelOfferRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}`,
    publicOpts,
  );
  return res.data;
}

export async function publicAcceptOffer(publicToken: string): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/accept`,
    {},
    publicOpts,
  );
  return res.data;
}

export async function publicDeclineOffer(
  publicToken: string,
  body?: { note?: string | null },
): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/decline`,
    body ?? {},
    publicOpts,
  );
  return res.data;
}

export async function publicRequestOfferChanges(
  publicToken: string,
  body: { note: string; rating?: number | null },
): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/request-changes`,
    body,
    publicOpts,
  );
  return res.data;
}

export async function fetchPublicOfferDocuments(
  publicToken: string,
): Promise<OfferDocumentRow[]> {
  const res = await apiGet<ApiEnvelope<OfferDocumentRow[]>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/documents`,
    publicOpts,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function uploadPublicOfferDocument(
  publicToken: string,
  file: File,
  type: string,
  side?: OfferDocSide | null,
): Promise<OfferDocumentRow> {
  const form = new FormData();
  form.append("file", file);
  form.append("type", type);
  if (side) form.append("side", side);
  const res = await apiPost<ApiEnvelope<OfferDocumentRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/documents`,
    form,
    publicOpts,
  );
  return res.data;
}

export async function deletePublicOfferDocument(
  publicToken: string,
  docId: string,
): Promise<void> {
  await apiDelete(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/documents/${encodeURIComponent(docId)}`,
    publicOpts,
  );
}

/** Client acknowledges documents are ready for staff review. */
export async function publicSubmitOfferDocuments(
  publicToken: string,
): Promise<TravelOfferRow> {
  const res = await apiPost<ApiEnvelope<TravelOfferRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/documents/submit`,
    {},
    publicOpts,
  );
  return res.data;
}

export async function publicInitiateEpointPayment(
  publicToken: string,
  language: "az" | "en" = "az",
): Promise<{
  paymentId: string;
  orderId: string;
  amount: number;
  redirectUrl: string;
  transactionId: string | null;
}> {
  const res = await apiPost<
    ApiEnvelope<{
      paymentId: string;
      orderId: string;
      amount: number;
      redirectUrl: string;
      transactionId: string | null;
    }>
  >(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/payments/epoint`,
    { language },
    publicOpts,
  );
  return res.data;
}

export async function publicInitiateBankPayment(
  publicToken: string,
  note?: string | null,
): Promise<{ payment: OfferPaymentRow; bank: OfferBankDetails }> {
  const res = await apiPost<
    ApiEnvelope<{ payment: OfferPaymentRow; bank: OfferBankDetails }>
  >(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/payments/bank`,
    { note: note ?? null },
    publicOpts,
  );
  return res.data;
}

export async function publicGetPayment(
  publicToken: string,
  paymentId: string,
): Promise<OfferPaymentRow> {
  const res = await apiGet<ApiEnvelope<OfferPaymentRow>>(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/payments/${encodeURIComponent(paymentId)}`,
    publicOpts,
  );
  return res.data;
}

export async function publicReconcilePayment(
  publicToken: string,
  orderId: string,
): Promise<{ status: OfferPaymentStatus | "pending"; payment: OfferPaymentRow }> {
  const q = new URLSearchParams({ order_id: orderId });
  const res = await apiGet<
    ApiEnvelope<{ status: OfferPaymentStatus | "pending"; payment: OfferPaymentRow }>
  >(
    `/public/travel/offers/${encodeURIComponent(publicToken)}/payments/reconcile?${q}`,
    publicOpts,
  );
  return res.data;
}

export async function fetchOfferPayments(offerId: string): Promise<OfferPaymentRow[]> {
  const res = await apiGet<ApiEnvelope<OfferPaymentRow[]>>(
    `/tenant/travel/offers/${offerId}/payments`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function confirmOfferBankPayment(
  offerId: string,
  paymentId: string,
): Promise<OfferPaymentRow> {
  const res = await apiPost<ApiEnvelope<OfferPaymentRow>>(
    `/tenant/travel/offers/${offerId}/payments/${paymentId}/confirm`,
    {},
  );
  return res.data;
}

export async function rejectOfferBankPayment(
  offerId: string,
  paymentId: string,
): Promise<OfferPaymentRow> {
  const res = await apiPost<ApiEnvelope<OfferPaymentRow>>(
    `/tenant/travel/offers/${offerId}/payments/${paymentId}/reject`,
    {},
  );
  return res.data;
}
