import { apiGetCached, apiPost, apiPut, apiDelete, clearApiCache } from "@/lib/api";
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
  const data = await apiPost<ApiProduct>("/products", body);
  await clearApiCache("/products");
  return mapProduct(data);
}

export async function updateProduct(
  id: string,
  body: { name: string; basePrice: number; stockQty: number },
): Promise<Product> {
  const data = await apiPut<ApiProduct>(`/products/${id}`, body);
  await clearApiCache("/products");
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<{ success: boolean; data: Product }> {
  const data = await apiDelete<ApiProduct>(`/products/${id}`);
  await clearApiCache("/products");
  return { success: true, data: mapProduct(data) };
}
