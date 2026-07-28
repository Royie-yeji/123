import { authHeaders, clearAuthToken, dataExportUrl, fetchMe, fetchTokenOrders, fetchTokenTransactions, isLoggedIn, type TokenAccount, type TokenOrder, type TokenTransaction, type UserProfile } from './token-api'

let user: UserProfile | null = null
let account: TokenAccount | null = null
let orders: TokenOrder[] = []
let transactions: TokenTransaction[] = []

function fmtDate(s?: string): string {
  return s ? new Date(s).toLocaleString('zh-CN') : '-'
}

function fmtAmount(n: number): string {
  return `${n > 0 ? '+' : ''}${n} Token`
}

export function renderWalletPage(): string {
  return `
    <main class="commerce-page wallet-page">
      <section class="commerce-hero wallet-hero">
        <div class="commerce-hero-inner">
          <p class="ai-eyebrow">个人中心</p>
          <h1>余额与流水</h1>
          <p>查看账户信息、Token 余额、订单和 AI 使用扣费记录。</p>
          <div class="commerce-actions">
            <a class="btn-primary" href="#/pricing">去充值</a>
            <a class="btn-secondary" href="#/ai">去 AI 使用</a>
          </div>
        </div>
      </section>
      <section class="commerce-section">
        <div class="wallet-summary" id="walletSummary">${renderSummary()}</div>
        <div class="wallet-toolbar">
          <button class="btn-secondary" id="downloadData" type="button">下载数据库 JSON</button>
          <button class="btn-secondary" id="logoutBtn" type="button">退出登录</button>
        </div>
        <div class="wallet-grid">
          <section class="wallet-panel">
            <h2>订单记录</h2>
            <div class="wallet-table" id="ordersTable">${renderOrders()}</div>
          </section>
          <section class="wallet-panel">
            <h2>Token 流水</h2>
            <div class="wallet-table" id="transactionsTable">${renderTransactions()}</div>
          </section>
        </div>
      </section>
    </main>
  `
}

function renderSummary(): string {
  if (!account || !user) return '<div class="commerce-empty">登录后查看账户余额。</div>'
  return `
    <article><span>登录邮箱</span><strong>${user.email}</strong><small>${user.hasUserApiKey ? '已保存个人 API Key' : '未保存个人 API Key'}</small></article>
    <article><span>可用余额</span><strong>${account.availableBalance}</strong><small>Token</small></article>
    <article><span>冻结余额</span><strong>${account.frozenBalance}</strong><small>Token</small></article>
    <article><span>累计购买</span><strong>${account.totalPurchased}</strong><small>Token</small></article>
    <article><span>累计消耗</span><strong>${account.totalConsumed}</strong><small>Token</small></article>
  `
}

function renderOrders(): string {
  if (!orders.length) return '<div class="commerce-empty">暂无订单。</div>'
  return `
    <table>
      <thead><tr><th>时间</th><th>套餐</th><th>金额</th><th>状态</th></tr></thead>
      <tbody>${orders.map(order => `
        <tr><td>${fmtDate(order.createdAt)}</td><td>${order.packageName}</td><td>$${order.payAmount.toFixed(2)}</td><td>${order.status}</td></tr>
      `).join('')}</tbody>
    </table>
  `
}

function renderTransactions(): string {
  if (!transactions.length) return '<div class="commerce-empty">暂无流水。</div>'
  return `
    <table>
      <thead><tr><th>时间</th><th>类型</th><th>数量</th><th>模型/功能</th><th>余额</th></tr></thead>
      <tbody>${transactions.map(tx => `
        <tr><td>${fmtDate(tx.createdAt)}</td><td>${tx.type}</td><td>${fmtAmount(tx.amount)}</td><td>${tx.model || tx.feature || tx.note || '-'}</td><td>${tx.afterAvailable}</td></tr>
      `).join('')}</tbody>
    </table>
  `
}

export async function bindWalletPageEvents(): Promise<void> {
  if (!isLoggedIn()) {
    window.location.hash = '#/login'
    return
  }
  try {
    const [me, orderList, txList] = await Promise.all([fetchMe(), fetchTokenOrders(), fetchTokenTransactions()])
    user = me.user
    account = me.account
    orders = orderList
    transactions = txList
    const summary = document.getElementById('walletSummary')
    const orderEl = document.getElementById('ordersTable')
    const txEl = document.getElementById('transactionsTable')
    if (summary) summary.innerHTML = renderSummary()
    if (orderEl) orderEl.innerHTML = renderOrders()
    if (txEl) txEl.innerHTML = renderTransactions()
  } catch {
    window.location.hash = '#/login'
    return
  }

  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    clearAuthToken()
    window.location.hash = '#/login'
  })
  document.getElementById('downloadData')?.addEventListener('click', async () => {
    const resp = await fetch(dataExportUrl(), { headers: authHeaders() })
    const blob = await resp.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ai-handbook-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  })
}
