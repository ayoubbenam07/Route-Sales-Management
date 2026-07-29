import { AppState } from "react-native";
import { getIsOnline } from "./netInfo";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SyncResult {
  pushed: { supermarkets: number; products: number; deals: number; payments: number };
  pulled: { supermarkets: number; products: number; deals: number; payments: number };
  errors: string[];
}

function emptySyncResult(): SyncResult {
  return {
    pushed: { supermarkets: 0, products: 0, deals: 0, payments: 0 },
    pulled: { supermarkets: 0, products: 0, deals: 0, payments: 0 },
    errors: [],
  };
}

// ─── Sync Lock ───────────────────────────────────────────────────────────────

let syncing = false;

// ─── PUSH: Local → Remote ────────────────────────────────────────────────────

async function pushPendingChanges(result: SyncResult): Promise<void> {
  const { getDb } = await import("./db");
  const { apiPost, apiPut, apiDelete } = await import("./api");
  const db = getDb();

  // 1. Push Supermarkets (must be first — deals reference them)
  const pendingSupermarkets = db.getAllSync(
    "SELECT * FROM supermarkets WHERE sync_status = 'pending'"
  ) as any[];

  for (const sm of pendingSupermarkets) {
    try {
      const action = sm.sync_action || "create";
      if (action === "create") {
        const newSm: any = await apiPost("/supermarkets", {
          name: sm.name,
          phone: sm.phone,
          address: sm.address || "",
        });
        if (newSm && newSm.id && newSm.id !== sm.id) {
          // Server assigned a new ID — remap everywhere
          db.withTransactionSync(() => {
            db.runSync(
              "UPDATE deals SET supermarketId = ? WHERE supermarketId = ?",
              [newSm.id, sm.id]
            );
            db.runSync(
              "UPDATE supermarkets SET id = ?, sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
              [newSm.id, sm.id]
            );
          });
        } else {
          db.runSync(
            "UPDATE supermarkets SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
            [sm.id]
          );
        }
      } else if (action === "update") {
        await apiPut(`/supermarkets/${sm.id}`, {
          name: sm.name,
          phone: sm.phone,
          address: sm.address || "",
        });
        db.runSync(
          "UPDATE supermarkets SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
          [sm.id]
        );
      } else if (action === "delete") {
        await apiDelete(`/supermarkets/${sm.id}`);
        db.runSync("DELETE FROM supermarkets WHERE id = ?", [sm.id]);
      }
      result.pushed.supermarkets++;
    } catch (e: any) {
      result.errors.push(`Supermarket ${sm.name}: ${e?.message || e}`);
    }
  }

  // 2. Push Products (must be before deals — deals reference products)
  const pendingProducts = db.getAllSync(
    "SELECT * FROM products WHERE sync_status = 'pending'"
  ) as any[];

  for (const p of pendingProducts) {
    try {
      const action = p.sync_action || "create";
      if (action === "create") {
        const newP: any = await apiPost("/products", {
          name: p.name,
          basePrice: p.basePrice,
          stockQty: p.stockQty,
        });
        if (newP && newP.id && newP.id !== p.id) {
          db.withTransactionSync(() => {
            db.runSync(
              "UPDATE deal_items SET productId = ? WHERE productId = ?",
              [newP.id, p.id]
            );
            db.runSync(
              "UPDATE products SET id = ?, sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
              [newP.id, p.id]
            );
          });
        } else {
          db.runSync(
            "UPDATE products SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
            [p.id]
          );
        }
      } else if (action === "update") {
        await apiPut(`/products/${p.id}`, {
          name: p.name,
          basePrice: p.basePrice,
          stockQty: p.stockQty,
        });
        db.runSync(
          "UPDATE products SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
          [p.id]
        );
      } else if (action === "delete") {
        await apiDelete(`/products/${p.id}`);
        db.runSync("DELETE FROM products WHERE id = ?", [p.id]);
      }
      result.pushed.products++;
    } catch (e: any) {
      result.errors.push(`Product ${p.name}: ${e?.message || e}`);
    }
  }

  // 3. Push Deals (with their items and initial payments)
  const pendingDeals = db.getAllSync(
    "SELECT * FROM deals WHERE sync_status = 'pending'"
  ) as any[];

  for (const deal of pendingDeals) {
    try {
      const action = deal.sync_action || "create";
      if (action === "create") {
        const items = db.getAllSync(
          "SELECT * FROM deal_items WHERE dealId = ?",
          [deal.id]
        ) as any[];
        const payments = db.getAllSync(
          "SELECT * FROM payments WHERE dealId = ?",
          [deal.id]
        ) as any[];

        const payload = {
          id: deal.id,
          supermarketId: deal.supermarketId,
          items: items.map((it: any) => ({
            productId: it.productId,
            productName: it.productName || undefined,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          })),
          initialPayment: payments.length > 0 ? payments[0].amount : 0,
        };

        const newDeal: any = await apiPost("/deals", payload);
        if (newDeal && newDeal.id) {
          db.withTransactionSync(() => {
            db.runSync(
              "UPDATE deals SET sync_status = 'synced', sync_action = 'synced', id = ? WHERE id = ?",
              [newDeal.id, deal.id]
            );
            db.runSync(
              "UPDATE deal_items SET sync_status = 'synced', sync_action = 'synced', dealId = ? WHERE dealId = ?",
              [newDeal.id, deal.id]
            );
            if (payments.length > 0) {
              const firstPaymentId = payments[0].id;
              const serverPaymentId = (newDeal.payments && newDeal.payments.length > 0) ? newDeal.payments[0].id : firstPaymentId;
              db.runSync(
                "UPDATE payments SET sync_status = 'synced', sync_action = 'synced', dealId = ?, id = ? WHERE id = ?",
                [newDeal.id, serverPaymentId, firstPaymentId]
              );
              if (payments.length > 1) {
                db.runSync(
                  "UPDATE payments SET dealId = ? WHERE dealId = ?",
                  [newDeal.id, deal.id]
                );
              }
            }
          });
        } else {
          db.withTransactionSync(() => {
            db.runSync(
              "UPDATE deals SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
              [deal.id]
            );
            db.runSync(
              "UPDATE deal_items SET sync_status = 'synced', sync_action = 'synced' WHERE dealId = ?",
              [deal.id]
            );
            if (payments.length > 0) {
              const firstPaymentId = payments[0].id;
              db.runSync(
                "UPDATE payments SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
                [firstPaymentId]
              );
            }
          });
        }
      } else if (action === "delete") {
        await apiDelete(`/deals/${deal.id}`);
        db.withTransactionSync(() => {
          db.runSync("DELETE FROM deal_items WHERE dealId = ?", [deal.id]);
          db.runSync("DELETE FROM payments WHERE dealId = ?", [deal.id]);
          db.runSync("DELETE FROM deals WHERE id = ?", [deal.id]);
        });
      }
      result.pushed.deals++;
    } catch (e: any) {
      result.errors.push(`Deal ${deal.id}: ${e?.message || e}`);
    }
  }

  // 4. Push standalone Payments (created after deal was already synced)
  const pendingPayments = db.getAllSync(
    "SELECT p.* FROM payments p INNER JOIN deals d ON p.dealId = d.id WHERE p.sync_status = 'pending' AND d.sync_status = 'synced'"
  ) as any[];

  for (const payment of pendingPayments) {
    try {
      const action = payment.sync_action || "create";
      if (action === "create") {
        const newPayment: any = await apiPost("/payment", {
          dealId: payment.dealId,
          amount: payment.amount,
          method: payment.method,
          paymentDate: payment.paymentDate,
        });
        if (newPayment && newPayment.id && newPayment.id !== payment.id) {
          db.runSync(
            "UPDATE payments SET id = ?, sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
            [newPayment.id, payment.id]
          );
        } else {
          db.runSync(
            "UPDATE payments SET sync_status = 'synced', sync_action = 'synced' WHERE id = ?",
            [payment.id]
          );
        }
      } else if (action === "delete") {
        await apiDelete(`/payment/${payment.id}`);
        db.runSync("DELETE FROM payments WHERE id = ?", [payment.id]);
      }
      result.pushed.payments++;
    } catch (e: any) {
      result.errors.push(`Payment ${payment.id}: ${e?.message || e}`);
    }
  }
}

