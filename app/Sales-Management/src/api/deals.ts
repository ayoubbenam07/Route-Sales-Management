import { getDb, generateId } from "@/lib/db";
import { type Deal, type DealStatus } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";
import { useAuth } from "@/stores/auth";
import { triggerSync } from "@/lib/offlineSync";

export async function fetchDeals(status?: DealStatus): Promise<Deal[]> {
  const db = getDb();
  
  // Show all deals in the local DB (per-user DB is already scoped by setDbUser)
  let query = "SELECT * FROM deals WHERE sync_action != 'delete'";
  const params: any[] = [];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY createdAt DESC';
  
  const deals = db.getAllSync(query, params) as any[];
  
  return deals.map(d => {
    const items = db.getAllSync(
      "SELECT * FROM deal_items WHERE dealId = ? AND sync_action != 'delete'",
      [d.id]
    ) as any[];
    return {
      id: d.id,
      reference: `DEAL-${d.id.slice(0, 8).toUpperCase()}`,
      supermarketId: d.supermarketId,
      supermarketName: d.supermarketName,
      buyerId: d.buyerId,
      buyerName: d.buyerName,
      items: items.map(it => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
      total: d.totalAmount,
      paid: d.paid,
      remaining: d.remaining,
      status: d.status,
      createdAt: d.createdAt,
    };
  });
}

export async function fetchDeal(id: string): Promise<Deal> {
  const db = getDb();
  const d = db.getFirstSync('SELECT * FROM deals WHERE id = ?', [id]) as any;
  if (!d) throw new Error("Deal not found");
  
  const items = db.getAllSync(
    "SELECT * FROM deal_items WHERE dealId = ? AND sync_action != 'delete'",
    [d.id]
  ) as any[];
  
  return {
    id: d.id,
    reference: `DEAL-${d.id.slice(0, 8).toUpperCase()}`,
    supermarketId: d.supermarketId,
    supermarketName: d.supermarketName,
    buyerId: d.buyerId,
    buyerName: d.buyerName,
    items: items.map(it => ({
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    })),
    total: d.totalAmount,
    paid: d.paid,
    remaining: d.remaining,
    status: d.status,
    createdAt: d.createdAt,
  };
}

export async function createDeal(body: {
  supermarketId: string;
  items: Array<{ productId: string; quantity: number; unitPrice: number; productName?: string }>;
  initialPayment: number;
}): Promise<Deal> {
  const db = getDb();
  const id = generateId();
  const totalAmount = body.items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const remaining = Math.max(0, totalAmount - body.initialPayment);
  const status = remaining > 0 ? (body.initialPayment > 0 ? "PARTIAL" : "UNPAID") : "PAID";
  const createdAt = new Date().toISOString();

  const sm = db.getFirstSync('SELECT name FROM supermarkets WHERE id = ?', [body.supermarketId]) as any;
  const supermarketName = sm ? sm.name : "Client";
  
  const currentUser = useAuth.getState().user;
  const buyerId = currentUser?.id || "";
  const buyerName = currentUser?.name || "";

  // Use a transaction for deal and items
  db.withTransactionSync(() => {
    db.runSync(
      "INSERT INTO deals (id, supermarketId, supermarketName, buyerId, buyerName, totalAmount, paid, remaining, status, createdAt, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'create', ?)",
      [id, body.supermarketId, supermarketName, buyerId, buyerName, totalAmount, body.initialPayment, remaining, status, createdAt, createdAt]
    );

    for (const item of body.items) {
      db.runSync(
        "INSERT INTO deal_items (id, dealId, productId, productName, quantity, unitPrice, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'create', ?)",
        [generateId(), id, item.productId, item.productName || "", item.quantity, item.unitPrice, createdAt]
      );
    }
    
    if (body.initialPayment > 0) {
      db.runSync(
        "INSERT INTO payments (id, dealId, amount, paymentDate, method, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 'create', ?)",
        [generateId(), id, body.initialPayment, createdAt, "CASH", createdAt]
      );
    }
    // totalDebt is computed dynamically — no static update needed
  });

  queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
  
  // Fire-and-forget background sync
  triggerSync();
  
  return fetchDeal(id);
}

export async function deleteDeal(id: string): Promise<void> {
  const db = getDb();
  const deal = db.getFirstSync('SELECT * FROM deals WHERE id = ?', [id]) as any;
  if (!deal) return;

  db.withTransactionSync(() => {
    // totalDebt is computed dynamically — no static update needed

    if (deal.sync_status === 'pending' && deal.sync_action === 'create') {
      // Never synced to server — safe to hard-delete locally
      db.runSync('DELETE FROM deal_items WHERE dealId = ?', [id]);
      db.runSync('DELETE FROM payments WHERE dealId = ?', [id]);
      db.runSync('DELETE FROM deals WHERE id = ?', [id]);
    } else {
      // Already on server — soft-delete, sync engine will send DELETE
      db.runSync(
        "UPDATE deals SET sync_status = 'pending', sync_action = 'delete', updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id]
      );
      db.runSync(
        "UPDATE deal_items SET sync_status = 'pending', sync_action = 'delete' WHERE dealId = ?",
        [id]
      );
      db.runSync(
        "UPDATE payments SET sync_status = 'pending', sync_action = 'delete' WHERE dealId = ?",
        [id]
      );
    }
  });

  queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });

  // Fire-and-forget background sync
  triggerSync();
}
