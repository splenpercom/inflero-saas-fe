import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

export type TravelCommissionSource = "MANUAL" | "AUTO";
export type TravelCommissionStatusUi = "pending" | "processing" | "paid" | "voided";

export interface TravelCommissionRuleRow {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  employeeName: string;
  role: string;
  ruleType: "percentage";
  baseRatePercent: number;
  monthlyTarget: number;
  targetBonus: number;
}

export interface TravelCommissionEntryRow {
  id: string;
  tenantId: string;
  storeId: string;
  userId: string;
  employeeName: string;
  role: string;
  source: TravelCommissionSource;
  offerId: string | null;
  offerDisplayCode: string | null;
  offerTitle: string | null;
  period: string | null;
  entryDate: string;
  salesAmount: number;
  commissionRate: number;
  commissionAmount: number;
  bonusAmount: number;
  totalPayout: number;
  status: TravelCommissionStatusUi;
  paidDate: string | null;
  voidedAt: string | null;
  voidReason: string | null;
  notes: string | null;
}

export async function fetchTravelCommissionRules(): Promise<TravelCommissionRuleRow[]> {
  const res = await apiGet<ApiEnvelope<TravelCommissionRuleRow[]>>(
    "/tenant/travel/commission-rules",
  );
  return res.data;
}

export async function upsertTravelCommissionRule(
  userId: string,
  body: { baseRatePercent: number | string; monthlyTarget: number | string; targetBonus: number | string },
): Promise<TravelCommissionRuleRow> {
  const res = await apiPut<ApiEnvelope<TravelCommissionRuleRow>>(
    `/tenant/travel/commission-rules/${userId}`,
    body,
  );
  return res.data;
}

export async function fetchTravelCommissions(params?: {
  from?: string;
  to?: string;
  userId?: string;
  source?: TravelCommissionSource;
  includeVoided?: boolean;
}): Promise<TravelCommissionEntryRow[]> {
  const q = new URLSearchParams();
  if (params?.from) q.set("from", params.from);
  if (params?.to) q.set("to", params.to);
  if (params?.userId) q.set("userId", params.userId);
  if (params?.source) q.set("source", params.source);
  if (params?.includeVoided) q.set("includeVoided", "1");
  const qs = q.toString();
  const res = await apiGet<ApiEnvelope<TravelCommissionEntryRow[]>>(
    `/tenant/travel/commissions${qs ? `?${qs}` : ""}`,
  );
  return res.data;
}

export async function createTravelCommission(body: {
  userId: string;
  entryDate: string;
  salesAmount: number | string;
  commissionRate: number | string;
  bonusAmount?: number | string;
  period?: string | null;
  offerDisplayCode?: string | null;
  offerTitle?: string | null;
  notes?: string | null;
  status?: "PENDING" | "PROCESSING" | "PAID";
}): Promise<TravelCommissionEntryRow> {
  const res = await apiPost<ApiEnvelope<TravelCommissionEntryRow>>(
    "/tenant/travel/commissions",
    body,
  );
  return res.data;
}

export async function patchTravelCommission(
  id: string,
  body: Record<string, unknown>,
): Promise<TravelCommissionEntryRow> {
  const res = await apiPatch<ApiEnvelope<TravelCommissionEntryRow>>(
    `/tenant/travel/commissions/${id}`,
    body,
  );
  return res.data;
}

export async function deleteTravelCommission(id: string): Promise<{ ok: boolean; voided?: boolean }> {
  const res = await apiDelete<ApiEnvelope<{ ok: boolean; voided?: boolean }>>(
    `/tenant/travel/commissions/${id}`,
  );
  return res.data;
}
