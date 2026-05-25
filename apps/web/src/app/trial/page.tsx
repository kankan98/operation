import { PublicTrialEntryPanel } from "@/components/internal-trial-access"
import { WorkspaceShell } from "@/components/workspace-shell"
import { getSafePublicTrialNextPath } from "@/lib/public-trial-auth"

type TrialPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function TrialPage({ searchParams }: TrialPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const rawNext = resolvedSearchParams.next
  const nextPath = getSafePublicTrialNextPath(
    Array.isArray(rawNext) ? rawNext[0] : rawNext,
  )

  return (
    <WorkspaceShell
      activePath="/trial"
      title="试用访问"
      subtitle="进入演示团队后继续"
      badge="试用"
      showTrialAccessCard={false}
    >
      <div className="workspace-page lg:grid-cols-[minmax(0,1fr)_minmax(280px,var(--workspace-aside-width-sm))]">
        <section className="min-w-0 space-y-5">
          <PublicTrialEntryPanel continuePath={nextPath} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">试用范围</h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-muted-foreground">
              <p>可以体验场次、球拍、资料、复盘、话术和下场任务。</p>
              <p>请使用演示或脱敏数据，暂不要录入真实客户和订单信息。</p>
            </div>
          </section>

          <section className="rounded-lg border bg-card p-5">
            <h2 className="text-base font-semibold">继续路径</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              试用团队准备好后，会继续到你刚才打开的工作面。
            </p>
          </section>
        </aside>
      </div>
    </WorkspaceShell>
  )
}
