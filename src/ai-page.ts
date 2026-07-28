import { authHeaders, fetchMe, isLoggedIn, type TokenAccount } from './token-api'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
  attachments?: ChatAttachment[]
  type?: 'text' | 'image'
  usage?: {
    estimatedTokens: number
    consumedTokens: number
    remainingBalance: number
    billingMode: 'user_api_key' | 'platform_token'
  }
}

interface ChatAttachment {
  id: string
  name: string
  type: string
  kind: 'image' | 'text' | 'file'
  dataUrl?: string
  text?: string
}

interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  model?: string
  apiKey?: string
}

interface AiModel {
  id: string
  label: string
  ownedBy?: string
  capabilities?: {
    chat?: boolean
    image?: boolean
  }
}

let conversations: Conversation[] = []
let currentConvId: string | null = null
let selectedModel = 'gpt-4o-mini'
let models: AiModel[] = [
  { id: 'gpt-4o-mini', label: 'gpt-4o-mini', capabilities: { chat: true, image: false } },
  { id: 'gpt-5.5', label: 'gpt-5.5', capabilities: { chat: true, image: false } },
]
let isLoading = false
let pendingAttachments: ChatAttachment[] = []
let currentAccount: TokenAccount | null = null

function attachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getModel(id: string): AiModel | undefined {
  return models.find(model => model.id === id)
}

function isImageModel(id: string): boolean {
  return Boolean(getModel(id)?.capabilities?.image || id.toLowerCase().includes('image'))
}

function modelLabel(id: string): string {
  const model = getModel(id)
  const suffix = isImageModel(id) ? ' · 图片' : ' · 文本'
  return `${model?.label || id}${suffix}`
}

function convId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')
}

function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/"/g, '&quot;')
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

async function fileToAttachment(file: File): Promise<ChatAttachment> {
  if (file.type.startsWith('image/')) {
    return { id: attachmentId(), name: file.name || '粘贴图片', type: file.type, kind: 'image', dataUrl: await readAsDataUrl(file) }
  }

  const textLike = file.type.startsWith('text/') || /\.(md|txt|json|csv|ts|js|html|css|py|yaml|yml|xml|rtf)$/i.test(file.name)
  if (textLike) {
    const text = await readAsText(file)
    return { id: attachmentId(), name: file.name, type: file.type || 'text/plain', kind: 'text', text: text.slice(0, 20000) }
  }

  return { id: attachmentId(), name: file.name, type: file.type || 'application/octet-stream', kind: 'file' }
}

async function addFiles(files: FileList | File[] | null): Promise<void> {
  if (!files || isLoading) return
  const incoming = Array.from(files)
  if (incoming.length === 0) return

  const converted: ChatAttachment[] = []
  for (const file of incoming) {
    if (file.size > 8 * 1024 * 1024) {
      converted.push({
        id: attachmentId(),
        name: file.name || '未命名文件',
        type: file.type || 'application/octet-stream',
        kind: 'file',
        text: '文件超过 8MB，已添加文件名，但不会上传完整内容。',
      })
      continue
    }
    converted.push(await fileToAttachment(file))
  }

  pendingAttachments = [...pendingAttachments, ...converted].slice(0, 8)
  renderPendingAttachments()
  updateEstimate()
}

function removePendingAttachment(id: string): void {
  pendingAttachments = pendingAttachments.filter(item => item.id !== id)
  renderPendingAttachments()
  updateEstimate()
}

function attachmentLabel(att: ChatAttachment): string {
  if (att.kind === 'image') return '图片'
  if (att.kind === 'text') return '文档'
  return '文件'
}

