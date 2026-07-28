import { productDetails, type ProductDetail } from './product-data'

/* ── 详情页渲染 ── */

function renderDetailHero(p: ProductDetail): string {
  return `
    <section class="detail-hero">
      <div class="detail-hero-content">
        <a href="#/" class="back-link">← 返回手册</a>
        <div class="detail-icon" style="background: ${p.iconBg}">
          <span>${p.icon}</span>
        </div>
        <h1 class="detail-name">${p.name}</h1>
        <p class="detail-company">${p.company}</p>
        <p class="detail-tagline">${p.tagline}</p>
        <div class="detail-tags">
          ${p.tags.map(t => `<span class="detail-tag">${t}</span>`).join('')}
        </div>
        <div class="detail-cta">
          <a href="${p.officialUrl}" target="_blank" rel="noopener" class="btn-primary">访问官网</a>
          <a href="${p.apiKeyUrl}" target="_blank" rel="noopener" class="btn-secondary">前往 CUN.AI 获取 API Key</a>
        </div>
      </div>
    </section>
  `
}

function renderModels(p: ProductDetail): string {
  return `
    <section class="detail-section">
      <h2 class="detail-section-title">可用模型</h2>
      <div class="model-grid">
        ${p.models.map(m => `
          <div class="model-card">
            <div class="model-category">${m.category}</div>
            <h3 class="model-name">${m.name}</h3>
            <p class="model-desc">${m.desc}</p>
          </div>
        `).join('')}
      </div>
    </section>
  `
}

function renderTutorials(p: ProductDetail): string {
  return `
    <section class="detail-section">
      <h2 class="detail-section-title">使用教程</h2>
      ${p.tutorials.map(t => `
        <div class="tutorial-block">
          <h3 class="tutorial-title">${t.title}</h3>
          <div class="tutorial-steps">
            ${t.steps.map((s, i) => `
              <div class="tut-step">
                <div class="tut-num">${i + 1}</div>
                <div class="tut-body">
                  <h4 class="tut-step-title">${s.title}</h4>
                  <p class="tut-step-desc">${s.desc}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderCodeBlock(block: { lang: string; label: string; code: string }): string {
  const escapedCode = escapeHtml(block.code)
  return `
    <div class="code-block">
      <div class="code-header">
        <span class="code-label">${block.label}</span>
        <button class="code-copy-btn" data-code="${encodeURIComponent(block.code)}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg>
          <span class="copy-text">复制</span>
        </button>
      </div>
      <pre class="code-pre"><code>${escapedCode}</code></pre>
    </div>
  `
}

function renderInstallGuide(p: ProductDetail): string {
  return `
    <section class="detail-section">
      <h2 class="detail-section-title">${p.installGuide.title}</h2>
      ${p.installGuide.phases.map((phase, pi) => `
        <div class="install-phase">
          <div class="phase-header">
            <div class="phase-tag">${phase.phaseTag}</div>
            <h3 class="phase-name">${phase.phaseName}</h3>
          </div>
          <div class="phase-steps">
            ${phase.steps.map((s, si) => `
              <div class="install-step">
                <div class="install-step-num">${pi + 1}.${si + 1}</div>
                <div class="install-step-body">
                  <h4 class="install-step-title">${s.title}</h4>
                  <p class="install-step-desc">${s.desc}</p>
                  ${s.cmd ? `<div class="install-cmd-row"><code class="term-cmd">${escapeHtml(s.cmd)}</code><button class="code-copy-btn code-copy-sm" data-code="${encodeURIComponent(s.cmd)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/></svg><span class="copy-text">复制</span></button></div>` : ''}
                  ${s.tip ? `<div class="install-tip">💡 ${s.tip}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `
}

function renderApiConfig(p: ProductDetail): string {
  return `
    <section class="detail-section">
      <h2 class="detail-section-title">${p.apiConfig.title}</h2>
      <div class="config-card">
        ${p.apiConfig.fields.map(f => `
          <div class="config-row">
            <span class="config-label">${f.label}</span>
            <code class="config-value">${f.value}</code>
          </div>
        `).join('')}
      </div>
      <div class="code-blocks">
        ${p.apiConfig.codeBlocks.map(renderCodeBlock).join('')}
      </div>
      ${p.apiConfig.callouts.map(c => `
        <div class="callout callout-${c.type}">
          <strong>${c.title}</strong>
          <p>${c.desc}</p>
        </div>
      `).join('')}
    </section>
  `
}

function renderTerminalConfig(p: ProductDetail): string {
  return `
    <section class="detail-section">
      <h2 class="detail-section-title">${p.terminalConfig.title}</h2>
      <p class="terminal-intro">${p.terminalConfig.intro}</p>
      ${p.terminalConfig.tools.map(tool => `
        <div class="tool-block">
          <h3 class="tool-title">${tool.name}</h3>
          <div class="terminal-steps">
            ${tool.steps.map(s => `
              <div class="term-step">
                <code class="term-cmd">${escapeHtml(s.cmd)}</code>
                <span class="term-desc">${s.desc}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </section>
  `
}

export function renderDetailPage(slug: string): string {
  const p = productDetails[slug]
  if (!p) {
    return `
      <div class="not-found">
        <h1>产品未找到</h1>
        <a href="#/" class="btn-primary">返回首页</a>
      </div>
    `
  }
  return `
    <div class="detail-page">
      ${renderDetailHero(p)}
      <div class="detail-body">
        ${renderModels(p)}
        ${renderInstallGuide(p)}
        ${renderTutorials(p)}
        ${renderApiConfig(p)}
        ${renderTerminalConfig(p)}
      </div>
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-left">© 2026 海外AI产品操作手册</div>
          <div class="footer-right">灵感参考：doc.cun.ai</div>
        </div>
      </footer>
    </div>
  `
}

/* ── 复制按钮绑定 ── */
export function bindCopyButtons(): void {
  document.querySelectorAll<HTMLElement>('.code-copy-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const encoded = btn.dataset.code || ''
      const code = decodeURIComponent(encoded)
      try {
        await navigator.clipboard.writeText(code)
        const text = btn.querySelector('.copy-text')
        if (text) {
          const original = text.textContent
          text.textContent = '已复制'
          btn.classList.add('copied')
          setTimeout(() => {
            text.textContent = original || '复制'
            btn.classList.remove('copied')
          }, 2000)
        }
      } catch {
        // Fallback
        const ta = document.createElement('textarea')
        ta.value = code
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        const text = btn.querySelector('.copy-text')
        if (text) {
          text.textContent = '已复制'
          setTimeout(() => { text.textContent = '复制' }, 2000)
        }
      }
    })
  })
}
