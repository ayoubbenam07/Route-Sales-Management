import { apiGetCached, apiPost, apiPut, clearApiCache } from "@/lib/api";
import { mapSupermarket, type ApiSupermarket, type Supermarket } from "@/lib/types";

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const data = await apiGetCached<ApiSupermarket[]>("/supermarkets");
  return data.map(mapSupermarket);
}

export async function fetchSupermarket(id: string): Promise<ApiSupermarket & { deals?: unknown[] }> {
  return apiGetCached(`/supermarkets/${id}`);
}

export async function createSupermarket(body: {
  name: string;
  phone: string;
  address: string;
}): Promise<Supermarket> {
  const data = await apiPost<ApiSupermarket>("/supermarkets", body);
  await clearApiCache("/supermarkets");
  return mapSupermarket(data);
}

export async function updateSupermarket(
  id: string,
  body: { name: string; phone: string; address: string },
): Promise<Supermarket> {
  const data = await apiPut<ApiSupermarket>(`/supermarkets/${id}`, body);
  await clearApiCache("/supermarkets");
  return mapSupermarket(data);
}
