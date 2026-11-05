/**
 * Inflero Hub API base (includes `/api`), used for public marketplace catalog + inquiries.
 * Dev: same-origin `/hub-api/api` (Vite proxy → hub) to avoid mixed-content / LAN issues.
 * Prod: `VITE_HUB_API_URL` or localhost default.
 */
export function resolveHubApiBase(): string {
  if (typeof window !== "undefined" && import.meta.env.DEV) {
    return "/hub-api/api";
  }
  const raw = (import.meta.env.VITE_HUB_API_URL as string | undefined)?.trim();
  return (raw || "http://localhost:3002/api").replace(/\/$/, "");
}
