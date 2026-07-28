import { authHeaders, isLoggedIn } from './token-api'

interface AdminUser {
  id: string
  displayName: string
  email: string
  role: 'guest' | 'user' | 'admin'
  disabled: boolean
  hasUserApiKey?: boolean
  createdAt: string
  updatedAt: string
}

interface AdminAccount {
  userId: string
  availableBalance: number
  frozenBalance: number
  totalPurchased: number
  totalBonus: number
  totalConsumed: number
}

interface AdminUserRow {
  user: AdminUser
  account: AdminAccount
}

interface AdminTransaction {
  id: string
  type: string
  amount: number
  afterAvailable: number
  model?: string
  feature?: string
  note?: string
  createdAt: string
}

let rows: AdminUserRow[] = []
let selectedUserId = ''

function escapeHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function adminFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {})
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  Object.entries(authHeaders()).forEach(([key, value]) => headers.set(key, String(value)))
  const resp = await fetch(url, { ...options, headers })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) throw new Error(data.message || data.error || '请求失败')
  return data as T
}

function fmtDate(s: string): string {
  return s ? new Date(s).toLocaleString('zh-CN') : '-'
}

function roleOptions(role = 'user'): string {
  return ['user', 'admin', 'guest'].map(item => `<option value="${item}" ${item === role ? 'selected' : ''}>${item}</option>`).join('')
}

function rowHtml(row: AdminUserRow): string {
  const isSelected = row.user.id === selectedUserId ? ' admin-user-selected' : ''
  return `
    <tr class="admin-user-row${isSelected}" data-user-id="${escapeHtml(row.user.id)}">
      <td>
        <strong>${escapeHtml(row.user.displayName)}</strong>
        <small>${escapeHtml(row.user.email)}</small>
      </td>
      <td><span class="admin-role-badge">${escapeHtml(row.user.role)}</span></td>
      <td>${row.user.disabled ? '<span class="admin-status off">禁用</span>' : '<span class="admin-status on">启用</span>'}</td>
      <td>${row.account.availableBalance}</td>
      <td>${row.account.totalPurchased}</td>
      <td>${row.account.totalConsumed}</td>
      <td>${fmtDate(row.user.createdAt)}</td>
      <td><button class="admin-link-btn" data-edit-user="${escapeHtml(row.user.id)}" type="button">编辑</button></td>
    </tr>
  `
}

function emptyPanel(message: string): string {
  return `<div class="admin-empty">${escapeHtml(message)}</div>`
}

function renderEditor(row?: AdminUserRow): string {
  const user = row?.user
  return `
    <section class="admin-panel admin-editor-panel">
      <div class="admin-panel-head">
        <div>
          <p class="ai-eyebrow">User CRUD</p>
          <h2>${user ? '编辑用户' : '新增用户'}</h2>
        </div>
        ${user ? `<button class="admin-danger" id="deleteUserBtn" type="button">删除用户</button>` : ''}
      </div>
      <div class="admin-form-grid">
        <label><span>邮箱</span><input id="adminEmail" class="form-input" type="email" value="${escapeHtml(user?.email || '')}" placeholder="user@example.com" /></label>
        <label><span>显示名</span><input id="adminDisplayName" class="form-input" value="${escapeHtml(user?.displayName || '')}" placeholder="用户名称" /></label>
        <label><span>角色</span><select id="adminRole" class="form-input">${roleOptions(user?.role)}</select></label>
        <label class="admin-check"><input id="adminDisabled" type="checkbox" ${user?.disabled ? 'checked' : ''} /> 禁用登录</label>
      </div>
      <div class="admin-actions-row">
        <button class="btn-primary" id="saveUserBtn" type="button">${user ? '保存修改' : '创建用户'}</button>
        <button class="btn-secondary" id="resetEditorBtn" type="button">清空表单</button>
      </div>
    </section>
  `
}

