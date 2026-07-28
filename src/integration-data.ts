/* ================================================================
   开发工具接入教学数据
   教用户把 AI 模型接入到各类开发工具中
   参考 https://doc.cun.ai/zh/guide/clients/
   ================================================================ */

export interface IntegrationTool {
  id: string
  name: string
  icon: string
  category: string
  desc: string
  configSummary: { label: string; value: string }[]
  steps: {
    title: string
    desc: string
    cmd?: string
    tip?: string
    code?: { lang: string; content: string }
  }[]
  troubleshooting: { issue: string; solution: string }[]
}

export const integrationTools: IntegrationTool[] = [
  /* ── OpenAI Compatible 通用接入 ── */
  {
    id: 'openai-compatible',
    name: 'OpenAI Compatible 通用接入',
    icon: '🔌',
    category: '通用协议',
    desc: 'CUN.AI 提供 OpenAI Compatible API，多数支持自定义 Base URL 的客户端都可以直接接入。',
    configSummary: [
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: 'YOUR_API_KEY（在 cun.ai 控制台创建）' },
      { label: 'Chat Endpoint', value: '/chat/completions' },
      { label: '协议', value: 'OpenAI Compatible' },
    ],
    steps: [
      {
        title: '获取 API Key',
        desc: '前往 cun.ai 控制台创建 API Key，保存好密钥',
        tip: '建议为每个工具单独创建一个 Key，便于排查和停用',
      },
      {
        title: 'Node.js 示例',
        desc: '安装 OpenAI Node.js SDK 并编写调用代码',
        cmd: 'npm install openai',
        code: {
          lang: 'javascript',
          content: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CUNAI_API_KEY,
  baseURL: "https://api.cun.ai/v1",
  defaultHeaders: { "User-Agent": "CUN.AI-Node/1.0" },
});

const res = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello CUN.AI" }],
});

console.log(res.choices[0].message.content);`,
        },
      },
      {
        title: 'Python 示例',
        desc: '安装 OpenAI Python SDK 并编写调用代码',
        cmd: 'pip install openai',
        code: {
          lang: 'python',
          content: `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="https://api.cun.ai/v1",
    default_headers={"User-Agent": "CUN.AI-Python/1.0"},
)

resp = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello CUN.AI"}],
)

