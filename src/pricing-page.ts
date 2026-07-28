import { createTokenOrder, fetchMe, fetchTokenPackages, isLoggedIn, mockPayOrder, type TokenAccount, type TokenPackage } from './token-api'

let account: TokenAccount | null = null
let packages: TokenPackage[] = []

function money(n: number): string {
  return `$${n.toFixed(2)}`
}

function balanceText(acc: TokenAccount | null): string {
  return acc ? `${acc.availableBalance.toFixed(0)} Token` : '登录后查看'
}

export function renderPricingPage(): string {
  return `
    <main class="commerce-page">
      <section class="commerce-hero">
        <div class="commerce-hero-inner">
          <p class="ai-eyebrow">算力 Token</p>
          <h1>购买算力 Token</h1>
          <p>用于 AI 问答、API 接入方案、文件分析和工具配置指导。</p>
          <div class="commerce-actions">
            <a class="btn-primary" href="#/ai">去 AI 使用</a>
            <a class="btn-secondary" href="#/wallet">查看余额</a>
          </div>
        </div>
      </section>
      <section class="commerce-section">
        <div class="balance-card" id="pricingBalance">
          <span>当前可用余额</span>
          <strong>${balanceText(account)}</strong>
          <small>新用户登录赠送 20 Token 试用额度</small>
        </div>
        <div class="pricing-grid" id="pricingGrid">
          ${packages.length ? packages.map(renderPackageCard).join('') : renderPricingSkeleton()}
        </div>
        <div class="billing-note">
          <h2>计费说明</h2>
          <p>普通问答低消耗，高级模型、长文档、图片和研究类任务会提高消耗。所有扣费均由服务端计算，请求失败不会扣费。</p>
        </div>
      </section>
    </main>
  `
}

function renderPackageCard(pkg: TokenPackage): string {
  return `
    <article class="pricing-card">
      <div class="pricing-card-top">
        <span>${pkg.group}</span>
        <h2>${pkg.name}</h2>
        <p>${pkg.positioning}</p>
      </div>
      <div class="pricing-price"><strong>${money(pkg.price)}</strong><span> / ${pkg.durationDays} 天</span></div>
      <div class="pricing-token">到账 ${pkg.tokens + pkg.bonus} Token</div>
      <ul>${pkg.highlights.map(item => `<li>${item}</li>`).join('')}</ul>
      <button class="pricing-buy" data-package="${pkg.id}" type="button">创建订单</button>
    </article>
  `
}

function renderPricingSkeleton(): string {
  return Array.from({ length: 4 }).map(() => '<div class="pricing-card pricing-loading">正在加载套餐...</div>').join('')
}

export async function bindPricingPageEvents(): Promise<void> {
  if (!isLoggedIn()) {
    const grid = document.getElementById('pricingGrid')
    if (grid) grid.innerHTML = '<div class="commerce-empty">请先登录后购买 Token。<br><a class="btn-primary" href="#/login">邮箱登录</a></div>'
    return
  }

  try {
    const [me, packageData] = await Promise.all([fetchMe(), fetchTokenPackages()])
    account = me.account
    packages = packageData.packages
    refreshPricingDom()
  } catch {
    window.location.hash = '#/login'
  }
}

function refreshPricingDom(): void {
  const balance = document.getElementById('pricingBalance')
  if (balance) {
    balance.innerHTML = `<span>当前可用余额</span><strong>${balanceText(account)}</strong><small>冻结余额 ${account?.frozenBalance || 0} Token</small>`
  }
  const grid = document.getElementById('pricingGrid')
  if (!grid) return
  grid.innerHTML = packages.map(renderPackageCard).join('')
  grid.querySelectorAll<HTMLButtonElement>('[data-package]').forEach(btn => {
    btn.addEventListener('click', async () => {
      btn.disabled = true
      btn.textContent = '订单创建中...'
      try {
        const order = await createTokenOrder(btn.dataset.package || '')
        btn.textContent = '模拟支付中...'
        account = await mockPayOrder(order.id)
        refreshPricingDom()
        alert('模拟支付成功，Token 已入账。')
      } catch (err) {
        alert(err instanceof Error ? err.message : '购买失败。')
        btn.disabled = false
        btn.textContent = '创建订单'
      }
    })
  })
}
