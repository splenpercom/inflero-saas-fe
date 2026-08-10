import { apiGet, apiPost } from "./client";

export type BillingStatusCode =
  | "OK"
  | "WARNING_3_DAYS"
  | "DUE_TODAY"
  | "OVERDUE"
  | "LOCKED"
  | "NO_SUBSCRIPTION";

export type BillingStatus = {
  code: BillingStatusCode;
  dueDate: string | null;
  daysLeft: number | null;
  daysOverdue: number | null;
  amount: string | null;
  locked: boolean;
  canUseSoftware: boolean;
};

export async function fetchBillingStatus() {
  const res = await apiGet<{ success: boolean; data: BillingStatus }>("/tenant/billing/status");
  return res.data;
}

export async function initiateBillingPayment(language: "az" | "en") {
  const res = await apiPost<{
    success: boolean;
    data: { orderId: string; redirectUrl: string; transactionId: string | null };
  }>("/tenant/billing/pay", { language });
  return res.data;
}

export async function syncBillingPayment(orderId: string) {
  const res = await apiGet<{
    success: boolean;
    data: { status: "success" | "failed" | "pending"; orderId: string };
  }>(`/tenant/billing/sync?order_id=${encodeURIComponent(orderId)}`);
  return res.data;
}
