import { apiDelete, apiGet, apiPatch, apiPost } from "./client";

type ApiEnvelope<T> = { success: boolean; data: T };

export type TaskStatusUi = "To Do" | "In Progress" | "Review" | "Done";
export type TaskPriorityUi = "High" | "Medium" | "Low";

export interface TaskAssignee {
  id: string;
  name: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  priority: TaskPriorityUi;
  status: TaskStatusUi;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  storeId: string;
  assigneeUserId: string;
  assignee: TaskAssignee;
}

export interface TasksPagedResult {
  items: TaskRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TasksListQuery {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: TaskStatusUi | "all";
  priority?: TaskPriorityUi | "all";
  assigneeUserId?: string;
}

function tasksQueryString(query: TasksListQuery = {}): string {
  const params = new URLSearchParams();
  if (query.page != null) params.set("page", String(query.page));
  if (query.pageSize != null) params.set("pageSize", String(query.pageSize));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.status && query.status !== "all") params.set("status", query.status);
  if (query.priority && query.priority !== "all") params.set("priority", query.priority);
  if (query.assigneeUserId) params.set("assigneeUserId", query.assigneeUserId);
  const q = params.toString();
  return q ? `?${q}` : "";
}

export async function fetchTasks(query: TasksListQuery = {}): Promise<TasksPagedResult> {
  const res = await apiGet<ApiEnvelope<TasksPagedResult>>(`/tenant/tasks${tasksQueryString(query)}`);
  return res.data;
}

export async function fetchTaskAssignees(): Promise<TaskAssignee[]> {
  const res = await apiGet<ApiEnvelope<TaskAssignee[]>>("/tenant/tasks/assignees");
  return Array.isArray(res.data) ? res.data : [];
}

export async function createTask(body: {
  title: string;
  description?: string | null;
  priority?: TaskPriorityUi;
  status?: TaskStatusUi;
  assigneeUserId: string;
  dueDate?: string | null;
}): Promise<TaskRow> {
  const res = await apiPost<ApiEnvelope<TaskRow>>("/tenant/tasks", body);
  return res.data;
}

export async function updateTask(
  id: string,
  body: {
    title?: string;
    description?: string | null;
    priority?: TaskPriorityUi;
    status?: TaskStatusUi;
    assigneeUserId?: string;
    dueDate?: string | null;
  },
): Promise<TaskRow> {
  const res = await apiPatch<ApiEnvelope<TaskRow>>(`/tenant/tasks/${id}`, body);
  return res.data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete(`/tenant/tasks/${id}`);
}
