/**
 * AI 聊天小部件 — 多对话 / 刷新 / 删除 / 保存
 * 通过 /api/chat 后端代理与 AI 通信，API 密钥不在前端暴露
 */

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
}

let conversations: Conversation[] = []
let currentConvId: string | null = null
let isOpen = false
let isLoading = false

function convId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function newConversation(): Conversation {
  const c: Conversation = {
    id: convId(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
  }
  conversations.push(c)
  currentConvId = c.id
  saveToStorage()
  return c
}

function getCurrentConv(): Conversation | null {
  if (!currentConvId) return null
  return conversations.find(c => c.id === currentConvId) || null
}

/* ── localStorage 持久化 ── */

function saveToStorage(): void {
  try {
    localStorage.setItem('ai_chat_conversations', JSON.stringify(conversations))
    localStorage.setItem('ai_chat_current', currentConvId || '')
  } catch { /* ignore */ }
}

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem('ai_chat_conversations')
    const current = localStorage.getItem('ai_chat_current')
    if (raw) {
      conversations = JSON.parse(raw)
      currentConvId = current || (conversations[0]?.id ?? null)
    }
  } catch { /* ignore */ }
}

/* ── 构建 UI ── */

function createChatWidget(): void {
  loadFromStorage()
  if (conversations.length === 0) {
    newConversation()
  }

  // 浮动按钮
  const floatBtn = document.createElement('div')
  floatBtn.className = 'chat-float-btn'
  floatBtn.id = 'chatFloatBtn'
  floatBtn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.04 2 11.02c0 2.18.89 4.17 2.35 5.69L3 22l5.46-1.35c1.13.33 2.34.51 3.54.51 5.52 0 10-4.04 10-9.02S17.52 2 12 2z" fill="currentColor"/>
    </svg>
    <span class="chat-float-badge">AI</span>
  `
  floatBtn.addEventListener('click', () => {
    window.location.hash = '#/ai'
  })
  document.body.appendChild(floatBtn)

  // 聊天窗口
  const chatWindow = document.createElement('div')
  chatWindow.className = 'chat-window'
  chatWindow.id = 'chatWindow'
  chatWindow.innerHTML = `
    <div class="chat-header">
      <div class="chat-header-info">
        <div class="chat-header-avatar">AI</div>
        <div>
          <div class="chat-header-title">AI 助手</div>
          <div class="chat-header-status">在线</div>
        </div>
      </div>
      <div class="chat-header-actions">
        <button class="chat-action-btn" id="chatNew" title="新对话" aria-label="新对话">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"/></svg>
        </button>
        <button class="chat-action-btn" id="chatRefresh" title="刷新当前对话" aria-label="刷新">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" fill="currentColor"/></svg>
        </button>
        <button class="chat-action-btn" id="chatSave" title="保存对话" aria-label="保存">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z" fill="currentColor"/></svg>
        </button>
        <button class="chat-action-btn chat-action-danger" id="chatDelete" title="删除当前对话" aria-label="删除">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/></svg>
        </button>
        <button class="chat-close" id="chatClose" aria-label="关闭">×</button>
      </div>
    </div>
    <div class="chat-conv-tabs" id="chatConvTabs"></div>
    <div class="chat-messages" id="chatMessages"></div>
    <div class="chat-input-area">
      <div class="chat-suggestions" id="chatSuggestions">
        <button class="chat-suggestion" data-q="ChatGPT 怎么用？">ChatGPT 怎么用？</button>
        <button class="chat-suggestion" data-q="Claude API 如何接入？">Claude API 如何接入？</button>
        <button class="chat-suggestion" data-q="对比 Gemini 和 ChatGPT">对比 Gemini 和 ChatGPT</button>
      </div>
      <div class="chat-input-row">
        <input type="text" class="chat-input" id="chatInput" placeholder="输入你的问题..." autocomplete="off" />
        <button class="chat-send" id="chatSend" aria-label="发送">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z" fill="currentColor"/></svg>
        </button>
      </div>
    </div>
  `
  document.body.appendChild(chatWindow)

  // 绑定事件
  document.getElementById('chatClose')?.addEventListener('click', toggleChat)
  document.getElementById('chatNew')?.addEventListener('click', () => { newConversation(); renderConversationList(); renderMessages() })
  document.getElementById('chatRefresh')?.addEventListener('click', refreshConversation)
  document.getElementById('chatSave')?.addEventListener('click', saveConversation)
  document.getElementById('chatDelete')?.addEventListener('click', deleteConversation)
  document.getElementById('chatSend')?.addEventListener('click', sendMessage)
  const input = document.getElementById('chatInput') as HTMLInputElement | null
  input?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })

  document.querySelectorAll<HTMLElement>('.chat-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
      const q = btn.dataset.q || ''
      if (input) { input.value = q; sendMessage() }
    })
  })

  // 初始渲染
  renderConversationList()
  renderMessages()
}

function toggleChat(): void {
  isOpen = !isOpen
  const win = document.getElementById('chatWindow')
  const btn = document.getElementById('chatFloatBtn')
  win?.classList.toggle('chat-open', isOpen)
  btn?.classList.toggle('chat-btn-active', isOpen)
  if (isOpen) {
    setTimeout(() => document.getElementById('chatInput')?.focus(), 300)
  }
}

/* ── 对话列表 ── */

function renderConversationList(): void {
  const container = document.getElementById('chatConvTabs')
  if (!container) return
  container.innerHTML = conversations.map(c => {
    const active = c.id === currentConvId ? 'conv-tab-active' : ''
    const title = c.title.length > 12 ? c.title.slice(0, 12) + '…' : c.title
    return `<button class="conv-tab ${active}" data-conv="${c.id}">${escapeHtml(title)}</button>`
  }).join('')

  container.querySelectorAll<HTMLElement>('.conv-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentConvId = tab.dataset.conv || null
      saveToStorage()
      renderConversationList()
      renderMessages()
    })
  })
}

/* ── 消息渲染 ── */

function renderMessages(): void {
  const container = document.getElementById('chatMessages')
  if (!container) return
  container.innerHTML = ''

  const conv = getCurrentConv()
  if (!conv || conv.messages.length === 0) {
    container.innerHTML = `
      <div class="chat-msg assistant">
        <div class="chat-msg-avatar">AI</div>
        <div class="chat-msg-bubble">你好！我是本站内置的AI助手。你可以问我关于 ChatGPT、Claude、Gemini 等海外AI产品的问题。</div>
      </div>
    `
    // 重新显示建议
    const sugg = document.getElementById('chatSuggestions')
    if (sugg) sugg.style.display = 'flex'
    return
  }

  // 隐藏建议（已有对话时）
  const sugg = document.getElementById('chatSuggestions')
  if (sugg) sugg.style.display = 'none'

  conv.messages.forEach(msg => appendMessage(msg, false))
}

function appendMessage(msg: ChatMessage, pushToConv = true): void {
  const container = document.getElementById('chatMessages')
  if (!container) return

  if (pushToConv) {
    const conv = getCurrentConv()
    if (conv) {
      conv.messages.push(msg)
      // 设置标题为第一条用户消息
      if (conv.title === '新对话' && msg.role === 'user') {
        conv.title = msg.content.slice(0, 20)
      }
      saveToStorage()
      renderConversationList()
    }
  }

  const div = document.createElement('div')
  div.className = `chat-msg ${msg.role}`
  if (msg.role === 'assistant') {
    div.innerHTML = `<div class="chat-msg-avatar">AI</div><div class="chat-msg-bubble">${escapeHtml(msg.content)}</div>`
  } else {
    div.innerHTML = `<div class="chat-msg-bubble user">${escapeHtml(msg.content)}</div>`
  }
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function showTyping(): void {
  const container = document.getElementById('chatMessages')
  if (!container) return
  const div = document.createElement('div')
  div.className = 'chat-msg assistant'
  div.id = 'chatTyping'
  div.innerHTML = `
    <div class="chat-msg-avatar">AI</div>
    <div class="chat-msg-bubble typing">
      <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
    </div>
  `
  container.appendChild(div)
  container.scrollTop = container.scrollHeight
}

function removeTyping(): void {
  document.getElementById('chatTyping')?.remove()
}

/* ── 操作 ── */

async function sendMessage(): Promise<void> {
  const input = document.getElementById('chatInput') as HTMLInputElement | null
  if (!input) return
  const text = input.value.trim()
  if (!text || isLoading) return

  input.value = ''
  isLoading = true

  if (!getCurrentConv()) newConversation()

  appendMessage({ role: 'user', content: text })

  const conv = getCurrentConv()
  if (!conv) { isLoading = false; return }

  showTyping()

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: conv.messages, model: 'gpt-4o-mini' }),
      signal: AbortSignal.timeout(120000),
    })
    const data = await resp.json()
    removeTyping()

    if (data.error) {
      appendMessage({ role: 'assistant', content: `抱歉，出现了错误：${data.error}` })
    } else {
      appendMessage({ role: 'assistant', content: data.reply || '抱歉，我无法生成回复。' })
    }
  } catch (err) {
    removeTyping()
    const errMsg = err instanceof Error && err.name === 'TimeoutError'
      ? '回复超时，请点击刷新按钮重试。'
      : '网络错误，请检查网络连接后点击刷新按钮重试。'
    appendMessage({ role: 'assistant', content: errMsg })
  } finally {
    isLoading = false
  }
}

function refreshConversation(): void {
  const conv = getCurrentConv()
  if (!conv) return
  // 保留用户消息，删除 AI 回复，重新请求最后一条
  const lastUserIdx = [...conv.messages].reverse().findIndex(m => m.role === 'user')
  if (lastUserIdx === -1) return
  const lastUserMsg = conv.messages[conv.messages.length - 1 - lastUserIdx]
  // 删除最后一条 AI 回复（如果有）
  if (conv.messages[conv.messages.length - 1].role === 'assistant') {
    conv.messages.pop()
  }
  saveToStorage()
  renderMessages()
  // 重新发送
  const input = document.getElementById('chatInput') as HTMLInputElement | null
  if (input) {
    input.value = lastUserMsg.content
    sendMessage()
  }
}

function saveConversation(): void {
  const conv = getCurrentConv()
  if (!conv || conv.messages.length === 0) return
  saveToStorage()
  // 导出为 txt 记事本文档
  const dateStr = new Date(conv.createdAt).toLocaleString('zh-CN')
  let text = `════════════════════════════════════════\n`
  text += `  AI 对话记录\n`
  text += `  对话标题：${conv.title}\n`
  text += `  创建时间：${dateStr}\n`
  text += `════════════════════════════════════════\n\n`

  conv.messages.forEach((msg, i) => {
    const role = msg.role === 'user' ? '我' : 'AI 助手'
    const time = new Date(conv.createdAt + i * 1000).toLocaleTimeString('zh-CN')
    text += `【${role}】 ${time}\n`
    text += `${msg.content}\n`
    text += `${'─'.repeat(40)}\n\n`
  })

  text += `════════════════════════════════════════\n`
  text += `  由海外AI产品操作手册 AI助手 生成\n`
  text += `════════════════════════════════════════\n`

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeTitle = conv.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 20)
  a.download = `AI对话_${safeTitle}.txt`
  a.click()
  URL.revokeObjectURL(url)
  // 视觉反馈
  const btn = document.getElementById('chatSave')
  if (btn) {
    btn.classList.add('saved-flash')
    setTimeout(() => btn.classList.remove('saved-flash'), 1500)
  }
}

function deleteConversation(): void {
  const conv = getCurrentConv()
  if (!conv) return
  conversations = conversations.filter(c => c.id !== conv.id)
  currentConvId = conversations[0]?.id || null
  if (!currentConvId) newConversation()
  saveToStorage()
  renderConversationList()
  renderMessages()
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

export { createChatWidget }
