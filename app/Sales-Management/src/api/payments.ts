import { getDb, generateId } from "@/lib/db";
import type { ApiPayment, PaymentMethod } from "@/lib/types";
import { triggerSync } from "@/lib/offlineSync";

export async function fetchPayments(): Promise<ApiPayment[]> {
  const db = getDb();
  const rows = db.getAllSync(
    "SELECT * FROM payments WHERE sync_action != 'delete' ORDER BY paymentDate DESC"
  ) as any[];
  return rows.map(r => ({
    id: r.id,
    dealId: r.dealId,
    amount: r.amount,
    paymentDate: r.paymentDate,
    method: r.method,
  }));
}

export async function createPayment(body: {
  dealId: string;
  amount: number;
  method: PaymentMethod;
}): Promise<ApiPayment> {
  const db = getDb();
  const id = generateId();
  const paymentDate = new Date().toISOString();

  db.withTransactionSync(() => {
    // Create payment
    db.runSync(
      "INSERT INTO payments (id, dealId, amount, paymentDate, method, sync_status, sync_action, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', 'create', ?)",
      [id, body.dealId, body.amount, paymentDate, body.method, paymentDate]
    );

    // Update deal
    db.runSync(
      'UPDATE deals SET paid = paid + ?, remaining = remaining - ? WHERE id = ?',
      [body.amount, body.amount, body.dealId]
    );

    // Update deal status based on remaining
    const deal = db.getFirstSync('SELECT remaining FROM deals WHERE id = ?', [body.dealId]) as any;
    if (deal) {
      const status = deal.remaining <= 0 ? 'PAID' : 'PARTIAL';
      db.runSync('UPDATE deals SET status = ? WHERE id = ?', [status, body.dealId]);
    }

    // totalDebt is computed dynamically — no static update needed
  });

  // Fire-and-forget background sync
  triggerSync();

  return {
    id,
    dealId: body.dealId,
    amount: body.amount,
    paymentDate,
    method: body.method,
  };
}

export function cashCollectedToday(payments: ApiPayment[]): number {
  const today = new Date().toDateString();
  return payments
    .filter((p) => new Date(p.paymentDate).toDateString() === today)
    .reduce((s, p) => s + p.amount, 0);
}

export async function fetchPaymentsByDeal(dealId: string): Promise<ApiPayment[]> {
  const db = getDb();
  const rows = db.getAllSync(
    "SELECT * FROM payments WHERE dealId = ? AND sync_action != 'delete' ORDER BY paymentDate DESC",
    [dealId]
  ) as any[];
  return rows.map(r => ({
    id: r.id,
    dealId: r.dealId,
    amount: r.amount,
    paymentDate: r.paymentDate,
    method: r.method,
  }));
}

export async function deletePayment(id: string): Promise<void> {
  const db = getDb();
  
  const payment = db.getFirstSync('SELECT * FROM payments WHERE id = ?', [id]) as any;
  if (!payment) return;

  db.withTransactionSync(() => {
    // Reverse the payment amount from deal
    db.runSync(
      'UPDATE deals SET paid = paid - ?, remaining = remaining + ? WHERE id = ?',
      [payment.amount, payment.amount, payment.dealId]
    );

    // Update deal status
    const deal = db.getFirstSync('SELECT remaining, totalAmount FROM deals WHERE id = ?', [payment.dealId]) as any;
    if (deal) {
      let status = 'UNPAID';
      if (deal.remaining <= 0) {
        status = 'PAID';
      } else if (deal.remaining < deal.totalAmount) {
        status = 'PARTIAL';
      }
      db.runSync('UPDATE deals SET status = ? WHERE id = ?', [status, payment.dealId]);
    }

    if (payment.sync_status === 'pending' && payment.sync_action === 'create') {
      db.runSync('DELETE FROM payments WHERE id = ?', [id]);
    } else {
      db.runSync(
        "UPDATE payments SET sync_status = 'pending', sync_action = 'delete', updated_at = ? WHERE id = ?",
        [new Date().toISOString(), id]
      );
    }
  });

  triggerSync();
}
