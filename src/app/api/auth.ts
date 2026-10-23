import {
  apiGet,
  apiPatch,
  apiPost,
  clearClientAuthState,
  getAccessToken,
  setAccessToken,
} from "./client";

export const TENANT_MODULE_KEYS = [
  "AUTO",
  "RESERVATIONS",
  "POS",
  "STOCK",
  "BRANCH_MANAGEMENT",
  "WEB_EDITOR",
  "DINING",
  "LOYALTY",
  "OPTICS",
  "TRAVEL",
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
      manage?: boolean;
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
    /** Store IDs allowed per feature module (BRANCH_MANAGEMENT is tenant-wide). */
    moduleStores?: Partial<Record<Exclude<TenantModuleKey, "BRANCH_MANAGEMENT">, string[]>>;
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
  // Drop stale branch/session leftovers before auth so /auth/me cannot fail
  // with a leftover X-Branch-Store-Id from a previous session.
  clearClientAuthState();
  const res = await apiPost<{
    success: boolean;
    data: { accessToken: string };
  }>("/auth/login", { email: email.trim(), password }, { skipAuth: true, skipBranch: true });
  const token = res.data?.accessToken;
  if (!token) {
    throw new Error("Login succeeded but no access token was returned");
  }
  setAccessToken(token);
}

export async function logout() {
  try {
    if (getAccessToken()) {
      await apiPost("/auth/logout", undefined, { skipBranch: true });
    }
  } finally {
    clearClientAuthState();
  }
}

export async function fetchMe() {
  // Never scope /auth/me by branch — stale branch headers break re-login.
  const res = await apiGet<MeResponse>("/auth/me", { skipBranch: true });
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
