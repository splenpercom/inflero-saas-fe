/**
 * Demo preview session — separate from real auth (`inflero-platform-token`).
 * Real login must call `exitDemoSession()` so the two never overlap.
 */
const TOKEN_KEY = "inflero-platform-token";
export const DEMO_SESSION_KEY = "inflero-platform-demo";

function hasAuthToken(): boolean {
  try {
    return !!sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return false;
  }
}

export function isDemoSession(): boolean {
  if (hasAuthToken()) return false;
  try {
    return sessionStorage.getItem(DEMO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function enterDemoSession(): void {
  if (hasAuthToken()) return;
  try {
    sessionStorage.setItem(DEMO_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function exitDemoSession(): void {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
