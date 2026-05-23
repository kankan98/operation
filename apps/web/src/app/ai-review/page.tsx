import { AiReviewWorkbench } from "@/components/ai-review-workbench"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function AiReviewPage() {
  return (
    <WorkspaceShell
      activePath="/ai-review"
      title="AI 复盘"
      subtitle="复盘、诊断、建议和任务"
      badge="静态工作台"
    >
      <AiReviewWorkbench />
    </WorkspaceShell>
  )
}
