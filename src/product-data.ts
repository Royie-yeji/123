/* ================================================================
   产品详情数据 — 每个产品的使用教程、API 接入、终端配置
   内容参考 https://doc.cun.ai/zh/guide/
   ================================================================ */

export interface ProductDetail {
  slug: string
  name: string
  company: string
  icon: string
  iconBg: string
  logoUrl: string
  tagline: string
  tags: string[]
  officialUrl: string
  apiKeyUrl: string
  models: { name: string; desc: string; category: string }[]
  tutorials: {
    title: string
    steps: { title: string; desc: string }[]
  }[]
  installGuide: {
    title: string
    phases: {
      phaseName: string
      phaseTag: string
      steps: {
        title: string
        desc: string
        cmd?: string
        tip?: string
      }[]
    }[]
  }
  apiConfig: {
    title: string
    fields: { label: string; value: string }[]
    codeBlocks: { lang: string; label: string; code: string }[]
    callouts: { type: string; title: string; desc: string }[]
  }
  terminalConfig: {
    title: string
    intro: string
    tools: {
      name: string
      steps: { cmd: string; desc: string }[]
    }[]
  }
}

export interface ProductCard {
  name: string
  company: string
  icon: string
  iconBg: string
  logoUrl: string
  description: string
  tags: string[]
  link: string
}

export const productDetails: Record<string, ProductDetail> = {
  /* ── ChatGPT ── */
  chatgpt: {
    slug: 'chatgpt',
    name: 'ChatGPT',
    company: 'OpenAI',
    icon: '💬',
    iconBg: 'linear-gradient(135deg, #10a37f, #1a7f64)',
    logoUrl: 'https://cdn.worldvectorlogo.com/logos/chatgpt-1.svg',
    tagline: '全球最受欢迎的通用AI助手，支持多模态对话、代码生成与插件扩展。',
    tags: ['多模态', '代码生成', '插件'],
    officialUrl: 'https://chat.openai.com',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'GPT-4o', desc: '多模态旗舰模型，支持文本、图像、语音', category: '高性能模型' },
      { name: 'GPT-4o mini', desc: '轻量快速版，适合日常对话和批量处理', category: '轻量模型' },
      { name: 'o1', desc: '深度推理模型，擅长复杂逻辑和数学', category: '高性能模型' }
    ],
    tutorials: [
      {
        title: '网页端使用',
        steps: [
          { title: '访问官网', desc: '打开 chat.openai.com，使用邮箱或 Google 账号注册登录' },
          { title: '选择模型', desc: '在左上角下拉菜单选择 GPT-4o 或其他模型' },
          { title: '开始对话', desc: '在输入框输入问题，支持上传图片、文件进行多模态对话' },
          { title: '使用插件', desc: '在 GPT Store 中搜索并安装插件，扩展功能如网页搜索、代码执行' }
        ]
      },
      {
        title: 'DALL·E 图像生成',
        steps: [
          { title: '进入 DALL·E', desc: '在 ChatGPT 中选择 DALL·E 或直接描述图像需求' },
          { title: '描述图像', desc: '用自然语言描述你想要的图片，例如"画一只在月球上的猫"' },
          { title: '调整与下载', desc: '可以要求修改风格、尺寸，生成后直接下载图片' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 OpenAI 官网', desc: '打开 https://chat.openai.com，点击 Sign up 注册按钮', tip: '建议使用 Google 账号一键登录，避免邮箱验证问题' },
            { title: '填写注册信息', desc: '输入邮箱地址和密码，或选择 Google/Microsoft 账号登录', tip: '需要能接收验证码的手机号（+86 号码可能受限，建议用海外号码）' },
            { title: '完成手机验证', desc: '输入手机号接收短信验证码，完成身份验证', tip: '如果收不到验证码，可尝试使用虚拟号码服务如 sms-activate' },
            { title: '登录进入 ChatGPT', desc: '验证完成后自动登录，进入对话界面' }
          ]
        },
        {
          phaseName: '网页端使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '选择模型', desc: '在左上角下拉菜单选择 GPT-4o 或 GPT-4o mini', tip: '免费用户默认使用 GPT-4o mini，Plus 订阅可用 GPT-4o 和 o1' },
            { title: '开始对话', desc: '在输入框输入问题，按 Enter 发送', tip: '可上传图片、PDF 等文件，GPT-4o 支持多模态理解' },
            { title: '使用 GPTs 商店', desc: '点击 Explore GPTs 浏览和安装插件', tip: '常用 GPTs：DALL·E（画图）、Code Interpreter（代码执行）、Web Search' },
            { title: '创建自定义 GPT', desc: '点击 Create a GPT，上传知识文件，设置系统提示词', tip: '自定义 GPT 可以设定角色和专属知识库' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '注册开发者账号', desc: '访问 https://platform.openai.com，用 ChatGPT 账号登录' },
            { title: '创建 API Key', desc: '进入 API Keys 页面，点击 Create new secret key', tip: '密钥只显示一次，请立即保存到安全位置' },
            { title: '充值额度', desc: '进入 Billing 页面，绑定信用卡并充值', tip: '建议先充 $5 测试，按量计费' },
            { title: '安装 SDK', desc: '在终端运行 pip install openai (Python) 或 npm install openai (Node.js)', cmd: 'pip install openai' },
            { title: '编写代码调用', desc: '使用 Base URL https://api.openai.com/v1 和 API Key 调用接口', tip: '也可通过 CUN.AI 中转：Base URL 改为 https://api.cun.ai/v1' }
          ]
        },
        {
          phaseName: '终端工具部署',
          phaseTag: '第4阶段',
          steps: [
            { title: '安装 Codex CLI', desc: '在终端执行安装命令', cmd: 'npm install -g @openai/codex' },
            { title: '配置 API Key', desc: '设置环境变量', cmd: 'export OPENAI_API_KEY="sk-your-key-here"', tip: '写入 ~/.zshrc 或 ~/.bashrc 持久化' },
            { title: '启动 Codex', desc: '在项目目录中运行', cmd: 'cd your-project && codex' },
            { title: '验证连接', desc: '发送一条测试消息确认能正常回复', tip: '如果返回 401，检查 API Key 是否正确' }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://api.openai.com/v1' },
        { label: 'API Key', value: '在 platform.openai.com 创建的密钥' },
        { label: 'Chat Endpoint', value: '/chat/completions' },
        { label: '协议', value: 'OpenAI Compatible' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.openai.com/v1",
)

resp = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}],
)

