/**
 * AI Chat Proxy Server
 *
 * 持有 API 密钥，代理前端聊天请求到 CUN.AI API。
 * 密钥永远不暴露给前端。
 *
 * 启动: node server/proxy-server.mjs
 */

import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { estimateTokenCost, PRICING_POLICY } from './token-config.mjs'
import {
  consumeTokens,
  adjustUserBalance,
  createOrder,
  createUser,
  deleteUser,
  exportData,
  getBalance,
  getMe,
  listUsers,
  listOrders,
  listTransactions,
  mockPayOrder,
  requestEmailCode,
  requireUser,
  setUserApiKey,
  tokenPackagesResponse,
  updateUser,
  verifyEmailCode,
} from './token-service.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

const PORT = Number(process.env.AI_HANDBOOK_PORT || 3002)
const AI_BASE = 'https://www.wintoken.dev/v1'
const AI_KEY = process.env.AI_HANDBOOK_KEY || ''
const AI_MODEL = 'gpt-4o-mini'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
}

const FALLBACK_MODELS = ['gpt-4o-mini', AI_MODEL]

function modelCapabilities(id, endpointTypes = []) {
  const lower = String(id).toLowerCase()
  const endpoints = Array.isArray(endpointTypes) ? endpointTypes : []
  const image = endpoints.includes('image-generation') || lower.includes('image')
  return {
    image,
    chat: !endpoints.includes('image-generation') || endpoints.includes('openai'),
  }
}

function isImageModel(id) {
  return modelCapabilities(id).image
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(data))
}

async function readJsonBody(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  if (!body) return {}
  return JSON.parse(body)
}

function setApiCors(res, methods = 'GET, POST, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', methods)
}

async function withUser(req, res) {
  const user = await requireUser(req)
  if (!user) {
    sendJson(res, 401, { error: 'UNAUTHORIZED', message: '请先使用邮箱验证码登录。' })
    return null
  }
  return user
}

async function withAdmin(req, res) {
  const user = await withUser(req, res)
  if (!user) return null
  if (user.role !== 'admin') {
    sendJson(res, 403, { error: 'FORBIDDEN', message: '需要管理员权限。' })
    return null
  }
  return user
}

function normalizeModels(data) {
  const raw = Array.isArray(data?.data) ? data.data : []
  const seen = new Set()
  const models = []

  for (const item of raw) {
    const id = typeof item === 'string' ? item : item?.id || item?.name
    if (!id || seen.has(id)) continue
    const lowerId = String(id).toLowerCase()
    if (lowerId.includes('gemini') && lowerId.includes('image')) continue
    seen.add(id)
    const endpointTypes = typeof item === 'string' ? [] : item?.supported_endpoint_types
    models.push({
      id,
      label: id,
      ownedBy: typeof item === 'string' ? '' : item?.owned_by || '',
      capabilities: modelCapabilities(id, endpointTypes),
      supportedEndpointTypes: Array.isArray(endpointTypes) ? endpointTypes : [],
    })
  }

  return models.sort((a, b) => a.id.localeCompare(b.id))
}

function fallbackModels() {
  return [...new Set(FALLBACK_MODELS)].map(id => ({
    id,
    label: id,
    ownedBy: '',
    capabilities: modelCapabilities(id),
    supportedEndpointTypes: [],
  }))
}

