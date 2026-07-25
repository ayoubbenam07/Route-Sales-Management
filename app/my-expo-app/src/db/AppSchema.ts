import { column, Schema, Table } from '@powersync/react-native';

/**
 * Client-side SQLite schema for PowerSync.
 * Regenerate from the PowerSync Dashboard → Connect if Sync Streams change.
 * Note: do not declare an `id` column — PowerSync adds it automatically.
 */
const products = new Table({
  name: column.text,
  basePrice: column.real,
  stockQty: column.real,
});

const supermarkets = new Table({
  name: column.text,
  phone: column.text,
  address: column.text,
  totalDebt: column.real,
});

const deals = new Table({
  createdAt: column.text,
  totalAmount: column.real,
  status: column.text,
  buyerId: column.text,
  supermarketId: column.text,
});

const deal_items = new Table(
  {
    quantity: column.real,
    unitPrice: column.real,
    dealId: column.text,
    productId: column.text,
  },
  { indexes: { deal: ['dealId'] } },
);

const payments = new Table(
  {
    amount: column.real,
    paymentDate: column.text,
    method: column.text,
    dealId: column.text,
  },
  { indexes: { deal: ['dealId'] } },
);

export const AppSchema = new Schema({
  products,
  supermarkets,
  deals,
  deal_items,
  payments,
});

export type Database = (typeof AppSchema)['types'];
export type ProductRecord = Database['products'];
export type SupermarketRecord = Database['supermarkets'];
export type DealRecord = Database['deals'];
export type DealItemRecord = Database['deal_items'];
export type PaymentRecord = Database['payments'];
