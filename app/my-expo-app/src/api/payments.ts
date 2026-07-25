import { apiGet, apiPost } from "@/lib/api";
import type { ApiPayment, PaymentMethod } from "@/lib/types";

export async function fetchPayments(): Promise<ApiPayment[]> {
  return apiGet<ApiPayment[]>("/payment");
}

export async function createPayment(body: {
  dealId: string;
  amount: number;
  method: PaymentMethod;
}): Promise<ApiPayment> {
  return apiPost<ApiPayment>("/payment", body);
}

export function cashCollectedToday(payments: ApiPayment[]): number {
  const today = new Date().toDateString();
  return payments
    .filter((p) => new Date(p.paymentDate).toDateString() === today)
    .reduce((s, p) => s + p.amount, 0);
}
