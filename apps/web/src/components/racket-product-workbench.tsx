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
    <div className="grid gap-5 px-4 py-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">静态产品库</Badge>
                  <Badge variant="outline">无保存</Badge>
                  <Badge variant="outline">无来源导入</Badge>
                  <Badge variant="outline">无 AI grounding</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  先把球拍型号、规格和别名整理成 AI 能引用的产品底座
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  本页预览未来产品库结构：型号、别名、重量级别、平衡点、中杆硬度、
                  推荐磅数、适合人群、卖点和审核状态都会影响直播讲解、AI 复盘、
                  话术资产和 Q&A Agent。当前内容只是字段结构示例。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {racketActions.map((action) => (
                  <Button
                    key={action.label}
                    disabled
                    aria-label={`未来${action.label}`}
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
              title="规格覆盖和知识边界"
              description="这些字段未来会进入接口契约、审核流程和 AI grounding。"
              badge="4 类字段"
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
              title="产品记录结构"
              description="示例记录用于固定字段，不代表真实库存、真实品牌数据或已审核知识。"
              badge="示例数据"
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
                title="审核队列预览"
                description="未来不能把未审核规格直接给到 AI 或直播话术。"
                badge="风险字段"
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
                title="下游准备状态"
                description="产品库会成为直播、复盘、话术和 Agent 的共同依据。"
                badge="未接入"
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
                        阻塞：{item.blockedBy}
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
            <h2 className="text-base font-semibold">当前边界</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            本页不保存产品、不导入来源、不合并别名、不调用 AI，也不把示例规格写入知识库。
          </p>
          <Separator className="my-4" />
          <div className="grid gap-3 text-sm leading-6">
            <BoundaryItem>未来需要团队、权限和 reviewer 记录。</BoundaryItem>
            <BoundaryItem>真实规格必须来自可追溯来源或团队审核。</BoundaryItem>
            <BoundaryItem>AI 只能引用已审核知识快照。</BoundaryItem>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">契约预留</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            真正实现前需要补 `racket-product-library` 契约：实体、输入输出、状态机、
            审核错误、租户权限、敏感数据和验证项。
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
