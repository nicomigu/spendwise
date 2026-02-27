import { api } from "./axios";

export interface Transaction {
  id: string;
  description: string;
  amount: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  status: "PENDING" | "CLEARED" | "RECONCILED" | "VOID";
  category: string | null;
  merchant: string | null;
  notes: string | null;
  transactionDate: string | null;
  accountId: string;
  organizationId: string;
  userId: string;
  createdAt: string;
}

export interface TransactionFilters {
  type?: string;
  status?: string;
  category?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  data: Transaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateTransactionPayload {
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  category?: string;
  merchant?: string;
  notes?: string;
  transactionDate?: string;
  accountId: string;
}

export const transactionsApi = {
  getAll: (filters: TransactionFilters = {}) =>
    api
      .get<PaginatedTransactions>("/transactions", { params: filters })
      .then((r) => r.data),

  getOne: (id: string) =>
    api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),

  create: (payload: CreateTransactionPayload) =>
    api.post<Transaction>("/transactions", payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateTransactionPayload>) =>
    api.put<Transaction>(`/transactions/${id}`, payload).then((r) => r.data),

  delete: (id: string) => api.delete(`/transactions/${id}`).then((r) => r.data),
};