// ─── PULL: Remote → Local ────────────────────────────────────────────────────

async function pullRemoteChanges(result: SyncResult): Promise<void> {
  const { getDb } = await import("./db");
  const { apiGet } = await import("./api");
  const db = getDb();

  // Pull Supermarkets
  try {
    const supermarkets = await apiGet<any[]>("/supermarkets");
    db.withTransactionSync(() => {
      // Only replace rows that are already synced (don't overwrite pending local changes)
      for (const sm of supermarkets) {
        const local = db.getFirstSync(
          "SELECT sync_status FROM supermarkets WHERE id = ?",
          [sm.id]
        ) as any;

        if (!local) {
          // New from server — totalDebt column is kept for reference but not used;
          // the app computes debt dynamically from the deals table.
          db.runSync(
            "INSERT INTO supermarkets (id, name, phone, address, totalDebt, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, 'synced', 'synced', ?)",
            [sm.id, sm.name, sm.phone, sm.address || "", sm.totalDebt || 0, new Date().toISOString()]
          );
          result.pulled.supermarkets++;
        } else if (local.sync_status === "synced") {
          // Update synced row with server data
          db.runSync(
            "UPDATE supermarkets SET name = ?, phone = ?, address = ?, totalDebt = ?, sync_status = 'synced', sync_action = 'synced', updated_at = ? WHERE id = ?",
            [sm.name, sm.phone, sm.address || "", sm.totalDebt || 0, new Date().toISOString(), sm.id]
          );
          result.pulled.supermarkets++;
        }
        // If pending, skip — local change takes priority until pushed
      }

      // Remove locally-synced supermarkets that no longer exist on server
      const serverIds = supermarkets.map((s: any) => s.id);
      const allLocal = db.getAllSync(
        "SELECT id FROM supermarkets WHERE sync_status = 'synced'"
      ) as any[];
      for (const local of allLocal) {
        if (!serverIds.includes(local.id)) {
          db.runSync("DELETE FROM supermarkets WHERE id = ? AND sync_status = 'synced'", [local.id]);
        }
      }
    });
  } catch (e: any) {
    result.errors.push(`Pull supermarkets: ${e?.message || e}`);
  }

  // Pull Products
  try {
    const products = await apiGet<any[]>("/products");
    db.withTransactionSync(() => {
      for (const p of products) {
        const local = db.getFirstSync(
          "SELECT sync_status FROM products WHERE id = ?",
          [p.id]
        ) as any;

        if (!local) {
          db.runSync(
            "INSERT INTO products (id, name, basePrice, stockQty, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, 'synced', 'synced', ?)",
            [p.id, p.name, p.basePrice, p.stockQty || p.stock || 0, new Date().toISOString()]
          );
          result.pulled.products++;
        } else if (local.sync_status === "synced") {
          db.runSync(
            "UPDATE products SET name = ?, basePrice = ?, stockQty = ?, sync_status = 'synced', sync_action = 'synced', updated_at = ? WHERE id = ?",
            [p.name, p.basePrice, p.stockQty || p.stock || 0, new Date().toISOString(), p.id]
          );
          result.pulled.products++;
        }
      }

      const serverIds = products.map((p: any) => p.id);
      const allLocal = db.getAllSync(
        "SELECT id FROM products WHERE sync_status = 'synced'"
      ) as any[];
      for (const local of allLocal) {
        if (!serverIds.includes(local.id)) {
          db.runSync("DELETE FROM products WHERE id = ? AND sync_status = 'synced'", [local.id]);
        }
      }
    });
  } catch (e: any) {
    result.errors.push(`Pull products: ${e?.message || e}`);
  }

  // Pull Deals (with items and payments)
  try {
    const deals = await apiGet<any[]>("/deals");
    db.withTransactionSync(() => {
      for (const d of deals) {
        // Robustly compute paid/remaining from the server response
        const totalAmount = d.totalAmount ?? 0;
        let paid: number;
        let remaining: number;

        if (d.paymentSummary) {
          // Best source: the server's computed summary
          paid = d.paymentSummary.totalPaid ?? 0;
          remaining = d.paymentSummary.remainingBalance ?? Math.max(0, totalAmount - paid);
        } else if (Array.isArray(d.payments) && d.payments.length > 0) {
          // Fallback: sum the payments array
          paid = d.payments.reduce((s: number, p: any) => s + (p.amount ?? 0), 0);
          remaining = Math.max(0, totalAmount - paid);
        } else {
          // Last resort: use top-level fields if present
          paid = d.paid ?? 0;
          remaining = d.remaining ?? Math.max(0, totalAmount - paid);
        }

        const local = db.getFirstSync(
          "SELECT sync_status FROM deals WHERE id = ?",
          [d.id]
        ) as any;

        if (!local) {
          db.runSync(
            "INSERT INTO deals (id, supermarketId, supermarketName, buyerId, buyerName, totalAmount, paid, remaining, status, createdAt, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'synced', 'synced', ?)",
            [
              d.id,
              d.supermarketId || d.supermarket?.id || "",
              d.supermarket?.name || d.supermarketName || "",
              d.buyerId || d.buyer?.id || "",
              d.buyer?.name || d.buyerName || "",
              totalAmount,
              paid,
              remaining,
              d.status,
              d.createdAt || new Date().toISOString(),
              new Date().toISOString(),
            ]
          );
          result.pulled.deals++;
        } else if (local.sync_status === "synced") {
          db.runSync(
            "UPDATE deals SET supermarketId = ?, supermarketName = ?, buyerId = ?, buyerName = ?, totalAmount = ?, paid = ?, remaining = ?, status = ?, createdAt = ?, sync_status = 'synced', sync_action = 'synced', updated_at = ? WHERE id = ?",
            [
              d.supermarketId || d.supermarket?.id || "",
              d.supermarket?.name || d.supermarketName || "",
              d.buyerId || d.buyer?.id || "",
              d.buyer?.name || d.buyerName || "",
              totalAmount,
              paid,
              remaining,
              d.status,
              d.createdAt || new Date().toISOString(),
              new Date().toISOString(),
              d.id,
            ]
          );
          result.pulled.deals++;
        }

        // Pull deal items
        if (Array.isArray(d.items)) {
          db.runSync("DELETE FROM deal_items WHERE dealId = ? AND sync_status = 'synced'", [d.id]);
          for (const it of d.items) {
            const itemId = it.id || `${d.id}-${it.productId || it.product?.id || Math.random()}`;
            db.runSync(
              "INSERT OR REPLACE INTO deal_items (id, dealId, productId, productName, quantity, unitPrice, sync_status, sync_action) VALUES (?, ?, ?, ?, ?, ?, 'synced', 'synced')",
              [
                itemId,
                d.id,
                it.productId || it.product?.id || "",
                it.productName || it.product?.name || "",
                it.quantity,
                it.unitPrice,
              ]
            );
          }
        }

        // Pull payments
        if (Array.isArray(d.payments)) {
          db.runSync("DELETE FROM payments WHERE dealId = ? AND sync_status = 'synced'", [d.id]);
          for (const p of d.payments) {
            const paymentId = p.id || `${d.id}-pay-${Math.random()}`;
            const localPayment = db.getFirstSync(
              "SELECT sync_status FROM payments WHERE id = ?",
              [paymentId]
            ) as any;
            
            if (!localPayment || localPayment.sync_status === "synced") {
              db.runSync(
                "INSERT OR REPLACE INTO payments (id, dealId, amount, paymentDate, method, sync_status, sync_action) VALUES (?, ?, ?, ?, ?, 'synced', 'synced')",
                [
                  paymentId,
                  d.id,
                  p.amount,
                  p.paymentDate || p.createdAt || new Date().toISOString(),
                  p.method || "CASH",
                ]
              );
              result.pulled.payments++;
            }
          }
        }
      }

      // Remove synced deals that no longer exist on server
      const serverDealIds = deals.map((d: any) => d.id);
      const allLocalDeals = db.getAllSync(
        "SELECT id FROM deals WHERE sync_status = 'synced'"
      ) as any[];
      for (const local of allLocalDeals) {
        if (!serverDealIds.includes(local.id)) {
          db.runSync("DELETE FROM deal_items WHERE dealId = ? AND sync_status = 'synced'", [local.id]);
          db.runSync("DELETE FROM payments WHERE dealId = ? AND sync_status = 'synced'", [local.id]);
          db.runSync("DELETE FROM deals WHERE id = ? AND sync_status = 'synced'", [local.id]);
        }
      }
    });
  } catch (e: any) {
    result.errors.push(`Pull deals: ${e?.message || e}`);
  }
}

