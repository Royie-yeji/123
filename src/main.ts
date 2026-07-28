import './style.css'
import { type ProductCard } from './product-data'
import { renderDetailPage, bindCopyButtons } from './detail-page'
import { createChatWidget } from './chat-widget'
import { renderIntegrationPage, bindIntegrationEvents } from './integration-page'
import { renderAiPage, bindAiPageEvents } from './ai-page'
import { renderLoginPage, bindLoginPageEvents } from './login-page'
import { renderPricingPage, bindPricingPageEvents } from './pricing-page'
import { renderWalletPage, bindWalletPageEvents } from './wallet-page'
import { renderAdminUsersPage, bindAdminUsersPageEvents } from './admin-users-page'
import { products } from './main-data'

export { products }
export type { ProductCard }

/* ── 首页渲染 ── */

function renderNav(): string {
  return `
    <nav class="navbar" id="navbar">
      <div class="nav-container">
        <a href="#/" class="nav-logo" data-route>
          <span class="logo-text">Luckyww</span>
        
        </a>
        <div class="nav-links">
          <a href="#/#hero" class="nav-link" data-route>概览</a>
          <a href="#/#products" class="nav-link" data-route>上游模型</a>
          <a href="#/integration" class="nav-link" data-route>接入教学</a>
          <a href="#/ai" class="nav-link" data-route>对话工作台</a>
          <a href="#/pricing" class="nav-link" data-route>计费</a>
          <a href="#/wallet" class="nav-link" data-route>账户</a>
          <a href="#/admin/users" class="nav-link" data-route>用户</a>
        </div>
      </div>
    </nav>
  `
}

function renderHero(): string {
  return `
    <section class="hero" id="hero">
      <div class="hero-content">
        <div class="hero-badge hero-anim" style="animation-delay:0s">OpenAI 兼容中转 · 统一入口 · 统一计费</div>
        <h1 class="hero-title">
          <span class="title-word hero-anim" style="animation-delay:0.15s">AI</span>
          <span class="title-accent hero-anim" style="animation-delay:0.3s">中转站</span>
          <br>
          <span class="title-word hero-anim" style="animation-delay:0.45s">统一接入海外模型</span>
        </h1>
        <p class="hero-subtitle hero-anim" style="animation-delay:0.6s">把多家上游模型收进同一个 OpenAI 兼容入口。<br>登录、模型路由、余额、计费、接入文档都在一处完成。</p>
        <div class="hero-pills hero-anim" style="animation-delay:0.75s">
          <span class="hero-pill">统一接口</span>
          <span class="hero-pill">模型路由</span>
          <span class="hero-pill">Token 计费</span>
          <span class="hero-pill">自定义 API Key</span>
        </div>
        <div class="hero-scroll hero-anim" style="animation-delay:0.9s">
          <span>向下滚动探索</span>
          <div class="scroll-arrow"></div>
        </div>
      </div>
    </section>
  `
}

function renderHandbook(): string {
  return `
    <section class="handbook" id="handbook">
      <div class="handbook-container">
        <div class="handbook-left">
          <h2 class="handbook-title">一个入口，<br>接所有上游。</h2>
          <p class="handbook-desc">这套中转站保留了 new-api 一类项目最关键的结构：<br>统一鉴权、统一模型列表、统一计费、统一的 OpenAI 兼容出口。</p>
          <div class="steps">
            <div class="step"><div class="step-number">1</div><div class="step-content"><h3 class="step-title">登录并领取额度</h3><p class="step-desc">邮箱验证码登录后，可直接查看 Token 余额、订单和流水</p></div></div>
            <div class="step"><div class="step-number">2</div><div class="step-content"><h3 class="step-title">选择上游模型</h3><p class="step-desc">模型列表从后端拉取，支持文本和图片能力标记</p></div></div>
            <div class="step"><div class="step-number">3</div><div class="step-content"><h3 class="step-title">发起兼容调用</h3><p class="step-desc">前端只认 /api/chat，后端把请求转给对应上游</p></div></div>
          </div>
        </div>
        <div class="handbook-right">
          <div class="browser-mockup">
            <div class="browser-bar"><div class="browser-dots"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div><div class="browser-url">royieaiguide:3001</div></div>
            <div class="browser-body">
              <div class="mock-line w-80"></div><div class="mock-line w-60"></div><div class="mock-line w-70"></div>
              <div class="mock-cards">
                <div class="mock-card"><div class="mock-icon" style="background: linear-gradient(135deg, #1d1d1f, #6e6e73)">↗</div><div class="mock-card-line"></div><div class="mock-card-line short"></div></div>
                <div class="mock-card"><div class="mock-icon" style="background: linear-gradient(135deg, #4a90d9, #1a73e8)">API</div><div class="mock-card-line"></div><div class="mock-card-line short"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `
}

