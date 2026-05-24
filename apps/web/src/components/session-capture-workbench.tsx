import {
  AlertTriangle,
  ArrowRight,
  CircleDashed,
  LockKeyhole,
  type LucideIcon,
} from "lucide-react"

import {
  captureActions,
  captureBoundaries,
  capturePrimarySections,
  downstreamReadiness,
  draftStates,
  productOrderRows,
  questionPrompts,
  sessionFacts,
  sessionMetrics,
  type CaptureTone,
} from "@/lib/session-capture"
import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const toneClasses: Record<CaptureTone, string> = {
  default: "workbench-status-default",
  success: "workbench-status-success",
  warning: "workbench-status-warning",
  info: "workbench-status-info",
  muted: "workbench-status-muted",
}

export function SessionCaptureWorkbench() {
  return (
    <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">手动采集</Badge>
                  <Badge variant="outline">暂不能保存</Badge>
                  <Badge variant="outline">待进入复盘</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  记录一场直播
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  填主题、主播、商品顺序和观众问题。资料越完整，复盘越省事。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {captureActions.slice(0, 2).map((action) => (
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
            {sessionMetrics.map((metric, index) => (
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
            aria-labelledby="capture-structure-title"
          >
            <SectionHeader
              id="capture-structure-title"
              icon={CircleDashed}
              title="要填写的内容"
              description="先把这四项补齐。"
              badge="4 组"
            />
            <div className="grid gap-3 p-5 md:grid-cols-4">
              {capturePrimarySections.map((section, index) => (
                <MotionListItem
                  key={section.label}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row min-h-28 p-4"
                >
                  <section.icon className="size-4 text-primary" />
                  <div className="mt-4 text-sm font-medium">{section.label}</div>
                  <Badge variant="outline" className="mt-3">
                    待填写
                  </Badge>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <MotionPanel delay={0.08}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="session-facts-title"
            >
              <SectionHeader
                id="session-facts-title"
                icon={CircleDashed}
                title="场次事实"
                description="记录本场最重要的信息。"
                badge="人工输入"
              />
              <div className="divide-y">
                {sessionFacts.map((fact, index) => (
                  <MotionListItem
                    key={fact.label}
                    delay={index * 0.025}
                    className="px-5 py-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{fact.label}</span>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{fact.required}</Badge>
                        <Badge variant="outline">{fact.boundary}</Badge>
                      </div>
                    </div>
                    <p className="mt-2 leading-6 text-muted-foreground">
                      {fact.value}
                    </p>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>

          <MotionPanel delay={0.1}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="product-order-title"
            >
              <SectionHeader
                id="product-order-title"
                icon={ArrowRight}
                title="商品讲解顺序"
                description="按实际讲解顺序排列。"
                badge="待核对"
              />
              <div className="divide-y">
                {productOrderRows.map((row, index) => (
                  <MotionListItem
                    key={row.order}
                    delay={index * 0.025}
                    className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[44px_minmax(0,1fr)_minmax(0,1.35fr)]"
                  >
                    <Badge variant="secondary">{row.order}</Badge>
                    <div className="min-w-0">
                      <div className="font-medium">{row.racketModel}</div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        {row.role}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="leading-6">{row.checkpoint}</p>
                      <p className="text-xs leading-5 text-muted-foreground">
                        {row.customerFit}；{row.evidence}
                      </p>
                    </div>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>
        </div>

        <MotionPanel delay={0.13}>
          <section
            className="workbench-panel"
            aria-labelledby="questions-title"
          >
            <SectionHeader
              id="questions-title"
              icon={AlertTriangle}
              title="问题和缺口"
              description="记录观众问什么、卡在哪里、哪里没讲清。"
              badge="3 类输入"
            />
            <div className="grid gap-3 p-5 md:grid-cols-3">
              {questionPrompts.map((prompt, index) => (
                <MotionListItem
                  key={prompt.label}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row min-h-56 p-4"
                >
                  <prompt.icon className="size-4 text-primary" />
                  <h3 className="mt-3 text-sm font-semibold">
                    {prompt.label}
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {prompt.description}
                  </p>
                  <div className="mt-4 grid gap-2">
                    {prompt.examples.map((example) => (
                      <Badge
                        key={example}
                        variant="outline"
                        className="h-auto min-h-6 justify-start whitespace-normal py-1"
                      >
                        {example}
                      </Badge>
                    ))}
                  </div>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.16}>
          <section
            className="workbench-panel"
            aria-labelledby="draft-states-title"
          >
            <SectionHeader
              id="draft-states-title"
              icon={LockKeyhole}
              title="保存检查"
              description="保存前先检查缺项和长文本。"
              badge="保存准备"
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
              {draftStates.map((state, index) => (
                <MotionListItem
                  key={state.label}
                  delay={index * 0.02}
                  className="motion-interactive workbench-row min-h-40 p-4"
                >
                  <span
                    className={cn(
                      "workbench-icon-surface border",
                      toneClasses[state.tone],
                    )}
                  >
                    <state.icon className="size-4" />
                  </span>
                  <div className="mt-3 text-sm font-semibold">{state.label}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {state.description}
                  </p>
                  <Badge variant="outline" className="mt-3">
                    {state.state}
                  </Badge>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-base font-semibold">状态</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {captureBoundaries.map((boundary) => (
              <div
                key={boundary.label}
                className="grid grid-cols-[18px_1fr] gap-2 text-sm leading-6"
              >
                <boundary.icon className="mt-1 size-3.5 text-primary" />
                <span>
                  <span className="font-medium">{boundary.label}</span>
                  <span className="block text-xs leading-5 text-muted-foreground">
                    {boundary.description}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.15}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">操作</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            补齐资料后再使用这些动作。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {captureActions.map((action) => (
              <Button
                key={action.label}
                disabled
                variant="outline"
                className="h-auto min-h-14 justify-start whitespace-normal px-3 py-3"
                aria-label={`暂不能${action.label}`}
              >
                <action.icon className="size-3.5" />
                {action.label}
              </Button>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.18}>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            <h2 className="text-base font-semibold">接下来</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {downstreamReadiness.map((item) => (
              <div key={item.label} className="workbench-row p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{item.label}</span>
                  <Badge variant="outline">{item.target}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
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
    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
      <Badge variant="outline" className="w-fit">
        {badge}
      </Badge>
    </div>
  )
}
