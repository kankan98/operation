import { NextActionsWorkbench } from "@/components/next-actions-workbench"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function NextActionsPage() {
  return (
    <WorkspaceShell
      activePath="/next-actions"
      title="下场任务"
      subtitle="复用、检查和跟进动作"
      badge="V0 任务"
    >
      <NextActionsWorkbench />
    </WorkspaceShell>
  )
}