print(resp.choices[0].message.content)`,
        },
      },
      {
        title: 'curl 示例',
        desc: '直接用命令行测试 API 是否可用',
        code: {
          lang: 'bash',
          content: `curl https://api.cun.ai/v1/chat/completions \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [{"role": "user", "content": "Hello"}]
  }'`,
        },
      },
      {
        title: 'LangChain JS 示例',
        desc: '在 LangChain 框架中使用 CUN.AI',
        cmd: 'npm install @langchain/openai',
        code: {
          lang: 'javascript',
          content: `import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  apiKey: process.env.CUNAI_API_KEY,
  configuration: { baseURL: "https://api.cun.ai/v1" },
  model: "gpt-4o-mini",
});`,
        },
      },
    ],
    troubleshooting: [
      { issue: 'Your request was blocked', solution: '这不是 Python 语法错误。请保留示例中的自定义 User-Agent 头：Python 用 default_headers，Node.js 用 defaultHeaders。' },
      { issue: 'SDK 自动请求官方 OpenAI', solution: '确认使用的是 baseURL（JS）或 base_url（Python），值为 https://api.cun.ai/v1' },
      { issue: '浏览器出现 CORS', solution: '不要让前端直接携带 Key 请求，通过自己的后端调用 CUN.AI' },
    ],
  },

  /* ── Cursor ── */
  {
    id: 'cursor',
    name: 'Cursor',
    icon: '✏️',
    category: '代码编辑器',
    desc: '在 Cursor 的模型设置中添加 OpenAI Compatible 服务，将 Base URL、API Key 和模型名指向 CUN.AI。',
    configSummary: [
      { label: 'Provider', value: 'OpenAI Compatible' },
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: '控制台创建的 API Key' },
      { label: 'Model', value: '控制台显示的完整模型 ID' },
    ],
    steps: [
      { title: '打开模型设置', desc: '进入 Cursor Settings，找到 Models、API Keys 或自定义模型供应商区域', tip: '不同版本菜单名称可能略有差异，找 OpenAI Compatible 或 Custom Provider 即可' },
      { title: '添加兼容服务', desc: '选择 OpenAI Compatible；如果版本只提供 OpenAI 配置，则使用允许覆盖 Base URL 的入口' },
      { title: '填写地址和密钥', desc: 'Base URL 填写 https://api.cun.ai/v1，API Key 填写 CUN.AI 控制台创建的密钥' },
      { title: '添加模型', desc: '从 CUN.AI 控制台复制完整模型 ID', tip: '不要自行删减版本号、短横线或大小写，必须与控制台一致' },
      { title: '启用并测试', desc: '保存并启用模型，在 Chat 或 Agent 中发送一条短请求，确认模型能正常返回' },
    ],
    troubleshooting: [
      { issue: '没有 Verify 按钮', solution: '部分新版本保存后自动生效，直接选择已添加模型发送短消息，到 CUN.AI 用量日志确认请求' },
      { issue: 'model not found', solution: '从控制台重新复制完整模型 ID，确认账户分组拥有该模型权限' },
      { issue: '官方模型也开始报错', solution: '关闭 Override OpenAI Base URL 后重试' },
      { issue: 'Network error / TLS 错误', solution: '检查网络代理设置，或尝试切换网络环境后重新配置' },
    ],
  },

  /* ── Claude Code ── */
  {
    id: 'claude-code',
    name: 'Claude Code',
    icon: '🧠',
    category: '终端工具',
    desc: 'Anthropic 官方终端 AI 编码助手，通过环境变量连接 CUN.AI 网关。',
    configSummary: [
      { label: 'Base URL', value: 'https://api.cun.ai' },
      { label: 'API Key', value: 'YOUR_API_KEY（环境变量 ANTHROPIC_AUTH_TOKEN）' },
      { label: '安装命令', value: 'curl -fsSL https://claude.ai/install.sh | bash' },
    ],
    steps: [
      { title: '安装 Claude Code', desc: '在终端执行安装脚本', cmd: 'curl -fsSL https://claude.ai/install.sh | bash' },
      { title: '检查安装状态', desc: '验证安装是否成功', cmd: 'claude doctor', tip: '如已安装只需保持较新版本，不需重复安装' },
      { title: '临时配置环境变量', desc: '设置 Base URL 和认证令牌', cmd: 'export ANTHROPIC_BASE_URL="https://api.cun.ai"\nexport ANTHROPIC_AUTH_TOKEN="YOUR_API_KEY"' },
      { title: '启动 Claude Code', desc: '在项目目录中运行', cmd: 'cd /path/to/your/project\nclaude', tip: 'ANTHROPIC_AUTH_TOKEN 会作为认证令牌发送，关闭终端后临时变量会失效' },
      {
        title: '持久化配置',
        desc: '将环境变量写入 Claude Code 配置文件',
        code: {
          lang: 'json',
          content: `// ~/.claude/settings.json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.cun.ai",
    "ANTHROPIC_AUTH_TOKEN": "YOUR_API_KEY"
  }
}`,
        },
        tip: 'settings.json 包含 API Key，不要提交到仓库或分享截图',
      },
      { title: '恢复官方服务', desc: '如果需要切回 Anthropic 官方服务', cmd: 'unset ANTHROPIC_BASE_URL ANTHROPIC_AUTH_TOKEN', tip: '运行后重新打开 Claude Code 即可恢复' },
    ],
    troubleshooting: [
      { issue: '仍然要求登录 Anthropic', solution: '重新打开终端，运行 env | grep ANTHROPIC，确认两个变量已生效' },
      { issue: '401 / unauthorized', solution: '重新复制 API Key，确认没有空格、换行或重复的 Bearer 前缀' },
      { issue: 'model not found', solution: '确认 CUN.AI 控制台存在 Claude Code 当前请求的模型，检查账户分组权限' },
    ],
  },

  /* ── Codex CLI ── */
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    icon: '⚡',
    category: '终端工具',
    desc: 'OpenAI 官方终端 AI 编码工具，通过 config.toml 配置自定义供应商连接 CUN.AI。',
    configSummary: [
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: '环境变量 CUNAI_API_KEY' },
      { label: '协议', value: 'Responses API' },
    ],
    steps: [
      { title: '安装或更新 Codex', desc: '通过 npm 安装 Codex CLI', cmd: 'npm install -g @openai/codex' },
      { title: '验证安装', desc: '检查版本号确认安装成功', cmd: 'codex --version' },
      { title: '配置 API Key', desc: '设置环境变量', cmd: 'export CUNAI_API_KEY="YOUR_API_KEY"', tip: '写入 ~/.zshrc 或 ~/.bashrc 持久化，然后重新打开终端' },
      {
        title: '配置自定义供应商',
        desc: '编辑 ~/.codex/config.toml 文件',
        code: {
          lang: 'toml',
          content: `# ~/.codex/config.toml
model = "MODEL_ID_FROM_CONSOLE"
model_provider = "cunai"

[model_providers.cunai]
name = "CUN.AI"
base_url = "https://api.cun.ai/v1"
env_key = "CUNAI_API_KEY"
wire_api = "responses"`,
        },
        tip: '将 MODEL_ID_FROM_CONSOLE 替换为 CUN.AI 控制台展示的完整模型 ID',
      },
      { title: '启动 Codex', desc: '在项目目录中运行', cmd: 'cd /path/to/your/project\ncodex', tip: '启动后确认顶部模型名称与配置一致' },
    ],
    troubleshooting: [
      { issue: '出现 401', solution: '运行 echo $CUNAI_API_KEY 检查是否为空' },
      { issue: 'model not found', solution: '从 CUN.AI 控制台复制完整的模型 ID' },
      { issue: 'Responses API 不支持', solution: '在 CUN.AI 控制台更换支持 Codex 的模型或线路' },
    ],
  },

  /* ── Cherry Studio ── */
  {
    id: 'cherry-studio',
    name: 'Cherry Studio',
    icon: '🍒',
    category: '桌面客户端',
    desc: '通过 Cherry Studio 的自定义服务商功能添加 CUN.AI，在桌面端管理模型、对话和助手。',
    configSummary: [
      { label: '服务商名称', value: 'CUN.AI' },
      { label: '服务商类型', value: 'OpenAI' },
      { label: 'API 地址', value: 'https://api.cun.ai/v1' },
      { label: 'Model', value: '控制台显示的完整模型名' },
    ],
    steps: [
      { title: '打开模型服务设置', desc: '点击 Cherry Studio 左下角的设置图标，进入「模型服务」' },
      { title: '新增自定义服务商', desc: '点击服务商列表底部的「添加」，名称填 CUN.AI，类型选 OpenAI，保存' },
      { title: '填写 API Key', desc: '选择刚创建的 CUN.AI 服务商，粘贴控制台创建的 API Key', tip: '建议为 Cherry Studio 单独创建密钥' },
      { title: '填写 API 地址', desc: 'API 地址填写 https://api.cun.ai/v1', tip: '不要重复追加 /v1、/chat/completions 或其他接口路径' },
      { title: '检查连接', desc: '点击 API Key 右侧的「检查」按钮验证连接', tip: '验证失败时先检查密钥、地址、余额和网络' },
      { title: '添加模型', desc: '在模型管理中点击「添加」，从 CUN.AI 控制台复制完整模型 ID' },
      { title: '启用并开始对话', desc: '打开服务商右侧的启用开关，在聊天界面选择 CUN.AI 模型开始对话' },
    ],
    troubleshooting: [
      { issue: '检查连接失败', solution: '检查 API Key 是否正确、地址是否为 https://api.cun.ai/v1、账户是否有余额' },
      { issue: '模型列表为空', solution: '手动添加模型，从控制台复制完整模型 ID' },
    ],
  },

  /* ── Chatbox ── */
  {
    id: 'chatbox',
    name: 'Chatbox',
    icon: '💬',
    category: '桌面客户端',
    desc: '轻量级 AI 对话客户端，支持自定义 OpenAI Compatible 服务商。',
    configSummary: [
      { label: '模型提供方', value: 'OpenAI API / Custom Provider' },
      { label: 'API Host', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: '控制台创建的 API Key' },
      { label: 'Model', value: '控制台显示的完整模型 ID' },
    ],
    steps: [
      { title: '打开设置', desc: '进入 Settings，找到 Model Provider、AI Provider 或 API 设置' },
      { title: '选择 OpenAI API', desc: '选择 OpenAI API 或自定义 OpenAI Compatible 服务', tip: '不要选择网页账号登录模式' },
      { title: '填写地址和密钥', desc: 'API Host / Base URL 填写 https://api.cun.ai/v1，API Key 填写 CUN.AI 控制台创建的密钥' },
      { title: '填写模型', desc: '从控制台复制完整模型 ID', tip: '自动模型列表为空时使用手动添加' },
      { title: '保存并验证', desc: '新建对话并选择 CUN.AI 模型，发送一条短消息验证' },
    ],
    troubleshooting: [
      { issue: '出现 404', solution: '检查是否把 /chat/completions 重复追加到了 Base URL 后面' },
      { issue: '无需退出 Chatbox 账号', solution: '只需把当前对话的模型提供方切换为 CUN.AI 即可' },
    ],
  },

  /* ── CC Switch ── */
  {
    id: 'cc-switch',
    name: 'CC Switch',
    icon: '🔄',
    category: '配置管理工具',
    desc: '快速导入配置管理工具，支持 Claude、Codex 和 Gemini 的一键导入。',
    configSummary: [
      { label: '支持的应用', value: 'Claude、Codex、Gemini' },
      { label: '导入方式', value: 'CUN.AI 控制台一键导入' },
      { label: '前提条件', value: '安装并打开 CC Switch' },
    ],
    steps: [
      { title: '创建密钥并选择 CC Switch', desc: '进入 CUN.AI 控制台 API Keys 页面创建密钥，点击密钥右侧「…」，选择 CC Switch' },
      { title: '选择应用和模型', desc: '在弹窗中选择 Claude、Codex 或 Gemini，填写配置名称，从下拉列表选择主模型' },
      { title: '打开 CC Switch', desc: '点击「打开 CC Switch」完成导入', tip: '确认 CC Switch 已安装并打开' },
      { title: '确认配置并导入', desc: '配置带到 CC Switch 后不需修改，确认应用类型、供应商名称、API 端点、密钥和模型无误，点击「导入」' },
      { title: '确认配置已启用', desc: '在 CC Switch 供应商列表中确认新配置显示为「使用中」', tip: '然后重新打开 Codex 或 Claude' },
      { title: '重启并使用', desc: '重启终端或应用桌面端，确认顶部显示刚才选择的模型' },
    ],
    troubleshooting: [
      { issue: '导入后模型不生效', solution: '重启终端或应用，确认 CC Switch 中配置状态为「使用中」' },
      { issue: 'CC Switch 未安装', solution: '先安装 CC Switch 再执行导入流程' },
    ],
  },

  /* ── Hermes / OpenClaw 本地代理（403 修复）── */
  {
    id: 'local-proxy-403',
    name: 'Hermes / OpenClaw 本地代理',
    icon: '🛡️',
    category: '本地代理',
    desc: '当 Hermes 或 OpenClaw 直连 CUN.AI 返回 403 时，通过本地代理转发请求。不会绕过账户权限，只是稳定转发。',
    configSummary: [
      { label: 'Hermes Base URL', value: 'http://127.0.0.1:8787/v1' },
      { label: 'Hermes API Key', value: 'local-proxy' },
      { label: '代理上游地址', value: 'https://api.cun.ai/v1' },
      { label: '真实 API Key', value: '保存在本机代理配置文件中' },
    ],
    steps: [
      { title: '创建代理目录', desc: '在终端创建工作目录', cmd: 'mkdir -p ~/cunai-proxy\ncd ~/cunai-proxy' },
      {
        title: '创建环境配置文件',
        desc: '创建 cunai-proxy.env 文件保存真实 API Key',
        code: {
          lang: 'bash',
          content: `# ~/cunai-proxy/cunai-proxy.env
UPSTREAM_BASE_URL=https://api.cun.ai/v1
UPSTREAM_API_KEY=YOUR_REAL_API_KEY
PORT=8787
LISTEN_HOST=127.0.0.1`,
        },
        tip: '这个文件包含真实密钥，不要提交到仓库',
      },
      {
        title: '创建代理脚本',
        desc: '创建 cunai-proxy.mjs 代理脚本',
        code: {
          lang: 'javascript',
          content: `// ~/cunai-proxy/cunai-proxy.mjs
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

// 读取配置
const envFile = fs.readFileSync(
  path.join(import.meta.dirname, "cunai-proxy.env"), "utf8"
);
const config = Object.fromEntries(
  envFile.split("\\n")
    .filter(l => l && !l.startsWith("#"))
    .map(l => l.split("="))
);

const PORT = config.PORT || 8787;
const UPSTREAM = config.UPSTREAM_BASE_URL;
const API_KEY = config.UPSTREAM_API_KEY;

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") {
    res.writeHead(204); res.end(); return;
  }

  // 收集 body
  let body = "";
  for await (const chunk of req) body += chunk;

  // 转发到上游
  const upstream = await fetch(UPSTREAM + req.url, {
    method: req.method,
    headers: {
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json",
      "User-Agent": "CUN.AI-Proxy/1.0",
    },
    body: req.method !== "GET" ? body : undefined,
  });

  const data = await upstream.text();
  res.writeHead(upstream.status, { "Content-Type": "application/json" });
  res.end(data);
});

server.listen(PORT, () => {
  console.log("CUN.AI proxy on http://127.0.0.1:" + PORT);
});`,
        },
      },
      { title: '启动代理服务', desc: '在终端运行代理脚本', cmd: 'cd ~/cunai-proxy\nnode cunai-proxy.mjs', tip: '保持终端运行，可以配合 tmux/screen 后台运行' },
      { title: '配置 Hermes / OpenClaw', desc: '在 Hermes 配置中设置 Base URL 为 http://127.0.0.1:8787/v1，API Key 设为 local-proxy', tip: '真实密钥保存在代理的 env 文件中，Hermes 不直接接触真实密钥' },
      { title: '验证代理', desc: '通过代理发送一条测试消息', cmd: 'curl http://127.0.0.1:8787/v1/chat/completions -H "Authorization: Bearer local-proxy" -H "Content-Type: application/json" -d \'{"model":"gpt-4o-mini","messages":[{"role":"user","content":"Hi"}]}\'' },
    ],
    troubleshooting: [
      { issue: '代理启动报错', solution: '检查 Node.js 版本 >= 18，确认 cunai-proxy.env 文件路径正确' },
      { issue: '仍然 403', solution: '检查 env 文件中的 UPSTREAM_API_KEY 是否正确，代理日志会显示上游返回状态码' },
      { issue: 'Hermes 连不上代理', solution: '确认代理在运行，curl http://127.0.0.1:8787/ 能返回响应' },
    ],
  },

  /* ── Open WebUI ── */
  {
    id: 'open-webui',
    name: 'Open WebUI',
    icon: '🌐',
    category: '自托管平台',
    desc: '在 Open WebUI 管理后台添加 CUN.AI 作为 OpenAI Compatible 连接。',
    configSummary: [
      { label: '权限要求', value: '管理员权限' },
      { label: '连接名称', value: 'CUN.AI' },
      { label: 'URL', value: 'https://api.cun.ai/v1' },
      { label: 'Key', value: '控制台创建的 API Key' },
    ],
    steps: [
      { title: '进入管理后台', desc: '以管理员登录，打开 Admin Panel / Settings，进入 Connections 或 OpenAI API 配置', tip: '普通用户只能使用管理员已启用的模型' },
      { title: '添加连接', desc: '名称填写 CUN.AI，URL 填写 https://api.cun.ai/v1，Key 填写控制台创建的 API Key' },
      { title: '保存并刷新模型', desc: '保存连接后刷新模型列表', tip: '列表为空时检查 Key 权限并尝试手动填写模型 ID' },
      { title: '创建测试对话', desc: '选择一个 CUN.AI 模型发送短消息，在 CUN.AI 用量日志确认请求' },
      {
        title: '环境变量方式（Docker）',
        desc: '也可通过 Docker 环境变量配置',
        code: {
          lang: 'bash',
          content: `# docker-compose.yml 或 docker run
OPENAI_API_BASE_URL=https://api.cun.ai/v1
OPENAI_API_KEY=YOUR_API_KEY`,
        },
        tip: '修改 Docker 环境变量后需要重新创建容器才能读取新值',
      },
    ],
    troubleshooting: [
      { issue: '模型列表为空', solution: '检查 Key 权限，尝试手动填写模型 ID' },
      { issue: '修改环境变量后不生效', solution: '需要重新创建 Open WebUI 容器，只刷新浏览器不会生效' },
    ],
  },

  /* ── Trae ── */
  {
    id: 'trae',
    name: 'Trae',
    icon: '🎯',
    category: '代码编辑器',
    desc: '在 Trae 中配置 OpenAI Compatible 自定义模型供应商。',
    configSummary: [
      { label: 'API Format', value: 'OpenAI Compatible' },
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: 'YOUR_API_KEY' },
      { label: 'Model Name', value: '控制台可用模型名' },
    ],
    steps: [
      { title: '进入 AI 设置', desc: '打开 Trae 设置，进入 AI、Models、Model Provider 或自定义模型配置区域' },
      { title: '添加自定义模型', desc: '服务商选择 OpenAI Compatible 或 Custom OpenAI Endpoint' },
      { title: '配置 Base URL', desc: '填写 https://api.cun.ai/v1', tip: '如果 Trae 要求填写完整接口地址，再按页面提示补充对应路径' },
      { title: '配置密钥', desc: 'API Key 填写 CUN.AI 控制台创建的密钥' },
      { title: '填写模型名', desc: '模型名必须与 CUN.AI 控制台可用模型列表一致', tip: '大小写和符号都要一致' },
      { title: '保存并测试', desc: '保存后在聊天或代码助手面板中发起一次简单请求', tip: '建议给 CUN.AI 模型加上清晰名称如「CUN.AI GPT」，避免选错供应商' },
    ],
    troubleshooting: [
      { issue: '不需要退出 Trae 账号', solution: 'Trae 账号和自定义模型供应商是独立的，配置后直接使用' },
      { issue: '模型名不匹配', solution: '从控制台复制完整的模型 ID，注意大小写' },
    ],
  },

  /* ── CodeBuddy ── */
  {
    id: 'codebuddy',
    name: 'CodeBuddy',
    icon: '🤝',
    category: '代码编辑器',
    desc: '在 CodeBuddy 中配置 OpenAI Compatible 自定义服务商。',
    configSummary: [
      { label: 'Provider Type', value: 'OpenAI Compatible' },
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: 'YOUR_API_KEY' },
      { label: 'Model', value: '选择控制台可用模型' },
    ],
    steps: [
      { title: '打开模型设置', desc: '进入 CodeBuddy 设置页，查找 Model、Provider、API Key、Custom Model 或 OpenAI Compatible 相关配置' },
      { title: '新增自定义服务商', desc: '服务商类型选择 OpenAI Compatible', tip: '如果没有该选项，可选择 OpenAI 并修改 Base URL' },
      { title: '填写接口地址', desc: 'Base URL 填写 https://api.cun.ai/v1', tip: '不要额外添加 /chat/completions' },
      { title: '填写 API Key', desc: '使用 CUN.AI 控制台创建的 API Key', tip: '建议为 CodeBuddy 单独创建一个 Key' },
      { title: '选择模型测试', desc: '选择控制台中可用的模型名称，发送一条短消息验证' },
    ],
    troubleshooting: [
      { issue: '找不到 OpenAI Compatible 选项', solution: '选择 OpenAI 并覆盖 Base URL 为 https://api.cun.ai/v1' },
      { issue: '版本差异', solution: '不同版本菜单名称不同，只要能配置自定义 Base URL 和 API Key 就按 OpenAI 兼容方式设置' },
    ],
  },

  /* ── SDK 开发接入 ── */
  {
    id: 'sdk',
    name: 'SDK 开发接入',
    icon: '📦',
    category: '开发框架',
    desc: '通过 OpenAI SDK、LangChain 等开发框架直接接入 CUN.AI API。',
    configSummary: [
      { label: 'Base URL', value: 'https://api.cun.ai/v1' },
      { label: 'API Key', value: '环境变量 CUNAI_API_KEY' },
      { label: '协议', value: 'OpenAI Compatible' },
    ],
    steps: [
      {
        title: '安装与环境变量',
        desc: '安装 LangChain 和 OpenAI SDK',
        cmd: 'npm install @langchain/openai\nexport CUNAI_API_KEY="YOUR_API_KEY"',
      },
      {
        title: 'LangChain JS 示例',
        desc: '在 LangChain 框架中使用 CUN.AI',
        code: {
          lang: 'javascript',
          content: `import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  apiKey: process.env.CUNAI_API_KEY,
  configuration: { baseURL: "https://api.cun.ai/v1" },
  model: "gpt-4o-mini",
});`,
        },
      },
      {
        title: 'OpenAI SDK (Node.js)',
        desc: '直接使用 OpenAI Node.js SDK',
        code: {
          lang: 'javascript',
          content: `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.CUNAI_API_KEY,
  baseURL: "https://api.cun.ai/v1",
  defaultHeaders: { "User-Agent": "CUN.AI-Node/1.0" },
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "Hello" }],
});`,
        },
      },
      {
        title: 'OpenAI SDK (Python)',
        desc: '直接使用 OpenAI Python SDK',
        code: {
          lang: 'python',
          content: `from openai import OpenAI

client = OpenAI(
    api_key=os.environ["CUNAI_API_KEY"],
    base_url="https://api.cun.ai/v1",
    default_headers={"User-Agent": "CUN.AI-Python/1.0"},
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Hello"}],
)`,
        },
      },
      { title: '上线前检查', desc: '将示例模型名替换为控制台实际可用的完整模型 ID', tip: '为开发、测试、生产创建不同 API Key，设置服务端超时和有限重试。API Key 只能放在服务端。' },
    ],
    troubleshooting: [
      { issue: 'SDK 自动请求官方 OpenAI', solution: '确认使用 baseURL（JS）或 base_url（Python），值为 https://api.cun.ai/v1' },
      { issue: '浏览器出现 CORS', solution: '不要让前端直接携带 Key 请求，通过自己的后端调用 CUN.AI' },
      { issue: '工具调用参数不兼容', solution: '先用普通文本对话验证，再确认所选模型和线路支持 tools / function calling' },
    ],
  },
]
