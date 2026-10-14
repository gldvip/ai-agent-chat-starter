import ChatWindow from "@/components/ChatWindow";

/** 首页：只渲染对话界面。 */
export default function Home() {
  return (
    <main className="page">
      <h1>Agent 对话骨架</h1>
      <p className="subtitle">
        带人工确认步骤：敏感操作必须点“批准”才执行。待填写的 4 处见 README。
      </p>
      <ChatWindow />
    </main>
  );
}
