/**
 * Agent 主逻辑：决定“直接回答”还是“提议执行工具”。
 * 两条铁律（不要绕过）：
 * 1. 敏感工具（needsConfirm=true）永远先返回提议，等用户在前端点“批准”才执行。
 * 2. 执行时服务端再次校验工具名和参数，前端传什么都不直接信。
 */
import { callLLM, hasApiKey, SYSTEM_PROMPT, type ChatMessage } from "./llm";
import { getTool } from "./tools";

export type PendingAction = {
  tool: string;
  args: Record<string, unknown>;
  risk: string;
};

export type AgentReply = {
  /** 给用户看的回复 */
  reply: string;
  /** 需要确认时带上提议；否则为 null */
  pendingAction: PendingAction | null;
  /** 是否演示模式（未配置 Key 时走本地规则） */
  demoMode: boolean;
};

type LlmDecision = {
  reply?: string;
  tool?: string | null;
  args?: Record<string, unknown>;
  needsConfirm?: boolean;
  risk?: string;
};

/** 演示模式：未配置 Key 时走本地规则，不调接口。 */
function demoDecide(userText: string): AgentReply {
  const text = userText;
  if (/几点|时间|日期/.test(text)) {
    return {
      reply: `现在是 ${new Date().toLocaleString("zh-CN")}（演示模式：未配置 Key，走本地规则）`,
      pendingAction: null,
      demoMode: true,
    };
  }
  if (/删|清空/.test(text)) {
    return {
      reply: "我准备删除整个备忘录，请确认。",
      pendingAction: {
        tool: "delete_note",
        args: {},
        risk: "会删除服务器 data/notes.txt 整个备忘录，且不可恢复。",
      },
      demoMode: true,
    };
  }
  if (/发邮件|发封邮件|写封邮件|写邮件/.test(text)) {
    return {
      reply: "发邮件功能还是占位实现（未接入真实发送），先不执行。你可以在 tools.ts 里按注释接上邮件服务。",
      pendingAction: null,
      demoMode: true,
    };
  }
  const noteMatch = text.match(/(?:记|写)(?:一句|一下)?[：:，, ]*\s*(.+)/);
  if (/记|写/.test(text) && noteMatch?.[1]) {
    return {
      reply: "我准备记下这句话，请确认。",
      pendingAction: {
        tool: "write_note",
        args: { text: noteMatch[1] },
        risk: "会在服务器 data/notes.txt 追加一句话。",
      },
      demoMode: true,
    };
  }
  return {
    reply: "演示模式：我听到了。你可以试试发「现在几点」「帮我记一句：明天开会」「删掉备忘录」，看看确认流程。配置 Key 后走真实 LLM。",
    pendingAction: null,
    demoMode: true,
  };
}

/** 解析 LLM 输出的 JSON；解析失败则当成普通回复。 */
function parseDecision(raw: string): LlmDecision {
  try {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return { reply: raw };
    return JSON.parse(raw.slice(start, end + 1)) as LlmDecision;
  } catch {
    return { reply: raw };
  }
}

/** 第一步：用户发消息 → 返回回复 +（可选）待确认提议。 */
export async function decide(userText: string): Promise<AgentReply> {
  if (!hasApiKey()) {
    return demoDecide(userText);
  }

  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userText },
  ];
  const raw = await callLLM(messages);
  const d = parseDecision(raw);

  // 工具名不在注册表里 → 当成普通回复，不执行任何东西。
  const tool = getTool(typeof d.tool === "string" ? d.tool : "");
  if (!tool) {
    return { reply: d.reply ?? raw, pendingAction: null, demoMode: false };
  }

  // 工具本身标记敏感 → 必须确认；LLM 说需要确认也必须确认。
  const needsConfirm = tool.needsConfirm || d.needsConfirm === true;
  if (!needsConfirm) {
    // 安全工具：直接执行，把结果拼进回复。
    const result = await tool.run(d.args ?? {});
    return {
      reply: `${d.reply ?? ""}\n${result.message}`.trim(),
      pendingAction: null,
      demoMode: false,
    };
  }

  return {
    reply: d.reply ?? `我准备调用 ${tool.name}，请确认。`,
    pendingAction: {
      tool: tool.name,
      args: d.args ?? {},
      risk: d.risk ?? tool.risk,
    },
    demoMode: false,
  };
}

/** 第二步：用户点“批准” → 服务端再次校验后执行。 */
export async function executeConfirmed(
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ ok: boolean; message: string }> {
  const tool = getTool(toolName);
  if (!tool) {
    return { ok: false, message: `未知工具：${toolName}，拒绝执行。` };
  }
  if (!tool.needsConfirm) {
    return { ok: false, message: `工具 ${toolName} 不需要确认流程，拒绝经确认接口执行。` };
  }
  // 这里可按需再加参数校验（例如 write_note 的 text 长度已在工具内校验）。
  return tool.run(args);
}
