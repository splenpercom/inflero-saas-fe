import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

export type LoyaltyRate = {
  id: string;
  name: string;
  percent: string;
  active: boolean;
  assignedToAllCards: boolean;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyCustomerCard = {
  customerId: string;
  code: string;
  name: string;
  loyaltyCardBarcode: string | null;
  walletBalance: string;
  hasAssignedRate: boolean;
  assignedRatePercent: string | null;
};

export type LoyaltyLedgerEntry = {
  id: string;
  type: "EARN" | "REDEEM" | "ADJUST";
  amount: string;
  balanceAfter: string;
  posOrderId: string | null;
  note: string | null;
  createdAt: string;
  description: string;
  order: {
    id: string;
    reference: string;
    date: string;
    grandTotal: string;
    status: string;
  } | null;
};

export type LoyaltyCustomerDetail = LoyaltyCustomerCard & {
  ledger: LoyaltyLedgerEntry[];
};

type Envelope<T> = { success: boolean; message?: string; data: T };

export async function fetchLoyaltyRates(): Promise<LoyaltyRate[]> {
  const res = await apiGet<Envelope<LoyaltyRate[]>>("/tenant/loyalty/rates");
  return res.data;
}

export async function createLoyaltyRate(body: {
  name: string;
  percent: number;
  active?: boolean;
}): Promise<LoyaltyRate> {
  const res = await apiPost<Envelope<LoyaltyRate>>("/tenant/loyalty/rates", body);
  return res.data;
}

export async function updateLoyaltyRate(
  id: string,
  body: { name?: string; percent?: number; active?: boolean },
): Promise<LoyaltyRate> {
  const res = await apiPatch<Envelope<LoyaltyRate>>(`/tenant/loyalty/rates/${id}`, body);
  return res.data;
}

export async function deleteLoyaltyRate(id: string): Promise<void> {
  await apiDelete(`/tenant/loyalty/rates/${id}`);
}

export async function assignLoyaltyRateToAll(rateId: string): Promise<LoyaltyRate> {
  const res = await apiPost<Envelope<LoyaltyRate>>("/tenant/loyalty/rates/assign-all", { rateId });
  return res.data;
}

export async function clearLoyaltyAssignToAll(): Promise<void> {
  await apiPost("/tenant/loyalty/rates/clear-assign", {});
}

export async function lookupLoyaltyCard(barcode: string): Promise<LoyaltyCustomerCard> {
  const q = new URLSearchParams({ barcode });
  const res = await apiGet<Envelope<LoyaltyCustomerCard>>(
    `/tenant/loyalty/customers/lookup?${q.toString()}`,
  );
  return res.data;
}

export async function fetchCustomerLoyalty(customerId: string): Promise<LoyaltyCustomerDetail> {
  const res = await apiGet<Envelope<LoyaltyCustomerDetail>>(
    `/tenant/loyalty/customers/${customerId}`,
  );
  return res.data;
}

export async function assignLoyaltyCard(
  customerId: string,
  barcode: string,
): Promise<LoyaltyCustomerCard> {
  const res = await apiPost<Envelope<LoyaltyCustomerCard>>(
    `/tenant/loyalty/customers/${customerId}/card`,
    { barcode },
  );
  return res.data;
}

export async function unassignLoyaltyCard(customerId: string): Promise<LoyaltyCustomerCard> {
  const res = await apiDelete<Envelope<LoyaltyCustomerCard>>(
    `/tenant/loyalty/customers/${customerId}/card`,
  );
  return res.data;
}
