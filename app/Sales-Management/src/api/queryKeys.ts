export const queryKeys = {
  products: ["products"] as const,
  supermarkets: ["supermarkets"] as const,
  supermarket: (id: string) => ["supermarkets", id] as const,
  deals: (status?: string) => ["deals", status ?? "all"] as const,
  deal: (id: string) => ["deals", id] as const,
  payments: ["payments"] as const,
  adminDashboard: ["analytics", "admin"] as const,
  buyerDashboard: ["analytics", "buyer"] as const,
  buyers: ["buyers"] as const,
};
