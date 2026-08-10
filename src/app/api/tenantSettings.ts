import { apiGet, apiPatch, apiPost, apiDelete } from "./client";

export interface SocialLinks {
  instagram?: string | null;
  facebook?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  tiktok?: string | null;
}

export interface TenantSettingsRecord {
  id: string;
  tenantId: string;
  companyName: string | null;
  companyEmail: string | null;
  phone: string | null;
  fax: string | null;
  website: string | null;
  address: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  postalCode: string | null;
  currency: string;
  currencySymbol: string;
  currencyPosition: string;
  decimalSeparator: string;
  thousandSeparator: string;
  companyIcon: string | null;
  favicon: string | null;
  companyLogo: string | null;
  companyDarkLogo: string | null;
  socialLinks: SocialLinks | null;
  latitude: number | null;
  longitude: number | null;
  employeeCommissionEnabled?: boolean;
  posServiceFeeEnabled?: boolean;
}

export type TenantSettingsUpdate = Partial<{
  companyName: string | null;
  companyEmail: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  companyLogo: string | null;
  socialLinks: SocialLinks | null;
  latitude: number | null;
  longitude: number | null;
  employeeCommissionEnabled: boolean;
  posServiceFeeEnabled: boolean;
}>;

export async function fetchTenantSettings() {
  const res = await apiGet<{ success: boolean; data: TenantSettingsRecord }>("/tenant/settings");
  return res.data;
}

export async function updateTenantSettings(body: TenantSettingsUpdate) {
  return apiPatch<{ success: boolean; message: string }>("/tenant/settings", body);
}

export async function uploadTenantSettingsAsset(
  kind: "companyLogo" | "companyDarkLogo" | "companyIcon" | "favicon",
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  const res = await apiPost<{ success: boolean; data: { url: string } }>(
    `/tenant/settings/assets?kind=${kind}`,
    form,
  );
  return res.data.url;
}

export async function deleteTenantSettingsAsset(
  kind: "companyLogo" | "companyDarkLogo" | "companyIcon" | "favicon",
) {
  return apiDelete<{ success: boolean; message: string }>(`/tenant/settings/assets?kind=${kind}`);
}
