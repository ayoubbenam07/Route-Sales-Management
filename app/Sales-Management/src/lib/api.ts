import axios, { type AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";
import type { ApiResponse } from "./types";
import { cacheStore } from "./storage";
import { queueRequest } from "./offlineSync";

const TOKEN_KEY = "rs-auth-token";

export const API_BASE_URL = "https://sales-management-six-mu.vercel.app/api";

let memoryToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export function getToken(): string | null {
  return memoryToken;
}

export async function hydrateToken(): Promise<string | null> {
  memoryToken = await SecureStore.getItemAsync(TOKEN_KEY);
  return memoryToken;
}

export async function setToken(token: string | null): Promise<void> {
  memoryToken = token;
  if (token) await SecureStore.setItemAsync(TOKEN_KEY, token);
  else await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = getToken() ?? (await hydrateToken());
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      await setToken(null);
      onUnauthorized?.();
    }
    const message =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      "Une erreur est survenue";
    return Promise.reject(new Error(message));
  },
);

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(path, { params });
  if (!data.success) throw new Error(data.error ?? data.message ?? "Request failed");
  return data.data as T;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.post<ApiResponse<T>>(path, body);
  if (!data.success) throw new Error(data.error ?? data.message ?? "Request failed");
  return data.data as T;
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const { data } = await api.put<ApiResponse<T>>(path, body);
  if (!data.success) throw new Error(data.error ?? data.message ?? "Request failed");
  return data.data as T;
}

export async function apiDelete<T>(path: string): Promise<T> {
  const { data } = await api.delete<ApiResponse<T>>(path);
  if (!data.success) throw new Error(data.error ?? data.message ?? "Request failed");
  return data.data as T;
}

export async function apiGetCached<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T> {
  const cacheKey = `rs-cache:${path}${params ? "?" + new URLSearchParams(params).toString() : ""}`;

  try {
    const data = await apiGet<T>(path, params);
    await cacheStore.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  } catch (error) {
    const cachedItem = await cacheStore.getItem<string>(cacheKey);
    if (cachedItem) {
      try {
        const { data } = JSON.parse(cachedItem);
        return data as T;
      } catch {
        // ignore parse errors
      }
    }
    throw error;
  }
}

export async function clearApiCache(pathPrefix: string) {
  try {
    const keys = await cacheStore.keys();
    for (const key of keys) {
      if (key.startsWith(`rs-cache:${pathPrefix}`)) {
        await cacheStore.removeItem(key);
      }
    }
  } catch (e) {
    console.error("Failed to clear cache", e);
  }
}

export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return msg.includes("network error") || msg.includes("timeout") || msg.includes("network request failed");
  }
  return false;
}

export async function apiMutationOffline<T>(
  method: "POST" | "PUT" | "DELETE",
  path: string,
  body: unknown,
  optimisticResponse: T
): Promise<T> {
  try {
    if (method === "POST") return await apiPost<T>(path, body);
    if (method === "PUT") return await apiPut<T>(path, body);
    if (method === "DELETE") return await apiDelete<T>(path);
    throw new Error("Invalid method");
  } catch (error) {
    if (isNetworkError(error)) {
      await queueRequest(method, path, body);
      return optimisticResponse;
    }
    throw error;
  }
}
