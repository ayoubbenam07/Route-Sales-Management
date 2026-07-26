import { getDb } from "@/lib/db";
import type { AdminDashboardData, BuyerDashboardData, DealStatus } from "@/lib/types";
import { useAuth } from "@/stores/auth";

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  // Not used in Buyer app, returning empty
  return {
    totalSalesRevenue: 0,
    totalGlobalOutstandingMarketDebt: 0,
    topPerformingBuyers: [],
    stockWarnings: [],
  };
}

export async function fetchBuyerDashboard(): Promise<BuyerDashboardData> {
  const db = getDb();
  const currentUser = useAuth.getState().user;
  const buyerId = currentUser?.id || "";

  // Total debt from deals specific to this buyer
  const deals = db.getAllSync('SELECT remaining FROM deals WHERE buyerId = ?', [buyerId]) as any[];
  const totalDebtResponsible = deals.reduce((sum, d) => sum + d.remaining, 0);

  // Total sales this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dealsThisMonth = db.getAllSync(
    'SELECT totalAmount FROM deals WHERE createdAt >= ? AND buyerId = ?',
    [startOfMonth, buyerId]
  ) as any[];
  const totalSalesThisMonth = dealsThisMonth.reduce((sum, d) => sum + d.totalAmount, 0);

  // Recent deals
  const recentRows = db.getAllSync(
    'SELECT id, createdAt, status, totalAmount, paid, remaining, supermarketId, supermarketName FROM deals WHERE buyerId = ? ORDER BY createdAt DESC LIMIT 5',
    [buyerId]
  ) as any[];

  const recentDeals = recentRows.map(r => ({
    id: r.id,
    createdAt: r.createdAt,
    status: r.status as DealStatus,
    totalAmount: r.totalAmount,
    totalPaid: r.paid,
    remainingBalance: r.remaining,
    supermarket: { id: r.supermarketId, name: r.supermarketName },
  }));

  return {
    totalSalesThisMonth,
    totalDebtResponsible,
    recentDeals,
  };
}