function renderAttachmentChip(att: ChatAttachment, removable = false): string {
  const preview = att.kind === 'image' && att.dataUrl
    ? `<img src="${escapeAttr(att.dataUrl)}" alt="${escapeAttr(att.name)}" />`
    : `<span class="ai-attachment-icon">${att.kind === 'text' ? 'DOC' : 'FILE'}</span>`
  const remove = removable
    ? `<button class="ai-attachment-remove" data-remove-attachment="${escapeAttr(att.id)}" type="button" aria-label="移除附件">×</button>`
    : ''
  return `
    <div class="ai-attachment-chip">
      ${preview}
      <div class="ai-attachment-meta">
        <strong>${escapeHtml(att.name || attachmentLabel(att))}</strong>
        <small>${attachmentLabel(att)}</small>
      </div>
      ${remove}
    </div>
  `
}

function renderPendingAttachments(): void {
  const container = document.getElementById('aiAttachments')
  if (!container) return
  if (pendingAttachments.length === 0) {
    container.innerHTML = ''
    container.classList.remove('ai-attachments-active')
    return
  }

  container.classList.add('ai-attachments-active')
  container.innerHTML = pendingAttachments.map(att => renderAttachmentChip(att, true)).join('')
  container.querySelectorAll<HTMLButtonElement>('[data-remove-attachment]').forEach(btn => {
    btn.addEventListener('click', () => removePendingAttachment(btn.dataset.removeAttachment || ''))
  })
}

function renderMessageAttachments(attachments?: ChatAttachment[]): string {
  if (!attachments || attachments.length === 0) return ''
  return `<div class="ai-message-attachments">${attachments.map(att => renderAttachmentChip(att)).join('')}</div>`
}

function saveToStorage(): void {
  try {
    const sanitized = conversations.map(({ apiKey: _apiKey, ...conv }) => conv)
    localStorage.setItem('ai_chat_conversations', JSON.stringify(sanitized))
    localStorage.setItem('ai_chat_current', currentConvId || '')
    localStorage.setItem('ai_chat_selected_model', selectedModel)
  } catch { /* ignore */ }
}

function loadFromStorage(): void {
  try {
    const raw = localStorage.getItem('ai_chat_conversations')
    const current = localStorage.getItem('ai_chat_current')
    const storedModel = localStorage.getItem('ai_chat_selected_model')
    if (raw) conversations = JSON.parse(raw)
    currentConvId = current || conversations[0]?.id || null
    if (storedModel) selectedModel = storedModel
  } catch { /* ignore */ }
}

function getCurrentConv(): Conversation | null {
  return conversations.find(c => c.id === currentConvId) || null
}

function newConversation(): Conversation {
  const conv: Conversation = {
    id: convId(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
    model: selectedModel,
  }
  conversations.unshift(conv)
  currentConvId = conv.id
  saveToStorage()
  return conv
}

async function loadModels(): Promise<void> {
  try {
    const conv = getCurrentConv()
    const userKey = conv?.apiKey || ''
    const resp = await fetch('/api/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: userKey }),
      signal: AbortSignal.timeout(35000),
    })
    const data = await resp.json()
    if (Array.isArray(data.models) && data.models.length > 0) {
      models = data.models
      selectedModel = localStorage.getItem('ai_chat_selected_model') || data.defaultModel || models[0].id
    }
  } catch { /* fallback models stay active */ }
  renderModelSelect()
}

