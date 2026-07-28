import { integrationTools, type IntegrationTool } from './integration-data'
import { products } from './main-data'

function renderProductMiniCard(product: typeof products[0]): string {
  const slug = product.name.toLowerCase()
  return `
    <article class="product-card" data-slug="${slug}">
      <div class="product-icon" style="background: ${product.iconBg}">
        <img src="${product.logoUrl}" alt="${product.name}" class="product-logo" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><span style="display:none">${product.icon}</span>
      </div>
      <h3 class="product-name">${product.name}</h3>
      <p class="product-company">${product.company}</p>
      <p class="product-desc">${product.description}</p>
      <div class="product-tags">${product.tags.map((t: string) => `<span class="product-tag">${t}</span>`).join('')}</div>
      <a href="#/product/${slug}" class="product-link" data-route>查看操作指引 →</a>
    </article>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderToolCard(tool: IntegrationTool): string {
  return `
    <article class="integ-tool-card" data-id="${tool.id}">
      <div class="integ-tool-header">
        <div class="integ-tool-icon">${tool.icon}</div>
        <div>
          <h3 class="integ-tool-name">${tool.name}</h3>
          <span class="integ-tool-category">${tool.category}</span>
        </div>
      </div>
      <p class="integ-tool-desc">${tool.desc}</p>
      <div class="integ-config-summary">
        ${tool.configSummary.map(c => `
          <div class="integ-config-row">
            <span class="integ-config-label">${c.label}</span>
            <code class="integ-config-value">${escapeHtml(c.value)}</code>
          </div>
        `).join('')}
      </div>
      <button class="integ-expand-btn" data-target="${tool.id}">查看详细步骤 →</button>
    </article>
  `
}

function renderToolDetail(tool: IntegrationTool): string {
  return `
    <div class="integ-detail" id="detail-${tool.id}" style="display:none">
      <div class="integ-detail-header">
        <button class="integ-back-btn" data-back>← 返回工具列表</button>
        <div class="integ-detail-icon">${tool.icon}</div>
        <h2 class="integ-detail-name">${tool.name}</h2>
        <p class="integ-detail-desc">${tool.desc}</p>
      </div>
      <div class="integ-config-card">
        <h3 class="integ-section-subtitle">配置信息</h3>
        ${tool.configSummary.map(c => `
          <div class="integ-config-row">
            <span class="integ-config-label">${c.label}</span>
            <code class="integ-config-value">${escapeHtml(c.value)}</code>
          </div>
        `).join('')}
      </div>
      <h3 class="integ-section-subtitle">操作步骤</h3>
      <div class="integ-steps">
        ${tool.steps.map((s, i) => `
          <div class="integ-step">
            <div class="integ-step-num">${i + 1}</div>
            <div class="integ-step-body">
              <h4 class="integ-step-title">${s.title}</h4>
              <p class="integ-step-desc">${s.desc}</p>
              ${s.cmd ? `<div class="integ-cmd-row"><code class="term-cmd">${escapeHtml(s.cmd)}</code><button class="code-copy-btn code-copy-sm" data-code="${encodeURIComponent(s.cmd)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg><span class="copy-text">复制</span></button></div>` : ''}
              ${s.code ? `<div class="code-block"><div class="code-header"><span class="code-label">${s.code.lang}</span><button class="code-copy-btn" data-code="${encodeURIComponent(s.code.content)}"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg><span class="copy-text">复制</span></button></div><pre class="code-pre"><code>${escapeHtml(s.code.content)}</code></pre></div>` : ''}
              ${s.tip ? `<div class="install-tip">💡 ${s.tip}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      ${tool.troubleshooting.length > 0 ? `
        <h3 class="integ-section-subtitle">常见问题</h3>
        <div class="integ-troubleshoot">
          ${tool.troubleshooting.map(t => `
            <div class="integ-faq">
              <div class="integ-faq-q">❓ ${t.issue}</div>
              <div class="integ-faq-a">${t.solution}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `
}

export function renderIntegrationPage(): string {
  return `
    <div class="integ-page">
      <section class="integ-hero">
        <div class="integ-hero-content">
          <div class="hero-badge hero-anim" style="animation-delay:0s">开发工具接入教学</div>
          <h1 class="hero-title">
            <span class="title-word hero-anim" style="animation-delay:0.15s">把 AI 模型</span>
            <br>
            <span class="title-accent hero-anim" style="animation-delay:0.3s">接入你的工具</span>
          </h1>
          <p class="hero-subtitle hero-anim" style="animation-delay:0.45s">从 CUN.AI 获取 API Key，按照教程配置到你的开发工具中，<br>涵盖 Cursor、Claude Code、Codex CLI、Cherry Studio 等主流工具。</p>
          <div class="integ-cta hero-anim" style="animation-delay:0.6s">
            <a href="https://www.cun.ai" target="_blank" rel="noopener" class="btn-primary">前往 CUN.AI 获取 API Key</a>
          </div>
        </div>
      </section>

      <section class="integ-tools-section" id="integTools">
        <div class="integ-tools-container">
          <h2 class="section-title">支持的接入工具</h2>
          <p class="section-subtitle">${integrationTools.length} 款开发工具，点击查看详细配置步骤</p>
          <div class="integ-tool-grid">
            ${integrationTools.map(renderToolCard).join('')}
          </div>
        </div>
      </section>

      ${integrationTools.map(renderToolDetail).join('')}

      <section class="products" id="products" style="padding-top: 60px;">
        <div class="products-container">
          <h2 class="section-title">AI 产品阵容</h2>
          <p class="section-subtitle">六款海外主流AI产品，点击查看详细使用教程与API接入</p>
          <div class="product-grid">${products.map(renderProductMiniCard).join('')}</div>
        </div>
      </section>

      <footer class="footer">
        <div class="footer-container">
          <div class="footer-left">© 2026 海外AI产品操作手册</div>
          <div class="footer-right">接入教学参考：doc.cun.ai</div>
        </div>
      </footer>
    </div>
  `
}

export function bindIntegrationEvents(): void {
  // 卡片展开
  document.querySelectorAll<HTMLElement>('.integ-expand-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.target
      if (!id) return
      // 隐藏卡片列表
      const toolsSection = document.getElementById('integTools')
      if (toolsSection) toolsSection.style.display = 'none'
      // 隐藏所有详情
      document.querySelectorAll<HTMLElement>('.integ-detail').forEach(d => { d.style.display = 'none' })
      // 显示目标详情
      const detail = document.getElementById(`detail-${id}`)
      if (detail) {
        detail.style.display = 'block'
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    })
  })

  // 返回按钮
  document.querySelectorAll<HTMLElement>('.integ-back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 隐藏所有详情
      document.querySelectorAll<HTMLElement>('.integ-detail').forEach(d => { d.style.display = 'none' })
      // 显示卡片列表
      const toolsSection = document.getElementById('integTools')
      if (toolsSection) {
        toolsSection.style.display = 'block'
        toolsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  })
}
