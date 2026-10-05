import { apiGet } from "./client";

export type DeletionLogTrigger = "direct" | "cascade" | "void" | string;

export interface DeletionLogRow {
  id: string;
  createdAt: string;
  entityType: string;
  entityId: string;
  label: string | null;
  deletedBy: { id: string; name: string | null; email: string | null } | null;
  actorName: string | null;
  reason: string | null;
  trigger: DeletionLogTrigger | null;
  rootEntityType: string | null;
  rootEntityId: string | null;
}

export interface DeletionLogsResult {
  items: DeletionLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  entityTypes: string[];
}

export type DeletionLogsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  entityType?: string;
  userId?: string;
  dateFrom?: string;
  dateTo?: string;
};

function deletionsQueryString(query: DeletionLogsQuery = {}): string {
  const sp = new URLSearchParams();
  if (query.page != null) sp.set("page", String(query.page));
  if (query.pageSize != null) sp.set("pageSize", String(query.pageSize));
  if (query.search?.trim()) sp.set("search", query.search.trim());
  if (query.entityType?.trim()) sp.set("entityType", query.entityType.trim());
  if (query.userId?.trim()) sp.set("userId", query.userId.trim());
  if (query.dateFrom?.trim()) sp.set("dateFrom", query.dateFrom.trim());
  if (query.dateTo?.trim()) sp.set("dateTo", query.dateTo.trim());
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchDeletionLogs(query: DeletionLogsQuery = {}): Promise<DeletionLogsResult> {
  const res = await apiGet<{ success: boolean; data: DeletionLogsResult }>(
    `/tenant/audit/deletions${deletionsQueryString(query)}`,
  );
  return res.data;
}
