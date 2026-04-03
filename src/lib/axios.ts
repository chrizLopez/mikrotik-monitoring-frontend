import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const AUTH_TOKEN_KEY = "mikrotik_monitoring_token";

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string) {
  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken() {
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export const api = axios.create({
  baseURL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers.Authorization) {
    delete config.headers.Authorization;
  }

  return config;
});

export async function downloadFile(url: string, params?: Record<string, string | number>) {
  const response = await api.get<Blob>(url, {
    params,
    responseType: "blob",
  });

  return response.data;
}
