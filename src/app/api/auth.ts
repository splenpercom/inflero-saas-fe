import { apiGet, apiPatch, apiPost, getAccessToken, setAccessToken } from "./client";

export const TENANT_MODULE_KEYS = [
  "AUTO",
  "RESERVATIONS",
  "POS",
  "STOCK",
  "BRANCH_MANAGEMENT",
  "WEB_EDITOR",
] as const;

export type TenantModuleKey = (typeof TENANT_MODULE_KEYS)[number];
export type TenantModuleMap = Record<TenantModuleKey, boolean>;

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  status: string;
  createdAt: string;
  isTenantOwner: boolean;
  storeId: string | null;
  store: { id: string; name: string; code: string } | null;
  branchesAsManager: { id: string; name: string; code: string }[];
  role: {
    id: string;
    name: string;
    permissions: {
      module: string;
      view: boolean;
      create: boolean;
      edit: boolean;
      delete: boolean;
    }[];
  } | null;
  tenant: {
    id: string;
    name: string;
    slug: string | null;
    address: string | null;
    companyEmail: string;
    phone: string | null;
    status: string;
    companyLogoUrl: string | null;
    companyDarkLogoUrl: string | null;
    modules: TenantModuleMap;
    modulesVersion: number;
    subscription: {
      cycle: "monthly" | "annual";
      expiringOn: string;
      daysLeft: number;
      monthsLeft: number;
      label: string;
      shortLabel: string;
      amount?: string | null;
    } | null;
    plan: {
      id: string | null;
      name: string;
      nameAz?: string | null;
      packageType?: string;
      price?: string;
      currency?: string;
      maxBranches?: number | null;
      billingCycle: string | null;
      subscriptionStatus?: string | null;
    } | null;
    billing?: {
      code:
        | "OK"
        | "WARNING_3_DAYS"
        | "DUE_TODAY"
        | "OVERDUE"
        | "LOCKED"
        | "NO_SUBSCRIPTION";
      dueDate: string | null;
      daysLeft: number | null;
      daysOverdue: number | null;
      amount: string | null;
      locked: boolean;
      canUseSoftware: boolean;
    };
  };
}

export interface MeResponse {
  success: boolean;
  data:
    | { actorType: "USER"; user: PlatformUser }
    | { actorType: "SUPERADMIN"; admin: { id: string; email: string; name: string } };
}

export interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  address?: string | null;
}

export async function login(email: string, password: string) {
  const res = await apiPost<{
    success: boolean;
    data: { accessToken: string };
  }>("/auth/login", { email: email.trim(), password }, { skipAuth: true });
  setAccessToken(res.data.accessToken);
}

export async function logout() {
  try {
    if (getAccessToken()) {
      await apiPost("/auth/logout");
    }
  } finally {
    setAccessToken(null);
  }
}

export async function fetchMe() {
  const res = await apiGet<MeResponse>("/auth/me");
  return res.data;
}

export async function updateProfile(body: UpdateProfileBody) {
  return apiPatch<{ success: boolean; message: string }>("/auth/profile", body);
}

export async function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiPost<{ success: boolean; message: string }>("/auth/profile/password", body);
}

export async function requestEmailChange(newEmail: string) {
  return apiPost<{ success: boolean; message?: string }>("/auth/email-change/request", {
    newEmail,
  });
}

export async function verifyEmailChange(newEmail: string, otp: string) {
  return apiPost<{ success: boolean; message?: string }>("/auth/email-change/verify", {
    newEmail,
    otp,
  });
}

export async function forgotPassword(email: string) {
  return apiPost("/auth/forgot-password", { email, actorType: "USER" }, { skipAuth: true });
}

export async function submitOnboarding(body: Record<string, unknown>) {
  return apiPost("/auth/onboarding/corporate", body, { skipAuth: true });
}

export async function fetchOnboardingPackages() {
  const res = await apiGet<{ success: boolean; data: unknown[] }>(
    "/public/onboarding-packages?softwareType=CORPORATE",
    { skipAuth: true },
  );
  return res.data;
}
