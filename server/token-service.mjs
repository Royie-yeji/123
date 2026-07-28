import crypto from 'node:crypto'
import { getDb, initDatabase, mapRows, withTransaction } from './sqlite-store.mjs'
import { TOKEN_PACKAGES } from './token-config.mjs'

const BONUS_TOKENS = 20
const CODE_TTL_MS = 10 * 60 * 1000
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000

function now() {
  return new Date().toISOString()
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function publicUser(user) {
  if (!user) return null
  const { apiKeyEncrypted: _apiKeyEncrypted, ...rest } = user
  return { ...rest, hasUserApiKey: Boolean(user.apiKeyEncrypted) }
}

function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex')
}

function encodeApiKey(apiKey) {
  return Buffer.from(String(apiKey), 'utf8').toString('base64')
}

function decodeApiKey(encoded) {
  if (!encoded) return ''
  return Buffer.from(encoded, 'base64').toString('utf8')
}

function assertValidEmail(email) {
  const normalized = normalizeEmail(email)
  if (!/^\S+@\S+\.\S+$/.test(normalized)) {
    return { ok: false, normalized, error: 'INVALID_EMAIL', message: '请输入有效邮箱地址。' }
  }
  return { ok: true, normalized }
}

async function readyDb() {
  await initDatabase()
  return getDb()
}

function getUserByIdSync(db, userId) {
  return mapRows.user(db.prepare('SELECT * FROM users WHERE id = ?').get(userId))
}

function getUserByEmailSync(db, email) {
  return mapRows.user(db.prepare('SELECT * FROM users WHERE email = ?').get(normalizeEmail(email)))
}

function accountForSync(db, userId) {
  let account = mapRows.account(db.prepare('SELECT * FROM token_accounts WHERE user_id = ?').get(userId))
  if (!account) {
    const createdAt = now()
    db.prepare(`
      INSERT INTO token_accounts (user_id, available_balance, frozen_balance, total_purchased, total_bonus, total_consumed, created_at, updated_at)
      VALUES (?, ?, 0, 0, ?, 0, ?, ?)
    `).run(userId, BONUS_TOKENS, BONUS_TOKENS, createdAt, createdAt)
    db.prepare(`
      INSERT INTO token_transactions (id, user_id, type, amount, before_available, after_available, before_frozen, after_frozen, feature, status, note, created_at)
      VALUES (?, ?, 'bonus', ?, 0, ?, 0, 0, 'signup_bonus', 'success', '新用户试用额度', ?)
    `).run(id('tx'), userId, BONUS_TOKENS, BONUS_TOKENS, createdAt)
    account = mapRows.account(db.prepare('SELECT * FROM token_accounts WHERE user_id = ?').get(userId))
  }
  return account
}

