import { getDb, generateId } from "@/lib/db";
import type { ApiPayment, PaymentMethod } from "@/lib/types";
import { triggerBackgroundSync } from "@/lib/offlineSync";

export async function fetchPayments(): Promise<ApiPayment[]> {
  const db = getDb();
  const rows = db.getAllSync('SELECT * FROM payments ORDER BY paymentDate DESC') as any[];
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
      'INSERT INTO payments (id, dealId, amount, paymentDate, method, sync_status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, body.dealId, body.amount, paymentDate, body.method, 'pending']
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

    // Update supermarket totalDebt
    // We need supermarketId from deal
    const dealSm = db.getFirstSync('SELECT supermarketId FROM deals WHERE id = ?', [body.dealId]) as any;
    if (dealSm) {
      db.runSync(
        'UPDATE supermarkets SET totalDebt = totalDebt - ? WHERE id = ?',
        [body.amount, dealSm.supermarketId]
      );
    }
  });

  // Trigger sync for the new payment
  triggerBackgroundSync();

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
