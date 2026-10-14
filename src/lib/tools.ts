/**
 * 示例工具集：Agent 能做的事都写在这里。
 * 【待你填写】按你的需求加工具：每个工具 = 一个 async 函数 + 一条元数据
 * （名字、是否需要人工确认、风险说明）。
 */
import { promises as fs } from "fs";
import path from "path";

export type ToolResult = { ok: boolean; message: string };

export type ToolDef = {
  /** 工具名（LLM 输出的 tool 必须和这里一致） */
  name: string;
  /** 是否敏感：true = 必须用户在前端点“批准”才执行 */
  needsConfirm: boolean;
  /** 显示在确认卡上的风险说明 */
  risk: string;
  run: (args: Record<string, unknown>) => Promise<ToolResult>;
};

/** 备忘录文件：演示模式下写文件只写到 data/ 目录。 */
const NOTE_FILE = path.join(process.cwd(), "data", "notes.txt");

const tools: ToolDef[] = [
  {
    name: "get_time",
    needsConfirm: false,
    risk: "",
    run: async () => ({
      ok: true,
      message: `现在是 ${new Date().toLocaleString("zh-CN")}`,
    }),
  },
  {
    name: "write_note",
    needsConfirm: true,
    risk: "会在服务器 data/notes.txt 追加一句话。",
    run: async (args) => {
      const text = args.text;
      if (typeof text !== "string" || text.trim().length === 0) {
        return { ok: false, message: "参数 text 必须是非空字符串。" };
      }
      if (text.length > 2000) {
        return { ok: false, message: "内容太长（最多 2000 字）。" };
      }
      await fs.mkdir(path.dirname(NOTE_FILE), { recursive: true });
      await fs.appendFile(NOTE_FILE, `${new Date().toISOString()} ${text}\n`, "utf-8");
      return { ok: true, message: `已记下：${text}` };
    },
  },
  {
    name: "delete_note",
    needsConfirm: true,
    risk: "会删除服务器 data/notes.txt 整个备忘录，且不可恢复。",
    run: async () => {
      await fs.rm(NOTE_FILE, { force: true });
      return { ok: true, message: "备忘录已删除。" };
    },
  },
  {
    name: "send_email",
    needsConfirm: true,
    risk: "会把邮件发给真实收件人，发出去收不回。",
    run: async () => {
      // 【待你填写】这里接你的邮件服务（如 nodemailer + SMTP）。
      // 现在是占位实现：不发任何邮件，只返回提示。
      return {
        ok: false,
        message: "未接入：send_email 还是占位实现，按 tools.ts 里的注释接你的邮件服务后再用。",
      };
    },
  },
];

export function getTool(name: string): ToolDef | undefined {
  return tools.find((t) => t.name === name);
}

/** 供 LLM 提示词使用的工具名清单。 */
export function listToolNames(): string[] {
  return tools.map((t) => t.name);
}
