export interface UserProfile {
  id: string
  displayName: string
  email: string
  role: 'guest' | 'user' | 'admin'
  hasUserApiKey?: boolean
}

export interface TokenAccount {
  userId: string
  availableBalance: number
  frozenBalance: number
  totalPurchased: number
  totalBonus: number
  totalConsumed: number
}

export interface TokenPackage {
  id: string
  name: string
  price: number
  currency: string
  tokens: number
  bonus: number
  durationDays: number
  group: string
  positioning: string
  highlights: string[]
}

export interface TokenOrder {
  id: string
  packageId: string
  packageName: string
  payAmount: number
  currency: string
  tokenAmount: number
  bonusTokenAmount: number
  status: 'pending' | 'paid' | 'cancelled' | 'refunded'
  paymentChannel: string
  createdAt: string
  paidAt?: string
}

export interface TokenTransaction {
  id: string
  type: 'purchase' | 'bonus' | 'freeze' | 'consume' | 'unfreeze' | 'refund'
  amount: number
  afterAvailable: number
  model?: string
  feature?: string
  status: 'pending' | 'success' | 'failed'
  note?: string
  createdAt: string
}

const AUTH_TOKEN_KEY = 'ai_handbook_auth_token'

export function getAuthToken(): string {
  return localStorage.getItem(AUTH_TOKEN_KEY) || ''
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return Boolean(getAuthToken())
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  const token = getAuthToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const resp = await fetch(url, { ...options, headers })
  const contentType = resp.headers.get('Content-Type') || ''
  const data = contentType.includes('application/json') ? await resp.json() : await resp.text()
  if (!resp.ok) {
    const err = new Error(typeof data === 'string' ? data : data.message || data.error || '请求失败')
    ;(err as Error & { status?: number; data?: unknown }).status = resp.status
    ;(err as Error & { status?: number; data?: unknown }).data = data
    throw err
  }
  return data as T
}

export async function sendLoginCode(email: string): Promise<{ ok: boolean; message: string; devCode?: string }> {
  return apiFetch('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) })
}

export async function verifyLoginCode(email: string, code: string): Promise<{ token: string; user: UserProfile; account: TokenAccount }> {
  const result = await apiFetch<{ token: string; user: UserProfile; account: TokenAccount }>('/api/auth/verify-code', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
  setAuthToken(result.token)
  return result
}

export async function fetchMe(): Promise<{ user: UserProfile; account: TokenAccount }> {
  return apiFetch('/api/auth/me')
}

export async function saveUserApiKey(apiKey: string): Promise<{ user: UserProfile }> {
  return apiFetch('/api/user/api-key', { method: 'POST', body: JSON.stringify({ apiKey }) })
}

export async function fetchTokenPackages(): Promise<{ pricingPolicy: unknown; packages: TokenPackage[] }> {
  return apiFetch('/api/token/packages')
}

export async function fetchTokenBalance(): Promise<TokenAccount> {
  const data = await apiFetch<{ account: TokenAccount }>('/api/token/balance')
  return data.account
}

export async function createTokenOrder(packageId: string): Promise<TokenOrder> {
  const data = await apiFetch<{ order: TokenOrder }>('/api/token/orders', {
    method: 'POST',
    body: JSON.stringify({ packageId, paymentChannel: 'mock' }),
  })
  return data.order
}

export async function mockPayOrder(orderId: string): Promise<TokenAccount> {
  const data = await apiFetch<{ account: TokenAccount }>(`/api/token/orders/${orderId}/mock-pay`, { method: 'POST' })
  return data.account
}

export async function fetchTokenTransactions(): Promise<TokenTransaction[]> {
  const data = await apiFetch<{ transactions: TokenTransaction[] }>('/api/token/transactions')
  return data.transactions
}

export async function fetchTokenOrders(): Promise<TokenOrder[]> {
  const data = await apiFetch<{ orders: TokenOrder[] }>('/api/token/orders')
  return data.orders
}

export function dataExportUrl(): string {
  return '/api/admin/export-data'
}

export function authHeaders(): HeadersInit {
  const token = getAuthToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
