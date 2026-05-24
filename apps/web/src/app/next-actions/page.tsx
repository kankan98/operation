import { WorkflowPlaceholderPage } from "@/components/workspace-pages"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function NextActionsPage() {
  return (
    <WorkspaceShell
      activePath="/next-actions"
      title="下场任务"
      subtitle="复用、检查和跟进动作"
      badge="暂无任务"
    >
      <WorkflowPlaceholderPage routeId="next-actions" />
    </WorkspaceShell>
  )
}
