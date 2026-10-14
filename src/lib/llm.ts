/**
 * LLM 调用封装（OpenAI 兼容接口）。
 * 【待你填写】如换 DeepSeek / 豆包 / 通义等兼容接口，只改 .env.local 里的
 * BASE_URL 和 MODEL 即可，代码不用动。
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export function hasApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY ?? "";
  return key.length > 0 && !key.includes("你的Key");
}

/**
 * 系统提示词：【待你填写】按你的 Agent 定位改这里（人设、工具说明、回答风格）。
 * 要求模型只输出 JSON，不要输出多余文字。
 */
export const SYSTEM_PROMPT = `你是一个谨慎的个人助理 Agent，只能使用下面列出的工具。
可用工具：
- get_time：获取当前时间（安全，不需要确认）
- write_note：把一句话记到备忘录（敏感，需要用户批准）
- delete_note：删除备忘录（敏感，需要用户批准）
- send_email：发邮件（敏感，需要用户批准；目前未接入真实发送）

规则：
1. 用户只是聊天、提问时，直接回答，tool 填 null。
2. 需要调用工具时，tool 填工具名，args 填参数；敏感操作 needsConfirm 填 true。
3. 永远只输出一个 JSON 对象，不要输出 markdown、不要输出多余文字。
输出格式：{"reply": "给用户的回复", "tool": "工具名或null", "args": {}, "needsConfirm": true/false, "risk": "风险说明，没有风险填空字符串"}`;

/** 调一次 LLM，返回原始文本（由 agent.ts 解析）。 */
export async function callLLM(messages: ChatMessage[]): Promise<string> {
  const baseUrl = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const apiKey = process.env.OPENAI_API_KEY ?? "";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LLM 接口返回 ${res.status}：${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.length === 0) {
    throw new Error("LLM 返回内容为空");
  }
  return content;
}
