import { apiGetCached, apiMutationOffline, clearApiCache } from "@/lib/api";
import { mapProduct, type ApiProduct, type Product } from "@/lib/types";

export async function fetchProducts(): Promise<Product[]> {
  const data = await apiGetCached<ApiProduct[]>("/products");
  return data.map(mapProduct);
}

export async function createProduct(body: {
  name: string;
  basePrice: number;
  stockQty: number;
}): Promise<Product> {
  const optimisticProduct: ApiProduct = {
    id: `offline-${Date.now()}`,
    name: body.name,
    basePrice: body.basePrice,
    stockQty: body.stockQty,
  };
  const data = await apiMutationOffline<ApiProduct>("POST", "/products", body, optimisticProduct);
  await clearApiCache("/products");
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  body: { name: string; basePrice: number; stockQty: number },
): Promise<Product> {
  const optimisticProduct: ApiProduct = {
    id,
    name: body.name,
    basePrice: body.basePrice,
    stockQty: body.stockQty,
  };
  const data = await apiMutationOffline<ApiProduct>("PUT", `/products/${id}`, body, optimisticProduct);
  await clearApiCache("/products");
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<{ success: boolean; data: Product }> {
  const optimisticProduct: ApiProduct = {
    id,
    name: "Deleted Offline",
    basePrice: 0,
    stockQty: 0,
  };
  const data = await apiMutationOffline<ApiProduct>("DELETE", `/products/${id}`, undefined, optimisticProduct);
  await clearApiCache("/products");
  return { success: true, data: mapProduct(data) };
}
