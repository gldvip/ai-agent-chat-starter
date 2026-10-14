/**
 * 人工确认卡片：敏感操作执行前必须经用户批准。
 * 显示工具名、参数、风险说明；只有点“批准执行”才真正执行。
 */
export type PendingAction = {
  tool: string;
  args: Record<string, unknown>;
  risk: string;
};

export default function ConfirmCard({
  action,
  onApprove,
  onReject,
}: {
  action: PendingAction;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="confirm-card">
      <div className="confirm-title">⚠️ 需要你的批准</div>
      <div className="confirm-row">
        <span className="confirm-label">工具</span>
        <code>{action.tool}</code>
      </div>
      <div className="confirm-row">
        <span className="confirm-label">参数</span>
        <pre>{JSON.stringify(action.args, null, 2)}</pre>
      </div>
      {action.risk ? (
        <div className="confirm-row">
          <span className="confirm-label">风险</span>
          <span>{action.risk}</span>
        </div>
      ) : null}
      <div className="confirm-actions">
        <button className="btn-approve" onClick={onApprove}>
          批准执行
        </button>
        <button className="btn-reject" onClick={onReject}>
          取消
        </button>
      </div>
    </div>
  );
}
