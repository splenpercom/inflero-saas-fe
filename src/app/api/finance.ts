import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import {
  bankAccountsListQueryString,
  expensesListQueryString,
  incomesListQueryString,
  trialBalanceQueryString,
  type BankAccountsListQuery,
  type BankAccountStatusApi,
  type BankAccountTypeApi,
  type ExpenseStatusApi,
  type ExpensesListQuery,
  type IncomesListQuery,
  type TrialBalanceQuery,
} from "../lib/financeMappers";

type ApiEnvelope<T> = { success: boolean; data: T };

export interface FinancePagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface FinanceCategory {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseListRow {
  id: string;
  reference: string | null;
  expenseName: string;
  category: string;
  categoryId: string | null;
  accountId: string | null;
  description: string;
  date: string;
  amount: string;
  status: ExpenseStatusApi;
}

export interface IncomeListRow {
  id: string;
  reference: string | null;
  date: string;
  store: string;
  storeId: string | null;
  category: string;
  categoryId: string | null;
  notes: string;
  amount: string;
  accountId: string | null;
  bankLabel: string | null;
}

export interface BankAccountRow {
  id: string;
  accountHolderName: string;
  accountNo: string;
  type: BankAccountTypeApi;
  openingBalance: string;
  currentBalance: string;
  notes: string;
  status: BankAccountStatusApi;
  createdAt: string;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: string | null;
  debit: string;
  credit: string;
}

export interface TrialBalanceResult {
  dateFrom: string;
  dateTo: string;
  items: TrialBalanceRow[];
  totalDebit: string;
  totalCredit: string;
}

// --- Categories ---

export async function fetchExpenseCategories(): Promise<FinanceCategory[]> {
  const res = await apiGet<ApiEnvelope<FinanceCategory[]>>("/tenant/finance/expense-categories");
  return res.data ?? [];
}

export async function createExpenseCategory(body: {
  name: string;
  description?: string | null;
  isActive?: boolean;
}): Promise<FinanceCategory> {
  const res = await apiPost<ApiEnvelope<FinanceCategory>>("/tenant/finance/expense-categories", body);
  return res.data;
}

export async function updateExpenseCategory(
  id: string,
  body: { name?: string; description?: string | null; isActive?: boolean },
): Promise<FinanceCategory> {
  const res = await apiPatch<ApiEnvelope<FinanceCategory>>(`/tenant/finance/expense-categories/${id}`, body);
  return res.data;
}

export async function deleteExpenseCategory(id: string): Promise<{ ok: true }> {
  const res = await apiDelete<ApiEnvelope<{ ok: true }>>(`/tenant/finance/expense-categories/${id}`);
  return res.data;
}

export async function fetchIncomeCategories(): Promise<FinanceCategory[]> {
  const res = await apiGet<ApiEnvelope<FinanceCategory[]>>("/tenant/finance/income-categories");
  return res.data ?? [];
}

export async function createIncomeCategory(body: {
  name: string;
  description?: string | null;
  isActive?: boolean;
}): Promise<FinanceCategory> {
  const res = await apiPost<ApiEnvelope<FinanceCategory>>("/tenant/finance/income-categories", body);
  return res.data;
}

export async function updateIncomeCategory(
  id: string,
  body: { name?: string; description?: string | null; isActive?: boolean },
): Promise<FinanceCategory> {
  const res = await apiPatch<ApiEnvelope<FinanceCategory>>(`/tenant/finance/income-categories/${id}`, body);
  return res.data;
}

export async function deleteIncomeCategory(id: string): Promise<{ ok: true }> {
  const res = await apiDelete<ApiEnvelope<{ ok: true }>>(`/tenant/finance/income-categories/${id}`);
  return res.data;
}

// --- Bank accounts ---

export async function fetchBankAccounts(
  query: BankAccountsListQuery = {},
): Promise<FinancePagedResult<BankAccountRow>> {
  const res = await apiGet<ApiEnvelope<FinancePagedResult<BankAccountRow>>>(
    `/tenant/finance/bank-accounts${bankAccountsListQueryString(query)}`,
  );
  return res.data ?? { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
}

export async function createBankAccount(body: {
  accountHolderName: string;
  accountNo: string;
  type?: BankAccountTypeApi;
  openingBalance?: string;
  notes?: string | null;
  status?: BankAccountStatusApi;
}): Promise<BankAccountRow> {
  const res = await apiPost<ApiEnvelope<BankAccountRow>>("/tenant/finance/bank-accounts", body);
  return res.data;
}

export async function updateBankAccount(
  id: string,
  body: {
    accountHolderName?: string;
    accountNo?: string;
    type?: BankAccountTypeApi;
    notes?: string | null;
    status?: BankAccountStatusApi;
  },
): Promise<BankAccountRow> {
  const res = await apiPatch<ApiEnvelope<BankAccountRow>>(`/tenant/finance/bank-accounts/${id}`, body);
  return res.data;
}

export async function deleteBankAccount(id: string): Promise<{ ok: true }> {
  const res = await apiDelete<ApiEnvelope<{ ok: true }>>(`/tenant/finance/bank-accounts/${id}`);
  return res.data;
}

// --- Expenses ---

export async function fetchExpenses(
  query: ExpensesListQuery = {},
): Promise<FinancePagedResult<ExpenseListRow>> {
  const res = await apiGet<ApiEnvelope<FinancePagedResult<ExpenseListRow>>>(
    `/tenant/finance/expenses${expensesListQueryString(query)}`,
  );
  return res.data ?? { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
}

export async function createExpense(body: {
  reference?: string | null;
  expenseName: string;
  categoryId?: string | null;
  accountId?: string | null;
  description?: string | null;
  date?: string;
  amount: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
}): Promise<ExpenseListRow> {
  const res = await apiPost<ApiEnvelope<ExpenseListRow>>("/tenant/finance/expenses", body);
  return res.data;
}

export async function updateExpense(
  id: string,
  body: {
    reference?: string | null;
    expenseName?: string;
    categoryId?: string | null;
    accountId?: string | null;
    description?: string | null;
    date?: string;
    amount?: string;
  },
): Promise<ExpenseListRow> {
  const res = await apiPatch<ApiEnvelope<ExpenseListRow>>(`/tenant/finance/expenses/${id}`, body);
  return res.data;
}

export async function patchExpenseStatus(
  id: string,
  status: "APPROVED" | "REJECTED",
): Promise<ExpenseListRow> {
  const res = await apiPatch<ApiEnvelope<ExpenseListRow>>(`/tenant/finance/expenses/${id}/status`, { status });
  return res.data;
}

export async function deleteExpense(id: string): Promise<{ ok: true }> {
  const res = await apiDelete<ApiEnvelope<{ ok: true }>>(`/tenant/finance/expenses/${id}`);
  return res.data;
}

// --- Incomes ---

export async function fetchIncomes(
  query: IncomesListQuery = {},
): Promise<FinancePagedResult<IncomeListRow>> {
  const res = await apiGet<ApiEnvelope<FinancePagedResult<IncomeListRow>>>(
    `/tenant/finance/incomes${incomesListQueryString(query)}`,
  );
  return res.data ?? { items: [], total: 0, page: 1, pageSize: 50, totalPages: 0 };
}

export async function createIncome(body: {
  reference?: string | null;
  categoryId?: string | null;
  storeId?: string | null;
  accountId?: string | null;
  notes?: string | null;
  date?: string;
  amount: string;
}): Promise<IncomeListRow> {
  const res = await apiPost<ApiEnvelope<IncomeListRow>>("/tenant/finance/incomes", body);
  return res.data;
}

export async function updateIncome(
  id: string,
  body: {
    reference?: string | null;
    categoryId?: string | null;
    storeId?: string | null;
    notes?: string | null;
    date?: string;
  },
): Promise<IncomeListRow> {
  const res = await apiPatch<ApiEnvelope<IncomeListRow>>(`/tenant/finance/incomes/${id}`, body);
  return res.data;
}

export async function deleteIncome(id: string): Promise<{ ok: true }> {
  const res = await apiDelete<ApiEnvelope<{ ok: true }>>(`/tenant/finance/incomes/${id}`);
  return res.data;
}

// --- Reports ---

export async function fetchTrialBalance(query: TrialBalanceQuery): Promise<TrialBalanceResult> {
  const res = await apiGet<ApiEnvelope<TrialBalanceResult>>(
    `/tenant/finance/reports/trial-balance${trialBalanceQueryString(query)}`,
  );
  return res.data;
}
