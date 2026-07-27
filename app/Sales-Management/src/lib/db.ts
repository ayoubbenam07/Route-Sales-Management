import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

let db: SQLite.SQLiteDatabase | null = null;
let currentDbName = 'sales.db';

export function setDbUser(userId: string | null) {
  const newDbName = userId ? `sales_${userId}.db` : 'sales_default.db';
  if (currentDbName !== newDbName) {
    currentDbName = newDbName;
    if (db) {
      db.closeSync();
      db = null;
    }
    // Re-initialize the new database
    initDb();
  }
}

export function getDb() {
  if (!db) {
    db = SQLite.openDatabaseSync(currentDbName);
  }
  return db;
}

export function initDb() {
  const database = getDb();
  database.execSync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS supermarkets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      totalDebt REAL DEFAULT 0,
      sync_status TEXT DEFAULT 'synced'
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      basePrice REAL NOT NULL,
      stockQty INTEGER NOT NULL,
      sync_status TEXT DEFAULT 'synced'
    );
    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      supermarketId TEXT NOT NULL,
      supermarketName TEXT,
      buyerId TEXT,
      buyerName TEXT,
      totalAmount REAL NOT NULL,
      paid REAL DEFAULT 0,
      remaining REAL NOT NULL,
      status TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      sync_status TEXT DEFAULT 'synced'
    );
    CREATE TABLE IF NOT EXISTS deal_items (
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      sync_status TEXT DEFAULT 'synced'
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL,
      method TEXT NOT NULL,
      sync_status TEXT DEFAULT 'synced'
    );
  `);
}

// Generate unique IDs for local creation
export function generateId() {
  return uuidv4();
}

// Ensure the db is initialized
initDb();