function renderProductCard(product: ProductCard): string {
  const tagsHtml = product.tags.map(tag => `<span class="product-tag">${tag}</span>`).join('')
  const slug = product.name.toLowerCase()
  return `
    <article class="product-card" data-slug="${slug}">
      <div class="product-icon" style="background: ${product.iconBg}">
        <img src="${product.logoUrl}" alt="${product.name}" class="product-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none">${product.icon}</span>
      </div>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-company">${product.company}</p>
      <p class="product-desc">${product.description}</p>
      <div class="product-tags">${tagsHtml}</div>
      <a href="#/product/${slug}" class="product-link" data-route>查看接入说明 →</a>
    </article>
  `
}

function renderProducts(): string {
  return `
    <section class="products" id="products">
      <div class="products-container">
        <h2 class="section-title">可接入的上游</h2>
        <p class="section-subtitle">这里展示的是可以挂到中转站里的模型来源与能力标签，而不是页面装饰。</p>
        <div class="product-grid">${products.map(renderProductCard).join('')}</div>
      </div>
    </section>
  `
}

function renderCommercialCta(): string {
  return `
    <section class="monetize-section">
      <div class="monetize-shell">
        <p class="ai-eyebrow">Relay Console</p>
        <h2>把代理、计费和模型治理放进同一个控制台</h2>
        <p>后端保留密钥，前端只发兼容请求。你可以继续扩展模型、定价、用户 Key 优先级和日志审计。</p>
        <div class="monetize-points">
          <span>OpenAI 兼容接口</span>
          <span>模型列表同步</span>
          <span>Token 计费</span>
          <span>用户 Key 优先</span>
        </div>
        <div class="commerce-actions">
          <a class="btn-primary" href="#/ai">进入对话工作台</a>
          <a class="btn-secondary" href="#/pricing">查看计费方案</a>
        </div>
      </div>
    </section>
  `
}

function renderFooter(): string {
  return `
    <footer class="footer" id="footer">
      <div class="footer-container">
        <div class="footer-left">© 2026 AI 中转站 · 自建代理与计费控制台</div>
        <div class="footer-right">参考结构：new-api 类开源项目</div>
      </div>
    </footer>
  `
}

function renderHomePage(): string {
  return `${renderNav()}${renderHero()}${renderHandbook()}${renderProducts()}${renderCommercialCta()}${renderFooter()}`
}

/* ── 动态背景元素 ── */

function injectDynamicElements(): void {
  // 滚动进度条
  const progress = document.createElement('div')
  progress.className = 'scroll-progress'
  progress.id = 'scrollProgress'
  document.body.appendChild(progress)

}

/* ── 路由系统 ── */

