/**
 * Axios client for the Learnity API with auth interceptor + 401 refresh retry.
 */
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { env } from "@/env";

export const api = axios.create({
  baseURL: env.NEXT_PUBLIC_API_URL + "/api",
  timeout: 10_000,
});

const ACCESS_KEY = "learnity.access";
export const REFRESH_KEY = "learnity.refresh";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_KEY);
}

export function setTokens(access: string, refresh: string): void {
  window.localStorage.setItem(ACCESS_KEY, access);
  window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const refreshToken = window.localStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;
    const res = await axios.post<{ accessToken: string; refreshToken: string }>(
      env.NEXT_PUBLIC_API_URL + "/api/auth/refresh",
      { refreshToken },
    );
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res.data.accessToken;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const status = error.response?.status;
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  if (status === 401 && original && !original._retry) {
    original._retry = true;
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    if (token) {
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }
  }
  return Promise.reject(error);
});
