import type { Language } from "../i18n/translations";
import { formatDate } from "./dateFormat";

export type UiStatus = "active" | "inactive";

export function statusToApi(status: UiStatus): "ACTIVE" | "INACTIVE" {
  return status === "active" ? "ACTIVE" : "INACTIVE";
}

export function formatInventoryDate(iso: string, language?: Language): string {
  return formatDate(iso, language);
}

export function parsePrice(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}