export function renderAiPage(): string {
  loadFromStorage()
  if (conversations.length === 0) newConversation()
  const current = getCurrentConv()
  selectedModel = current?.model || selectedModel

  return `
    <main class="ai-page">
      <aside class="ai-sidebar">
        <div class="ai-sidebar-top">
          <a class="ai-brand" href="#/">AI 产品手册</a>
          <button class="ai-new-btn" id="aiNewChat">+ 新对话</button>
          <label class="ai-model-label" for="aiModelSelect">模型</label>
          <select class="ai-model-select" id="aiModelSelect"></select>
        </div>
        <div class="ai-conversation-list" id="aiConversationList"></div>
        <div class="ai-sidebar-actions">
          <button class="ai-side-action" id="aiSaveChat">保存</button>
          <button class="ai-side-action" id="aiRefreshChat">刷新</button>
          <button class="ai-side-action ai-danger" id="aiDeleteChat">删除</button>
        </div>
      </aside>
      <section class="ai-main">
        <header class="ai-main-header">
          <div>
            <p class="ai-eyebrow">AI 使用</p>
            <h1>多模型工作台</h1>
          </div>
          <div class="ai-header-meta">
            <div class="ai-balance-pill" id="aiBalancePill">余额：登录后查看</div>
            <div class="ai-current-model" id="aiCurrentModel">${escapeHtml(selectedModel)}</div>
          </div>
        </header>
        <div class="ai-messages" id="aiMessages"></div>
        <div class="ai-input-panel">
          <div class="ai-key-panel">
            <div>
              <strong>当前对话 API Key</strong>
              <span id="aiKeyState">默认使用平台 Token 余额扣费</span>
            </div>
            <div class="ai-key-controls">
              <input id="aiUserApiKey" type="password" placeholder="粘贴你的 wintoken.dev API Key" autocomplete="off" />
              <button id="aiToggleKey" type="button">显示</button>
              <button id="aiSaveKey" type="button">保存</button>
            </div>
          </div>
          <div class="ai-estimate" id="aiEstimate">预计消耗 2 Token</div>
          <div class="ai-suggestions" id="aiSuggestions">
            <button data-q="写一份海外AI工具接入方案">写一份接入方案</button>
            <button data-q="对比 GPT、Claude、Gemini 适合什么场景">对比主流模型</button>
            <button data-q="生成一张 Apple 风格的 AI 产品封面图">生成图片</button>
          </div>
          <div class="ai-attachments" id="aiAttachments"></div>
          <div class="ai-input-row">
            <button class="ai-attach-btn" id="aiAttach" type="button" aria-label="上传文件">＋</button>
            <textarea id="aiInput" class="ai-input" rows="1" placeholder="输入问题，可粘贴图片或上传文件"></textarea>
            <button class="ai-send-btn" id="aiSend" aria-label="发送">↑</button>
            <input id="aiFileInput" class="ai-file-input" type="file" multiple accept="image/*,.txt,.md,.json,.csv,.ts,.js,.html,.css,.py,.yaml,.yml,.xml,.rtf" />
          </div>
        </div>
      </section>
    </main>
  `
}

export function bindAiPageEvents(): void {
  renderConversationList()
  renderMessages()
  renderModelSelect()
  loadModels()
  loadAiAccount()
  bindApiKeyPanel()
  updateEstimate()

  document.getElementById('aiNewChat')?.addEventListener('click', () => {
    newConversation()
    renderConversationList()
    renderMessages()
    renderModelSelect()
    syncApiKeyPanel()
    updateEstimate()
  })
  document.getElementById('aiSaveChat')?.addEventListener('click', saveConversation)
  document.getElementById('aiRefreshChat')?.addEventListener('click', refreshConversation)
  document.getElementById('aiDeleteChat')?.addEventListener('click', deleteConversation)
  document.getElementById('aiSend')?.addEventListener('click', sendMessage)
  document.getElementById('aiAttach')?.addEventListener('click', () => document.getElementById('aiFileInput')?.click())
  document.getElementById('aiFileInput')?.addEventListener('change', async (e: Event) => {
    const input = e.currentTarget as HTMLInputElement
    await addFiles(input.files)
    input.value = ''
  })

  const input = document.getElementById('aiInput') as HTMLTextAreaElement | null
  input?.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  })
  input?.addEventListener('input', updateEstimate)
  input?.addEventListener('paste', async (e: ClipboardEvent) => {
    const files = Array.from(e.clipboardData?.files || [])
    if (files.length > 0) {
      e.preventDefault()
      await addFiles(files)
    }
  })

  document.querySelectorAll<HTMLButtonElement>('.ai-suggestions button').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!input) return
      input.value = btn.dataset.q || ''
      sendMessage()
    })
  })
}

