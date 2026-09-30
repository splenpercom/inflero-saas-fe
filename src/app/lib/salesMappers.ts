import { formatInventoryDate } from "./inventoryMappers";
import { formatDateTime } from "./dateFormat";
import type { Language } from "../i18n/translations";

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

export function formatSalesDate(iso: string, language?: Language): string {
  return formatInventoryDate(iso, language);
}

/** Exact local date + time for POS order timestamps. */
export function formatSalesDateTime(iso: string, language?: Language): string {
  return formatDateTime(iso, language);
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
  if (s === "held" || s === "draft") return "HELD";
  return "COMPLETED";
}

export function isDraftOrderStatus(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase();
  return s === "held" || s === "draft";
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
  /** cash | card | all */
  paymentMethod?: string;
  sortBy?: string;
  /** ISO datetime — custom range start (with sortBy=custom). */
  dateFrom?: string;
  /** ISO datetime — custom range end (with sortBy=custom). */
  dateTo?: string;
  page?: number;
  pageSize?: number;
  limit?: number;
  source?: string;
  kotStatus?: string;
  productionStatus?: string;
};

export function salesListQueryString(q: SalesListQuery = {}): string {
  const params = new URLSearchParams();
  if (q.search?.trim()) params.set("search", q.search.trim());
  if (q.customerId) params.set("customerId", q.customerId);
  if (q.status && q.status !== "all") params.set("status", q.status);
  if (q.paymentStatus && q.paymentStatus !== "all") params.set("paymentStatus", q.paymentStatus);
  if (q.paymentMethod && q.paymentMethod !== "all") params.set("paymentMethod", q.paymentMethod);
  if (q.sortBy && q.sortBy !== "all") params.set("sortBy", q.sortBy);
  if (q.dateFrom) params.set("dateFrom", q.dateFrom);
  if (q.dateTo) params.set("dateTo", q.dateTo);
  if (q.source && q.source !== "all") params.set("source", q.source);
  if (q.kotStatus && q.kotStatus !== "all") params.set("kotStatus", q.kotStatus);
  if (q.productionStatus && q.productionStatus !== "all") params.set("productionStatus", q.productionStatus);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** First 2 Latin letters from a name (e.g. "Inflero" → "IN"). */
export function orderIdLettersFromName(
  name: string | null | undefined,
  fallback?: string | null,
): string {
  const letters = (s: string | null | undefined) =>
    (s ?? "").replace(/[^A-Za-z]/g, "").toUpperCase();
  let out = letters(name).slice(0, 2);
  if (out.length < 2) {
    out = (out + letters(fallback) + "OR").slice(0, 2);
  }
  return out;
}

/** @deprecated Prefer orderIdLettersFromName — kept for older call sites. */
export function branchInitialsFromStore(
  name: string | null | undefined,
  code: string | null | undefined,
): string {
  return orderIdLettersFromName(name, code);
}

/**
 * Short display order ID: 2 letters + 4 digits (IN0001).
 * Compacts legacy refs like F1D-SL048 / SL048 when possible.
 */
export function formatOrderDisplayId(
  reference: string,
  storeName?: string | null,
  storeCode?: string | null,
  tenantName?: string | null,
): string {
  if (!reference || reference === "—") return reference;
  const ref = reference.trim();
  if (/^[A-Za-z]{2}\d{4,}$/.test(ref)) return ref.toUpperCase();

  const numMatch = ref.match(/(?:SL)?(\d+)$/i);
  if (numMatch) {
    const prefix =
      orderIdLettersFromName(tenantName, storeName) ||
      orderIdLettersFromName(storeName, storeCode) ||
      "OR";
    return `${prefix}${numMatch[1].padStart(4, "0")}`;
  }
  return ref;
}

/** Human source tag: POS counter, web store, or QR menu (dining). */
export function orderSourceTag(
  source: string | null | undefined,
  _hasTable?: boolean,
): "POS" | "QR Menu" | "Web" {
  if (source === "WEB") return "Web";
  if (source === "QR_MENU") return "QR Menu";
  return "POS";
}

