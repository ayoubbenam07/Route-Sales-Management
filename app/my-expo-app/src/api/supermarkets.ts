import { apiGetCached, apiMutationOffline, clearApiCache } from "@/lib/api";
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
  const optimisticSupermarket: ApiSupermarket = {
    id: `offline-${Date.now()}`,
    name: body.name,
    phone: body.phone,
    address: body.address,
    totalDebt: 0,
  };
  const data = await apiMutationOffline<ApiSupermarket>("POST", "/supermarkets", body, optimisticSupermarket);
  await clearApiCache("/supermarkets");
  return mapSupermarket(data);
}

export async function updateSupermarket(
  id: string,
  body: { name: string; phone: string; address: string },
): Promise<Supermarket> {
  const optimisticSupermarket: ApiSupermarket = {
    id,
    name: body.name,
    phone: body.phone,
    address: body.address,
    totalDebt: 0, // This might overwrite current debt in UI temporarily, but it's acceptable for offline optimism
  };
  const data = await apiMutationOffline<ApiSupermarket>("PUT", `/supermarkets/${id}`, body, optimisticSupermarket);
  await clearApiCache("/supermarkets");
  return mapSupermarket(data);
}