function renderModelSelect(): void {
  const select = document.getElementById('aiModelSelect') as HTMLSelectElement | null
  if (!select) return
  select.innerHTML = models.map(model => {
    const active = model.id === selectedModel ? 'selected' : ''
    const label = modelLabel(model.id)
    return `<option value="${escapeHtml(model.id)}" ${active}>${escapeHtml(label)}</option>`
  }).join('')
  select.value = selectedModel
  select.onchange = () => {
    selectedModel = select.value
    saveToStorage()
    updateCurrentModel()
  }
  updateCurrentModel()
}

function updateCurrentModel(): void {
  const label = document.getElementById('aiCurrentModel')
  const currentModel = getCurrentConv()?.model || selectedModel
  if (label) label.textContent = modelLabel(currentModel)
}

function renderConversationList(): void {
  const list = document.getElementById('aiConversationList')
  if (!list) return
  list.innerHTML = conversations.map(conv => {
    const active = conv.id === currentConvId ? 'ai-conversation-active' : ''
    const title = conv.title || '新对话'
    const model = conv.model || selectedModel
    return `
      <button class="ai-conversation ${active}" data-conv="${conv.id}">
        <span>${escapeHtml(title)}</span>
        <small>${escapeHtml(modelLabel(model))}</small>
      </button>
    `
  }).join('')

  list.querySelectorAll<HTMLButtonElement>('.ai-conversation').forEach(btn => {
    btn.addEventListener('click', () => {
      currentConvId = btn.dataset.conv || null
      saveToStorage()
      renderConversationList()
      renderMessages()
      renderModelSelect()
      syncApiKeyPanel()
      updateEstimate()
    })
  })
}

function renderUsage(usage?: ChatMessage['usage']): string {
  if (!usage) return ''
  const mode = usage.billingMode === 'user_api_key' ? '个人 API Key，平台未扣费' : `本次消耗 ${usage.consumedTokens} Token`
  return `<div class="ai-usage-note">${mode} · 剩余 ${usage.remainingBalance} Token</div>`
}

function estimateCurrentCost(): number {
  const input = document.getElementById('aiInput') as HTMLTextAreaElement | null
  const text = input?.value.trim() || ''
  const base = isImageModel(selectedModel) ? 30 : 2
  const textCost = Math.max(0, Math.ceil(text.length / 1000) - 1)
  const fileCost = pendingAttachments.filter(att => att.kind === 'text' || att.kind === 'file').length * 5
  const imageCost = pendingAttachments.filter(att => att.kind === 'image').length * 8
  const modelCost = selectedModel.includes('gpt-5') || selectedModel.toLowerCase().includes('claude') ? 4 : 1
  return Math.max(1, Math.ceil((base + textCost + fileCost + imageCost) * modelCost))
}

function currentConversationHasApiKey(): boolean {
  return Boolean(getCurrentConv()?.apiKey)
}

function syncApiKeyPanel(): void {
  const input = document.getElementById('aiUserApiKey') as HTMLInputElement | null
  const keyState = document.getElementById('aiKeyState')
  const hasKey = currentConversationHasApiKey()
  if (input) input.value = getCurrentConv()?.apiKey || ''
  if (keyState) {
    keyState.textContent = hasKey
      ? '已使用你的 wintoken.dev API Key，可调用上游所有模型'
      : '填入你的 wintoken.dev API Key 后保存，即可加载所有上游模型'
  }
}

function updateEstimate(): void {
  const el = document.getElementById('aiEstimate')
  if (!el) return
  const cost = estimateCurrentCost()
  el.textContent = currentConversationHasApiKey() ? `使用当前对话 API Key，预计平台扣费 0 Token（参考消耗 ${cost}）` : `预计消耗 ${cost} Token`
}

function updateBalanceUi(): void {
  const pill = document.getElementById('aiBalancePill')
  if (!pill) return
  if (!isLoggedIn()) {
    pill.innerHTML = '未登录 · <a href="#/login">邮箱登录</a>（需登录后使用 API Key 调用）'
    return
  }
  pill.textContent = currentAccount ? `余额：${currentAccount.availableBalance} Token` : '使用自己的 API Key 调用，平台不扣费'
}