print(resp.choices[0].message.content)`
        },
        {
          lang: 'javascript',
          label: 'Node.js 示例',
          code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://api.openai.com/v1",
});

const res = await client.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});

console.log(res.choices[0].message.content);`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
        }
      ],
      callouts: [
        { type: 'warning', title: '安全提示', desc: 'API Key 只能放在服务端，不要提交到公开仓库或前端代码中。' },
        { type: 'info', title: '速率限制', desc: '不同模型有不同速率限制，GPT-4o 默认 500 RPM，o1 较低。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: '在终端中使用 ChatGPT API 需要配置环境变量和客户端工具。',
      tools: [
        {
          name: 'Codex CLI',
          steps: [
            { cmd: 'npm install -g @openai/codex', desc: '安装 Codex CLI 命令行工具' },
            { cmd: 'export OPENAI_API_KEY="YOUR_API_KEY"', desc: '设置 API Key 环境变量（写入 ~/.zshrc 持久化）' },
            { cmd: 'codex', desc: '在项目目录中启动 Codex，自动读取环境变量' }
          ]
        },
        {
          name: 'Chatbox (终端模式)',
          steps: [
            { cmd: 'npm install -g @anthropic-ai/chatbox', desc: '安装终端聊天工具' },
            { cmd: 'export OPENAI_API_KEY="YOUR_API_KEY"', desc: '设置密钥' },
            { cmd: 'export OPENAI_BASE_URL="https://api.openai.com/v1"', desc: '设置 Base URL' },
            { cmd: 'chatbox --model gpt-4o', desc: '启动并指定模型' }
          ]
        },
        {
          name: 'OpenAI REPL',
          steps: [
            { cmd: 'pip install openai', desc: '安装 OpenAI Python SDK' },
            { cmd: 'export OPENAI_API_KEY="YOUR_API_KEY"', desc: '设置环境变量' },
            { cmd: "python3 -c \"from openai import OpenAI; print(OpenAI().chat.completions.create(model='gpt-4o', messages=[{'role':'user','content':'Hi'}]).choices[0].message.content)\"", desc: '一行命令快速测试' }
          ]
        }
      ]
    }
  },

  /* ── Claude ── */
  claude: {
    slug: 'claude',
    name: 'Claude',
    company: 'Anthropic',
    icon: '🧠',
    iconBg: 'linear-gradient(135deg, #d97757, #cc6b4f)',
    logoUrl: 'https://claude.ai/favicon.ico',
    tagline: '支持20万Token超长上下文，注重安全对齐与深度推理研究。',
    tags: ['200K上下文', '安全', '研究'],
    officialUrl: 'https://claude.ai',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'Claude Sonnet 4', desc: '最新旗舰模型，编码和推理能力最强', category: '高性能模型' },
      { name: 'Claude Opus 4', desc: '深度推理，适合复杂分析和长文档处理', category: '高性能模型' },
      { name: 'Claude Haiku 3.5', desc: '轻量快速版，适合高并发场景', category: '轻量模型' }
    ],
    tutorials: [
      {
        title: '网页端使用',
        steps: [
          { title: '访问官网', desc: '打开 claude.ai，使用邮箱注册登录' },
          { title: '上传文档', desc: '点击附件按钮上传 PDF、代码文件等，Claude 支持 200K Token 上下文' },
          { title: '长文档分析', desc: '上传学术论文、法律文件等长文档，Claude 可完整理解并回答问题' },
          { title: 'Artifacts', desc: 'Claude 可以生成可视化内容（图表、代码、文档），在右侧面板实时预览' }
        ]
      },
      {
        title: 'Projects 功能',
        steps: [
          { title: '创建项目', desc: '在左侧栏创建 Project，上传项目相关文件作为知识库' },
          { title: '设置指令', desc: '为项目设置自定义指令，定义 Claude 的回答风格和行为' },
          { title: '持续对话', desc: '在项目内对话会自动参考上传的文件和指令' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 Claude 官网', desc: '打开 https://claude.ai，点击 Sign up' },
            { title: '注册账号', desc: '使用邮箱注册，或选择 Google 账号登录', tip: 'Claude 不需要手机号验证，注册更简单' },
            { title: '登录进入对话', desc: '注册完成后自动进入 Claude 对话界面' }
          ]
        },
        {
          phaseName: '网页端使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '选择模型', desc: '在对话界面底部选择 Claude Sonnet 4 或 Opus 4', tip: '免费用户使用 Sonnet，Pro 订阅可用 Opus 4' },
            { title: '上传长文档', desc: '点击附件按钮上传 PDF、代码文件等', tip: 'Claude 支持 200K Token 上下文，可上传整本学术书籍' },
            { title: '使用 Artifacts', desc: '让 Claude 生成代码、图表、文档，右侧面板实时预览', tip: '适合生成 React 组件、SVG 图表、Mermaid 流程图' },
            { title: '创建 Projects', desc: '左侧栏创建项目，上传知识文件作为专属知识库', tip: '项目内对话自动参考上传文件和自定义指令' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '注册开发者账号', desc: '访问 https://console.anthropic.com 注册' },
            { title: '创建 API Key', desc: '进入 Settings → API Keys，创建新密钥', tip: '需绑定信用卡才能使用' },
            { title: '充值额度', desc: '在 Billing 页面设置消费上限', tip: 'Claude API 按 Token 计费，Sonnet 比 Opus 便宜' },
            { title: '安装 SDK', desc: '安装 Anthropic Python SDK', cmd: 'pip install anthropic' },
            { title: '编写代码调用', desc: '使用 Base URL https://api.anthropic.com 调用', tip: '也可通过 CUN.AI 中转：Base URL 改为 https://api.cun.ai' }
          ]
        },
        {
          phaseName: '终端工具部署',
          phaseTag: '第4阶段',
          steps: [
            { title: '安装 Claude Code', desc: '在终端执行安装脚本', cmd: 'curl -fsSL https://claude.ai/install.sh | bash' },
            { title: '检查安装', desc: '验证 Claude Code 是否安装成功', cmd: 'claude doctor' },
            { title: '配置 API Key', desc: '设置环境变量', cmd: 'export ANTHROPIC_API_KEY="sk-ant-your-key"', tip: '写入 ~/.zshrc 持久化' },
            { title: '启动 Claude Code', desc: '在项目目录中运行', cmd: 'cd your-project && claude' },
            { title: '验证连接', desc: '发送一条测试消息确认能正常回复', tip: '如要求登录 Anthropic，检查 ANTHROPIC_BASE_URL 和 ANTHROPIC_AUTH_TOKEN 是否已设置' }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://api.anthropic.com' },
        { label: 'API Key', value: '在 console.anthropic.com 创建的密钥' },
        { label: 'Messages Endpoint', value: '/v1/messages' },
        { label: '协议', value: 'Anthropic Messages API' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `import anthropic

client = anthropic.Anthropic(
    api_key="YOUR_API_KEY",
)

message = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Hello, Claude!"}
    ]
)

print(message.content[0].text)`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl https://api.anthropic.com/v1/messages \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-sonnet-4-20250514",
    "max_tokens": 1024,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
        }
      ],
      callouts: [
        { type: 'warning', title: '版本头', desc: '必须包含 anthropic-version: 2023-06-01 请求头，否则会返回错误。' },
        { type: 'info', title: '长上下文', desc: 'Claude 支持 200K Token 上下文，适合处理长文档、代码库分析等场景。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: 'Claude Code 是 Anthropic 官方终端工具，可以直接在项目目录中启动。',
      tools: [
        {
          name: 'Claude Code',
          steps: [
            { cmd: 'curl -fsSL https://claude.ai/install.sh | bash', desc: '安装 Claude Code CLI' },
            { cmd: 'claude doctor', desc: '检查安装状态和配置' },
            { cmd: 'export ANTHROPIC_API_KEY="YOUR_API_KEY"', desc: '设置 API Key（写入 ~/.zshrc 持久化）' },
            { cmd: 'cd /path/to/your/project && claude', desc: '在项目目录中启动 Claude Code' }
          ]
        },
        {
          name: '通过兼容网关接入',
          steps: [
            { cmd: 'export ANTHROPIC_BASE_URL="https://api.cun.ai/v1"', desc: '设置兼容网关 Base URL' },
            { cmd: 'export ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"', desc: '设置认证令牌' },
            { cmd: 'claude', desc: '启动后自动使用网关，恢复官方服务运行 unset 命令' }
          ]
        },
        {
          name: '持久化配置',
          steps: [
            { cmd: 'cat ~/.claude/settings.json', desc: '查看或编辑 Claude Code 配置文件' },
            { cmd: 'echo \'{"env":{"ANTHROPIC_API_KEY":"YOUR_KEY"}}\' > ~/.claude/settings.json', desc: '写入配置实现持久化' }
          ]
        }
      ]
    }
  },

  /* ── Gemini ── */
  gemini: {
    slug: 'gemini',
    name: 'Gemini',
    company: 'Google DeepMind',
    icon: '✦',
    iconBg: 'linear-gradient(135deg, #4285f4, #1a73e8)',
    logoUrl: 'https://www.gstatic.com/lamda/images/favicon_gemini_favicon_191017385_6a0267fb3e16.svg',
    tagline: '深度集成Google生态，原生多模态能力，擅长长文本与多语言处理。',
    tags: ['Google集成', '多模态', '长文本'],
    officialUrl: 'https://gemini.google.com',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'Gemini 2.5 Pro', desc: '最新旗舰模型，100万Token上下文，多模态推理', category: '高性能模型' },
      { name: 'Gemini 2.5 Flash', desc: '快速版，速度与质量平衡，适合高并发', category: '轻量模型' },
      { name: 'Gemini 2.0 Flash', desc: '极速版，低延迟，适合实时应用', category: '轻量模型' }
    ],
    tutorials: [
      {
        title: '网页端使用',
        steps: [
          { title: '访问官网', desc: '打开 gemini.google.com，使用 Google 账号登录' },
          { title: '多模态对话', desc: '上传图片、视频或音频文件，Gemini 可以理解和分析内容' },
          { title: 'Google 集成', desc: 'Gemini 与 Gmail、Docs、Drive 深度集成，可以直接调用 Google 生态功能' },
          { title: '代码执行', desc: 'Gemini 可以运行 Python 代码，进行数据处理和可视化' }
        ]
      },
      {
        title: 'AI Studio 使用',
        steps: [
          { title: '打开 AI Studio', desc: '访问 aistudio.google.com，免费使用 Gemini API' },
          { title: '创建 Prompt', desc: '在界面中编写 System Prompt 和对话内容' },
          { title: '获取 API Key', desc: '点击 "Get API Key" 创建密钥用于代码调用' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 Gemini 官网', desc: '打开 https://gemini.google.com，使用 Google 账号登录', tip: '必须有 Google 账号，直接用 Gmail 登录即可' },
            { title: '同意服务条款', desc: '首次使用需要同意 Google AI 服务条款' },
            { title: '进入对话界面', desc: '登录后自动进入 Gemini 对话界面' }
          ]
        },
        {
          phaseName: '网页端使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '选择模型', desc: '在顶部选择 Gemini 2.5 Pro 或 Flash', tip: 'Pro 模式更强大，Flash 模式更快' },
            { title: '多模态对话', desc: '上传图片、视频或音频文件，Gemini 可以理解和分析', tip: 'Gemini 原生支持多模态，无需插件' },
            { title: 'Google 集成', desc: '使用 @ 提及 Gmail、Docs、Drive 中的内容', tip: '例如 @Gmail 可以让 Gemini 读取邮件内容回答问题' },
            { title: '使用 AI Studio', desc: '访问 https://aistudio.google.com 获取免费 API 配额', tip: 'AI Studio 提供免费额度，适合学习和原型开发' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '获取 API Key', desc: '在 AI Studio 中点击 Get API Key 创建密钥', tip: '免费额度：每分钟 15 次请求，每天 1500 次' },
            { title: '安装 SDK', desc: '安装 Google GenAI Python SDK', cmd: 'pip install google-genai' },
            { title: '设置环境变量', desc: '配置 API Key', cmd: 'export GEMINI_API_KEY="your-key-here"' },
            { title: '编写代码调用', desc: '使用 Base URL 调用 Gemini API', tip: '也可通过 OpenAI 兼容模式：Base URL = https://generativelanguage.googleapis.com/v1beta/openai' }
          ]
        },
        {
          phaseName: '终端工具部署',
          phaseTag: '第4阶段',
          steps: [
            { title: '安装 Python SDK', desc: '安装 Google GenAI SDK', cmd: 'pip install google-genai' },
            { title: '配置密钥', desc: '设置环境变量', cmd: 'export GEMINI_API_KEY="your-key"' },
            { title: '测试调用', desc: '一行命令验证', cmd: 'python3 -c "from google import genai; print(genai.Client().models.generate_content(model=\'gemini-2.5-pro\', contents=\'Hi\').text)"' },
            { title: '接入客户端工具', desc: '在 Cursor/Cherry Studio 中配置 OpenAI 兼容模式', tip: 'Provider: OpenAI, Base URL: https://generativelanguage.googleapis.com/v1beta/openai' }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://generativelanguage.googleapis.com/v1beta' },
        { label: 'API Key', value: '在 aistudio.google.com 创建的密钥' },
        { label: 'Generate Endpoint', value: '/models/{model}:generateContent' },
        { label: '协议', value: 'Google Generative AI API' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `from google import genai

client = genai.Client(api_key="YOUR_API_KEY")

response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="Hello, Gemini!"
)

print(response.text)`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "contents": [{"parts": [{"text": "Hello!"}]}]
  }'`
        }
      ],
      callouts: [
        { type: 'info', title: '免费额度', desc: 'Gemini API 有免费额度，适合学习和原型开发。生产环境建议使用付费版本。' },
        { type: 'warning', title: '安全提示', desc: '不要把 API Key 放在 URL 参数中发布到公开环境，生产环境使用服务端调用。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: 'Gemini 可以通过 Google GenAI SDK 或 OpenAI 兼容接口在终端中使用。',
      tools: [
        {
          name: 'Google GenAI SDK',
          steps: [
            { cmd: 'pip install google-genai', desc: '安装 Google GenAI Python SDK' },
            { cmd: 'export GEMINI_API_KEY="YOUR_API_KEY"', desc: '设置 API Key 环境变量' },
            { cmd: "python3 -c \"from google import genai; print(genai.Client().models.generate_content(model='gemini-2.5-pro', contents='Hi').text)\"", desc: '一行命令测试' }
          ]
        },
        {
          name: 'OpenAI 兼容模式',
          steps: [
            { cmd: 'pip install openai', desc: '安装 OpenAI SDK' },
            { cmd: 'export OPENAI_API_KEY="YOUR_GEMINI_KEY"', desc: '使用 Gemini API Key' },
            { cmd: 'export OPENAI_BASE_URL="https://generativelanguage.googleapis.com/v1beta/openai"', desc: '设置兼容 Base URL' },
            { cmd: 'python3 script.py', desc: '在脚本中使用 openai.chat.completions.create 调用 Gemini' }
          ]
        },
        {
          name: 'Gemini CLI',
          steps: [
            { cmd: 'npm install -g @anthropic-ai/gemini-cli', desc: '安装 Gemini CLI（如有）' },
            { cmd: 'export GEMINI_API_KEY="YOUR_API_KEY"', desc: '设置密钥' },
            { cmd: 'gemini "解释这段代码"', desc: '直接在终端提问' }
          ]
        }
      ]
    }
  },

  /* ── Perplexity ── */
  perplexity: {
    slug: 'perplexity',
    name: 'Perplexity',
    company: 'Perplexity AI',
    icon: '🔍',
    iconBg: 'linear-gradient(135deg, #1a1a1a, #333333)',
    logoUrl: 'https://www.perplexity.ai/favicon.svg',
    tagline: 'AI驱动实时搜索引擎，回答附带引用来源，适合学术与深度研究。',
    tags: ['实时搜索', '引用来源', '研究'],
    officialUrl: 'https://perplexity.ai',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'sonar-pro', desc: '深度搜索模型，多步推理，适合复杂研究问题', category: '高性能模型' },
      { name: 'sonar', desc: '快速搜索模型，实时联网，适合日常查询', category: '轻量模型' },
      { name: 'sonar-reasoning', desc: '推理增强版，结合搜索与思维链', category: '高性能模型' }
    ],
    tutorials: [
      {
        title: '网页端使用',
        steps: [
          { title: '访问官网', desc: '打开 perplexity.ai，注册账号即可使用（免费版有每日限制）' },
          { title: '提问搜索', desc: '输入问题后 Perplexity 会实时搜索网络并生成带引用的回答' },
          { title: 'Focus 模式', desc: '选择搜索范围：学术、写作、社交媒体、YouTube 等' },
          { title: 'Pro Search', desc: '使用 Pro 模式进行多步深度搜索，获得更全面的答案' }
        ]
      },
      {
        title: 'Space 知识管理',
        steps: [
          { title: '创建 Space', desc: '在左侧栏创建 Space，上传 PDF 或添加 URL 作为知识库' },
          { title: '在 Space 内搜索', desc: '对话会优先搜索 Space 内的文档，再结合网络搜索' },
          { title: '分享与协作', desc: '可以将 Space 分享给团队成员，共同使用' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 Perplexity 官网', desc: '打开 https://perplexity.ai，点击 Sign up' },
            { title: '注册账号', desc: '使用邮箱注册，或选择 Google/Apple 账号登录', tip: '免费版每天有 5 次 Pro Search 额度' },
            { title: '进入搜索界面', desc: '注册后进入 Perplexity 搜索对话界面' }
          ]
        },
        {
          phaseName: '网页端使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '输入问题搜索', desc: '在输入框输入问题，Perplexity 会实时联网搜索', tip: '回答附带引用来源链接，可点击查看原文' },
            { title: '使用 Focus 模式', desc: '选择搜索范围：Academic（学术）、Writing（写作）、YouTube 等', tip: '学术模式优先搜索论文，适合研究用途' },
            { title: 'Pro Search', desc: '点击 Pro 按钮进行多步深度搜索', tip: 'Pro Search 会分解问题、多轮搜索后综合回答' },
            { title: '创建 Space', desc: '左侧栏创建 Space，上传 PDF 或添加 URL 作为知识库', tip: '在 Space 内搜索会优先使用你的文件' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '获取 API Key', desc: '访问 https://www.perplexity.ai/settings/api 创建密钥', tip: '需要 Pro 订阅才能使用 API（$20/月或通过 CUN.AI）' },
            { title: '安装 SDK', desc: 'Perplexity API 兼容 OpenAI 格式，直接用 OpenAI SDK', cmd: 'pip install openai' },
            { title: '配置调用', desc: 'Base URL 设为 https://api.perplexity.ai', tip: '也可通过 CUN.AI 中转使用' },
            { title: '编写代码', desc: '使用 sonar 或 sonar-pro 模型进行联网搜索对话' }
          ]
        },
        {
          phaseName: '终端工具部署',
          phaseTag: '第4阶段',
          steps: [
            { title: '安装 OpenAI SDK', desc: 'Perplexity 兼容 OpenAI 格式', cmd: 'pip install openai' },
            { title: '设置环境变量', desc: '配置 API Key', cmd: 'export PERPLEXITY_API_KEY="pplx-your-key"' },
            { title: '测试调用', desc: '用 curl 快速验证', cmd: "curl https://api.perplexity.ai/chat/completions -H 'Authorization: Bearer $PERPLEXITY_API_KEY' -H 'Content-Type: application/json' -d '{\"model\":\"sonar\",\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}'" },
            { title: '接入客户端', desc: '在 Chatbox/Cherry Studio 中配置', tip: 'Provider: OpenAI Compatible, Base URL: https://api.perplexity.ai, Model: sonar' }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://api.perplexity.ai' },
        { label: 'API Key', value: '在 perplexity.ai/settings/api 创建的密钥' },
        { label: 'Chat Endpoint', value: '/chat/completions' },
        { label: '协议', value: 'OpenAI Compatible' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.perplexity.ai",
)

response = client.chat.completions.create(
    model="sonar-pro",
    messages=[
        {"role": "system", "content": "Be precise and cite sources."},
        {"role": "user", "content": "What is the latest news about AI?"}
    ],
)

print(response.choices[0].message.content)
print(response.citations)`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl https://api.perplexity.ai/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "sonar-pro",
    "messages": [{"role": "user", "content": "Latest AI news?"}]
  }'`
        }
      ],
      callouts: [
        { type: 'info', title: '实时搜索', desc: 'Perplexity API 自动联网搜索，回答包含引用来源 URL，适合需要时效性的应用。' },
        { type: 'warning', title: '额度计费', desc: 'API 调用按 Token 计费，sonar-pro 价格高于 sonar，请根据需求选择。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: 'Perplexity API 兼容 OpenAI 格式，可以在任何支持自定义 Base URL 的终端工具中使用。',
      tools: [
        {
          name: 'curl 直接调用',
          steps: [
            { cmd: 'export PERPLEXITY_API_KEY="YOUR_API_KEY"', desc: '设置 API Key' },
            { cmd: 'curl https://api.perplexity.ai/chat/completions -H "Authorization: Bearer $PERPLEXITY_API_KEY" -H "Content-Type: application/json" -d \'{"model":"sonar","messages":[{"role":"user","content":"Hi"}]}\'', desc: '一行命令测试' }
          ]
        },
        {
          name: 'Python REPL',
          steps: [
            { cmd: 'pip install openai', desc: '安装 OpenAI SDK' },
            { cmd: 'export PERPLEXITY_API_KEY="YOUR_API_KEY"', desc: '设置密钥' },
            { cmd: "python3 -c \"import os; from openai import OpenAI; print(OpenAI(api_key=os.getenv('PERPLEXITY_API_KEY'), base_url='https://api.perplexity.ai').chat.completions.create(model='sonar', messages=[{'role':'user','content':'Hi'}]).choices[0].message.content)\"", desc: '快速测试调用' }
          ]
        },
        {
          name: '接入 Chatbox / Cherry Studio',
          steps: [
            { cmd: '# 在客户端设置中配置', desc: 'Provider: OpenAI Compatible' },
            { cmd: '# Base URL', desc: 'https://api.perplexity.ai' },
            { cmd: '# Model', desc: 'sonar 或 sonar-pro' },
            { cmd: '# API Key', desc: '填入 perplexity.ai 创建的密钥' }
          ]
        }
      ]
    }
  },

  /* ── Mistral ── */
  mistral: {
    slug: 'mistral',
    name: 'Mistral',
    company: 'Mistral AI',
    icon: '⚡',
    iconBg: 'linear-gradient(135deg, #ff7000, #cc5800)',
    logoUrl: 'https://mistral.ai/images/favicon.ico',
    tagline: '欧洲开源大模型先锋，推理速度极快，支持多语言与本地部署。',
    tags: ['开源', '快速', '多语言'],
    officialUrl: 'https://mistral.ai',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'Mistral Large 2', desc: '旗舰模型，123B参数，多语言能力强', category: '高性能模型' },
      { name: 'Mistral Small', desc: '轻量模型，速度快延迟低，适合实时应用', category: '轻量模型' },
      { name: 'Codestral', desc: '代码专用模型，支持80+编程语言', category: '高性能模型' },
      { name: 'Pixtral', desc: '多模态模型，支持图像理解', category: '多模态模型' }
    ],
    tutorials: [
      {
        title: 'Le Chat 网页端',
        steps: [
          { title: '访问 Le Chat', desc: '打开 chat.mistral.ai，注册账号即可免费使用' },
          { title: '选择模型', desc: '在对话界面选择 Mistral Large 2 或其他模型' },
          { title: '上传文件', desc: 'Pixtral 模型支持上传图片进行分析' },
          { title: '代码助手', desc: '切换到 Codestral 模式，获得代码生成和解释' }
        ]
      },
      {
        title: '本地部署（开源模型）',
        steps: [
          { title: '下载模型', desc: '从 HuggingFace 下载 Mistral 开源权重，如 Mistral-7B-Instruct' },
          { title: '安装 llama.cpp', desc: '使用 llama.cpp 或 vLLM 等推理引擎加载模型' },
          { title: '启动服务', desc: '运行推理服务，通过 OpenAI 兼容 API 在本地调用' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 Mistral 官网', desc: '打开 https://chat.mistral.ai 注册 Le Chat 账号' },
            { title: '注册登录', desc: '使用邮箱注册，或选择 Google 账号登录', tip: 'Le Chat 免费使用，无需绑卡' },
            { title: '进入对话界面', desc: '登录后进入 Le Chat 对话界面' }
          ]
        },
        {
          phaseName: '网页端使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '选择模型', desc: '在对话界面选择 Mistral Large 2 或 Codestral', tip: 'Codestral 模式适合代码生成和技术问题' },
            { title: '上传图片', desc: 'Pixtral 模型支持上传图片进行分析', tip: '可分析截图、文档扫描件等' },
            { title: '创建对话', desc: '点击 New Chat 创建新对话，可设置系统提示词', tip: '可自定义 AI 角色和行为' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '注册开发者账号', desc: '访问 https://console.mistral.ai 注册' },
            { title: '创建 API Key', desc: '进入 API Keys 页面创建密钥', tip: '新用户有免费额度' },
            { title: '安装 SDK', desc: '安装 Mistral Python SDK', cmd: 'pip install mistralai' },
            { title: '编写代码调用', desc: 'Base URL: https://api.mistral.ai/v1', tip: 'Mistral API 兼容 OpenAI 格式，也可用 OpenAI SDK 调用' }
          ]
        },
        {
          phaseName: '本地部署（开源模型）',
          phaseTag: '第4阶段',
          steps: [
            { title: '下载模型权重', desc: '从 HuggingFace 下载 Mistral-7B-Instruct', cmd: 'pip install huggingface-hub && huggingface-cli download mistralai/Mistral-7B-Instruct-v0.3 --local-dir ./mistral-7b' },
            { title: '安装 llama.cpp', desc: '安装推理引擎', cmd: 'brew install llama.cpp', tip: '或从源码编译：git clone https://github.com/ggerganov/llama.cpp && cd llama.cpp && make' },
            { title: '转换模型格式', desc: '将模型转为 GGUF 格式', cmd: 'python3 convert.py ./mistral-7b --outtype f16' },
            { title: '启动推理服务', desc: '运行本地 API 服务器', cmd: 'llama-server --model mistral-7b/ggml-model-f16.gguf --port 8080' },
            { title: '测试本地 API', desc: '验证本地部署是否成功', cmd: "curl http://localhost:8080/v1/chat/completions -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}'" }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://api.mistral.ai/v1' },
        { label: 'API Key', value: '在 console.mistral.ai 创建的密钥' },
        { label: 'Chat Endpoint', value: '/chat/completions' },
        { label: '协议', value: 'OpenAI Compatible' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `from mistralai import Mistral

client = Mistral(api_key="YOUR_API_KEY")

response = client.chat.complete(
    model="mistral-large-latest",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl https://api.mistral.ai/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "mistral-large-latest",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
        },
        {
          lang: 'javascript',
          label: 'OpenAI SDK 兼容模式',
          code: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

const res = await client.chat.completions.create({
  model: "mistral-large-latest",
  messages: [{ role: "user", content: "Hello!" }],
});`
        }
      ],
      callouts: [
        { type: 'info', title: '开源优势', desc: 'Mistral 部分模型开源，可本地部署，不依赖 API 调用，适合对数据隐私要求高的场景。' },
        { type: 'warning', title: '多语言', desc: 'Mistral 在中文、法语、德语等欧洲语言上表现优秀，适合多语言应用。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: 'Mistral API 兼容 OpenAI 格式，可在终端工具中直接配置使用。',
      tools: [
        {
          name: 'Mistral CLI',
          steps: [
            { cmd: 'pip install mistralai', desc: '安装 Mistral Python SDK' },
            { cmd: 'export MISTRAL_API_KEY="YOUR_API_KEY"', desc: '设置 API Key' },
            { cmd: "python3 -c \"from mistralai import Mistral; print(Mistral().chat.complete(model='mistral-large-latest', messages=[{'role':'user','content':'Hi'}]).choices[0].message.content)\"", desc: '快速测试' }
          ]
        },
        {
          name: '本地部署 (llama.cpp)',
          steps: [
            { cmd: 'brew install llama.cpp', desc: '安装 llama.cpp（或从源码编译）' },
            { cmd: 'huggingface-cli download mistralai/Mistral-7B-Instruct-v0.3 --local-dir ./mistral-7b', desc: '下载模型权重' },
            { cmd: 'llama-server --model ./mistral-7b/model.gguf --port 8080', desc: '启动本地推理服务' },
            { cmd: "curl http://localhost:8080/v1/chat/completions -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hi\"}]}'", desc: '通过本地 API 调用' }
          ]
        },
        {
          name: '接入终端客户端',
          steps: [
            { cmd: '# Provider', desc: 'OpenAI Compatible' },
            { cmd: '# Base URL', desc: 'https://api.mistral.ai/v1' },
            { cmd: '# Model', desc: 'mistral-large-latest 或 codestral-latest' }
          ]
        }
      ]
    }
  },

  /* ── Cohere ── */
  cohere: {
    slug: 'cohere',
    name: 'Cohere',
    company: 'Cohere',
    icon: '🔗',
    iconBg: 'linear-gradient(135deg, #39594d, #2a4036)',
    logoUrl: 'https://cohere.com/favicon.ico',
    tagline: '专注企业级RAG与检索增强，提供高质量嵌入模型与多语言支持。',
    tags: ['企业RAG', '嵌入模型', '多语言'],
    officialUrl: 'https://cohere.com',
    apiKeyUrl: 'https://www.cun.ai',
    models: [
      { name: 'Command R+', desc: '企业级大模型，擅长 RAG 和工具调用', category: '高性能模型' },
      { name: 'Command R', desc: '高效模型，适合大规模部署和成本控制', category: '轻量模型' },
      { name: 'Embed v4', desc: '多语言嵌入模型，适合向量检索', category: '嵌入模型' },
      { name: 'Rerank v3.5', desc: '重排序模型，提升检索精度', category: '嵌入模型' }
    ],
    tutorials: [
      {
        title: 'Dashboard 使用',
        steps: [
          { title: '访问 Dashboard', desc: '打开 dashboard.cohere.com，注册获取 API Trial Key' },
          { title: 'Chat 界面', desc: '在 Dashboard 中直接与 Command R+ 模型对话测试' },
          { title: '嵌入测试', desc: '使用 Embed 工具输入文本，获取向量表示用于检索' },
          { title: 'Rerank 测试', desc: '输入查询和文档列表，测试重排序效果' }
        ]
      },
      {
        title: 'Coral (企业搜索)',
        steps: [
          { title: '创建 Connector', desc: '在 Cohere Dashboard 中连接数据源（网页、数据库等）' },
          { title: '配置索引', desc: '设置要检索的内容范围和过滤条件' },
          { title: '对话检索', desc: '使用 Coral API 进行基于自有数据的对话式检索' }
        ]
      }
    ],
    installGuide: {
      title: '安装部署全流程',
      phases: [
        {
          phaseName: '注册账号',
          phaseTag: '第1阶段',
          steps: [
            { title: '访问 Cohere 官网', desc: '打开 https://dashboard.cohere.com 注册' },
            { title: '注册登录', desc: '使用邮箱注册，或选择 Google/GitHub 账号登录', tip: '注册即获 Trial Key，每月 1000 次调用' },
            { title: '进入 Dashboard', desc: '登录后进入控制台，可看到 API Key 和使用量' }
          ]
        },
        {
          phaseName: 'Dashboard 使用',
          phaseTag: '第2阶段',
          steps: [
            { title: '测试对话', desc: '在 Dashboard 中直接与 Command R+ 模型对话', tip: '可设置系统提示词、温度等参数' },
            { title: '测试嵌入', desc: '使用 Embed 工具输入文本生成向量', tip: '生成的向量可用于语义搜索和 RAG' },
            { title: '测试 Rerank', desc: '输入查询和文档列表，测试重排序效果', tip: 'Rerank 能显著提升检索精度' },
            { title: '创建 Connector', desc: '在 Coral 中连接数据源实现企业搜索', tip: '支持网页、数据库、文件等数据源' }
          ]
        },
        {
          phaseName: 'API 接入开发',
          phaseTag: '第3阶段',
          steps: [
            { title: '获取 API Key', desc: '在 Dashboard 的 API Keys 页面创建密钥', tip: 'Trial Key 免费使用 1000 次/月' },
            { title: '安装 SDK', desc: '安装 Cohere Python SDK', cmd: 'pip install cohere' },
            { title: '设置环境变量', desc: '配置 API Key', cmd: 'export COHERE_API_KEY="your-key"' },
            { title: '编写代码调用', desc: '使用 Cohere SDK 调用 Command R+ 模型', tip: 'Cohere API 格式与 OpenAI 不同，使用独立的 messages API' }
          ]
        },
        {
          phaseName: 'RAG 流程部署',
          phaseTag: '第4阶段',
          steps: [
            { title: '安装依赖', desc: '安装 Cohere SDK 和向量数据库', cmd: 'pip install cohere faiss-cpu numpy' },
            { title: '生成文档嵌入', desc: '用 Embed 模型将文档转为向量', tip: '使用 embed-v4.0 模型，input_type=search_document' },
            { title: '存储向量', desc: '将向量存入 FAISS 向量数据库' },
            { title: '查询检索', desc: '将用户查询转为向量，在 FAISS 中检索最相关文档', tip: '查询时用 input_type=search_query' },
            { title: 'Rerank 重排序', desc: '用 Rerank 模型对检索结果重新排序，提升精度', tip: '使用 rerank-v3.5 模型' },
            { title: '生成回答', desc: '将检索到的文档作为上下文，用 Command R+ 生成回答', tip: '这是完整的 RAG 流程：Embed → 检索 → Rerank → 生成' }
          ]
        }
      ]
    },
    apiConfig: {
      title: 'API 接入',
      fields: [
        { label: 'Base URL', value: 'https://api.cohere.com/v2' },
        { label: 'API Key', value: '在 dashboard.cohere.com 创建的密钥' },
        { label: 'Chat Endpoint', value: '/chat' },
        { label: '协议', value: 'Cohere API' }
      ],
      codeBlocks: [
        {
          lang: 'python',
          label: 'Python 示例',
          code: `import cohere

client = cohere.Client(api_key="YOUR_API_KEY")

response = client.chat(
    model="command-r-plus",
    message="Hello, Cohere!"
)

print(response.text)`
        },
        {
          lang: 'python',
          label: '嵌入示例 (RAG)',
          code: `import cohere

client = cohere.Client(api_key="YOUR_API_KEY")

# 生成文本嵌入
embeds = client.embed(
    texts=["Hello world", "Goodbye world"],
    model="embed-v4.0",
    input_type="search_document"
)

print(embeds.embeddings[0][:5])  # 前5维向量`
        },
        {
          lang: 'bash',
          label: 'curl 示例',
          code: `curl https://api.cohere.com/v2/chat \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "command-r-plus",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`
        }
      ],
      callouts: [
        { type: 'info', title: 'RAG 优势', desc: 'Cohere 的核心优势在 RAG 流程：Embed 生成向量 → 向量检索 → Rerank 重排序 → Command 生成回答。' },
        { type: 'warning', title: 'Trial 限制', desc: 'Trial Key 有速率限制（1000 次/月），生产环境需要 Production Key。' }
      ]
    },
    terminalConfig: {
      title: '终端工具接入',
      intro: 'Cohere 提供独立的 Python SDK，也可以通过兼容接口接入终端工具。',
      tools: [
        {
          name: 'Cohere SDK',
          steps: [
            { cmd: 'pip install cohere', desc: '安装 Cohere Python SDK' },
            { cmd: 'export COHERE_API_KEY="YOUR_API_KEY"', desc: '设置 API Key' },
            { cmd: "python3 -c \"import cohere; print(cohere.Client().chat(model='command-r-plus', message='Hi').text)\"", desc: '快速测试对话' }
          ]
        },
        {
          name: 'RAG 检索流程',
          steps: [
            { cmd: 'pip install cohere faiss-cpu', desc: '安装 Cohere SDK 和向量检索库' },
            { cmd: 'export COHERE_API_KEY="YOUR_API_KEY"', desc: '设置密钥' },
            { cmd: 'python3 rag_pipeline.py', desc: '运行 RAG 流水线：嵌入→检索→重排→生成' }
          ]
        },
        {
          name: '接入终端客户端',
          steps: [
            { cmd: '# Provider', desc: 'OpenAI Compatible（部分功能）' },
            { cmd: '# Base URL', desc: 'https://api.cohere.com/v2' },
            { cmd: '# Model', desc: 'command-r-plus' }
          ]
        }
      ]
    }
  }
}