async function handleTokenApi(req, res, pathname, url) {
  setApiCors(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return true
  }

  try {
    if (pathname === '/api/auth/send-code' && req.method === 'POST') {
      const body = await readJsonBody(req)
      const result = await requestEmailCode(body.email)
      sendJson(res, result.status, result)
      return true
    }

    if (pathname === '/api/auth/verify-code' && req.method === 'POST') {
      const body = await readJsonBody(req)
      const result = await verifyEmailCode(body.email, body.code)
      sendJson(res, result.status, result)
      return true
    }

    if (pathname === '/api/auth/me' && req.method === 'GET') {
      const user = await withUser(req, res)
      if (!user) return true
      sendJson(res, 200, await getMe(user.id))
      return true
    }

    if (pathname === '/api/user/api-key' && req.method === 'POST') {
      const user = await withUser(req, res)
      if (!user) return true
      const body = await readJsonBody(req)
      const result = await setUserApiKey(user.id, body.apiKey || '')
      sendJson(res, result.status, result)
      return true
    }

    if (pathname === '/api/token/packages' && req.method === 'GET') {
      sendJson(res, 200, { pricingPolicy: PRICING_POLICY, packages: tokenPackagesResponse() })
      return true
    }

    if (pathname === '/api/token/balance' && req.method === 'GET') {
      const user = await withUser(req, res)
      if (!user) return true
      sendJson(res, 200, { account: await getBalance(user.id) })
      return true
    }

    if (pathname === '/api/token/transactions' && req.method === 'GET') {
      const user = await withUser(req, res)
      if (!user) return true
      sendJson(res, 200, { transactions: await listTransactions(user.id) })
      return true
    }

    if (pathname === '/api/token/orders' && req.method === 'GET') {
      const user = await withUser(req, res)
      if (!user) return true
      sendJson(res, 200, { orders: await listOrders(user.id) })
      return true
    }

    if (pathname === '/api/token/orders' && req.method === 'POST') {
      const user = await withUser(req, res)
      if (!user) return true
      const body = await readJsonBody(req)
      const result = await createOrder(user.id, body.packageId, body.paymentChannel || 'mock')
      sendJson(res, result.status, result)
      return true
    }

    const payMatch = pathname.match(/^\/api\/token\/orders\/([^/]+)\/mock-pay$/)
    if (payMatch && req.method === 'POST') {
      const user = await withUser(req, res)
      if (!user) return true
      const result = await mockPayOrder(user.id, payMatch[1])
      sendJson(res, result.status, result)
      return true
    }

    if (pathname === '/api/admin/users' && req.method === 'GET') {
      const user = await withAdmin(req, res)
      if (!user) return true
      const result = await listUsers({ q: url.searchParams.get('q') || '', limit: url.searchParams.get('limit') || 100, offset: url.searchParams.get('offset') || 0 })
      sendJson(res, 200, result)
      return true
    }

    if (pathname === '/api/admin/users' && req.method === 'POST') {
      const user = await withAdmin(req, res)
      if (!user) return true
      const body = await readJsonBody(req)
      const result = await createUser(body)
      sendJson(res, result.status, result)
      return true
    }

    const adminUserMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/)
    if (adminUserMatch && req.method === 'PATCH') {
      const user = await withAdmin(req, res)
      if (!user) return true
      const body = await readJsonBody(req)
      const result = await updateUser(adminUserMatch[1], body)
      sendJson(res, result.status, result)
      return true
    }

    if (adminUserMatch && req.method === 'DELETE') {
      const user = await withAdmin(req, res)
      if (!user) return true
      const result = await deleteUser(adminUserMatch[1])
      sendJson(res, result.status, result)
      return true
    }

    const balanceMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/balance$/)
    if (balanceMatch && req.method === 'POST') {
      const user = await withAdmin(req, res)
      if (!user) return true
      const body = await readJsonBody(req)
      const result = await adjustUserBalance(balanceMatch[1], body.amount, body.note)
      sendJson(res, result.status, result)
      return true
    }

    const adminTxMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)\/transactions$/)
    if (adminTxMatch && req.method === 'GET') {
      const user = await withAdmin(req, res)
      if (!user) return true
      sendJson(res, 200, { transactions: await listTransactions(adminTxMatch[1]) })
      return true
    }

    if (pathname === '/api/admin/export-data' && req.method === 'GET') {
      const user = await withUser(req, res)
      if (!user) return true
      const data = await exportData()
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai-handbook-data-${Date.now()}.json"`,
      })
      res.end(JSON.stringify(data, null, 2))
      return true
    }
  } catch (err) {
    console.error('[Token API Error]', err)
    sendJson(res, 500, { error: 'TOKEN_API_ERROR', detail: String(err) })
    return true
  }

  return pathname.startsWith('/api/auth/') || pathname.startsWith('/api/token/') || pathname.startsWith('/api/user/') || pathname.startsWith('/api/admin/')
}

