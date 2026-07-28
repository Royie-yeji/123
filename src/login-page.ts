import { sendLoginCode, verifyLoginCode } from './token-api'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function renderLoginPage(): string {
  return `
    <main class="auth-page">
      <section class="auth-shell">
        <a class="back-link" href="#/">← 返回首页</a>
        <div class="auth-card">
          <p class="ai-eyebrow">安全登录</p>
          <h1>邮箱验证码登录</h1>
          <p class="auth-desc">登录后可查看余额、订单、消耗记录，并使用自己的 API Key 调用模型。</p>
          <label class="form-label" for="loginEmail">邮箱</label>
          <input class="form-input" id="loginEmail" type="email" placeholder="name@example.com" autocomplete="email" />
          <div class="auth-code-row">
            <div>
              <label class="form-label" for="loginCode">验证码</label>
              <input class="form-input" id="loginCode" type="text" placeholder="6 位验证码" inputmode="numeric" />
            </div>
            <button class="btn-secondary auth-code-btn" id="sendLoginCode" type="button">发送验证码</button>
          </div>
          <button class="btn-primary auth-submit" id="verifyLoginCode" type="button">登录 / 注册</button>
          <p class="auth-status" id="authStatus"></p>
        </div>
      </section>
    </main>
  `
}

export function bindLoginPageEvents(): void {
  const email = document.getElementById('loginEmail') as HTMLInputElement | null
  const code = document.getElementById('loginCode') as HTMLInputElement | null
  const status = document.getElementById('authStatus')
  const send = document.getElementById('sendLoginCode') as HTMLButtonElement | null
  const verify = document.getElementById('verifyLoginCode') as HTMLButtonElement | null

  const setStatus = (text: string) => { if (status) status.innerHTML = escapeHtml(text) }

  send?.addEventListener('click', async () => {
    if (!email?.value.trim()) return setStatus('请输入邮箱地址。')
    send.disabled = true
    setStatus('正在生成验证码...')
    try {
      const result = await sendLoginCode(email.value.trim())
      setStatus(result.devCode ? `开发环境验证码：${result.devCode}` : result.message)
      code?.focus()
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '验证码发送失败。')
    } finally {
      send.disabled = false
    }
  })

  verify?.addEventListener('click', async () => {
    if (!email?.value.trim() || !code?.value.trim()) return setStatus('请输入邮箱和验证码。')
    verify.disabled = true
    setStatus('正在登录...')
    try {
      await verifyLoginCode(email.value.trim(), code.value.trim())
      setStatus('登录成功，正在进入 AI 使用页。')
      window.location.hash = '#/ai'
    } catch (err) {
      setStatus(err instanceof Error ? err.message : '登录失败。')
    } finally {
      verify.disabled = false
    }
  })
}