// ─── Full Sync ───────────────────────────────────────────────────────────────

export async function performFullSync(): Promise<SyncResult> {
  if (syncing) {
    return emptySyncResult();
  }

  if (!getIsOnline()) {
    const result = emptySyncResult();
    result.errors.push("Offline — sync skipped");
    return result;
  }

  syncing = true;
  const result = emptySyncResult();

  try {
    // Push first, then pull (so server has our changes before we pull)
    await pushPendingChanges(result);
    await pullRemoteChanges(result);

    // Save last sync timestamp
    const { getDb } = await import("./db");
    const db = getDb();
    db.runSync(
      "INSERT OR REPLACE INTO sync_meta (key, value) VALUES ('last_sync', ?)",
      [new Date().toISOString()]
    );

    // Invalidate React Query cache so UI refreshes
    const { queryClient } = await import("./queryClient");
    queryClient.invalidateQueries();

    console.log("[Sync] Complete:", JSON.stringify(result));
  } catch (err: any) {
    result.errors.push(`Sync error: ${err?.message || err}`);
    console.error("[Sync] Error:", err?.message || err);
  } finally {
    syncing = false;
  }

  return result;
}

/** Trigger a sync in the background (fire-and-forget). Safe to call frequently. */
export function triggerSync() {
  performFullSync().catch((err) =>
    console.error("[Sync] Background sync error:", err?.message || err)
  );
}

