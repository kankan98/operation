import { WorkspaceOverview } from "@/components/workspace-pages"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function Home() {
  return (
    <WorkspaceShell
      activePath="/"
      title="运营工作台总览"
      subtitle="Wave 0/线路补充：稳定入口与空状态"
      badge="无业务数据"
    >
      <WorkspaceOverview />
    </WorkspaceShell>
  )
}
