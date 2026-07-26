import { getDb, generateId } from "@/lib/db";
import { type Product } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";

export async function fetchProducts(): Promise<Product[]> {
  const db = getDb();
  const rows = db.getAllSync('SELECT * FROM products') as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    basePrice: r.basePrice,
    stock: r.stockQty,
  }));
}

export async function createProduct(body: {
  name: string;
  basePrice: number;
  stockQty: number;
}): Promise<Product> {
  const db = getDb();
  const id = generateId();
  db.runSync(
    'INSERT INTO products (id, name, basePrice, stockQty, sync_status) VALUES (?, ?, ?, ?, ?)',
    [id, body.name, body.basePrice, body.stockQty, 'pending']
  );
  // Assume there is a queryKey for products
  queryClient.invalidateQueries({ queryKey: ['products'] as const });
  return {
    id,
    name: body.name,
    basePrice: body.basePrice,
    stock: body.stockQty,
  };
}

export async function updateProduct(
  id: string,
  body: { name: string; basePrice: number; stockQty: number },
): Promise<Product> {
  const db = getDb();
  db.runSync(
    'UPDATE products SET name = ?, basePrice = ?, stockQty = ?, sync_status = ? WHERE id = ?',
    [body.name, body.basePrice, body.stockQty, 'pending', id]
  );
  queryClient.invalidateQueries({ queryKey: ['products'] as const });
  return {
    id,
    name: body.name,
    basePrice: body.basePrice,
    stock: body.stockQty,
  };
}

export async function deleteProduct(id: string): Promise<{ success: boolean; data: Product }> {
  const db = getDb();
  const row = db.getFirstSync('SELECT * FROM products WHERE id = ?', [id]) as any;
  if (row) {
    db.runSync('DELETE FROM products WHERE id = ?', [id]);
  }
  queryClient.invalidateQueries({ queryKey: ['products'] as const });
  return {
    success: true,
    data: {
      id,
      name: row?.name || "Deleted",
      basePrice: row?.basePrice || 0,
      stock: row?.stockQty || 0,
    }
  };
}