/** Get count of pending (unsynced) changes across all tables */
export function getPendingChangesCount(): number {
  try {
    const { getDb } = require("./db");
    const db = getDb();
    const tables = ["supermarkets", "products", "deals", "payments"];
    let count = 0;
    for (const table of tables) {
      const row = db.getFirstSync(
        `SELECT COUNT(*) as cnt FROM ${table} WHERE sync_status = 'pending'`
      ) as any;
      count += row?.cnt || 0;
    }
    return count;
  } catch {
    return 0;
  }
}

/** Get the last sync timestamp */
export function getLastSyncTime(): string | null {
  try {
    const { getDb } = require("./db");
    const db = getDb();
    const row = db.getFirstSync(
      "SELECT value FROM sync_meta WHERE key = 'last_sync'"
    ) as any;
    return row?.value || null;
  } catch {
    return null;
  }
}

// ─── Auto-sync Listener ──────────────────────────────────────────────────────

let started = false;
let syncInterval: ReturnType<typeof setInterval> | null = null;

export function startSyncListener() {
  if (started) return;
  started = true;

  // Sync when app returns to foreground
  AppState.addEventListener("change", (state) => {
    if (state === "active") {
      triggerSync();
    }
  });

  // Periodic sync every 30 seconds
  syncInterval = setInterval(() => {
    if (getIsOnline()) {
      triggerSync();
    }
  }, 30_000);
}

export function stopSyncListener() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  started = false;
}

// ─── Legacy exports for backwards compat ─────────────────────────────────────

/** @deprecated Use triggerSync() instead */
export const triggerBackgroundSync = triggerSync;

/** @deprecated Use performFullSync() instead */
export const processSyncQueue = performFullSync;

/** @deprecated Use performFullSync() instead — pull is part of full sync */
export async function pullRemoteData() {
  return performFullSync();
}

/** @deprecated Use startSyncListener() instead */
export const startOfflineSyncListener = startSyncListener;