async function loadAiAccount(): Promise<void> {
  updateBalanceUi()
  if (!isLoggedIn()) return
  try {
    const me = await fetchMe()
    currentAccount = me.account
  } catch {
    currentAccount = null
  }
  updateBalanceUi()
  syncApiKeyPanel()
  updateEstimate()
}

function bindApiKeyPanel(): void {
  const input = document.getElementById('aiUserApiKey') as HTMLInputElement | null
  const toggle = document.getElementById('aiToggleKey') as HTMLButtonElement | null
  const save = document.getElementById('aiSaveKey') as HTMLButtonElement | null
  toggle?.addEventListener('click', () => {
    if (!input) return
    input.type = input.type === 'password' ? 'text' : 'password'
    toggle.textContent = input.type === 'password' ? '显示' : '隐藏'
  })
  save?.addEventListener('click', () => {
    const conv = getCurrentConv() || newConversation()
    conv.apiKey = input?.value.trim() || ''
    syncApiKeyPanel()
    updateEstimate()
    // 保存 Key 后重新拉取上游模型列表
    loadModels()
  })
}

function renderMessages(): void {
  const container = document.getElementById('aiMessages')
  if (!container) return
  const conv = getCurrentConv()

  if (!conv || conv.messages.length === 0) {
    container.innerHTML = `
      <div class="ai-empty-state">
        <div class="ai-empty-icon">AI</div>
        <h2>选择模型，开始创作或接入</h2>
        <p>可以进行通用对话、代码、写作、图片生成，也可以继续询问大模型 API 接入教程。</p>
      </div>
    `
    const suggestions = document.getElementById('aiSuggestions')
    if (suggestions) suggestions.style.display = 'flex'
    return
  }

  const suggestions = document.getElementById('aiSuggestions')
  if (suggestions) suggestions.style.display = 'none'
  container.innerHTML = conv.messages.map(msg => {
    const images = msg.images?.map(src => `<img class="ai-generated-image" src="${escapeHtml(src)}" alt="AI 生成图片" loading="lazy" />`).join('') || ''
    const attachments = renderMessageAttachments(msg.attachments)
    const usage = renderUsage(msg.usage)
    return `
      <article class="ai-message ai-message-${msg.role}">
        <div class="ai-message-avatar">${msg.role === 'assistant' ? 'AI' : '我'}</div>
        <div class="ai-message-body">${escapeHtml(msg.content)}${attachments}${images ? `<div class="ai-image-grid">${images}</div>` : ''}${usage}</div>
      </article>
    `
  }).join('')
  container.scrollTop = container.scrollHeight
}

function appendMessage(msg: ChatMessage): void {
  const conv = getCurrentConv() || newConversation()
  conv.messages.push(msg)
  if (conv.title === '新对话' && msg.role === 'user') conv.title = msg.content.slice(0, 20)
  conv.model = selectedModel
  saveToStorage()
  renderConversationList()
  renderMessages()
}

function showTyping(modelId: string): void {
  const container = document.getElementById('aiMessages')
  if (!container) return
  const typing = document.createElement('article')
  const text = isImageModel(modelId) ? '正在生成图片，请稍候...' : '正在调用模型生成回答，请稍候...'
  typing.className = 'ai-message ai-message-assistant'
  typing.id = 'aiTyping'
  typing.innerHTML = `<div class="ai-message-avatar">AI</div><div class="ai-message-body ai-typing"><span></span><span></span><span></span><em>${text}</em></div>`
  container.appendChild(typing)
  container.scrollTop = container.scrollHeight
}

function removeTyping(): void {
  document.getElementById('aiTyping')?.remove()
}

