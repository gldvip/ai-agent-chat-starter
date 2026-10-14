/**
 * POST /api/chat：对话接口。
 * 两种请求：
 * 1. { message: "用户说的话" } → Agent 决策，返回 { reply, pendingAction, demoMode }
 * 2. { confirm: { tool, args } } → 用户批准执行，返回 { reply }
 */
import { NextResponse } from "next/server";
import { decide, executeConfirmed } from "@/lib/agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 批准执行分支
    if (body && typeof body === "object" && body.confirm) {
      const { tool, args } = body.confirm;
      if (typeof tool !== "string") {
        return NextResponse.json({ reply: "确认请求缺少工具名。" }, { status: 400 });
      }
      const result = await executeConfirmed(tool, (args ?? {}) as Record<string, unknown>);
      return NextResponse.json({
        reply: result.ok ? `已执行：${result.message}` : `执行失败：${result.message}`,
        pendingAction: null,
        demoMode: false,
      });
    }

    // 新消息分支
    const message = body?.message;
    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ reply: "消息不能为空。" }, { status: 400 });
    }
    const decision = await decide(message.trim());
    return NextResponse.json(decision);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { reply: "服务端出错了，请看终端日志。", pendingAction: null, demoMode: false },
      { status: 500 },
    );
  }
}
