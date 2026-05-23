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
    <div className="grid gap-5 px-4 py-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">手动采集</Badge>
                  <Badge variant="outline">无保存</Badge>
                  <Badge variant="outline">无 AI 分析</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  先把直播事实记录清楚，再让复盘和知识学习变可靠
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  本页预览 MVP 的手动场次采集结构：主题、主播、商品顺序、讲解检查点、
                  客户问题和购买异议都先作为人工事实，再进入后续 AI 复盘。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                {captureActions.slice(0, 2).map((action) => (
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
              title="采集结构"
              description="当前是字段预览，未来才会接入表单校验、草稿保存和权限。"
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
                    字段预览
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
                description="只展示字段结构，不代表已经创建场次记录。"
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
                description="后续 AI 复盘会根据顺序判断讲解节奏、对比逻辑和异议承接。"
                badge="顺序预览"
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
              title="问题、异议和讲解缺口"
              description="未来用于问题聚类、话术改进、短视频选题和下场任务。"
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
              title="草稿、校验和恢复状态"
              description="这些是未来保存能力的状态设计，本切片不保存任何内容。"
              badge="状态预览"
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
            <h2 className="text-base font-semibold">当前边界</h2>
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
            <h2 className="text-base font-semibold">未来动作</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            下列控件只展示后续能力入口，不会写入或分析数据。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {captureActions.map((action) => (
              <Button
                key={action.label}
                disabled
                variant="outline"
                className="h-auto min-h-14 justify-start whitespace-normal px-3 py-3"
                aria-label={`未来${action.label}`}
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
            <h2 className="text-base font-semibold">下游准备</h2>
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
