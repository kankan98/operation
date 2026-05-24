import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Database,
  GitBranch,
  LockKeyhole,
  MessageSquareWarning,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import {
  aiReviewBoundaries,
  analysisSections,
  downstreamArtifacts,
  feedbackSignals,
  groundingReferences,
  reviewActions,
  reviewInputFacts,
  reviewMetrics,
  reviewPipelineStages,
  validationStates,
  type ReviewTone,
} from "@/lib/ai-review-workbench"
import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const toneClasses: Record<ReviewTone, string> = {
  default: "workbench-status-default",
  success: "workbench-status-success",
  warning: "workbench-status-warning",
  info: "workbench-status-info",
  muted: "workbench-status-muted",
}

const sourceLabels = {
  operator: "人工事实",
  "public-knowledge": "资料来源",
  "review-rule": "审核规则",
} as const

export function AiReviewWorkbench() {
  return (
    <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">智能复盘</Badge>
                  <Badge variant="outline">暂不能生成</Badge>
                  <Badge variant="outline">暂不能保存</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  生成复盘建议
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  先选择场次和资料，再生成建议。采纳前请人工确认。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
                <Button disabled aria-label="暂不能生成复盘建议">
                  <Sparkles data-icon="inline-start" />
                  生成复盘建议
                </Button>
                <Button disabled variant="outline" aria-label="暂不能保存审核结果">
                  <CheckCircle2 data-icon="inline-start" />
                  保存审核结果
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            {reviewMetrics.map((metric, index) => (
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
            aria-labelledby="review-pipeline-title"
          >
            <SectionHeader
              id="review-pipeline-title"
              icon={Bot}
              title="复盘流程"
              description="按这几步完成复盘。"
              badge="5 步"
            />
            <div className="grid gap-3 p-5 lg:grid-cols-5">
              {reviewPipelineStages.map((stage, index) => (
                <MotionListItem
                  key={stage.title}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row relative min-h-40 p-4"
                >
                  {index < reviewPipelineStages.length - 1 ? (
                    <ArrowRight
                      className="absolute right-2 top-6 hidden size-5 rounded-full border bg-card p-1 text-muted-foreground lg:block"
                      aria-hidden="true"
                    />
                  ) : null}
                  <stage.icon className="size-4 text-primary" />
                  <div className="mt-4 text-sm font-medium">{stage.title}</div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {stage.description}
                  </p>
                  <Badge variant="outline" className="mt-4">
                    {stage.state}
                  </Badge>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <MotionPanel delay={0.08}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="review-input-title"
            >
              <SectionHeader
                id="review-input-title"
                icon={ClipboardList}
                title="场次信息"
                description="复盘前先确认这些内容。"
                badge="待确认"
              />
              <div className="divide-y">
                {reviewInputFacts.map((fact, index) => (
                  <MotionListItem
                    key={fact.label}
                    delay={index * 0.025}
                    className="grid gap-2 px-5 py-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{fact.label}</span>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">
                          {sourceLabels[fact.source]}
                        </Badge>
                        <Badge variant="outline">{fact.state}</Badge>
                      </div>
                    </div>
                    <p className="leading-6 text-muted-foreground">
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
              aria-labelledby="grounding-title"
            >
              <SectionHeader
                id="grounding-title"
                icon={Database}
                title="参考资料"
                description="复盘会参考这些资料。"
                badge="待审核"
              />
              <div className="grid gap-3 p-5">
                {groundingReferences.map((reference, index) => (
                  <MotionListItem
                    key={reference.title}
                    delay={index * 0.025}
                    className="motion-interactive workbench-row p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">
                        {reference.title}
                      </h3>
                      <Badge variant="outline">{reference.sourceType}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="secondary">{reference.reviewState}</Badge>
                      <Badge variant="secondary">{reference.confidence}</Badge>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {reference.intendedUse}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {reference.boundary}
                    </p>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>
        </div>

        <MotionPanel delay={0.13}>
          <section
            className="workbench-panel"
            aria-labelledby="analysis-output-title"
          >
            <SectionHeader
              id="analysis-output-title"
              icon={Sparkles}
              title="复盘结果"
              description="生成后先审核，再用于话术和任务。"
              badge="6 类内容"
            />
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {analysisSections.map((section, index) => (
                <MotionListItem
                  key={section.title}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row flex min-h-52 flex-col p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <section.icon className="size-4 text-primary" />
                      <h3 className="mt-3 text-sm font-semibold">
                        {section.title}
                      </h3>
                    </div>
                    <Badge variant="outline">{section.artifact}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {section.preview}
                  </p>
                  <div className="mt-auto pt-4">
                    <p className="text-xs leading-5 text-muted-foreground">
                      依据：{section.evidence}
                    </p>
                    <Badge variant="secondary" className="mt-3">
                      {section.state}
                    </Badge>
                  </div>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <MotionPanel delay={0.16}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="validation-title"
            >
              <SectionHeader
                id="validation-title"
                icon={MessageSquareWarning}
                title="异常提示"
                description="资料不足时先补齐。"
                badge="需处理"
              />
              <div className="grid gap-3 p-5">
                {validationStates.map((state, index) => (
                  <MotionListItem
                    key={state.label}
                    delay={index * 0.02}
                    className="workbench-row grid grid-cols-[32px_1fr] gap-3 p-3"
                  >
                    <span
                      className={cn(
                        "workbench-icon-surface border",
                        toneClasses[state.tone],
                      )}
                    >
                      <state.icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">
                          {state.label}
                        </span>
                        <Badge variant="outline">{state.state}</Badge>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {state.description}
                      </span>
                    </span>
                  </MotionListItem>
                ))}
              </div>
            </section>
          </MotionPanel>

          <MotionPanel delay={0.18}>
            <section
              className="workbench-panel h-full"
              aria-labelledby="feedback-title"
            >
              <SectionHeader
                id="feedback-title"
                icon={GitBranch}
                title="反馈记录"
                description="记录采纳、编辑、拒绝等结果。"
                badge="7 类"
              />
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {feedbackSignals.map((signal, index) => (
                  <MotionListItem
                    key={signal.label}
                    delay={index * 0.02}
                    className="motion-interactive workbench-row min-h-36 p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "workbench-icon-surface border",
                          toneClasses[signal.tone],
                        )}
                      >
                        <signal.icon className="size-4" />
                      </span>
                      <span className="text-sm font-semibold">
                        {signal.label}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                      {signal.description}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-primary">
                      {signal.futureUse}
                    </p>
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
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-base font-semibold">状态</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {aiReviewBoundaries.map((boundary) => (
              <div
                key={boundary}
                className="grid grid-cols-[18px_1fr] gap-2 text-sm leading-6"
              >
                <LockKeyhole className="mt-1 size-3.5 text-primary" />
                <span>{boundary}</span>
              </div>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.15}>
          <div className="flex items-center gap-2">
            <CircleDashed className="size-4 text-primary" />
            <h2 className="text-base font-semibold">审核操作</h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            补齐资料后再进行审核。
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {reviewActions.map((action) => (
              <Button
                key={action.label}
                disabled
                variant="outline"
                className="h-auto min-h-16 flex-col items-start whitespace-normal px-3 py-3 text-left"
                aria-label={`暂不能${action.label}建议`}
              >
                <span className="flex items-center gap-2">
                  <action.icon className="size-3.5" />
                  {action.label}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {action.description}
                </span>
              </Button>
            ))}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.18}>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            <h2 className="text-base font-semibold">下一步</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {downstreamArtifacts.map((artifact) => (
              <div
                key={artifact.label}
                className="workbench-row p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{artifact.label}</span>
                  <Badge variant="outline">{artifact.state}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {artifact.description}
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