async function sendMessage(): Promise<void> {
  const input = document.getElementById('aiInput') as HTMLTextAreaElement | null
  if (!input || isLoading) return
  const text = input.value.trim()
  const attachments = pendingAttachments
  if (!text && attachments.length === 0) return

  if (!isLoggedIn() && !getCurrentConv()?.apiKey) {
    appendMessage({ role: 'assistant', content: '请先在下方 API Key 栏填入你的 wintoken.dev API Key 并保存，或邮箱登录后使用平台 Token。' })
    return
  }

  input.value = ''
  pendingAttachments = []
  renderPendingAttachments()
  isLoading = true
  appendMessage({ role: 'user', content: text || '请分析我上传的附件。', attachments })
  const conv = getCurrentConv()
  if (!conv) { isLoading = false; return }
  const activeModel = conv.model || selectedModel
  showTyping(activeModel)

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({
        messages: conv.messages,
        model: activeModel,
        apiKey: conv.apiKey || '',
        feature: attachments.length > 0 ? 'file_analysis' : 'chat',
        requestId: `req_${Date.now()}`,
      }),
      signal: AbortSignal.timeout(isImageModel(activeModel) ? 180000 : 120000),
    })
    const data = await resp.json()
    removeTyping()
    if (resp.status === 402) {
      appendMessage({ role: 'assistant', content: data.message || '当前余额不足，请先购买算力 Token。' })
      if (confirm('当前余额不足，请先购买算力 Token。是否前往充值？')) window.location.hash = '#/pricing'
    } else if (resp.status === 401) {
      appendMessage({ role: 'assistant', content: '请先使用邮箱验证码登录。' })
      window.location.hash = '#/login'
    } else if (data.error) {
      appendMessage({ role: 'assistant', content: data.message || `抱歉，出现了错误：${data.error}` })
    } else if (Array.isArray(data.images) && data.images.length > 0) {
      appendMessage({ role: 'assistant', content: data.reply || '图片已生成。', type: 'image', images: data.images, usage: data.usage })
    } else {
      appendMessage({ role: 'assistant', content: data.reply || '抱歉，我无法生成回复。', usage: data.usage })
    }
    if (data.usage) {
      currentAccount = { ...(currentAccount || { userId: '', frozenBalance: 0, totalPurchased: 0, totalBonus: 0, totalConsumed: 0 }), availableBalance: data.usage.remainingBalance }
      updateBalanceUi()
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
  if (!conv || isLoading) return
  const lastUserIndex = [...conv.messages].reverse().findIndex(msg => msg.role === 'user')
  if (lastUserIndex === -1) return
  const lastUserMsg = conv.messages[conv.messages.length - 1 - lastUserIndex]
  if (conv.messages[conv.messages.length - 1]?.role === 'assistant') conv.messages.pop()
  saveToStorage()
  renderMessages()
  const input = document.getElementById('aiInput') as HTMLTextAreaElement | null
  if (input) {
    input.value = lastUserMsg.content
    sendMessage()
  }
}

function saveConversation(): void {
  const conv = getCurrentConv()
  if (!conv || conv.messages.length === 0) return
  const dateStr = new Date(conv.createdAt).toLocaleString('zh-CN')
  let text = `AI 对话记录\n对话标题：${conv.title}\n模型：${conv.model || selectedModel}\n创建时间：${dateStr}\n\n`
  conv.messages.forEach((msg, i) => {
    const role = msg.role === 'user' ? '我' : 'AI 助手'
    const time = new Date(conv.createdAt + i * 1000).toLocaleTimeString('zh-CN')
    text += `【${role}】 ${time}\n${msg.content}\n${'─'.repeat(40)}\n\n`
  })
  text += '由海外AI产品操作手册 AI助手 生成\n'

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  const safeTitle = conv.title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 20)
  a.href = url
  a.download = `AI对话_${safeTitle}.txt`
  a.click()
  URL.revokeObjectURL(url)
}

function deleteConversation(): void {
  const conv = getCurrentConv()
  if (!conv) return
  conversations = conversations.filter(item => item.id !== conv.id)
  currentConvId = conversations[0]?.id || null
  if (!currentConvId) newConversation()
  saveToStorage()
  renderConversationList()
  renderMessages()
  renderModelSelect()
}
