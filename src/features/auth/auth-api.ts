import { api, clearAuthToken, setAuthToken } from "@/lib/axios";
import { AuthUser, LoginPayload } from "@/types/api";

export async function login(payload: LoginPayload) {
  const { data } = await api.post<{ token: string; user: AuthUser }>("/api/login", payload);
  setAuthToken(data.token);
  return data.user;
}

export async function logout() {
  try {
    await api.post("/api/logout");
  } finally {
    clearAuthToken();
  }
}

export async function fetchMe() {
  const { data } = await api.get<{ data: AuthUser }>("/api/me");
  return data.data;
}
