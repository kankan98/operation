import { KnowledgeLearningHub } from "@/components/knowledge-learning-hub"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function KnowledgePage() {
  return (
    <WorkspaceShell
      activePath="/knowledge"
      title="种子知识库"
      subtitle="公开来源、审核、刷新和版本"
      badge="学习闭环"
    >
      <KnowledgeLearningHub />
    </WorkspaceShell>
  )
}
