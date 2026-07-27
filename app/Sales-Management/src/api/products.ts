import { getDb, generateId } from "@/lib/db";
import { type Product } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { triggerSync } from "@/lib/offlineSync";

export async function fetchProducts(): Promise<Product[]> {
  const db = getDb();
  const rows = db.getAllSync(
    "SELECT * FROM products WHERE sync_action != 'delete'"
  ) as any[];
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
  const now = new Date().toISOString();
  db.runSync(
    "INSERT INTO products (id, name, basePrice, stockQty, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, 'pending', 'create', ?)",
    [id, body.name, body.basePrice, body.stockQty, now]
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.products });
  triggerSync();
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
  const now = new Date().toISOString();
  
  // Check if this row was created locally but never synced
  const existing = db.getFirstSync(
    "SELECT sync_action FROM products WHERE id = ?",
    [id]
  ) as any;
  const action = existing?.sync_action === "create" ? "create" : "update";

  db.runSync(
    "UPDATE products SET name = ?, basePrice = ?, stockQty = ?, sync_status = 'pending', sync_action = ?, updated_at = ? WHERE id = ?",
    [body.name, body.basePrice, body.stockQty, action, now, id]
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.products });
  triggerSync();
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
    if (row.sync_status === 'pending' && row.sync_action === 'create') {
      // Never synced — hard delete
      db.runSync('DELETE FROM products WHERE id = ?', [id]);
    } else {
      // Already on server — soft-delete
      db.runSync(
        "UPDATE products SET sync_status = 'pending', sync_action = 'delete', updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id]
      );
    }
  }

  queryClient.invalidateQueries({ queryKey: queryKeys.products });
  triggerSync();
  
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
