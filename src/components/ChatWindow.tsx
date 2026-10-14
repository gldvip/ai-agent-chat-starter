"use client";

/**
 * 对话界面：消息列表 + 输入框 + 确认卡挂载。
 * 流程：发消息 → 服务端返回回复和（可选）待确认提议 →
 * 有提议则弹出确认卡 → 点批准才真正执行。
 */
import { useRef, useState } from "react";
import ConfirmCard, { type PendingAction } from "./ConfirmCard";

type Message = {
  id: number;
  role: "user" | "agent";
  text: string;
};

let nextId = 1;

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "agent",
      text: "你好，我是你的 Agent。试试发「现在几点」「帮我记一句：明天开会」「删掉备忘录」，看看确认流程。",
    },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [demoMode, setDemoMode] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const push = (role: Message["role"], text: string) => {
    setMessages((prev) => [...prev, { id: nextId++, role, text }]);
  };

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    push("user", content);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      push("agent", data.reply ?? "（无回复）");
      setDemoMode(data.demoMode ?? false);
      if (data.pendingAction) setPending(data.pendingAction);
    } catch {
      push("agent", "请求失败，请看终端日志。");
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  async function approve() {
    if (!pending) return;
    setPending(null);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: pending }),
      });
      const data = await res.json();
      push("agent", data.reply ?? "（无回复）");
    } catch {
      push("agent", "请求失败，请看终端日志。");
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    setPending(null);
    push("agent", "已取消，不执行。");
  }

  return (
    <div className="chat">
      <div className="chat-header">
        <span>Agent 对话</span>
        {demoMode === true ? <span className="badge">演示模式（未配置 Key）</span> : null}
        {demoMode === false ? <span className="badge badge-live">真实 LLM 模式</span> : null}
      </div>
      <div className="chat-messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role === "user" ? "msg-user" : "msg-agent"}`}>
            {m.text}
          </div>
        ))}
        {pending ? (
          <ConfirmCard action={pending} onApprove={approve} onReject={reject} />
        ) : null}
      </div>
      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入一句话…"
          disabled={busy}
        />
        <button type="submit" disabled={busy || input.trim().length === 0}>
          发送
        </button>
      </form>
    </div>
  );
}
