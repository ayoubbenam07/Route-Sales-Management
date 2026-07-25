import { api, apiGet, apiPost, apiPut, setToken } from "@/lib/api";
import type { ApiResponse, ApiUser } from "@/lib/types";
import type { Role, User } from "@/stores/auth";

function normalizeRole(role: string): Role {
  const upper = role.toUpperCase();
  if (upper === "ADMIN" || upper === "BUYER") return upper;
  throw new Error("Rôle utilisateur invalide");
}

function extractToken(res: {
  data: ApiResponse<ApiUser> & { token?: string };
}): string | null {
  return res.data.data?.token ?? res.data.token ?? null;
}

export async function login(phone: string, password: string): Promise<User> {
  const res = await api.post<ApiResponse<ApiUser>>("/auth/login", { phone, password });
  if (!res.data.success || !res.data.data) {
    throw new Error(res.data.error ?? res.data.message ?? "Échec de connexion");
  }
  const token = extractToken(res);
  if (token) await setToken(token);
  const { id, name, phone: p, role } = res.data.data;
  return { id, name, phone: p, role: normalizeRole(role) };
}

export async function logout(): Promise<void> {
  try {
    await apiPost<unknown>("/auth/logout");
  } finally {
    await setToken(null);
  }
}

export async function createBuyer(body: {
  name: string;
  phone: string;
  password: string;
}): Promise<User> {
  const data = await apiPost<ApiUser>("/auth/create_buyer", body);
  return { id: data.id, name: data.name, phone: data.phone, role: normalizeRole(data.role) };
}

export interface BuyerListItem {
  id: string;
  name: string;
  phone: string;
  dealsCount: number;
  totalSales: number;
}

export async function fetchBuyers(): Promise<BuyerListItem[]> {
  return apiGet<BuyerListItem[]>("/auth/buyers");
}

export async function updateBuyer(
  id: string,
  body: { name?: string; phone?: string; password?: string },
): Promise<User> {
  const data = await apiPut<ApiUser>(`/auth/buyers/${id}`, body);
  return { id: data.id, name: data.name, phone: data.phone, role: normalizeRole(data.role) };
}
