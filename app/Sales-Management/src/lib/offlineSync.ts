import { Alert } from "react-native";
import { AppState } from "react-native";
import { syncQueue } from "./storage";

interface QueuedRequest {
  id: string;
  method: "POST" | "PUT" | "DELETE";
  url: string;
  payload: unknown;
  timestamp: number;
}

export async function queueRequest(
  method: "POST" | "PUT" | "DELETE",
  url: string,
  payload?: unknown
): Promise<string> {
  const offlineId = `offline-${Date.now()}`;
  const queuedRequest: QueuedRequest = {
    id: offlineId,
    method,
    url,
    payload,
    timestamp: Date.now(),
  };
  await syncQueue.setItem(offlineId, queuedRequest);
  return offlineId;
}

export async function processSyncQueue() {
  const keys = await syncQueue.keys();
  if (keys.length === 0) return;

  const { apiPost, apiPut, apiDelete } = await import("./api");

  let successCount = 0;
  let failureCount = 0;

  for (const key of keys) {
    const req = await syncQueue.getItem<QueuedRequest>(key);
    if (!req) continue;
    try {
      if (req.method === "POST") {
        await apiPost(req.url, req.payload);
      } else if (req.method === "PUT") {
        await apiPut(req.url, req.payload);
      } else if (req.method === "DELETE") {
        await apiDelete(req.url);
      }
      await syncQueue.removeItem(key);
      successCount++;
    } catch (error) {
      console.error(`Failed to sync queued request ${key}`, error);
      failureCount++;
    }
  }

  if (successCount > 0) {
    // Sync silently
  }
  if (failureCount > 0 && successCount === 0) {
    // Stay quiet when still offline — avoid alert spam
  }

  // Also process pending SQLite changes
  await triggerBackgroundSync();
}

export async function triggerBackgroundSync() {
  try {
    const { getDb } = await import("./db");
    const { apiPost } = await import("./api");
    const db = getDb();

    // 1. Supermarkets
    const pendingSupermarkets = db.getAllSync("SELECT * FROM supermarkets WHERE sync_status = 'pending'") as any[];
    for (const sm of pendingSupermarkets) {
      try {
        const newSm: any = await apiPost('/supermarkets', sm);
        if (newSm && newSm.id) {
          db.runSync("UPDATE supermarkets SET sync_status = 'synced', id = ? WHERE id = ?", [newSm.id, sm.id]);
          db.runSync("UPDATE deals SET supermarketId = ? WHERE supermarketId = ?", [newSm.id, sm.id]);
        } else {
          db.runSync("UPDATE supermarkets SET sync_status = 'synced' WHERE id = ?", [sm.id]);
        }
      } catch (e) {
        console.error('Background sync failed for supermarket', sm.id);
      }
    }

    // 2. Deals
    const pendingDeals = db.getAllSync("SELECT * FROM deals WHERE sync_status = 'pending'") as any[];
    for (const deal of pendingDeals) {
      const items = db.getAllSync("SELECT * FROM deal_items WHERE dealId = ?", [deal.id]) as any[];
      const payments = db.getAllSync("SELECT * FROM payments WHERE dealId = ?", [deal.id]) as any[];
      try {
        const payload = {
          id: deal.id,
          supermarketId: deal.supermarketId,
          items: items.map((it: any) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice
          })),
          initialPayment: payments.length > 0 ? payments[0].amount : 0
        };
        const newDeal: any = await apiPost('/deals', payload);
        if (newDeal && newDeal.id) {
          db.runSync("UPDATE deals SET sync_status = 'synced', id = ? WHERE id = ?", [newDeal.id, deal.id]);
          db.runSync("UPDATE deal_items SET sync_status = 'synced', dealId = ? WHERE dealId = ?", [newDeal.id, deal.id]);
          db.runSync("UPDATE payments SET sync_status = 'synced', dealId = ? WHERE dealId = ?", [newDeal.id, deal.id]);
        } else {
          db.runSync("UPDATE deals SET sync_status = 'synced' WHERE id = ?", [deal.id]);
          db.runSync("UPDATE deal_items SET sync_status = 'synced' WHERE dealId = ?", [deal.id]);
          db.runSync("UPDATE payments SET sync_status = 'synced' WHERE dealId = ?", [deal.id]);
        }
      } catch (e: any) {
        console.error('Background sync failed for deal', deal.id, e?.message || e);
      }
    }

    // 2.5 Payments
    const pendingPayments = db.getAllSync("SELECT * FROM payments WHERE sync_status = 'pending'") as any[];
    for (const p of pendingPayments) {
      try {
        const payload = {
          id: p.id,
          dealId: p.dealId,
          amount: p.amount,
          paymentDate: p.paymentDate,
          method: p.method
        };
        const newP: any = await apiPost('/payments', payload);
        if (newP && newP.id) {
          db.runSync("UPDATE payments SET sync_status = 'synced', id = ? WHERE id = ?", [newP.id, p.id]);
        } else {
          db.runSync("UPDATE payments SET sync_status = 'synced' WHERE id = ?", [p.id]);
        }
      } catch (e: any) {
        console.error('Background sync failed for payment', p.id, e?.message || e);
      }
    }
    
    // 2.6 Deal Items (just in case they are pending separately)
    const pendingItems = db.getAllSync("SELECT * FROM deal_items WHERE sync_status = 'pending'") as any[];
    for (const it of pendingItems) {
      try {
        const payload = {
          id: it.id,
          dealId: it.dealId,
          productId: it.productId,
          productName: it.productName,
          quantity: it.quantity,
          unitPrice: it.unitPrice
        };
        const newIt: any = await apiPost('/deal-items', payload).catch(() => apiPost('/deal_items', payload));
        if (newIt && newIt.id) {
          db.runSync("UPDATE deal_items SET sync_status = 'synced', id = ? WHERE id = ?", [newIt.id, it.id]);
        } else {
          db.runSync("UPDATE deal_items SET sync_status = 'synced' WHERE id = ?", [it.id]);
        }
      } catch (e: any) {
        console.error('Background sync failed for deal item', it.id, e?.message || e);
      }
    }

    // 3. Products
    const pendingProducts = db.getAllSync("SELECT * FROM products WHERE sync_status = 'pending'") as any[];
    for (const p of pendingProducts) {
      try {
        const newP: any = await apiPost('/products', p);
        if (newP && newP.id) {
          db.runSync("UPDATE products SET sync_status = 'synced', id = ? WHERE id = ?", [newP.id, p.id]);
        } else {
          db.runSync("UPDATE products SET sync_status = 'synced' WHERE id = ?", [p.id]);
        }
      } catch (e) {
        console.error('Background sync failed for product', p.id);
      }
    }

  } catch (err: any) {
    console.error('Background sync error', err?.message || err);
  }
}

