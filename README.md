# AI Agent 对话界面 · 代码骨架

一个带**人工确认步骤**的 Agent 对话界面骨架（Next.js + React + TypeScript）。
你发一句话，Agent 决定“直接回答”还是“提议执行工具”；敏感操作（写文件、删文件、发邮件…）必须先弹出确认卡，你点“批准”才真正执行。

## 快速开始

```bash
npm install
npm run dev
# 打开 http://localhost:3000
```

不填 Key 也能跑：自动进入**演示模式**（本地规则，不调接口），先看界面和确认流程。
填 Key 后走真实 LLM（见 DEPLOY.md）。

## 待你填写（共 4 处，代码里都标了【待你填写】）

1. `.env.local`：填 `OPENAI_API_KEY`（复制 `.env.example` 改名即可）
2. `src/lib/llm.ts`：改系统提示词（Agent 人设、回答风格）
3. `src/lib/tools.ts`：加你自己的工具（每个工具 = 一个函数 + 是否需要确认）
4. `src/lib/tools.ts`：`send_email` 目前是占位，按注释接你的邮件服务

## 目录结构

- `src/app/page.tsx`：页面入口
- `src/components/ChatWindow.tsx`：对话界面（消息列表、输入框、确认卡挂载）
- `src/components/ConfirmCard.tsx`：人工确认卡片
- `src/app/api/chat/route.ts`：对话接口（新消息 / 批准执行）
- `src/lib/agent.ts`：Agent 主逻辑（决策 + 执行校验）
- `src/lib/llm.ts`：LLM 调用封装（OpenAI 兼容接口）
- `src/lib/tools.ts`：示例工具集

## 人工确认机制（核心）

1. 用户发消息 → Agent 判断是否需要调用工具。
2. 敏感工具 → 后端**不执行**，只返回提议（工具名 + 参数 + 风险说明）。
3. 前端弹出确认卡，用户点“批准” → 前端把提议发回后端。
4. 后端**再次校验**工具名和参数，通过后才执行，返回结果。

> 安全要点：确认逻辑在服务端也校验了一遍，只改前端绕不过去。
> 演示模式下写文件只写到 `data/` 目录，删文件只删 `data/notes.txt`。

## 部署

见 [DEPLOY.md](./DEPLOY.md)，照着做就能上线（Vercel）。
