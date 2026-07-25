export type DealStatus = "PAID" | "PARTIAL" | "UNPAID";
export type PaymentMethod = "CASH" | "CHECK" | "TRANSFER";
export type Role = "ADMIN" | "BUYER";

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  stock: number;
}

export interface Supermarket {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
}

export interface DealItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface Deal {
  id: string;
  reference: string;
  supermarketId: string;
  supermarketName: string;
  buyerId: string;
  buyerName: string;
  items: DealItem[];
  total: number;
  paid: number;
  remaining: number;
  status: DealStatus;
  createdAt: string;
}

export interface Buyer {
  id: string;
  name: string;
  phone: string;
  totalSales: number;
  totalDebt: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}

export interface ApiUser {
  id: string;
  name: string;
  phone: string;
  role: Role;
  token?: string;
}

export interface ApiProduct {
  id: string;
  name: string;
  basePrice: number;
  stockQty: number;
}

export interface ApiSupermarket {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  totalDebt: number;
}

export interface ApiPayment {
  id: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
  dealId: string;
}

export interface ApiDealItem {
  id?: string;
  productId?: string;
  quantity: number;
  unitPrice: number;
  product?: { id: string; name: string };
}

export interface ApiDeal {
  id: string;
  createdAt?: string;
  totalAmount: number;
  status: DealStatus;
  buyerId?: string;
  supermarketId?: string;
  buyer?: { id: string; name: string; phone?: string };
  supermarket?: { id: string; name: string; phone?: string; address?: string };
  items?: ApiDealItem[];
  payments?: ApiPayment[];
  paymentSummary?: {
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    paymentCount: number;
  };
}

export interface AdminDashboardData {
  totalSalesRevenue: number;
  totalGlobalOutstandingMarketDebt: number;
  topPerformingBuyers: Array<{
    buyerId: string;
    name: string;
    phone: string;
    totalSales: number;
    dealsCount: number;
  }>;
  stockWarnings: Array<{
    productId: string;
    name: string;
    stockQty: number;
    basePrice: number;
    warning: string;
  }>;
}

export interface BuyerDashboardData {
  totalSalesThisMonth: number;
  totalDebtResponsible: number;
  recentDeals: Array<{
    id: string;
    createdAt: string;
    status: DealStatus;
    totalAmount: number;
    totalPaid: number;
    remainingBalance: number;
    supermarket: { id: string; name: string };
  }>;
}

export function mapProduct(p: ApiProduct): Product {
  return { id: p.id, name: p.name, basePrice: p.basePrice, stock: p.stockQty };
}

export function mapSupermarket(s: ApiSupermarket): Supermarket {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    address: s.address ?? "",
    totalDebt: s.totalDebt,
  };
}

export function dealReference(id: string): string {
  return `DEAL-${id.slice(0, 8).toUpperCase()}`;
}

export function mapDeal(d: ApiDeal): Deal {
  const totalPaid =
    d.paymentSummary?.totalPaid ??
    d.payments?.reduce((s, p) => s + p.amount, 0) ??
    0;
  const total = d.totalAmount;
  const remaining = d.paymentSummary?.remainingBalance ?? Math.max(0, total - totalPaid);

  return {
    id: d.id,
    reference: dealReference(d.id),
    supermarketId: d.supermarketId ?? d.supermarket?.id ?? "",
    supermarketName: d.supermarket?.name ?? "",
    buyerId: d.buyerId ?? d.buyer?.id ?? "",
    buyerName: d.buyer?.name ?? "",
    items: (d.items ?? []).map((it) => ({
      productId: it.productId ?? it.product?.id ?? "",
      productName: it.product?.name ?? "",
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    total,
    paid: totalPaid,
    remaining,
    status: d.status,
    createdAt: d.createdAt ?? new Date().toISOString(),
  };
}

export function mapBuyerFromAnalytics(b: AdminDashboardData["topPerformingBuyers"][0]): Buyer {
  return {
    id: b.buyerId,
    name: b.name,
    phone: b.phone,
    totalSales: b.totalSales,
    totalDebt: 0,
  };
}
