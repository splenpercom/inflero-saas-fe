import { apiGet } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

export type TravelReportPeriod = "3m" | "6m" | "12m" | "ytd";

export type TravelReportInvoiceStatusKey = "paid" | "partial" | "unpaid";
export type TravelReportPaymentMethodKey = "cash" | "bank" | "card" | "online" | "other";

export interface TravelReportsOverview {
  period: TravelReportPeriod;
  from: string;
  to: string;
  kpis: {
    invoiced: number;
    collected: number;
    outstanding: number;
    overdue: number;
    overdueCount: number;
    pipeline: number;
    clients: number;
    vipClients: number;
    deals: number;
    avgDeal: number;
    collectionRate: number;
    outstandingInvoiceCount: number;
    deltas?: {
      invoiced?: number;
      collected?: number;
      outstanding?: number;
      pipeline?: number;
      clients?: number;
      deals?: number;
      avgDeal?: number;
    };
  };
  monthly: {
    month: string;
    monthKey: string;
    invoiced: number;
    collected: number;
    deals: number;
    clients: number;
  }[];
  invoiceStatus: { key: TravelReportInvoiceStatusKey; count: number; amount: number }[];
  pipeline: { status: string; count: number; value: number }[];
  paymentMethods: { key: TravelReportPaymentMethodKey; amount: number; pct: number }[];
  topClients: {
    id: string;
    name: string;
    status: "vip" | "active" | "inactive";
    trips: number;
    totalInvoiced: number;
    totalPaid: number;
  }[];
  topDestinations: {
    label: string;
    deals: number;
    revenue: number;
    clients: number;
    avgDeal: number;
  }[];
  employees: {
    userId: string;
    name: string;
    role: string;
    deals: number;
    revenue: number;
    commission: number;
    target: number | null;
    pct: number | null;
  }[];
  outstandingDebts: {
    offerId: string;
    displayCode: string;
    clientName: string;
    clientPhone: string;
    offerTitle: string;
    amount: number;
    paid: number;
    due: string | null;
    overdue: boolean;
  }[];
}

export async function fetchTravelReportsOverview(
  period: TravelReportPeriod = "ytd",
): Promise<TravelReportsOverview> {
  const q = new URLSearchParams({ period });
  const res = await apiGet<ApiEnvelope<TravelReportsOverview>>(
    `/tenant/travel/reports/overview?${q.toString()}`,
  );
  return res.data;
}