function createUserSync(db, { email, displayName, role = 'user', disabled = false, apiKey = '' }) {
  const valid = assertValidEmail(email)
  if (!valid.ok) return { ok: false, status: 400, error: valid.error, message: valid.message }

  const existing = getUserByEmailSync(db, valid.normalized)
  if (existing) return { ok: false, status: 409, error: 'EMAIL_EXISTS', message: '该邮箱已存在。' }

  const createdAt = now()
  const user = {
    id: id('user'),
    displayName: String(displayName || valid.normalized.split('@')[0]).trim(),
    email: valid.normalized,
    role: ['admin', 'user', 'guest'].includes(role) ? role : 'user',
    apiKeyEncrypted: apiKey ? encodeApiKey(apiKey) : '',
    disabled: Boolean(disabled),
    createdAt,
    updatedAt: createdAt,
  }

  db.prepare(`
    INSERT INTO users (id, display_name, email, role, api_key_encrypted, disabled, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, user.displayName, user.email, user.role, user.apiKeyEncrypted, user.disabled ? 1 : 0, user.createdAt, user.updatedAt)
  accountForSync(db, user.id)
  return { ok: true, status: 200, user: publicUser(user), account: accountForSync(db, user.id) }
}

export async function requestEmailCode(email) {
  const valid = assertValidEmail(email)
  if (!valid.ok) return { ok: false, status: 400, error: valid.error, message: valid.message }

  const db = await readyDb()
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const cutoff = new Date(Date.now()).toISOString()
  db.prepare('DELETE FROM email_codes WHERE used_at IS NULL AND expires_at <= ?').run(cutoff)
  db.prepare(`
    INSERT INTO email_codes (id, email, code_hash, expires_at, used_at, created_at)
    VALUES (?, ?, ?, ?, NULL, ?)
  `).run(id('code'), valid.normalized, hashCode(code), new Date(Date.now() + CODE_TTL_MS).toISOString(), now())

  console.log(`[Auth] Email code for ${valid.normalized}: ${code}`)
  return {
    ok: true,
    status: 200,
    devCode: code,
    message: '验证码已生成。当前开发环境会直接返回验证码；接入 SMTP 后将改为邮件发送。',
  }
}

export async function verifyEmailCode(email, code) {
  const valid = assertValidEmail(email)
  if (!valid.ok) return { ok: false, status: 400, error: valid.error, message: valid.message }

  const db = await readyDb()
  const target = db.prepare(`
    SELECT * FROM email_codes
    WHERE email = ? AND used_at IS NULL AND expires_at > ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(valid.normalized, now())

  if (!target || target.code_hash !== hashCode(code)) {
    return { ok: false, status: 401, error: 'INVALID_CODE', message: '验证码错误或已过期。' }
  }

  let result
  withTransaction(() => {
    db.prepare('UPDATE email_codes SET used_at = ? WHERE id = ?').run(now(), target.id)
    let user = getUserByEmailSync(db, valid.normalized)
    if (!user) {
      result = createUserSync(db, { email: valid.normalized })
      user = getUserByIdSync(db, result.user.id)
    } else {
      db.prepare('UPDATE users SET updated_at = ? WHERE id = ?').run(now(), user.id)
    }

    const token = crypto.randomBytes(24).toString('hex')
    db.prepare(`
      INSERT INTO sessions (id, token, user_id, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id('sess'), token, user.id, new Date(Date.now() + SESSION_TTL_MS).toISOString(), now())
    result = { ok: true, status: 200, token, user: publicUser(getUserByIdSync(db, user.id)), account: accountForSync(db, user.id) }
  })
  return result
}

export async function userFromToken(token) {
  if (!token) return null
  const db = await readyDb()
  const row = db.prepare(`
    SELECT u.* FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > ? AND u.disabled = 0
    LIMIT 1
  `).get(token, now())
  return mapRows.user(row)
}

export async function requireUser(req) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  return userFromToken(token)
}

export async function getBalance(userId) {
  const db = await readyDb()
  const account = accountForSync(db, userId)
  return { ...account }
}

export async function listTransactions(userId) {
  const db = await readyDb()
  return db.prepare('SELECT * FROM token_transactions WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(mapRows.transaction)
}

export async function listOrders(userId) {
  const db = await readyDb()
  return db.prepare('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(mapRows.order)
}

export async function createOrder(userId, packageId, paymentChannel = 'mock') {
  const pkg = TOKEN_PACKAGES.find(item => item.id === packageId)
  if (!pkg) return { ok: false, status: 404, error: 'PACKAGE_NOT_FOUND' }
  const db = await readyDb()
  const order = {
    id: id('order'),
    userId,
    packageId: pkg.id,
    packageName: pkg.name,
    payAmount: pkg.price,
    currency: pkg.currency,
    tokenAmount: pkg.tokens,
    bonusTokenAmount: pkg.bonus,
    status: 'pending',
    paymentChannel,
    createdAt: now(),
  }
  db.prepare(`
    INSERT INTO orders (id, user_id, package_id, package_name, pay_amount, currency, token_amount, bonus_token_amount, status, payment_channel, created_at, paid_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
  `).run(order.id, order.userId, order.packageId, order.packageName, order.payAmount, order.currency, order.tokenAmount, order.bonusTokenAmount, order.status, order.paymentChannel, order.createdAt)
  return { ok: true, status: 200, order }
}

export async function mockPayOrder(userId, orderId) {
  const db = await readyDb()
  let result
  withTransaction(() => {
    const order = mapRows.order(db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(orderId, userId))
    if (!order) {
      result = { ok: false, status: 404, error: 'ORDER_NOT_FOUND' }
      return
    }
    const account = accountForSync(db, userId)
    if (order.status === 'paid') {
      result = { ok: true, status: 200, order, account }
      return
    }
    if (order.status !== 'pending') {
      result = { ok: false, status: 409, error: 'ORDER_NOT_PAYABLE' }
      return
    }

    const amount = order.tokenAmount + order.bonusTokenAmount
    const beforeAvailable = account.availableBalance
    const beforeFrozen = account.frozenBalance
    const paidAt = now()
    const afterAvailable = beforeAvailable + amount
    db.prepare(`
      UPDATE token_accounts
      SET available_balance = ?, total_purchased = total_purchased + ?, total_bonus = total_bonus + ?, updated_at = ?
      WHERE user_id = ?
    `).run(afterAvailable, order.tokenAmount, order.bonusTokenAmount, paidAt, userId)
    db.prepare('UPDATE orders SET status = ?, paid_at = ? WHERE id = ?').run('paid', paidAt, order.id)
    db.prepare(`
      INSERT INTO token_transactions (id, user_id, type, amount, before_available, after_available, before_frozen, after_frozen, order_id, status, note, created_at)
      VALUES (?, ?, 'purchase', ?, ?, ?, ?, ?, ?, 'success', ?, ?)
    `).run(id('tx'), userId, amount, beforeAvailable, afterAvailable, beforeFrozen, beforeFrozen, order.id, `${order.packageName} 充值入账`, paidAt)

    result = {
      ok: true,
      status: 200,
      order: mapRows.order(db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id)),
      account: accountForSync(db, userId),
    }
  })
  return result
}

export async function consumeTokens(userId, amount, data = {}) {
  const db = await readyDb()
  let result
  withTransaction(() => {
    const account = accountForSync(db, userId)
    if (account.availableBalance < amount) {
      result = { ok: false, status: 402, requiredTokens: amount, availableBalance: account.availableBalance }
      return
    }
    const beforeAvailable = account.availableBalance
    const beforeFrozen = account.frozenBalance
    const afterAvailable = beforeAvailable - amount
    const createdAt = now()
    db.prepare(`
      UPDATE token_accounts
      SET available_balance = ?, total_consumed = total_consumed + ?, updated_at = ?
      WHERE user_id = ?
    `).run(afterAvailable, amount, createdAt, userId)
    db.prepare(`
      INSERT INTO token_transactions (id, user_id, type, amount, before_available, after_available, before_frozen, after_frozen, request_id, model, feature, status, note, created_at)
      VALUES (?, ?, 'consume', ?, ?, ?, ?, ?, ?, ?, ?, 'success', ?, ?)
    `).run(
      id('tx'),
      userId,
      -amount,
      beforeAvailable,
      afterAvailable,
      beforeFrozen,
      beforeFrozen,
      data.requestId || null,
      data.model || null,
      data.feature || null,
      data.note || null,
      createdAt,
    )
    result = { ok: true, status: 200, account: accountForSync(db, userId) }
  })
  return result
}

export async function setUserApiKey(userId, apiKey) {
  const db = await readyDb()
  const user = getUserByIdSync(db, userId)
  if (!user) return { ok: false, status: 404, error: 'USER_NOT_FOUND' }
  db.prepare('UPDATE users SET api_key_encrypted = ?, updated_at = ? WHERE id = ?').run(apiKey ? encodeApiKey(apiKey) : '', now(), userId)
  return { ok: true, status: 200, user: publicUser(getUserByIdSync(db, userId)) }
}

export async function getUserApiKey(userId) {
  const db = await readyDb()
  const user = getUserByIdSync(db, userId)
  return decodeApiKey(user?.apiKeyEncrypted || '')
}

export async function getMe(userId) {
  const db = await readyDb()
  const user = getUserByIdSync(db, userId)
  const account = accountForSync(db, userId)
  return { user: publicUser(user), account }
}

export async function listUsers({ q = '', limit = 100, offset = 0 } = {}) {
  const db = await readyDb()
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500)
  const safeOffset = Math.max(Number(offset) || 0, 0)
  const pattern = `%${String(q || '').trim().toLowerCase()}%`
  const rows = db.prepare(`
    SELECT u.*, a.available_balance, a.frozen_balance, a.total_purchased, a.total_bonus, a.total_consumed
    FROM users u
    LEFT JOIN token_accounts a ON a.user_id = u.id
    WHERE (? = '%%' OR lower(u.email) LIKE ? OR lower(u.display_name) LIKE ?)
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `).all(pattern, pattern, pattern, safeLimit, safeOffset)
  const total = db.prepare(`
    SELECT COUNT(*) AS count FROM users u
    WHERE (? = '%%' OR lower(u.email) LIKE ? OR lower(u.display_name) LIKE ?)
  `).get(pattern, pattern, pattern).count
  return {
    total,
    users: rows.map(row => ({
      user: publicUser(mapRows.user(row)),
      account: mapRows.account({
        user_id: row.id,
        available_balance: row.available_balance || 0,
        frozen_balance: row.frozen_balance || 0,
        total_purchased: row.total_purchased || 0,
        total_bonus: row.total_bonus || 0,
        total_consumed: row.total_consumed || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    })),
  }
}

export async function createUser(data) {
  const db = await readyDb()
  return withTransaction(() => createUserSync(db, data))
}

export async function updateUser(userId, data = {}) {
  const db = await readyDb()
  const user = getUserByIdSync(db, userId)
  if (!user) return { ok: false, status: 404, error: 'USER_NOT_FOUND', message: '用户不存在。' }

  const displayName = String(data.displayName ?? user.displayName).trim() || user.displayName
  const role = ['admin', 'user', 'guest'].includes(data.role) ? data.role : user.role
  const disabled = typeof data.disabled === 'boolean' ? data.disabled : user.disabled
  let email = user.email
  if (data.email && normalizeEmail(data.email) !== user.email) {
    const valid = assertValidEmail(data.email)
    if (!valid.ok) return { ok: false, status: 400, error: valid.error, message: valid.message }
    const existing = getUserByEmailSync(db, valid.normalized)
    if (existing && existing.id !== userId) return { ok: false, status: 409, error: 'EMAIL_EXISTS', message: '该邮箱已存在。' }
    email = valid.normalized
  }

  db.prepare('UPDATE users SET display_name = ?, email = ?, role = ?, disabled = ?, updated_at = ? WHERE id = ?')
    .run(displayName, email, role, disabled ? 1 : 0, now(), userId)
  return { ok: true, status: 200, user: publicUser(getUserByIdSync(db, userId)), account: accountForSync(db, userId) }
}

export async function deleteUser(userId) {
  const db = await readyDb()
  const user = getUserByIdSync(db, userId)
  if (!user) return { ok: false, status: 404, error: 'USER_NOT_FOUND', message: '用户不存在。' }
  db.prepare('DELETE FROM users WHERE id = ?').run(userId)
  return { ok: true, status: 200, user: publicUser(user) }
}

export async function adjustUserBalance(userId, amount, note = '管理员调整余额') {
  const delta = Number(amount)
  if (!Number.isFinite(delta) || delta === 0) {
    return { ok: false, status: 400, error: 'INVALID_AMOUNT', message: '请输入非 0 的余额调整数量。' }
  }

  const db = await readyDb()
  let result
  withTransaction(() => {
    const user = getUserByIdSync(db, userId)
    if (!user) {
      result = { ok: false, status: 404, error: 'USER_NOT_FOUND', message: '用户不存在。' }
      return
    }
    const account = accountForSync(db, userId)
    const beforeAvailable = account.availableBalance
    const afterAvailable = beforeAvailable + Math.trunc(delta)
    if (afterAvailable < 0) {
      result = { ok: false, status: 409, error: 'NEGATIVE_BALANCE', message: '余额不能调整为负数。' }
      return
    }
    const createdAt = now()
    db.prepare('UPDATE token_accounts SET available_balance = ?, updated_at = ? WHERE user_id = ?').run(afterAvailable, createdAt, userId)
    db.prepare(`
      INSERT INTO token_transactions (id, user_id, type, amount, before_available, after_available, before_frozen, after_frozen, feature, status, note, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'admin_adjust', 'success', ?, ?)
    `).run(id('tx'), userId, delta > 0 ? 'bonus' : 'consume', Math.trunc(delta), beforeAvailable, afterAvailable, account.frozenBalance, account.frozenBalance, String(note || '管理员调整余额'), createdAt)
    result = { ok: true, status: 200, user: publicUser(user), account: accountForSync(db, userId) }
  })
  return result
}

export async function exportData() {
  const db = await readyDb()
  return {
    users: db.prepare('SELECT * FROM users ORDER BY created_at DESC').all().map(row => publicUser(mapRows.user(row))),
    accounts: db.prepare('SELECT * FROM token_accounts ORDER BY created_at DESC').all().map(mapRows.account),
    transactions: db.prepare('SELECT * FROM token_transactions ORDER BY created_at DESC').all().map(mapRows.transaction),
    orders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all().map(mapRows.order),
    sessions: db.prepare('SELECT id, user_id, expires_at, created_at FROM sessions ORDER BY created_at DESC').all().map(row => ({ id: row.id, userId: row.user_id, expiresAt: row.expires_at, createdAt: row.created_at })),
    database: { engine: 'sqlite', path: 'server/data/ai-handbook.sqlite' },
  }
}

export function tokenPackagesResponse() {
  return TOKEN_PACKAGES
}