function getRoute(): { page: string; slug?: string; anchor?: string } {
  const hash = window.location.hash.slice(1) || '/'
  // Patterns: /, /product/{slug}, /integration, /#anchor
  if (hash.startsWith('/product/')) {
    const slug = hash.replace('/product/', '')
    return { page: 'detail', slug }
  }
  if (hash.startsWith('/integration')) {
    return { page: 'integration' }
  }
  if (hash.startsWith('/ai')) {
    return { page: 'ai' }
  }
  if (hash.startsWith('/pricing')) {
    return { page: 'pricing' }
  }
  if (hash.startsWith('/wallet')) {
    return { page: 'wallet' }
  }
  if (hash.startsWith('/admin/users')) {
    return { page: 'admin-users' }
  }
  if (hash.startsWith('/login')) {
    return { page: 'login' }
  }
  // Home with optional anchor: / or /#section
  const anchorMatch = hash.match(/^\/?(?:#(.+))?$/)
  return { page: 'home', anchor: anchorMatch?.[1] }
}

function scrollToAnchor(anchor?: string): void {
  if (!anchor) {
    window.scrollTo(0, 0)
    return
  }
  const el = document.getElementById(anchor)
  if (el) {
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }
}

function bindHomeInteractions(): void {
  // 平滑滚动
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#/#"]').forEach(link => {
    link.addEventListener('click', (e: MouseEvent) => {
      const href = link.getAttribute('href') || ''
      const anchor = href.split('#/#')[1]?.split('"')[0]
      if (anchor) {
        e.preventDefault()
        scrollToAnchor(anchor)
      }
    })
  })

  // 导航栏滚动 + 进度条
  const navbar = document.getElementById('navbar')
  const progress = document.getElementById('scrollProgress')
  window.addEventListener('scroll', () => {
    if (navbar) {
      navbar.classList.toggle('navbar-scrolled', window.scrollY > 50)
    }
    if (progress) {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      progress.style.width = `${pct}%`
    }
  }, { passive: true })

  // 卡片入场动画
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('card-visible')
      })
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  )
  document.querySelectorAll('.product-card, .handbook-container, .step').forEach(el => {
    el.classList.add('card-hidden')
    observer.observe(el)
  })

  // 卡片鼠标跟随光晕
  document.querySelectorAll<HTMLElement>('.product-card').forEach(card => {
    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      card.style.setProperty('--mx', `${x}%`)
      card.style.setProperty('--my', `${y}%`)
    })
  })
}

function render(): void {
  const route = getRoute()
  const app = document.getElementById('app')
  if (!app) return

  if (route.page === 'detail' && route.slug) {
    app.innerHTML = `${renderNav()}${renderDetailPage(route.slug)}`
    window.scrollTo(0, 0)
    bindCopyButtons()
  } else if (route.page === 'integration') {
    app.innerHTML = `${renderNav()}${renderIntegrationPage()}`
    window.scrollTo(0, 0)
    bindIntegrationEvents()
    bindCopyButtons()
  } else if (route.page === 'ai') {
    app.innerHTML = `${renderNav()}${renderAiPage()}`
    window.scrollTo(0, 0)
    bindAiPageEvents()
  } else if (route.page === 'pricing') {
    app.innerHTML = `${renderNav()}${renderPricingPage()}`
    window.scrollTo(0, 0)
    bindPricingPageEvents()
  } else if (route.page === 'wallet') {
    app.innerHTML = `${renderNav()}${renderWalletPage()}`
    window.scrollTo(0, 0)
    bindWalletPageEvents()
  } else if (route.page === 'admin-users') {
    app.innerHTML = `${renderNav()}${renderAdminUsersPage()}`
    window.scrollTo(0, 0)
    bindAdminUsersPageEvents()
  } else if (route.page === 'login') {
    app.innerHTML = `${renderNav()}${renderLoginPage()}`
    window.scrollTo(0, 0)
    bindLoginPageEvents()
  } else {
    app.innerHTML = renderHomePage()
    bindHomeInteractions()
    scrollToAnchor(route.anchor)
  }
}

// 初始渲染 + hash 变化监听
injectDynamicElements()
createChatWidget()
render()
window.addEventListener('hashchange', render)
