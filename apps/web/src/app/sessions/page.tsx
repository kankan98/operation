import { SessionCaptureWorkbench } from "@/components/session-capture-workbench"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function SessionsPage() {
  return (
    <WorkspaceShell
      activePath="/sessions"
      title="直播场次"
      subtitle="记录主题、主播、商品顺序和问题"
      badge="V0 可保存"
    >
      <SessionCaptureWorkbench />
    </WorkspaceShell>
  )
}
