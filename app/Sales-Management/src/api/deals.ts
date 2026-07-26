import { getDb, generateId } from "@/lib/db";
import { type Deal, type DealStatus } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { queryKeys } from "@/api/queryKeys";

import { useAuth } from "@/stores/auth";

export async function fetchDeals(status?: DealStatus): Promise<Deal[]> {
  const db = getDb();
  const currentUser = useAuth.getState().user;
  
  let query = 'SELECT * FROM deals WHERE buyerId = ?';
  const params: any[] = [currentUser?.id || ""];
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  query += ' ORDER BY createdAt DESC';
  
  const deals = db.getAllSync(query, params) as any[];
  
  return deals.map(d => {
    const items = db.getAllSync('SELECT * FROM deal_items WHERE dealId = ?', [d.id]) as any[];
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
  
  const items = db.getAllSync('SELECT * FROM deal_items WHERE dealId = ?', [d.id]) as any[];
  
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

  // Find supermarket name
  const sm = db.getFirstSync('SELECT name FROM supermarkets WHERE id = ?', [body.supermarketId]) as any;
  const supermarketName = sm ? sm.name : "Client";

  // Use a transaction for deal and items
  db.withTransactionSync(() => {
    db.runSync(
      'INSERT INTO deals (id, supermarketId, supermarketName, buyerId, buyerName, totalAmount, paid, remaining, status, createdAt, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, body.supermarketId, supermarketName, "", "", totalAmount, body.initialPayment, remaining, status, createdAt, 'pending']
    );

    for (const item of body.items) {
      db.runSync(
        'INSERT INTO deal_items (id, dealId, productId, productName, quantity, unitPrice, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [generateId(), id, item.productId, item.productName || "", item.quantity, item.unitPrice, 'pending']
      );
    }
    
    if (body.initialPayment > 0) {
      db.runSync(
        'INSERT INTO payments (id, dealId, amount, paymentDate, method, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
        [generateId(), id, body.initialPayment, createdAt, "CASH", 'pending']
      );
    }
    
    // Update supermarket debt
    db.runSync(
      'UPDATE supermarkets SET totalDebt = totalDebt + ? WHERE id = ?',
      [remaining, body.supermarketId]
    );
  });

  queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
  
  return fetchDeal(id);
}

export async function deleteDeal(id: string): Promise<void> {
  const db = getDb();
  const deal = db.getFirstSync('SELECT * FROM deals WHERE id = ?', [id]) as any;
  if (!deal) return;

  db.withTransactionSync(() => {
    // Decrease supermarket debt
    db.runSync(
      'UPDATE supermarkets SET totalDebt = totalDebt - ? WHERE id = ?',
      [deal.remaining, deal.supermarketId]
    );
    // Note: To implement a real offline deletion sync, you'd usually soft-delete or track deleted IDs.
    // For now we'll just hard-delete.
    db.runSync('DELETE FROM deal_items WHERE dealId = ?', [id]);
    db.runSync('DELETE FROM payments WHERE dealId = ?', [id]);
    db.runSync('DELETE FROM deals WHERE id = ?', [id]);
  });

  queryClient.invalidateQueries({ queryKey: queryKeys.deals() });
  queryClient.invalidateQueries({ queryKey: queryKeys.supermarkets });
  queryClient.invalidateQueries({ queryKey: queryKeys.buyerDashboard });
}
