import { api } from "./axios";

export interface Account {
  id: string;
  name: string;
  type: "CHECKING" | "SAVINGS" | "CREDIT" | "INVESTMENT" | "CASH";
  balance: string;
  currency: string;
  isActive: boolean;
  organizationId: string;
  ownerId: string;
  createdAt: string;
}

export interface CreateAccountPayload {
  name: string;
  type?: string;
  currency?: string;
}

export const accountsApi = {
  getAll: () => api.get<Account[]>("/accounts").then((r) => r.data),

  getOne: (id: string) =>
    api.get<Account>(`/accounts/${id}`).then((r) => r.data),

  create: (payload: CreateAccountPayload) =>
    api.post<Account>("/accounts", payload).then((r) => r.data),

  update: (id: string, payload: Partial<CreateAccountPayload>) =>
    api.put<Account>(`/accounts/${id}`, payload).then((r) => r.data),
};