export async function pullRemoteData() {
  try {
    const { getDb } = await import("./db");
    const { apiGet } = await import("./api");
    const db = getDb();

    console.log("Downloading remote data as source of truth...");
    
    try {
      const supermarkets = await apiGet<any[]>("/supermarkets");
      db.withTransactionSync(() => {
        for (const sm of supermarkets) {
          db.runSync(
            "INSERT OR REPLACE INTO supermarkets (id, name, phone, address, totalDebt, sync_status) VALUES (?, ?, ?, ?, ?, 'synced')",
            [sm.id, sm.name, sm.phone, sm.address || "", sm.totalDebt || 0]
          );
        }
      });
    } catch (e: any) { console.error("Error pulling supermarkets", e?.message); }

    try {
      const products = await apiGet<any[]>("/products");
      db.withTransactionSync(() => {
        for (const p of products) {
          db.runSync(
            "INSERT OR REPLACE INTO products (id, name, basePrice, stockQty, sync_status) VALUES (?, ?, ?, ?, 'synced')",
            [p.id, p.name, p.basePrice, p.stockQty || p.stock || 0]
          );
        }
      });
    } catch (e: any) { console.error("Error pulling products", e?.message); }

    try {
      const deals = await apiGet<any[]>("/deals");
      db.withTransactionSync(() => {
        for (const d of deals) {
          db.runSync(
            "INSERT OR REPLACE INTO deals (id, supermarketId, supermarketName, buyerId, buyerName, totalAmount, paid, remaining, status, createdAt, sync_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced')",
            [d.id, d.supermarketId || d.supermarket?.id || "", d.supermarket?.name || "", d.buyerId || d.buyer?.id || "", d.buyer?.name || "", d.totalAmount, d.paymentSummary?.totalPaid || d.paid || 0, d.paymentSummary?.remainingBalance || d.remaining || 0, d.status, d.createdAt || new Date().toISOString()]
          );
          if (Array.isArray(d.items)) {
            for (const it of d.items) {
              db.runSync(
                "INSERT OR REPLACE INTO deal_items (id, dealId, productId, productName, quantity, unitPrice, sync_status) VALUES (?, ?, ?, ?, ?, ?, 'synced')",
                [it.id || Date.now().toString() + Math.random(), d.id, it.productId || it.product?.id || "", it.productName || it.product?.name || "", it.quantity, it.unitPrice]
              );
            }
          }
          if (Array.isArray(d.payments)) {
            for (const p of d.payments) {
              db.runSync(
                "INSERT OR REPLACE INTO payments (id, dealId, amount, paymentDate, method, sync_status) VALUES (?, ?, ?, ?, ?, 'synced')",
                [p.id || Date.now().toString() + Math.random(), d.id, p.amount, p.paymentDate || p.createdAt || new Date().toISOString(), p.method || 'CASH']
              );
            }
          }
        }
      });
    } catch (e: any) { console.error("Error pulling deals", e?.message); }
    
    console.log("Remote data pull completed.");
  } catch (err: any) {
    console.error('Remote pull error', err?.message || err);
  }
}

let started = false;

export function startOfflineSyncListener() {
  if (started) return;
  started = true;

  // Retry queued writes when app returns to foreground
  AppState.addEventListener("change", (state) => {
    if (state === "active") processSyncQueue();
  });

  // Periodic retry
  setInterval(() => {
    processSyncQueue();
  }, 20000);
}
