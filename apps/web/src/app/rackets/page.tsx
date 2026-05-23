import { RacketProductWorkbench } from "@/components/racket-product-workbench"
import { WorkspaceShell } from "@/components/workspace-shell"

export default function RacketsPage() {
  return (
    <WorkspaceShell
      activePath="/rackets"
      title="球拍产品"
      subtitle="型号、规格、别名和卖点"
      badge="静态产品库"
    >
      <RacketProductWorkbench />
    </WorkspaceShell>
  )
}
