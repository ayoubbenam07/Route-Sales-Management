import axios from "axios";

export const API_BASE_URL = "https://route-sales-management.vercel.app/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export type Role = "ADMIN" | "BUYER";
export type DealStatus = "UNPAID" | "PARTIAL" | "PAID";
export type PaymentMethod = "CASH" | "CHECK" | "TRANSFER";

export interface User {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

export interface Product {
  id: string;
  name: string;
  basePrice: number;
  stockQty: number;
}

export interface Supermarket {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalDebt: number;
}

export interface DealItemProduct {
  id: string;
  name: string;
}

export interface DealItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: DealItemProduct;
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  method: PaymentMethod;
}

export interface PaymentSummary {
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentCount: number;
}

export interface ItemSummary {
  totalItems: number;
  totalQuantity: number;
}

export interface Deal {
  id: string;
  createdAt: string;
  totalAmount: number;
  status: DealStatus;
  buyer: { id: string; name: string; phone: string };
  supermarket: { id: string; name: string; phone: string; address?: string; totalDebt: number };
  items: DealItem[];
  payments: Payment[];
  paymentSummary?: PaymentSummary;
  itemSummary?: ItemSummary;
}

export interface BuyerAnalytics {
  totalSalesThisMonth: number;
  totalDebtResponsible: number;
  recentDeals: Deal[];
}

export interface TopBuyer {
  buyerId: string;
  name: string;
  phone: string;
  totalSales: number;
  dealsCount: number;
}

export interface StockWarning {
  productId: string;
  name: string;
  stockQty: number;
  basePrice: number;
  warning: string;
}

export interface AdminAnalytics {
  totalSalesRevenue: number;
  totalGlobalOutstandingMarketDebt: number;
  topPerformingBuyers: TopBuyer[];
  stockWarnings: StockWarning[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
  count?: number;
}

export const getProducts = async (): Promise<Product[]> => {
  const res = await api.get<ApiResponse<Product[]>>("/products");
  return res.data.data;
};

export const createProduct = async (data: Partial<Product>): Promise<Product> => {
  const res = await api.post<ApiResponse<Product>>("/products", data);
  return res.data.data;
};

export const updateProduct = async (id: string, data: Partial<Product>): Promise<Product> => {
  const res = await api.put<ApiResponse<Product>>(`/products/${id}`, data);
  return res.data.data;
};

export const deleteProduct = async (id: string): Promise<void> => {
  await api.delete(`/products/${id}`);
};

export const getSupermarkets = async (): Promise<Supermarket[]> => {
  const res = await api.get<ApiResponse<Supermarket[]>>("/supermarkets");
  return res.data.data;
};

export const getSupermarketById = async (id: string): Promise<Supermarket & { deals: Deal[] }> => {
  const res = await api.get<ApiResponse<Supermarket & { deals: Deal[] }>>(`/supermarkets/${id}`);
  return res.data.data;
};

export const createSupermarket = async (data: Partial<Supermarket>): Promise<Supermarket> => {
  const res = await api.post<ApiResponse<Supermarket>>("/supermarkets", data);
  return res.data.data;
};

export const updateSupermarket = async (id: string, data: Partial<Supermarket>): Promise<Supermarket> => {
  const res = await api.put<ApiResponse<Supermarket>>(`/supermarkets/${id}`, data);
  return res.data.data;
};

export const deleteSupermarket = async (id: string): Promise<void> => {
  await api.delete(`/supermarkets/${id}`);
};

export const getDeals = async (status?: DealStatus): Promise<Deal[]> => {
  const params = status && status !== "ALL" as any ? { status } : {};
  const res = await api.get<ApiResponse<Deal[]>>("/deals", { params });
  return res.data.data;
};

export const getDealById = async (id: string): Promise<Deal> => {
  const res = await api.get<ApiResponse<Deal>>(`/deals/${id}`);
  return res.data.data;
};

export const createDeal = async (data: {
  supermarketId: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  initialPayment: number;
}): Promise<Deal> => {
  const res = await api.post<ApiResponse<Deal>>("/deals", data);
  return res.data.data;
};

export const updateDeal = async (id: string, data: any): Promise<Deal> => {
  const res = await api.put<ApiResponse<Deal>>(`/deals/${id}`, data);
  return res.data.data;
};

export const deleteDeal = async (id: string): Promise<void> => {
  await api.delete(`/deals/${id}`);
};

export const createPayment = async (data: { dealId: string; amount: number; method: PaymentMethod }): Promise<Payment> => {
  const res = await api.post<ApiResponse<Payment>>("/payment", data);
  return res.data.data;
};

export const getPayments = async (sort = "desc"): Promise<Payment[]> => {
  const res = await api.get<ApiResponse<Payment[]>>("/payment", { params: { sort } });
  return res.data.data;
};

export const getAdminDashboard = async (): Promise<AdminAnalytics> => {
  const res = await api.get<ApiResponse<AdminAnalytics>>("/analytics/admin-dashboard");
  return res.data.data;
};

export const getBuyerDashboard = async (): Promise<BuyerAnalytics> => {
  const res = await api.get<ApiResponse<BuyerAnalytics>>("/analytics/buyer-dashboard");
  return res.data.data;
};

export const createBuyer = async (data: any): Promise<User> => {
  const res = await api.post<ApiResponse<User>>("/auth/create_buyer", data);
  return res.data.data;
};

export const login = async (data: any): Promise<User> => {
  const res = await api.post<ApiResponse<User>>("/auth/login", data);
  return res.data.data;
