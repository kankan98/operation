import { WorkspaceOverview } from "@/components/workspace-pages"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function Home() {
  return (
    <WorkspaceShell
      activePath="/"
      title="运营工作台总览"
      subtitle="先记录场次，再整理复盘"
      badge="今日概览"
    >
      <WorkspaceOverview />
    </WorkspaceShell>
  )
}
