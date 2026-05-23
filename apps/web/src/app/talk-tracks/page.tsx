import { WorkflowPlaceholderPage } from "@/components/workspace-pages"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function TalkTracksPage() {
  return (
    <WorkspaceShell
      activePath="/talk-tracks"
      title="话术资产"
      subtitle="讲解结构、异议回应和短视频选题"
      badge="占位"
    >
      <WorkflowPlaceholderPage routeId="talk-tracks" />
    </WorkspaceShell>
  )
}
