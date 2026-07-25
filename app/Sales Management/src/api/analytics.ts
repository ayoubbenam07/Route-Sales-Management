import { getDb } from "@/lib/db";
import type { AdminDashboardData, BuyerDashboardData, DealStatus } from "@/lib/types";

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

  // Total debt from supermarkets
  const supermarkets = db.getAllSync('SELECT totalDebt FROM supermarkets') as any[];
  const totalDebtResponsible = supermarkets.reduce((sum, s) => sum + s.totalDebt, 0);

  // Total sales this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const dealsThisMonth = db.getAllSync(
    'SELECT totalAmount FROM deals WHERE createdAt >= ?',
    [startOfMonth]
  ) as any[];
  const totalSalesThisMonth = dealsThisMonth.reduce((sum, d) => sum + d.totalAmount, 0);

  // Recent deals
  const recentRows = db.getAllSync(
    'SELECT id, createdAt, status, totalAmount, paid, remaining, supermarketId, supermarketName FROM deals ORDER BY createdAt DESC LIMIT 5'
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
