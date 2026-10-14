# 上线部署清单

照着做，一步步来。每一步都是可执行的动作。

## 第 1 步：申请 LLM 接口密钥（约 10 分钟）

- 打开 https://platform.openai.com/api-keys ，登录并创建一枚 Key。
  - 如用 DeepSeek / 豆包 / 通义等 OpenAI 兼容接口，去对应平台申请即可，代码不用改，只换环境变量里的地址和模型名。
- 注意：Key 只给自己用，不要截图发出去，不要写进代码。

## 第 2 步：配置环境变量

```bash
cp .env.example .env.local
```

用编辑器打开 `.env.local`，填：
- `OPENAI_API_KEY`：第 1 步申请的 Key
- `OPENAI_BASE_URL`：用 OpenAI 默认即可；用兼容接口时换成该平台的地址
- `OPENAI_MODEL`：如 `gpt-4o-mini`（兼容接口换成对应模型名）

## 第 3 步：本地安装与验证

```bash
npm install
npm run dev
```

打开 http://localhost:3000，验证三件事：
1. 不填 Key 也能打开，左上角显示“演示模式”。
2. 发“现在几点” → 直接回答时间（安全工具，无需确认）。
3. 发“帮我记一句：明天开会” → 弹出确认卡 → 点“批准”才写入，点“取消”不写。
4. 填 Key 后刷新，发同样的话，走真实 LLM 再测一遍。

## 第 4 步：部署到 Vercel

1. 把仓库推到 GitHub（本仓库已推）。
2. 打开 https://vercel.com/new ，导入这个仓库。
3. 在 Vercel 项目设置的 Environment Variables 里，填上和 `.env.local` 相同的三个变量（Key、BASE_URL、MODEL）。
4. 点 Deploy，等构建成功。

## 第 5 步：线上验证

1. 打开 Vercel 给你的域名，重复第 3 步的 3 个测试。
2. 打开 Vercel 项目 → Logs，确认没有报错。

## 第 6 步：上线检查（发布前必做）

- [ ] `.env.local` 没有提交到 Git（已在 `.gitignore` 里，再确认一次 `git status`）
- [ ] Key 只存在于 Vercel 环境变量和你的本地 `.env.local`，没出现在代码、截图、聊天记录里
- [ ] 确认卡流程在线上也能正常弹出（敏感操作必须经你批准才执行）
