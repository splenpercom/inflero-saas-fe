import { formatInventoryDate } from "./inventoryMappers";

export type ExpenseStatusApi = "PENDING" | "APPROVED" | "REJECTED";
export type BankAccountStatusApi = "ACTIVE" | "INACTIVE" | "CLOSED" | "SUSPENDED";
export type BankAccountTypeApi =
  | "SAVINGS"
  | "CURRENT"
  | "SALARY"
  | "BUSINESS"
  | "INVESTMENT";

export function parseFinanceMoney(value: string | number | null | undefined): number {
  if (value == null || value === "") return 0;
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export function formatFinanceDate(iso: string): string {
  return formatInventoryDate(iso);
}

export function mapExpenseStatusToApi(status: string): ExpenseStatusApi | undefined {
  const s = status.toLowerCase();
  if (s === "pending") return "PENDING";
  if (s === "approved") return "APPROVED";
  if (s === "rejected") return "REJECTED";
  return undefined;
}

export function mapExpenseStatusLabel(status: ExpenseStatusApi, tr: (az: string, en: string) => string): string {
  switch (status) {
    case "APPROVED":
      return tr("Təsdiqləndi", "Approved");
    case "PENDING":
      return tr("Gözləyir", "Pending");
    case "REJECTED":
      return tr("Rədd Edildi", "Rejected");
    default:
      return status;
  }
}

export function mapBankAccountStatusToApi(status: string): BankAccountStatusApi | undefined {
  const s = status.toLowerCase();
  if (s === "active") return "ACTIVE";
  if (s === "inactive") return "INACTIVE";
  if (s === "closed") return "CLOSED";
  if (s === "suspended") return "SUSPENDED";
  return undefined;
}

export function mapBankAccountStatusLabel(
  status: BankAccountStatusApi,
  tr: (az: string, en: string) => string,
): string {
  switch (status) {
    case "ACTIVE":
      return tr("Aktiv", "Active");
    case "INACTIVE":
      return tr("Qeyri-aktiv", "Inactive");
    case "CLOSED":
      return tr("Bağlı", "Closed");
    case "SUSPENDED":
      return tr("Dayandırılıb", "Suspended");
    default:
      return status;
  }
}

export function mapBankAccountTypeToApi(type: string): BankAccountTypeApi | undefined {
  const t = type.toLowerCase();
  if (t === "savings") return "SAVINGS";
  if (t === "checking" || t === "current") return "CURRENT";
  if (t === "salary") return "SALARY";
  if (t === "business") return "BUSINESS";
  if (t === "investment") return "INVESTMENT";
  return undefined;
}

export function mapBankAccountTypeLabel(
  type: BankAccountTypeApi,
  tr: (az: string, en: string) => string,
): string {
  switch (type) {
    case "SAVINGS":
      return tr("Əmanət Hesabı", "Savings Account");
    case "CURRENT":
      return tr("Cari Hesab", "Current Account");
    case "SALARY":
      return tr("Əmək Haqqı Hesabı", "Salary Account");
    case "BUSINESS":
      return tr("Biznes Hesabı", "Business Account");
    case "INVESTMENT":
      return tr("İnvestisiya Hesabı", "Investment Account");
    default:
      return type;
  }
}

export type FinancePagedQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
};

export type ExpensesListQuery = FinancePagedQuery & {
  categoryId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type IncomesListQuery = FinancePagedQuery & {
  categoryId?: string;
  storeId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type BankAccountsListQuery = FinancePagedQuery & {
  status?: string;
  sort?: "latest" | "oldest" | "name";
};

export type TrialBalanceQuery = {
  dateFrom: string;
  dateTo: string;
};

function financeQueryString(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== "all") sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

export function expensesListQueryString(q: ExpensesListQuery = {}): string {
  return financeQueryString({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search?.trim(),
    categoryId: q.categoryId,
    status: q.status && q.status !== "all" ? mapExpenseStatusToApi(q.status) : undefined,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
  });
}

export function incomesListQueryString(q: IncomesListQuery = {}): string {
  return financeQueryString({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search?.trim(),
    categoryId: q.categoryId,
    storeId: q.storeId && q.storeId !== "all" ? q.storeId : undefined,
    accountId: q.accountId,
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
  });
}

export function bankAccountsListQueryString(q: BankAccountsListQuery = {}): string {
  return financeQueryString({
    page: q.page,
    pageSize: q.pageSize,
    search: q.search?.trim(),
    status: q.status && q.status !== "all" ? mapBankAccountStatusToApi(q.status) : undefined,
    sort: q.sort && q.sort !== "latest" ? q.sort : undefined,
  });
}

export function trialBalanceQueryString(q: TrialBalanceQuery): string {
  return financeQueryString({
    dateFrom: q.dateFrom,
    dateTo: q.dateTo,
  });
}

export function monthStartIso(d = new Date()): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), 1)).toISOString();
}

export function monthEndIso(d = new Date()): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString();
}

export function dateInputToIso(date: string): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}