function renderBalance(row?: AdminUserRow): string {
  if (!row) return `<section class="admin-panel">${emptyPanel('选择左侧用户后可调整余额。')}</section>`
  return `
    <section class="admin-panel">
      <div class="admin-panel-head">
        <div>
          <p class="ai-eyebrow">Balance</p>
          <h2>余额调整</h2>
        </div>
        <strong class="admin-balance-number">${row.account.availableBalance} Token</strong>
      </div>
      <div class="admin-form-grid two">
        <label><span>调整数量</span><input id="balanceAmount" class="form-input" type="number" placeholder="例如 100 或 -20" /></label>
        <label><span>备注</span><input id="balanceNote" class="form-input" value="管理员调整余额" /></label>
      </div>
      <button class="btn-primary" id="adjustBalanceBtn" type="button">提交余额调整</button>
    </section>
  `
}

function renderTransactions(items: AdminTransaction[] = []): string {
  if (!items.length) return emptyPanel('暂无流水记录。')
  return `
    <table class="admin-table compact">
      <thead><tr><th>时间</th><th>类型</th><th>数量</th><th>余额</th><th>说明</th></tr></thead>
      <tbody>${items.map(tx => `
        <tr>
          <td>${fmtDate(tx.createdAt)}</td>
          <td>${escapeHtml(tx.type)}</td>
          <td>${tx.amount > 0 ? '+' : ''}${tx.amount}</td>
          <td>${tx.afterAvailable}</td>
          <td>${escapeHtml(tx.note || tx.model || tx.feature || '-')}</td>
        </tr>
      `).join('')}</tbody>
    </table>
  `
}

function refreshDom(transactions: AdminTransaction[] = []): void {
  const table = document.getElementById('adminUsersTable')
  const selected = rows.find(row => row.user.id === selectedUserId)
  if (table) table.innerHTML = rows.length ? rows.map(rowHtml).join('') : `<tr><td colspan="8">暂无用户。</td></tr>`
  const editor = document.getElementById('adminEditor')
  if (editor) editor.innerHTML = renderEditor(selected)
  const balance = document.getElementById('adminBalance')
  if (balance) balance.innerHTML = renderBalance(selected)
  const tx = document.getElementById('adminTransactions')
  if (tx) tx.innerHTML = renderTransactions(transactions)
  bindDynamicEvents()
}

async function loadUsers(): Promise<void> {
  const q = (document.getElementById('adminSearch') as HTMLInputElement | null)?.value || ''
  const data = await adminFetch<{ users: AdminUserRow[]; total: number }>(`/api/admin/users?q=${encodeURIComponent(q)}`)
  rows = data.users
  if (!selectedUserId || !rows.some(row => row.user.id === selectedUserId)) selectedUserId = rows[0]?.user.id || ''
  const transactions = selectedUserId ? await loadTransactions(selectedUserId) : []
  refreshDom(transactions)
}

async function loadTransactions(userId: string): Promise<AdminTransaction[]> {
  const data = await adminFetch<{ transactions: AdminTransaction[] }>(`/api/admin/users/${encodeURIComponent(userId)}/transactions`)
  return data.transactions
}

