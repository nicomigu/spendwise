import { api } from "./axios";

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationName: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    api.post("/auth/register", payload).then((r) => r.data),

  login: (payload: LoginPayload) =>
    api.post("/auth/login", payload).then((r) => r.data),

  refresh: () => api.post("/auth/refresh").then((r) => r.data),
};
