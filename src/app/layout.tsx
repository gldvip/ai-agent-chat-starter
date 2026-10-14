import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agent 对话骨架",
  description: "带人工确认步骤的 Agent 对话界面代码骨架",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
