export const TOKEN_PACKAGES = [
  {
    id: 'dev_3990_30d',
    name: '全模型开发版',
    price: 39.9,
    currency: 'USD',
    tokens: 60,
    bonus: 0,
    durationDays: 30,
    group: 'all5',
    positioning: '代码开发、Agent、插件及自动化任务',
    highlights: ['到账 $60 API 额度', '支持全系列模型', '请求记录及费用明细', '优先技术支持'],
  },
  {
    id: 'pro_8990_30d',
    name: '全模型专业版',
    price: 89.9,
    currency: 'USD',
    tokens: 160,
    bonus: 0,
    durationDays: 30,
    group: 'all5',
    positioning: '高频编程、Agent 及自动化任务',
    highlights: ['到账 $160 API 额度', '额度直接翻倍', '支持 Fable-5 / GPT-5.6', '优先技术支持'],
  },
  {
    id: 'team_10990_60d',
    name: '全模型团队版',
    price: 109.9,
    currency: 'USD',
    tokens: 200,
    bonus: 0,
    durationDays: 60,
    group: 'all5',
    positioning: '团队开发、批量任务及生产项目',
    highlights: ['到账 $200 API 额度', '多 API Key 分项目管理', '完整用量和费用记录', '优先问题响应'],
  },
  {
    id: 'business_13990_30d',
    name: '团队版 · 官方原生通道',
    price: 139.9,
    currency: 'USD',
    tokens: 200,
    bonus: 0,
    durationDays: 30,
    group: 'business',
    positioning: '小团队、Agent 和生产项目',
    highlights: ['到账 $200 API 额度', '解锁 business 分组模型', '团队专属低倍率计费', '额度每周重置参考'],
  },
  {
    id: 'biz_20900_60d',
    name: '全模型商务版',
    price: 209,
    currency: 'USD',
    tokens: 400,
    bonus: 0,
    durationDays: 60,
    group: 'all5',
    positioning: '中小团队、多项目协作及持续生产调用',
    highlights: ['到账 $400 API 额度', 'GPT/Claude/Gemini/GLM/DeepSeek', '多项目 API Key 管理', '接入指导'],
  },
  {
    id: 'enterprise_50900_60d',
    name: '全模型高级版',
    price: 509,
    currency: 'USD',
    tokens: 1000,
    bonus: 0,
    durationDays: 60,
    group: 'all5',
    positioning: '企业项目及持续生产调用',
    highlights: ['到账 $1000 API 额度', '支持全系列模型', '多项目 API Key 管理', '费用明细和接入指导'],
  },
]

export const PRICING_POLICY = {
  upstreamProvider: 'CUN.AI',
  currency: 'USD',
  marginTarget: '10%-30%',
  note: '套餐以 CUN.AI subscription-plans 结构校准，前端从后端实时读取，不写死价格。',
}

export const FEATURE_PRICING = {
  chat: { base: 2, multiplier: 1, label: '普通问答' },
  api_plan: { base: 8, multiplier: 2, label: 'API 接入方案' },
  debug_error: { base: 8, multiplier: 2, label: '报错排查' },
  file_analysis: { base: 12, multiplier: 2, label: '文件分析' },
  image_understanding: { base: 15, multiplier: 3, label: '图片理解' },
  image_generation: { base: 30, multiplier: 5, label: '图片生成' },
  research_report: { base: 20, multiplier: 3, label: '研究报告' },
}

export const MODEL_PRICING = {
  'gpt-4o-mini': { multiplier: 1, label: '轻量模型' },
  'gpt-5.5': { multiplier: 4, label: '高级模型' },
  'claude': { multiplier: 4, label: '高级模型' },
  'gemini': { multiplier: 3, label: '高级模型' },
  'deepseek': { multiplier: 2, label: '高性价比模型' },
  'kimi': { multiplier: 2, label: '国产长文本模型' },
  'image': { multiplier: 10, label: '图片模型' },
}

export function modelPricingFor(model = '') {
  const lower = String(model).toLowerCase()
  const match = Object.entries(MODEL_PRICING).find(([key]) => lower.includes(key))
  return match?.[1] || { multiplier: 2, label: '通用模型' }
}

export function estimateTokenCost({ messages = [], model = '', feature = 'chat' } = {}) {
  const lastUser = [...messages].reverse().find(msg => msg?.role === 'user') || {}
  const content = String(lastUser.content || '')
  const attachments = Array.isArray(lastUser.attachments) ? lastUser.attachments : []
  const featureRule = FEATURE_PRICING[feature] || FEATURE_PRICING.chat
  const modelRule = modelPricingFor(model)
  const textUnits = Math.ceil(content.length / 1000)
  const textCost = Math.max(0, textUnits - 1)
  const fileCost = attachments.filter(att => att.kind === 'text' || att.kind === 'file').length * 5
  const imageCost = attachments.filter(att => att.kind === 'image').length * 8
  const imageModelCost = String(model).toLowerCase().includes('image') ? 30 : 0
  const raw = featureRule.base + textCost + fileCost + imageCost + imageModelCost
  return Math.max(1, Math.ceil(raw * featureRule.multiplier * modelRule.multiplier))
}
