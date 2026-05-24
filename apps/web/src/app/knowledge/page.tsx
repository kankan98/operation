import { KnowledgeLearningHub } from "@/components/knowledge-learning-hub"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function KnowledgePage() {
  return (
    <WorkspaceShell
      activePath="/knowledge"
      title="资料来源"
      subtitle="审核来源，放心使用"
      badge="待审核"
    >
      <KnowledgeLearningHub />
    </WorkspaceShell>
  )
}
