/**
 * Resolve API base URL for browser calls.
 * In Vite DEV, always use same-origin `/api/v1` (proxied to the backend) so:
 * - LAN phones don't call phone-localhost
 * - HTTPS frontend can talk to HTTP backend without mixed-content blocks
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    return "/api/v1";
  }

  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  return (raw || "http://localhost:4000/api/v1").replace(/\/$/, "");
}