async function handleModels(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  // 支持两种方式传入用户 apiKey：
  //  1) GET 请求带 Authorization header（前端 fetch 时直接传）
  //  2) POST 请求 body { apiKey }
  let userApiKey = ''
  if (req.method === 'POST') {
    try {
      const body = await readJsonBody(req)
      userApiKey = String(body?.apiKey || '').trim()
    } catch { /* ignore */ }
  } else if (req.method === 'GET') {
    const authHeader = req.headers['authorization'] || ''
    userApiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  // 没有任何 Key 时返回 fallback
  const apiKey = userApiKey || AI_KEY
  if (!apiKey) {
    sendJson(res, 200, {
      defaultModel: AI_MODEL,
      source: 'fallback',
      models: fallbackModels(),
      hint: '请填入你的 wintoken.dev API Key 以加载上游所有模型。',
    })
    return
  }

  try {
    const modelResp = await fetch(`${AI_BASE}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'User-Agent': 'AI-Handbook-Server/1.0',
      },
      signal: AbortSignal.timeout(30000),
    })

    if (!modelResp.ok) {
      const errText = await modelResp.text()
      console.error(`[Models Error] ${modelResp.status}: ${errText}`)
      sendJson(res, 200, {
        defaultModel: AI_MODEL,
        source: 'fallback',
        models: fallbackModels(),
        hint: userApiKey ? '你的 API Key 无效或无法拉取模型列表。' : undefined,
      })
      return
    }

    const data = await modelResp.json()
    const models = normalizeModels(data)
    sendJson(res, 200, {
      defaultModel: AI_MODEL,
      source: models.length > 0 ? 'api' : 'fallback',
      models: models.length > 0 ? models : fallbackModels(),
    })
  } catch (err) {
    console.error('[Models Proxy Error]', err)
    sendJson(res, 200, {
      defaultModel: AI_MODEL,
      source: 'fallback',
      models: fallbackModels(),
    })
  }
}

function latestUserPrompt(messages) {
  const last = [...messages].reverse().find(msg => msg?.role === 'user')
  return String(last?.content || '').trim()
}

function normalizeImageResult(data) {
  const images = []
  const raw = Array.isArray(data?.data) ? data.data : []

  for (const item of raw) {
    if (item?.url) images.push(item.url)
    if (item?.b64_json) images.push(`data:image/png;base64,${item.b64_json}`)
  }

  return images
}

function attachmentContext(attachments = []) {
  const parts = []
  for (const att of attachments) {
    if (att?.kind === 'text' && att.text) {
      parts.push(`附件：${att.name || '未命名文档'}\n类型：${att.type || 'text/plain'}\n内容：\n${String(att.text).slice(0, 20000)}`)
    } else if (att?.kind === 'file') {
      parts.push(`附件：${att.name || '未命名文件'}\n类型：${att.type || 'application/octet-stream'}\n说明：${att.text || '该文件不是可直接读取的文本格式，当前仅提供文件名和类型。'}`)
    }
  }
  return parts.join('\n\n---\n\n')
}

function normalizeChatMessages(messages) {
  return messages.map(msg => {
    if (!msg || (msg.role !== 'user' && msg.role !== 'assistant')) return null
    const baseText = String(msg.content || '')
    const attachments = Array.isArray(msg.attachments) ? msg.attachments : []
    const context = attachmentContext(attachments)
    const imageAttachments = attachments.filter(att => att?.kind === 'image' && att.dataUrl)

    if (msg.role === 'user' && imageAttachments.length > 0) {
      const content = [{ type: 'text', text: context ? `${baseText}\n\n${context}` : baseText }]
      for (const att of imageAttachments) {
        content.push({ type: 'image_url', image_url: { url: att.dataUrl } })
      }
      return { role: 'user', content }
    }

    return {
      role: msg.role,
      content: context ? `${baseText}\n\n${context}` : baseText,
    }
  }).filter(Boolean)
}

async function handleImageGeneration(messages, model, res, apiKey = AI_KEY) {
  const prompt = latestUserPrompt(messages)
  if (!prompt) {
    sendJson(res, 400, { error: 'prompt required for image generation' })
    return null
  }

  const imageResp = await fetch(`${AI_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Handbook-Server/1.0',
    },
    body: JSON.stringify({
      model,
      prompt,
      n: 1,
      size: '1024x1024',
    }),
    signal: AbortSignal.timeout(180000),
  })

  if (!imageResp.ok) {
    const errText = await imageResp.text()
    console.error(`[Image Error] ${imageResp.status}: ${errText}`)
    sendJson(res, 200, {
      error: apiKey === AI_KEY ? 'AI_API_ERROR' : 'USER_API_KEY_ERROR',
      message: apiKey === AI_KEY ? '平台图片模型调用失败，请稍后重试。' : '你的个人 API Key 无效、余额不足或没有该图片模型权限。',
      detail: errText,
    })
    return null
  }

  const data = await imageResp.json()
  const images = normalizeImageResult(data)
  return {
    reply: images.length > 0 ? '图片已生成。' : '图片模型已返回结果，但未找到可展示的图片地址。',
    model: data.model || model,
    type: 'image',
    images,
  }
}

async function handleChat(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Method not allowed' }))
    return
  }

  // 读取 body
  let body = ''
  for await (const chunk of req) body += chunk

  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Invalid JSON' }))
    return
  }

  const { messages, model, apiKey: requestApiKey = '', feature = 'chat', requestId } = payload
  const requestedModel = model || AI_MODEL

  if (!messages || !Array.isArray(messages)) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'messages array required' }))
    return
  }

  const sessionApiKey = String(requestApiKey || '').trim()

  // 用户填了自己的 Key 时，不强制登录，也不走平台扣费
  if (sessionApiKey) {
    const apiKey = sessionApiKey
    const estimatedTokens = estimateTokenCost({ messages, model: requestedModel, feature })
    let responsePayload
    if (isImageModel(requestedModel)) {
      try {
        responsePayload = await handleImageGeneration(messages, requestedModel, res, apiKey)
        if (!responsePayload) return
      } catch (err) {
        console.error('[Image Proxy Error]', err)
        sendJson(res, 500, { error: 'Image proxy error', detail: String(err) })
        return
      }
    } else {
      const systemPrompt = {
        role: 'system',
        content: `你是"海外AI产品操作手册"网站里的多AI模型使用窗口。你的职责：
1. 直接完成用户指定的通用AI任务，包括写作、翻译、总结、代码、分析、创意等
2. 也可以继续回答大模型接入教程、API配置、终端工具配置、模型对比等问题
3. 当用户询问平台接入大模型时，给出清晰步骤、Base URL、模型选择和安全注意事项
4. 中文回复，结构清晰，保持专业但不要把自己限定成客服
5. 当用户上传图片时，先观察图片内容再回答；当用户上传文本/文档时，基于附件内容总结、分析或改写
6. 不要要求用户暴露API密钥；涉及密钥时提醒只放后端或本地安全环境`
      }
      try {
        const normalizedMessages = normalizeChatMessages(messages)
        const aiResp = await fetch(`${AI_BASE}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'AI-Handbook-Server/1.0',
          },
          body: JSON.stringify({
            model: requestedModel,
            messages: [systemPrompt, ...normalizedMessages],
            max_tokens: 2048,
            temperature: 0.7,
            stream: false,
          }),
          signal: AbortSignal.timeout(120000),
        })

        if (!aiResp.ok) {
          const errText = await aiResp.text()
          console.error(`[AI Error] ${aiResp.status}: ${errText}`)
          sendJson(res, 200, {
            error: 'USER_API_KEY_ERROR',
            message: '你的 API Key 无效、余额不足或没有该模型权限。请检查 Key 后重新保存。',
            detail: errText,
          })
          return
        }

        const data = await aiResp.json()
        const reply = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复。'
        responsePayload = { reply, model: data.model || requestedModel, type: 'text' }
      } catch (err) {
        console.error('[Proxy Error]', err)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Proxy error', detail: String(err) }))
        return
      }
    }

    sendJson(res, 200, {
      ...responsePayload,
      usage: {
        estimatedTokens,
        consumedTokens: 0,
        remainingBalance: 0,
        billingMode: 'user_api_key',
      },
    })
    return
  }

  // 没有用户 Key 时走平台逻辑，需要登录
  const user = await requireUser(req)
  if (!user) {
    sendJson(res, 401, { error: 'UNAUTHORIZED', message: '请先使用邮箱验证码登录，或在下方填入你的 wintoken.dev API Key。' })
    return
  }

  const apiKey = AI_KEY
  const useOwnApiKey = Boolean(sessionApiKey)

  // 没有任何可用 Key 时提示用户填入
  if (!apiKey) {
    sendJson(res, 200, {
      error: 'NO_API_KEY',
      message: '请先在下方 API Key 栏填入你的 wintoken.dev API Key，保存后再发送消息。',
    })
    return
  }

  const estimatedTokens = estimateTokenCost({ messages, model: requestedModel, feature })
  const account = await getBalance(user.id)
  if (!useOwnApiKey && account.availableBalance < estimatedTokens) {
    sendJson(res, 402, {
      error: 'INSUFFICIENT_TOKEN_BALANCE',
      message: '当前余额不足，请先购买算力 Token。',
      requiredTokens: estimatedTokens,
      availableBalance: account.availableBalance,
    })
    return
  }

  let responsePayload
  if (isImageModel(requestedModel)) {
    try {
      responsePayload = await handleImageGeneration(messages, requestedModel, res, apiKey)
      if (!responsePayload) return
    } catch (err) {
      console.error('[Image Proxy Error]', err)
      sendJson(res, 500, { error: 'Image proxy error', detail: String(err) })
      return
    }
  } else {
    // System prompt — AI 作为多模型使用窗口的专业助手
    const systemPrompt = {
      role: 'system',
      content: `你是"海外AI产品操作手册"网站里的多AI模型使用窗口。你的职责：
1. 直接完成用户指定的通用AI任务，包括写作、翻译、总结、代码、分析、创意等
2. 也可以继续回答大模型接入教程、API配置、终端工具配置、模型对比等问题
3. 当用户询问平台接入大模型时，给出清晰步骤、Base URL、模型选择和安全注意事项
4. 中文回复，结构清晰，保持专业但不要把自己限定成客服
5. 当用户上传图片时，先观察图片内容再回答；当用户上传文本/文档时，基于附件内容总结、分析或改写
6. 不要要求用户暴露API密钥；涉及密钥时提醒只放后端或本地安全环境`
    }

    try {
      const normalizedMessages = normalizeChatMessages(messages)
      const aiResp = await fetch(`${AI_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Handbook-Server/1.0',
        },
        body: JSON.stringify({
          model: requestedModel,
          messages: [systemPrompt, ...normalizedMessages],
          max_tokens: 2048,
          temperature: 0.7,
          stream: false,
        }),
        signal: AbortSignal.timeout(120000),
      })

      if (!aiResp.ok) {
        const errText = await aiResp.text()
        console.error(`[AI Error] ${aiResp.status}: ${errText}`)
        const personalKeyMessage = useOwnApiKey
          ? '你的个人 API Key 无效、余额不足或没有该模型权限。请检查 Key 后重新保存，或清空个人 Key 改用平台 Token。'
          : '平台模型调用失败，请稍后重试。'
        sendJson(res, 200, {
          error: useOwnApiKey ? 'USER_API_KEY_ERROR' : 'AI_API_ERROR',
          message: personalKeyMessage,
          detail: errText,
        })
        return
      }

      const data = await aiResp.json()
      const reply = data.choices?.[0]?.message?.content || '抱歉，我无法生成回复。'
      responsePayload = { reply, model: data.model || requestedModel, type: 'text' }
    } catch (err) {
      console.error('[Proxy Error]', err)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Proxy error', detail: String(err) }))
      return
    }
  }

  let remainingBalance = account.availableBalance
  let consumedTokens = 0
  if (!useOwnApiKey) {
    const consumed = await consumeTokens(user.id, estimatedTokens, {
      requestId: requestId || `req_${Date.now()}`,
      model: requestedModel,
      feature,
      note: `AI 使用扣费：${requestedModel}`,
    })
    if (!consumed.ok) {
      sendJson(res, 402, {
        error: 'INSUFFICIENT_TOKEN_BALANCE',
        message: '当前余额不足，请先购买算力 Token。',
        requiredTokens: estimatedTokens,
        availableBalance: consumed.availableBalance,
      })
      return
    }
    remainingBalance = consumed.account.availableBalance
    consumedTokens = estimatedTokens
  }

  sendJson(res, 200, {
    ...responsePayload,
    usage: {
      estimatedTokens,
      consumedTokens,
      remainingBalance,
      billingMode: useOwnApiKey ? 'user_api_key' : 'platform_token',
    },
  })
}

