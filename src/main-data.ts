import { type ProductCard } from './product-data'

export const products: ProductCard[] = [
  { name: 'ChatGPT', company: 'OpenAI', icon: '💬', iconBg: 'linear-gradient(135deg, #10a37f, #1a7f64)', logoUrl: 'https://cdn.worldvectorlogo.com/logos/chatgpt-1.svg', description: '全球最受欢迎的通用AI助手，支持多模态对话、代码生成与插件扩展。', tags: ['多模态', '代码生成', '插件'], link: 'https://chat.openai.com' },
  { name: 'Claude', company: 'Anthropic', icon: '🧠', iconBg: 'linear-gradient(135deg, #d97757, #cc6b4f)', logoUrl: 'https://claude.ai/favicon.ico', description: '支持20万Token超长上下文，注重安全对齐与深度推理研究。', tags: ['200K上下文', '安全', '研究'], link: 'https://claude.ai' },
  { name: 'Gemini', company: 'Google DeepMind', icon: '✦', iconBg: 'linear-gradient(135deg, #4285f4, #1a73e8)', logoUrl: 'https://www.gstatic.com/lamda/images/favicon_gemini_favicon_191017385_6a0267fb3e16.svg', description: '深度集成Google生态，原生多模态能力，擅长长文本与多语言处理。', tags: ['Google集成', '多模态', '长文本'], link: 'https://gemini.google.com' },
  { name: 'Perplexity', company: 'Perplexity AI', icon: '🔍', iconBg: 'linear-gradient(135deg, #1a1a1a, #333333)', logoUrl: 'https://www.perplexity.ai/favicon.svg', description: 'AI驱动实时搜索引擎，回答附带引用来源，适合学术与深度研究。', tags: ['实时搜索', '引用来源', '研究'], link: 'https://perplexity.ai' },
  { name: 'Mistral', company: 'Mistral AI', icon: '⚡', iconBg: 'linear-gradient(135deg, #ff7000, #cc5800)', logoUrl: 'https://mistral.ai/images/favicon.ico', description: '欧洲开源大模型先锋，推理速度极快，支持多语言与本地部署。', tags: ['开源', '快速', '多语言'], link: 'https://mistral.ai' },
  { name: 'Cohere', company: 'Cohere', icon: '🔗', iconBg: 'linear-gradient(135deg, #39594d, #2a4036)', logoUrl: 'https://cohere.com/favicon.ico', description: '专注企业级RAG与检索增强，提供高质量嵌入模型与多语言支持。', tags: ['企业RAG', '嵌入模型', '多语言'], link: 'https://cohere.com' }
]
