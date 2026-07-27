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

/**
 * Run safe migrations to add new columns to existing tables.
 * Uses try/catch since SQLite doesn't support IF NOT EXISTS for ALTER TABLE.
 */
function migrateDb(database: SQLite.SQLiteDatabase) {
  const migrations: string[] = [
    // sync_action column: 'synced' | 'create' | 'update' | 'delete'
    "ALTER TABLE supermarkets ADD COLUMN sync_action TEXT DEFAULT 'synced'",
    "ALTER TABLE products ADD COLUMN sync_action TEXT DEFAULT 'synced'",
    "ALTER TABLE deals ADD COLUMN sync_action TEXT DEFAULT 'synced'",
    "ALTER TABLE deal_items ADD COLUMN sync_action TEXT DEFAULT 'synced'",
    "ALTER TABLE payments ADD COLUMN sync_action TEXT DEFAULT 'synced'",
    // updated_at column for conflict resolution
    "ALTER TABLE supermarkets ADD COLUMN updated_at TEXT",
    "ALTER TABLE products ADD COLUMN updated_at TEXT",
    "ALTER TABLE deals ADD COLUMN updated_at TEXT",
    "ALTER TABLE deal_items ADD COLUMN updated_at TEXT",
    "ALTER TABLE payments ADD COLUMN updated_at TEXT",
  ];

  for (const sql of migrations) {
    try {
      database.runSync(sql);
    } catch {
      // Column already exists — safe to ignore
    }
  }
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
      sync_status TEXT DEFAULT 'synced',
      sync_action TEXT DEFAULT 'synced',
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      basePrice REAL NOT NULL,
      stockQty INTEGER NOT NULL,
      sync_status TEXT DEFAULT 'synced',
      sync_action TEXT DEFAULT 'synced',
      updated_at TEXT
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
      sync_status TEXT DEFAULT 'synced',
      sync_action TEXT DEFAULT 'synced',
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS deal_items (
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      productId TEXT NOT NULL,
      productName TEXT,
      quantity INTEGER NOT NULL,
      unitPrice REAL NOT NULL,
      sync_status TEXT DEFAULT 'synced',
      sync_action TEXT DEFAULT 'synced',
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      dealId TEXT NOT NULL,
      amount REAL NOT NULL,
      paymentDate TEXT NOT NULL,
      method TEXT NOT NULL,
      sync_status TEXT DEFAULT 'synced',
      sync_action TEXT DEFAULT 'synced',
      updated_at TEXT
    );
    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Run migrations for existing databases that may lack new columns
  migrateDb(database);
}

// Generate unique IDs for local creation
export function generateId() {
  return uuidv4();
}

// Ensure the db is initialized
initDb();
