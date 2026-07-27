import { type Supermarket } from "@/lib/types";
import { getDb, generateId } from "@/lib/db";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { triggerSync } from "@/lib/offlineSync";

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const db = getDb();
  const rows = db.getAllSync(
    "SELECT * FROM supermarkets WHERE sync_action != 'delete'"
  ) as any[];
  return rows.map(r => {
    // Compute totalDebt dynamically from deals rather than using the static column
    const debtRow = db.getFirstSync(
      "SELECT COALESCE(SUM(remaining), 0) as debt FROM deals WHERE supermarketId = ? AND status != 'PAID' AND sync_action != 'delete'",
      [r.id]
    ) as any;
    return {
      id: r.id,
      name: r.name,
      phone: r.phone,
      address: r.address || "",
      totalDebt: debtRow?.debt ?? 0,
    };
  });
}

export async function fetchSupermarket(id: string): Promise<Supermarket & { deals?: unknown[] }> {
  const db = getDb();
  const row = db.getFirstSync('SELECT * FROM supermarkets WHERE id = ?', [id]) as any;
  if (!row) throw new Error("Not found");
  // Compute totalDebt dynamically from deals
  const debtRow = db.getFirstSync(
    "SELECT COALESCE(SUM(remaining), 0) as debt FROM deals WHERE supermarketId = ? AND status != 'PAID' AND sync_action != 'delete'",
    [id]
  ) as any;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address || "",
    totalDebt: debtRow?.debt ?? 0,
  };
}

export async function createSupermarket(body: {
  name: string;
  phone: string;
  address: string;
}): Promise<Supermarket> {
  const db = getDb();
  const id = generateId();
  const now = new Date().toISOString();
  db.runSync(
    "INSERT INTO supermarkets (id, name, phone, address, totalDebt, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 'create', ?)",
    [id, body.name, body.phone, body.address, 0, now]
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  triggerSync();
  return {
    id,
    name: body.name,
    phone: body.phone,
    address: body.address,
    totalDebt: 0,
  };
}

export async function updateSupermarket(
  id: string,
  body: { name: string; phone: string; address: string },
): Promise<Supermarket> {
  const db = getDb();
  const now = new Date().toISOString();

  // Preserve 'create' action if row was never synced
  const existing = db.getFirstSync(
    "SELECT sync_action FROM supermarkets WHERE id = ?",
    [id]
  ) as any;
  const action = existing?.sync_action === "create" ? "create" : "update";

  db.runSync(
    "UPDATE supermarkets SET name = ?, phone = ?, address = ?, sync_status = 'pending', sync_action = ?, updated_at = ? WHERE id = ?",
    [body.name, body.phone, body.address, action, now, id]
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  triggerSync();
  const row = db.getFirstSync('SELECT * FROM supermarkets WHERE id = ?', [id]) as any;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address || "",
    totalDebt: row.totalDebt,
  };
}
