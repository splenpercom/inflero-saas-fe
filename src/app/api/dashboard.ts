import { apiGet } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

export type DashboardPeriod = "1D" | "1W" | "1M" | "1Y";

export interface DashboardSummaryCounts {
  products: number;
  customers: number;
  suppliers: number;
  posOrders: number;
  purchaseDocuments: number;
  posInvoices: number;
}

export interface DashboardSummaryTotals {
  salesPaid: string;
  purchasesReceived: string;
  purchaseReturnsReceived: string;
  salesReturnsReceived: string;
  weeklySalesPaid: string;
  unpaidInvoiceTotal: string;
  approvedExpenses: string;
  profitApprox: string;
}

export interface DashboardMonthPoint {
  month: string;
  sales?: number;
  purchase?: number;
  revenue?: number;
  expense?: number;
}

export interface DashboardHeatmapPoint {
  day: string;
  hour: string;
  orders: number;
}

export interface DashboardActivityRow {
  id: string;
  kind: "POS" | "PURCHASE";
  title: string;
  subtitle: string;
  at: string;
  amount: string;
  status: string;
  paymentStatus: string;
}

export interface DashboardSummary {
  scope: { mode: "all" } | { mode: "branch"; storeId: string };
  period: DashboardPeriod;
  range: { from: string; to: string };
  counts: DashboardSummaryCounts;
  totals: DashboardSummaryTotals;
  charts: {
    salesPurchaseByMonth: DashboardMonthPoint[];
    salesAnalyticsMonthly: Array<{ month: string; sales: number }>;
    salesStatsMonthly: Array<{ month: string; revenue: number; expense: number }>;
    orderHeatmap: DashboardHeatmapPoint[];
  };
  recent: {
    posOrders: Array<{
      id: string;
      label: string;
      date: string;
      customer: string | null;
      total: string;
      status: string;
      paymentStatus: string;
    }>;
    activity: DashboardActivityRow[];
  };
  widgets: {
    topSelling: Array<{ productId: string; name: string; sku: string; quantitySold: number }>;
    lowStock: Array<{ productId: string; name: string; sku: string; quantity: number; quantityAlert: number }>;
    expiredProducts: Array<{ id: string; name: string; sku: string; manufacturedDate: string | null; expiryDate: string | null }>;
    recentlyAddedProducts: Array<{ id: string; name: string; sku: string; price: string; unit: string; createdAt: string }>;
    topCustomers: Array<{ customerId: string; name: string; country: string | null; ordersCount: number; amount: string }>;
    topCategories: Array<{ id: string; name: string; value: number }>;
    customerOrderMix: { single: number; repeat: number };
    purchasesByCountry: Array<{ country: string; total: string }>;
  };
}

const EMPTY_SUMMARY: DashboardSummary = {
  scope: { mode: "all" },
  period: "1M",
  range: { from: "", to: "" },
  counts: { products: 0, customers: 0, suppliers: 0, posOrders: 0, purchaseDocuments: 0, posInvoices: 0 },
  totals: {
    salesPaid: "0.00",
    purchasesReceived: "0.00",
    purchaseReturnsReceived: "0.00",
    salesReturnsReceived: "0.00",
    weeklySalesPaid: "0.00",
    unpaidInvoiceTotal: "0.00",
    approvedExpenses: "0.00",
    profitApprox: "0.00",
  },
  charts: {
    salesPurchaseByMonth: [],
    salesAnalyticsMonthly: [],
    salesStatsMonthly: [],
    orderHeatmap: [],
  },
  recent: { posOrders: [], activity: [] },
  widgets: {
    topSelling: [],
    lowStock: [],
    expiredProducts: [],
    recentlyAddedProducts: [],
    topCustomers: [],
    topCategories: [],
    customerOrderMix: { single: 0, repeat: 0 },
    purchasesByCountry: [],
  },
};

export async function fetchDashboardSummary(period: DashboardPeriod = "1M"): Promise<DashboardSummary> {
  const res = await apiGet<ApiEnvelope<DashboardSummary>>(
    `/tenant/dashboard/summary?period=${encodeURIComponent(period)}`,
  );
  if (!res.data) return { ...EMPTY_SUMMARY, period };
  return {
    ...EMPTY_SUMMARY,
    ...res.data,
    counts: { ...EMPTY_SUMMARY.counts, ...res.data.counts },
    totals: { ...EMPTY_SUMMARY.totals, ...res.data.totals },
    charts: { ...EMPTY_SUMMARY.charts, ...res.data.charts },
    recent: { ...EMPTY_SUMMARY.recent, ...res.data.recent },
    widgets: { ...EMPTY_SUMMARY.widgets, ...res.data.widgets },
  };
}
