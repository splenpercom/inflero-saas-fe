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
  sortBy?: string;
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
  if (q.sortBy && q.sortBy !== "all") params.set("sortBy", q.sortBy);
  if (q.source && q.source !== "all") params.set("source", q.source);
  if (q.kotStatus && q.kotStatus !== "all") params.set("kotStatus", q.kotStatus);
  if (q.productionStatus && q.productionStatus !== "all") params.set("productionStatus", q.productionStatus);
  if (q.page) params.set("page", String(q.page));
  if (q.pageSize) params.set("pageSize", String(q.pageSize));
  if (q.limit) params.set("limit", String(q.limit));
  const s = params.toString();
  return s ? `?${s}` : "";
}

/** Branch initials from store name (e.g. "Filial 1 - Demo" → "F1D") or code fallback. */
export function branchInitialsFromStore(
  name: string | null | undefined,
  code: string | null | undefined,
): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n
      .replace(/[^\w\u00C0-\u024F\s-]/gi, " ")
      .split(/[\s/_-]+/)
      .filter(Boolean);
    const init = parts
      .map((w) => (/^\d+$/.test(w) ? w : w.charAt(0)))
      .join("")
      .toUpperCase()
      .slice(0, 4);
    if (init) return init;
  }
  const c = (code ?? "").replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return c.slice(0, 4) || "BR";
}

/** Display order ID with branch initials prefix (adds prefix for legacy SL### refs). */
export function formatOrderDisplayId(
  reference: string,
  storeName?: string | null,
  storeCode?: string | null,
): string {
  if (!reference || reference === "—") return reference;
  if (/^[A-Z0-9]{1,4}-/i.test(reference)) return reference;
  const initials = branchInitialsFromStore(storeName, storeCode);
  if (!initials) return reference;
  return `${initials}-${reference}`;
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

