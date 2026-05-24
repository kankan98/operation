import { AiReviewWorkbench } from "@/components/ai-review-workbench"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function AiReviewPage() {
  return (
    <WorkspaceShell
      activePath="/ai-review"
      title="智能复盘"
      subtitle="生成建议，人工确认"
      badge="待生成"
    >
      <AiReviewWorkbench />
    </WorkspaceShell>
  )
}
