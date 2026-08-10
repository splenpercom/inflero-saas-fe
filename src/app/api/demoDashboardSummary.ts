import type { DashboardPeriod, DashboardSummary } from "./dashboard";
import {
  getCustomerSummary,
  getExpiredProducts,
  getGeneralInfo,
  getLowStockProducts,
  getRecentTransactionsWidget,
  getSalesAnalytics,
  getSalesByCountry,
  getSalesPurchaseData,
  getSalesStatsData,
  getStatCards,
  getTopSellingProducts,
  mockClients,
  mockProducts,
  mockSuppliers,
} from "../utils/dashboardData";

const HEAT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HEAT_HOURS = ["6 Am", "8 Am", "10 Am", "12 Pm", "2 Pm", "4 Pm", "6 Pm"];

function heatmapDemo(): DashboardSummary["charts"]["orderHeatmap"] {
  const grid = [1, 2, 3, 2, 4, 3, 2, 1, 3, 4, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2, 3, 4, 3, 2, 1, 2];
  const out: DashboardSummary["charts"]["orderHeatmap"] = [];
  let i = 0;
  for (const day of HEAT_DAYS) {
    for (const hour of HEAT_HOURS) {
      out.push({ day, hour, orders: grid[i++] ?? 0 });
    }
  }
  return out;
}

export function buildDemoDashboardSummary(period: DashboardPeriod = "1M"): DashboardSummary {
  const general = getGeneralInfo();
  const statCards = getStatCards();
  const salesPurchase = getSalesPurchaseData();
  const salesAnalytics = getSalesAnalytics();
  const salesStats = getSalesStatsData();
  const customerMix = getCustomerSummary();
  const topSelling = getTopSellingProducts();
  const lowStock = getLowStockProducts();
  const expired = getExpiredProducts();
  const activity = getRecentTransactionsWidget();
  const countryData = getSalesByCountry();

  const now = new Date();
  const from = new Date(now);
  if (period === "1D") from.setHours(0, 0, 0, 0);
  else if (period === "1W") from.setDate(from.getDate() - 6);
  else if (period === "1Y") from.setFullYear(from.getFullYear() - 1);
  else from.setDate(from.getDate() - 29);

  return {
    scope: { mode: "all" },
    period,
    range: { from: from.toISOString(), to: now.toISOString() },
    counts: {
      products: mockProducts.length,
      customers: general.customers,
      suppliers: general.suppliers,
      posOrders: general.orders,
      purchaseDocuments: mockSuppliers.length + 2,
      posInvoices: general.orders,
    },
    totals: {
      salesPaid: "15200.00",
      purchasesReceived: "8400.00",
      purchaseReturnsReceived: "320.00",
      salesReturnsReceived: "180.00",
      weeklySalesPaid: "4200.00",
      unpaidInvoiceTotal: String(statCards[1]?.amount ?? 4385),
      approvedExpenses: String(statCards[3]?.amount ?? 40000),
      profitApprox: String(statCards[2]?.amount ?? 8360),
    },
    charts: {
      salesPurchaseByMonth: salesPurchase.map((r) => ({
        month: r.month,
        sales: r.sales,
        purchase: r.purchase,
      })),
      salesAnalyticsMonthly: salesAnalytics.map((r) => ({ month: r.month, sales: r.sales })),
      salesStatsMonthly: salesStats.data.map((r) => ({
        month: r.month,
        revenue: r.revenue,
        expense: r.expense,
      })),
      orderHeatmap: heatmapDemo(),
    },
    recent: {
      posOrders: activity.slice(0, 6).map((a, idx) => ({
        id: `pos-demo-${idx}`,
        label: a.customerId,
        date: now.toISOString(),
        customer: a.customer,
        total: String(a.amount),
        status: a.status === "Completed" ? "COMPLETED" : "PENDING",
        paymentStatus: a.status === "Completed" ? "PAID" : "UNPAID",
      })),
      activity: activity.slice(0, 12).map((a, idx) => ({
        id: `act-${idx}`,
        kind: a.type === "Quotation" ? ("PURCHASE" as const) : ("POS" as const),
        title: a.customer,
        subtitle: a.customerId,
        at: now.toISOString(),
        amount: String(a.amount),
        status: a.status === "Completed" ? "COMPLETED" : "PENDING",
        paymentStatus: a.status === "Completed" ? "PAID" : "UNPAID",
      })),
    },
    widgets: {
      topSelling: topSelling.slice(0, 5).map((p, i) => ({
        productId: String(i + 1),
        name: p.name,
        sku: p.id,
        quantitySold: p.sales,
      })),
      lowStock: lowStock.slice(0, 5).map((p, i) => {
        const qty = Number.parseInt(String(p.stock).replace(/\D/g, ""), 10) || 0;
        return {
          productId: String(i + 1),
          name: p.name,
          sku: p.id,
          quantity: qty,
          quantityAlert: Math.max(qty + 5, 10),
        };
      }),
      expiredProducts: expired.slice(0, 5).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        manufacturedDate: null,
        expiryDate: p.expiryDate,
      })),
      recentlyAddedProducts: mockProducts.slice(0, 4).map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        price: p.price.toFixed(2),
        unit: p.unit,
        createdAt: now.toISOString(),
      })),
      topCustomers: mockClients.slice(0, 5).map((c) => ({
        customerId: String(c.id),
        name: c.companyName,
        country: "AZ",
        ordersCount: c.totalOrders,
        amount: c.totalSpent.replace(/[^\d.]/g, "") || "0.00",
      })),
      topCategories: [
        { id: "1", name: "Oil Change", value: 38 },
        { id: "2", name: "Brake Service", value: 22 },
        { id: "3", name: "Diagnostics", value: 18 },
        { id: "4", name: "Full Service", value: 14 },
        { id: "5", name: "Other", value: 8 },
      ],
      customerOrderMix: {
        single: customerMix.firstTime,
        repeat: customerMix.returning,
      },
      purchasesByCountry: countryData.countries.map((c) => ({
        country: c.name,
        total: String(c.sales),
      })),
    },
  };
}
