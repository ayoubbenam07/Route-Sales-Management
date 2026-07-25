import { apiGet, apiGetCached, apiMutationOffline, clearApiCache } from "@/lib/api";
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
  const totalAmount = body.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const remaining = Math.max(0, totalAmount - body.initialPayment);
  const optimisticDeal: ApiDeal = {
    id: `offline-${Date.now()}`,
    createdAt: new Date().toISOString(),
    totalAmount,
    status: remaining > 0 ? (body.initialPayment > 0 ? "PARTIAL" : "UNPAID") : "PAID",
    supermarketId: body.supermarketId,
    items: body.items.map(it => ({ quantity: it.quantity, unitPrice: it.unitPrice, productId: it.productId })),
    paymentSummary: {
      totalAmount,
      totalPaid: body.initialPayment,
      remainingBalance: remaining,
      paymentCount: body.initialPayment > 0 ? 1 : 0,
    }
  };

  const data = await apiMutationOffline<ApiDeal>("POST", "/deals", body, optimisticDeal);
  await clearApiCache("/deals");
  await clearApiCache("/supermarkets");
  return mapDeal(data);
}

export async function deleteDeal(id: string): Promise<void> {
  await apiMutationOffline<void>("DELETE", `/deals/${id}`, undefined, undefined as void);
  await clearApiCache("/deals");
  await clearApiCache("/supermarkets");
  await clearApiCache("/products");
}
