import { DatabaseSync } from 'node:sqlite'
import { mkdir, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = join(__dirname, 'data')
export const DB_PATH = join(DATA_DIR, 'ai-handbook.sqlite')

let db
let initialized = false

function now() {
  return new Date().toISOString()
}

async function readLegacyJson(fileName, fallback) {
  try {
    const raw = await readFile(join(DATA_DIR, fileName), 'utf8')
    return JSON.parse(raw)
  } catch {
    return structuredClone(fallback)
  }
}

function boolInt(value) {
  return value ? 1 : 0
}

function toBool(value) {
  return Boolean(value)
}

function rowToUser(row) {
  if (!row) return null
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    role: row.role,
    apiKeyEncrypted: row.api_key_encrypted || '',
    disabled: toBool(row.disabled),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToAccount(row) {
  if (!row) return null
  return {
    userId: row.user_id,
    availableBalance: row.available_balance,
    frozenBalance: row.frozen_balance,
    totalPurchased: row.total_purchased,
    totalBonus: row.total_bonus,
    totalConsumed: row.total_consumed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function rowToOrder(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    packageId: row.package_id,
    packageName: row.package_name,
    payAmount: row.pay_amount,
    currency: row.currency,
    tokenAmount: row.token_amount,
    bonusTokenAmount: row.bonus_token_amount,
    status: row.status,
    paymentChannel: row.payment_channel,
    createdAt: row.created_at,
    paidAt: row.paid_at || undefined,
  }
}

function rowToTransaction(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: row.amount,
    beforeAvailable: row.before_available,
    afterAvailable: row.after_available,
    beforeFrozen: row.before_frozen,
    afterFrozen: row.after_frozen,
    orderId: row.order_id || undefined,
    requestId: row.request_id || undefined,
    model: row.model || undefined,
    feature: row.feature || undefined,
    status: row.status,
    note: row.note || undefined,
    createdAt: row.created_at,
  }
}

function initSchema() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'user',
      api_key_encrypted TEXT DEFAULT '',
      disabled INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS token_accounts (
      user_id TEXT PRIMARY KEY,
      available_balance INTEGER NOT NULL DEFAULT 0,
      frozen_balance INTEGER NOT NULL DEFAULT 0,
      total_purchased INTEGER NOT NULL DEFAULT 0,
      total_bonus INTEGER NOT NULL DEFAULT 0,
      total_consumed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS token_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      before_available INTEGER NOT NULL DEFAULT 0,
      after_available INTEGER NOT NULL DEFAULT 0,
      before_frozen INTEGER NOT NULL DEFAULT 0,
      after_frozen INTEGER NOT NULL DEFAULT 0,
      order_id TEXT,
      request_id TEXT,
      model TEXT,
      feature TEXT,
      status TEXT NOT NULL DEFAULT 'success',
      note TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_token_transactions_user_time ON token_transactions(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      package_id TEXT NOT NULL,
      package_name TEXT NOT NULL,
      pay_amount REAL NOT NULL,
      currency TEXT NOT NULL,
      token_amount INTEGER NOT NULL,
      bonus_token_amount INTEGER NOT NULL,
      status TEXT NOT NULL,
      payment_channel TEXT NOT NULL,
      created_at TEXT NOT NULL,
      paid_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_time ON orders(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

    CREATE TABLE IF NOT EXISTS email_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email, created_at DESC);
  `)
}

function insertLegacyUser(user) {
  db.prepare(`
    INSERT OR IGNORE INTO users (id, display_name, email, role, api_key_encrypted, disabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    user.id,
    user.displayName || user.display_name || String(user.email || '').split('@')[0],
    user.email,
    user.role || 'user',
    user.apiKeyEncrypted || user.api_key_encrypted || '',
    boolInt(user.disabled),
    user.createdAt || user.created_at || now(),
    user.updatedAt || user.updated_at || now(),
  )
}

async function migrateLegacyJson() {
  const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count
  if (userCount > 0) return
  if (!existsSync(join(DATA_DIR, 'users.json'))) return

  const [users, accounts, transactions, orders, sessions, codes] = await Promise.all([
    readLegacyJson('users.json', []),
    readLegacyJson('token-accounts.json', []),
    readLegacyJson('token-transactions.json', []),
    readLegacyJson('orders.json', []),
    readLegacyJson('sessions.json', []),
    readLegacyJson('email-codes.json', []),
  ])

  withTransaction(() => {
    users.forEach(insertLegacyUser)

    const insertAccount = db.prepare(`
      INSERT OR IGNORE INTO token_accounts (user_id, available_balance, frozen_balance, total_purchased, total_bonus, total_consumed, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const account of accounts) {
      insertAccount.run(
        account.userId,
        account.availableBalance || 0,
        account.frozenBalance || 0,
        account.totalPurchased || 0,
        account.totalBonus || 0,
        account.totalConsumed || 0,
        account.createdAt || now(),
        account.updatedAt || now(),
      )
    }

    const insertTx = db.prepare(`
      INSERT OR IGNORE INTO token_transactions (id, user_id, type, amount, before_available, after_available, before_frozen, after_frozen, order_id, request_id, model, feature, status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const item of transactions) {
      insertTx.run(
        item.id,
        item.userId,
        item.type,
        item.amount || 0,
        item.beforeAvailable || 0,
        item.afterAvailable || 0,
        item.beforeFrozen || 0,
        item.afterFrozen || 0,
        item.orderId || null,
        item.requestId || null,
        item.model || null,
        item.feature || null,
        item.status || 'success',
        item.note || null,
        item.createdAt || now(),
      )
    }

    const insertOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (id, user_id, package_id, package_name, pay_amount, currency, token_amount, bonus_token_amount, status, payment_channel, created_at, paid_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const order of orders) {
      insertOrder.run(
        order.id,
        order.userId,
        order.packageId,
        order.packageName,
        order.payAmount || 0,
        order.currency || 'USD',
        order.tokenAmount || 0,
        order.bonusTokenAmount || 0,
        order.status || 'pending',
        order.paymentChannel || 'mock',
        order.createdAt || now(),
        order.paidAt || null,
      )
    }

    const insertSession = db.prepare(`
      INSERT OR IGNORE INTO sessions (id, token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    for (const session of sessions) {
      insertSession.run(session.id, session.token, session.userId, session.expiresAt, session.createdAt || now())
    }

    const insertCode = db.prepare(`
      INSERT OR IGNORE INTO email_codes (id, email, code_hash, expires_at, used_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    for (const code of codes) {
      insertCode.run(code.id, code.email, code.codeHash, code.expiresAt, code.usedAt || null, code.createdAt || now())
    }
  })
}

export async function initDatabase() {
  if (initialized) return db
  await mkdir(DATA_DIR, { recursive: true })
  db = new DatabaseSync(DB_PATH)
  initSchema()
  await migrateLegacyJson()
  initialized = true
  return db
}

export function getDb() {
  if (!db) throw new Error('Database has not been initialized. Call initDatabase() first.')
  return db
}

export function withTransaction(fn) {
  const activeDb = getDb()
  activeDb.exec('BEGIN IMMEDIATE')
  try {
    const result = fn(activeDb)
    activeDb.exec('COMMIT')
    return result
  } catch (err) {
    activeDb.exec('ROLLBACK')
    throw err
  }
}

export const mapRows = {
  user: rowToUser,
  account: rowToAccount,
  order: rowToOrder,
  transaction: rowToTransaction,
}
