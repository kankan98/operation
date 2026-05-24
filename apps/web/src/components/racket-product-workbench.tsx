import { AlertTriangle, CircleDashed, LockKeyhole, type LucideIcon } from "lucide-react"

import {
  downstreamReadiness,
  racketActions,
  racketMetrics,
  racketProductRecords,
  reviewQueueItems,
  specCoverage,
  type RacketTone,
} from "@/lib/racket-products"
import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const toneClasses: Record<RacketTone, string> = {
  default: "workbench-status-default",
  success: "workbench-status-success",
  warning: "workbench-status-warning",
  info: "workbench-status-info",
  muted: "workbench-status-muted",
}

export function RacketProductWorkbench() {
  return (
    <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">产品资料</Badge>
                  <Badge variant="outline">暂不能保存</Badge>
                  <Badge variant="outline">来源待审核</Badge>
                  <Badge variant="outline">待确认</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  整理球拍资料
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  核对型号、规格、卖点和适合人群。确认后再用于直播讲解和复盘。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {racketActions.map((action) => (
                  <Button
                    key={action.label}
                    disabled
                    aria-label={`暂不能${action.label}`}
                  >
                    <action.icon data-icon="inline-start" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            {racketMetrics.map((metric, index) => (
              <MotionListItem
                key={metric.label}
                delay={index * 0.03}
                className="min-h-32 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{metric.label}</span>
                  <span
                    className={cn(
                      "rounded-4xl border px-2 py-0.5 text-xs font-medium",
                      toneClasses[metric.tone],
                    )}
                  >
                    {metric.value}
                  </span>
                </div>
                <p className="mt-5 text-xs leading-5 text-muted-foreground">
                  {metric.description}
                </p>
              </MotionListItem>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel delay={0.05}>
          <section
            className="workbench-panel"
            aria-labelledby="racket-spec-coverage-title"
          >
            <SectionHeader
              id="racket-spec-coverage-title"
              icon={CircleDashed}
              title="需要核对"
              description="先看哪些资料还缺。"
              badge="4 项"
            />
            <div className="grid gap-3 p-5 md:grid-cols-4">
              {specCoverage.map((item, index) => (
                <MotionListItem
                  key={item.label}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row min-h-40 p-4"
                >
                  <div
                    className={cn(
                      "workbench-icon-surface border",
                      toneClasses[item.tone],
                    )}
                  >
                    <item.icon className="size-4" />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{item.label}</span>
                    <Badge variant="outline">{item.state}</Badge>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.08}>
          <section
            className="workbench-panel overflow-hidden"
            aria-labelledby="racket-records-title"
          >
            <SectionHeader
              id="racket-records-title"
              icon={CircleDashed}
              title="产品资料"
              description="按型号检查规格、打法和卖点。"
              badge="待审核"
            />
            <div className="divide-y">
              {racketProductRecords.map((record, index) => (
                <MotionListItem
                  key={record.model}
                  delay={index * 0.035}
                  className="grid gap-4 px-5 py-4 text-sm 2xl:grid-cols-[minmax(180px,0.8fr)_minmax(0,1.4fr)_minmax(0,1fr)_170px]"
                >
                  <div className="min-w-0">
                    <div className="font-semibold">{record.model}</div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {record.aliases.map((alias) => (
                        <Badge
                          key={alias}
                          variant="outline"
                          className="h-auto min-h-6 whitespace-normal py-1"
                        >
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <SpecField label="重量" value={record.weightClass} />
                    <SpecField label="平衡" value={record.balance} />
                    <SpecField label="中杆" value={record.shaftStiffness} />
                    <SpecField label="磅数" value={record.recommendedTension} />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{record.playerLevel}</Badge>
                      <Badge variant="outline">{record.priceBand}</Badge>
                    </div>
                    <p className="mt-2 leading-6">{record.playStyle}</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {record.sellingFocus}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 xl:items-end">
                    <span
                      className={cn(
                        "rounded-4xl border px-2 py-0.5 text-xs font-medium",
                        toneClasses[record.tone],
                      )}
                    >
                      {record.reviewState}
                    </span>
                    <span className="text-xs leading-5 text-muted-foreground xl:text-right">
                      {record.sourceFreshness}
                    </span>
                  </div>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <MotionPanel delay={0.12}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="racket-review-title"
            >
              <SectionHeader
                id="racket-review-title"
                icon={AlertTriangle}
                title="待复核项目"
                description="这些内容需要先确认。"
                badge="需处理"
              />
              <div className="grid gap-3 p-5">
                {reviewQueueItems.map((item, index) => (
                  <MotionListItem
                    key={item.label}
                    delay={index * 0.025}
                    className="workbench-row-interactive p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "workbench-icon-surface shrink-0 border",
                          toneClasses[item.tone],
                        )}
                      >
                        <item.icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold">
                            {item.label}
                          </h3>
                          <Badge variant="outline">{item.state}</Badge>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>

          <MotionPanel delay={0.15}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="racket-downstream-title"
            >
              <SectionHeader
                id="racket-downstream-title"
                icon={CircleDashed}
                title="可用于"
                description="资料确认后，可用于这些工作。"
                badge="待确认"
              />
              <div className="divide-y">
                {downstreamReadiness.map((item, index) => (
                  <MotionListItem
                    key={item.workflow}
                    delay={index * 0.025}
                    className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[32px_minmax(0,0.7fr)_minmax(0,1.3fr)]"
                  >
                    <item.icon className="size-4 text-primary" />
                    <div className="min-w-0 font-medium">{item.workflow}</div>
                    <div className="min-w-0">
                      <p className="leading-6">{item.useCase}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        还需要：{item.blockedBy}
                      </p>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>
        </div>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-primary" />
            <h2 className="text-base font-semibold">状态</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            暂不能保存。请先整理资料，等待审核。
          </p>
          <Separator className="my-4" />
          <div className="grid gap-3 text-sm leading-6">
            <BoundaryItem>维护资料需要团队权限。</BoundaryItem>
            <BoundaryItem>规格需要可靠来源。</BoundaryItem>
            <BoundaryItem>审核后再用于复盘。</BoundaryItem>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">整理规则</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            每个型号都要有来源、审核状态、别名和适用场景。
          </p>
        </MotionPanel>
      </aside>
    </div>
  )
}

function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
  badge,
}: {
  id: string
  icon: LucideIcon
  title: string
  description: string
  badge: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-primary" />
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
      <Badge variant="outline" className="w-fit shrink-0">
        {badge}
      </Badge>
    </div>
  )
}

function SpecField({ label, value }: { label: string; value: string }) {
  return (
    <div className="workbench-row px-3 py-2">
      <div className="text-[11px] font-medium text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-xs leading-5">{value}</div>
    </div>
  )
}

function BoundaryItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CircleDashed className="mt-1 size-3.5 shrink-0 text-primary" />
      <span>{children}</span>
    </div>
  )
}