async function saveUser(): Promise<void> {
  const payload = {
    email: (document.getElementById('adminEmail') as HTMLInputElement).value.trim(),
    displayName: (document.getElementById('adminDisplayName') as HTMLInputElement).value.trim(),
    role: (document.getElementById('adminRole') as HTMLSelectElement).value,
    disabled: (document.getElementById('adminDisabled') as HTMLInputElement).checked,
  }
  if (selectedUserId) {
    await adminFetch(`/api/admin/users/${encodeURIComponent(selectedUserId)}`, { method: 'PATCH', body: JSON.stringify(payload) })
  } else {
    const result = await adminFetch<{ user: AdminUser }>('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) })
    selectedUserId = result.user.id
  }
  await loadUsers()
}

async function deleteSelectedUser(): Promise<void> {
  if (!selectedUserId) return
  const row = rows.find(item => item.user.id === selectedUserId)
  if (!row || !confirm(`确认删除用户 ${row.user.email}？该操作会删除余额和流水。`)) return
  await adminFetch(`/api/admin/users/${encodeURIComponent(selectedUserId)}`, { method: 'DELETE' })
  selectedUserId = ''
  await loadUsers()
}

async function adjustBalance(): Promise<void> {
  if (!selectedUserId) return
  const amount = Number((document.getElementById('balanceAmount') as HTMLInputElement).value)
  const note = (document.getElementById('balanceNote') as HTMLInputElement).value
  await adminFetch(`/api/admin/users/${encodeURIComponent(selectedUserId)}/balance`, { method: 'POST', body: JSON.stringify({ amount, note }) })
  await loadUsers()
}

function bindDynamicEvents(): void {
  document.querySelectorAll<HTMLElement>('[data-user-id]').forEach(row => {
    row.addEventListener('click', async () => {
      selectedUserId = row.dataset.userId || ''
      refreshDom(selectedUserId ? await loadTransactions(selectedUserId) : [])
    })
  })
  document.querySelectorAll<HTMLElement>('[data-edit-user]').forEach(btn => {
    btn.addEventListener('click', async (event) => {
      event.stopPropagation()
      selectedUserId = btn.dataset.editUser || ''
      refreshDom(selectedUserId ? await loadTransactions(selectedUserId) : [])
    })
  })
  document.getElementById('saveUserBtn')?.addEventListener('click', () => saveUser().catch(showError))
  document.getElementById('deleteUserBtn')?.addEventListener('click', () => deleteSelectedUser().catch(showError))
  document.getElementById('adjustBalanceBtn')?.addEventListener('click', () => adjustBalance().catch(showError))
  document.getElementById('resetEditorBtn')?.addEventListener('click', async () => {
    selectedUserId = ''
    refreshDom([])
  })
}

function showError(err: unknown): void {
  const status = document.getElementById('adminStatus')
  if (status) status.textContent = err instanceof Error ? err.message : '操作失败'
}

export function renderAdminUsersPage(): string {
  if (!isLoggedIn()) {
    return `
      <main class="admin-page">
        <section class="admin-hero"><div class="admin-hero-inner"><h1>用户管理</h1><p>请先登录管理员账号。</p><a class="btn-primary" href="#/login">去登录</a></div></section>
      </main>
    `
  }
  return `
    <main class="admin-page">
      <section class="admin-hero">
        <div class="admin-hero-inner">
          <p class="ai-eyebrow">SQLite Admin</p>
          <h1>用户与余额管理</h1>
          <p>基于本地 SQLite 数据库，管理用户增删改查、余额调整和 Token 流水。</p>
        </div>
      </section>
      <section class="admin-shell">
        <div class="admin-toolbar">
          <input id="adminSearch" class="form-input" placeholder="搜索邮箱或显示名" />
          <button class="btn-secondary" id="adminSearchBtn" type="button">搜索</button>
          <button class="btn-primary" id="newUserBtn" type="button">新增用户</button>
          <span id="adminStatus" class="admin-status-text"></span>
        </div>
        <div class="admin-layout">
          <section class="admin-panel admin-users-panel">
            <div class="admin-panel-head"><div><p class="ai-eyebrow">Users</p><h2>用户列表</h2></div></div>
            <div class="admin-table-wrap">
              <table class="admin-table">
                <thead><tr><th>用户</th><th>角色</th><th>状态</th><th>余额</th><th>购买</th><th>消耗</th><th>创建时间</th><th></th></tr></thead>
                <tbody id="adminUsersTable"><tr><td colspan="8">正在加载...</td></tr></tbody>
              </table>
            </div>
          </section>
          <div class="admin-side">
            <div id="adminEditor">${renderEditor()}</div>
            <div id="adminBalance">${renderBalance()}</div>
            <section class="admin-panel">
              <div class="admin-panel-head"><div><p class="ai-eyebrow">Ledger</p><h2>余额流水</h2></div></div>
              <div id="adminTransactions">${emptyPanel('选择用户后查看流水。')}</div>
            </section>
          </div>
        </div>
      </section>
    </main>
  `
}

export function bindAdminUsersPageEvents(): void {
  document.getElementById('adminSearchBtn')?.addEventListener('click', () => loadUsers().catch(showError))
  document.getElementById('adminSearch')?.addEventListener('keydown', event => {
    if ((event as KeyboardEvent).key === 'Enter') loadUsers().catch(showError)
  })
  document.getElementById('newUserBtn')?.addEventListener('click', () => {
    selectedUserId = ''
    refreshDom([])
  })
  loadUsers().catch(err => {
    showError(err)
    const table = document.getElementById('adminUsersTable')
    if (table) table.innerHTML = `<tr><td colspan="8">${escapeHtml(err instanceof Error ? err.message : '加载失败')}</td></tr>`
  })
}