async function handleStatic(req, res, pathname) {
  let filePath = pathname === '/' ? '/index.html' : pathname
  const fullPath = join(ROOT, 'dist', filePath)

  try {
    let data
    let contentType = MIME[extname(filePath)] || 'application/octet-stream'

    try {
      data = await readFile(fullPath)
    } catch {
      // SPA fallback — serve index.html for client-side routes
      data = await readFile(join(ROOT, 'dist', 'index.html'))
      contentType = 'text/html; charset=utf-8'
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': filePath === '/index.html' ? 'no-cache' : 'max-age=3600',
    })
    res.end(data)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' })
    res.end('Not found')
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://RoyieAIGuide:${PORT}`)
  const pathname = url.pathname

  // API routes
  if (await handleTokenApi(req, res, pathname, url)) {
    return
  }

  if (pathname === '/api/chat') {
    await handleChat(req, res)
    return
  }

  if (pathname === '/api/models') {
    await handleModels(req, res)
    return
  }

  // Static files (production build)
  await handleStatic(req, res, pathname)
})

server.listen(PORT, () => {
  console.log(`\n  🤖 AI Handbook Server`)
  console.log(`  ─────────────────────────`)
  console.log(`  Local:   http://RoyieAIGuide:${PORT}`)
  console.log(`  API:     http://RoyieAIGuide:${PORT}/api/chat`)
  console.log(`  ─────────────────────────`)
  console.log(`  ✅ API key is server-side only — never exposed to frontend\n`)
})
