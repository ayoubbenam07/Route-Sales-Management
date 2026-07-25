import { apiGet } from "@/lib/api";
import type { AdminDashboardData, BuyerDashboardData } from "@/lib/types";

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  return apiGet<AdminDashboardData>("/analytics/admin-dashboard");
}

export async function fetchBuyerDashboard(): Promise<BuyerDashboardData> {
  return apiGet<BuyerDashboardData>("/analytics/buyer-dashboard");
}
