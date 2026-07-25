import { apiGet, apiGetCached, apiPost, apiDelete, clearApiCache } from "@/lib/api";
import { mapDeal, type ApiDeal, type Deal, type DealStatus } from "@/lib/types";

export async function fetchDeals(status?: DealStatus): Promise<Deal[]> {
  const params = status ? { status } : undefined;
  const data = await apiGetCached<ApiDeal[]>("/deals", params);
  return (data ?? []).map(mapDeal);
}

export async function fetchDeal(id: string): Promise<Deal> {
  const data = await apiGet<ApiDeal>(`/deals/${id}`);
  return mapDeal(data);
}

export async function createDeal(body: {
  supermarketId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  initialPayment: number;
}): Promise<Deal> {
  const data = await apiPost<ApiDeal>("/deals", body);
  await clearApiCache("/deals");
  await clearApiCache("/supermarkets");
  return mapDeal(data);
}

export async function deleteDeal(id: string): Promise<void> {
  await apiDelete(`/deals/${id}`);
  await clearApiCache("/deals");
  await clearApiCache("/supermarkets");
  await clearApiCache("/products");
}
