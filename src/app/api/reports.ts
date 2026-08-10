import { apiGet } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

function reportQueryString(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// --- Sales ---

export interface SalesReportItem {
  productId: string;
  sku: string;
  productName: string;
  brand: string;
  category: string;
  soldQty: number;
  soldAmount: string;
  instockQty: number;
}

export interface SalesReportResult {
  dateFrom: string;
  dateTo: string;
  totals: {
    totalPaid: string;
    totalDue: string;
    totalUnpaid: string;
    purchase: string;
  };
  items: SalesReportItem[];
}

export type SalesReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  categoryId?: string;
  brandId?: string;
  limit?: number;
};

export async function fetchSalesReport(query: SalesReportQuery = {}): Promise<SalesReportResult> {
  const res = await apiGet<ApiEnvelope<SalesReportResult>>(
    `/tenant/sales/reports/sales-report${reportQueryString(query)}`,
  );
  return res.data ?? { dateFrom: "", dateTo: "", totals: { totalPaid: "0", totalDue: "0", totalUnpaid: "0", purchase: "0" }, items: [] };
}

export interface BillerReportCategoryItem {
  category: string;
  soldQty: number;
  soldAmount: number;
}

export interface BillerReportItem {
  billerId: string | null;
  billerCode: string;
  billerName: string;
  orderCount: number;
  totalRevenue: number;
  paidAmount: number;
  dueAmount: number;
  unpaidAmount: number;
  commissionAmount?: number;
  itemsSold: number;
  avgOrderValue: number;
  uniqueProducts: number;
  categories: BillerReportCategoryItem[];
}

export interface BillerReportResult {
  dateFrom: string;
  dateTo: string;
  totals: {
    totalOrders: number;
    totalRevenue: number;
    totalItemsSold: number;
    activeBillers: number;
  };
  items: BillerReportItem[];
}

export type BillerReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  billerId?: string;
  limit?: number;
};

export async function fetchBillerReport(query: BillerReportQuery = {}): Promise<BillerReportResult> {
  const res = await apiGet<ApiEnvelope<BillerReportResult>>(
    `/tenant/sales/reports/biller-report${reportQueryString(query)}`,
  );
  return res.data ?? {
    dateFrom: "",
    dateTo: "",
    totals: { totalOrders: 0, totalRevenue: 0, totalItemsSold: 0, activeBillers: 0 },
    items: [],
  };
}

// --- Finance ---

export interface ProfitLossItem {
  monthStart: string;
  month: string;
  sales: number;
  service: number;
  purchaseReturn: number;
  grossProfit: number;
  salesExpense: number;
  purchase: number;
  salesReturn: number;
  totalExpense: number;
  netProfit: number;
}

export interface ProfitLossResult {
  dateFrom: string;
  dateTo: string;
  items: ProfitLossItem[];
}

export async function fetchProfitLoss(query: { dateFrom: string; dateTo: string }): Promise<ProfitLossResult> {
  const res = await apiGet<ApiEnvelope<ProfitLossResult>>(
    `/tenant/finance/reports/profit-loss${reportQueryString(query)}`,
  );
  return res.data ?? { dateFrom: query.dateFrom, dateTo: query.dateTo, items: [] };
}

export interface ExpenseReportItem {
  id: string;
  expenseName: string;
  category: string;
  description: string;
  date: string;
  amount: number;
  status: string;
}

export interface ExpenseReportResult {
  dateFrom: string;
  dateTo: string;
  items: ExpenseReportItem[];
}

export async function fetchExpenseReport(query: {
  dateFrom: string;
  dateTo: string;
  search?: string;
  status?: string;
  limit?: number;
}): Promise<ExpenseReportResult> {
  const res = await apiGet<ApiEnvelope<ExpenseReportResult>>(
    `/tenant/finance/reports/expense${reportQueryString({ ...query, limit: query.limit ?? 500 })}`,
  );
  return res.data ?? { dateFrom: query.dateFrom, dateTo: query.dateTo, items: [] };
}

export interface AnnualReportRow {
  key: string;
  label: string;
  amounts: number[];
}

export interface AnnualReportResult {
  year: number;
  monthLabels: string[];
  rows: AnnualReportRow[];
}

export async function fetchAnnualReport(query: { year: number }): Promise<AnnualReportResult> {
  const res = await apiGet<ApiEnvelope<AnnualReportResult>>(
    `/tenant/finance/reports/annual${reportQueryString({ year: query.year })}`,
  );
  return res.data ?? { year: query.year, monthLabels: [], rows: [] };
}

// --- Stock ---

export interface ProductReportItem {
  productId: string;
  sku: string;
  productName: string;
  category: string;
  brand: string;
  qty: number;
  price: number;
  totalOrdered: number;
  revenue: number;
}

export interface ProductReportResult {
  dateFrom?: string;
  dateTo?: string;
  items: ProductReportItem[];
}

export type ProductReportQuery = {
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  categoryId?: string;
  brandId?: string;
  limit?: number;
};

export async function fetchProductReport(query: ProductReportQuery = {}): Promise<ProductReportResult> {
  const res = await apiGet<ApiEnvelope<ProductReportResult>>(
    `/tenant/stock/reports/products${reportQueryString({ ...query, limit: query.limit ?? 200 })}`,
  );
  return res.data ?? { items: [] };
}

export interface ProductQuantityAlertItem {
  productId: string;
  sku: string;
  productName: string;
  totalQuantity: number;
  alertQuantity: number;
}

export async function fetchProductQuantityAlert(query: ProductReportQuery = {}): Promise<ProductQuantityAlertItem[]> {
  const res = await apiGet<ApiEnvelope<{ items: ProductQuantityAlertItem[] }>>(
    `/tenant/stock/reports/product-quantity-alert${reportQueryString({ ...query, limit: query.limit ?? 500 })}`,
  );
  return res.data?.items ?? [];
}
