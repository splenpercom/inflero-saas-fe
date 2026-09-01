import { isDemoSession } from "../lib/demoSession";
import { resolveDemoApiResponse } from "./demoMocks";

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;
  code?: string;
  raw?: unknown;

  constructor(statusCode: number, message: string, errors?: unknown, code?: string, raw?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    this.raw = raw;
  }
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

let accessToken: string | null = null;
let branchStoreId: string | null | undefined = undefined;
let branchTenantId: string | null = null;

const TOKEN_KEY = "inflero-platform-token";
const BRANCH_KEY = "inflero-platform-branch";

function branchStorageKey(): string {
  return branchTenantId ? `${BRANCH_KEY}:${branchTenantId}` : BRANCH_KEY;
}

function readBranchFromStorage(): string | null {
  try {
    return localStorage.getItem(branchStorageKey());
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (accessToken) return accessToken;
  try {
    accessToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    accessToken = null;
  }
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getBranchStoreId(): string | null {
  if (branchStoreId !== undefined) return branchStoreId;
  branchStoreId = readBranchFromStorage();
  return branchStoreId;
}

export function setBranchStoreId(id: string | null): void {
  branchStoreId = id;
  try {
    const key = branchStorageKey();
    if (id) localStorage.setItem(key, id);
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function setBranchTenantId(tenantId: string | null): void {
  if (branchTenantId === tenantId) return;
  branchTenantId = tenantId;
  branchStoreId = undefined;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  skipAuth?: boolean;
  skipBranch?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth, skipBranch, headers: extraHeaders, ...rest } = options;

  if (!skipAuth && isDemoSession() && !getAccessToken()) {
    if (rest.method === "GET" || !rest.method) {
      return resolveDemoApiResponse(path, "GET") as T;
    }
    throw new ApiError(403, "Demo mode — sign in to save changes.");
  }

  const headers: Record<string, string> = { ...(extraHeaders as Record<string, string>) };

  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  if (!skipBranch) {
    const branch = getBranchStoreId();
    if (branch) headers["X-Branch-Store-Id"] = branch;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const code = typeof json.code === "string" ? json.code : undefined;
    if (res.status === 402 || code === "SUBSCRIPTION_LOCKED") {
      window.dispatchEvent(new CustomEvent("inflero:subscription-locked"));
    }
    if (code === "MODULE_DISABLED") {
      window.dispatchEvent(new CustomEvent("inflero:module-disabled"));
    }
    throw new ApiError(
      res.status,
      json.message ?? `Request failed (${res.status})`,
      json.errors,
      code,
      json,
    );
  }
  return json as T;
}

export const apiGet = <T>(path: string, o?: RequestOptions) =>
  apiRequest<T>(path, { ...o, method: "GET" });
export const apiPost = <T>(path: string, body?: unknown, o?: RequestOptions) =>
  apiRequest<T>(path, { ...o, method: "POST", body });
export const apiPatch = <T>(path: string, body?: unknown, o?: RequestOptions) =>
  apiRequest<T>(path, { ...o, method: "PATCH", body });
export const apiPut = <T>(path: string, body?: unknown, o?: RequestOptions) =>
  apiRequest<T>(path, { ...o, method: "PUT", body });
export const apiDelete = <T>(path: string, o?: RequestOptions) =>
  apiRequest<T>(path, { ...o, method: "DELETE" });
