import { mapSupermarket, type ApiSupermarket, type Supermarket } from "@/lib/types";
import { getDb, generateId } from "@/lib/db";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";

export async function fetchSupermarkets(): Promise<Supermarket[]> {
  const db = getDb();
  const rows = db.getAllSync('SELECT * FROM supermarkets') as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    address: r.address || "",
    totalDebt: r.totalDebt,
  }));
}

export async function fetchSupermarket(id: string): Promise<Supermarket & { deals?: unknown[] }> {
  const db = getDb();
  const row = db.getFirstSync('SELECT * FROM supermarkets WHERE id = ?', [id]) as any;
  if (!row) throw new Error("Not found");
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address || "",
    totalDebt: row.totalDebt,
  };
}

export async function createSupermarket(body: {
  name: string;
  phone: string;
  address: string;
}): Promise<Supermarket> {
  const db = getDb();
  const id = generateId();
  db.runSync(
    'INSERT INTO supermarkets (id, name, phone, address, totalDebt, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
    [id, body.name, body.phone, body.address, 0, 'pending']
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
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
  db.runSync(
    'UPDATE supermarkets SET name = ?, phone = ?, address = ?, sync_status = ? WHERE id = ?',
    [body.name, body.phone, body.address, 'pending', id]
  );
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  const row = db.getFirstSync('SELECT * FROM supermarkets WHERE id = ?', [id]) as any;
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    address: row.address || "",
    totalDebt: row.totalDebt,
  };
}
