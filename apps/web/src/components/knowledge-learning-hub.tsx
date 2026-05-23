import Link from "next/link"
import { ExternalLink, LockKeyhole, RadioTower, RefreshCcw } from "lucide-react"

import {
  feedbackSignals,
  knowledgeSources,
  learningStages,
  trustLevelLabels,
} from "@/lib/knowledge-learning"
import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export function KnowledgeLearningHub() {
  return (
    <div className="grid gap-5 px-4 py-5 md:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">知识库学习中枢</Badge>
                <Badge variant="outline">静态元数据</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                从专业公开来源到可审核 AI 分析能力
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                这里展示未来知识库的核心闭环：登记可信来源、规范化字段、人工审核、发布知识快照、让 AI
                引用快照生成建议，再用运营反馈改进后续分析。当前不自动抓取、不保存、不调用 AI。
              </p>
            </div>
            <div className="rounded-md border bg-surface p-3 text-sm leading-6 text-muted-foreground lg:max-w-72">
              下一步真正实现时，需要先接入团队权限、持久化数据表、来源采集策略和审核队列。
            </div>
          </div>
        </MotionPanel>

        <MotionPanel delay={0.05}>
          <section
            className="workbench-panel"
            aria-labelledby="source-registry-title"
          >
            <div className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 id="source-registry-title" className="text-base font-semibold">
                  公开来源注册表
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  只展示来源元数据和计划字段，不复制长篇来源内容。
                </p>
              </div>
              <Badge variant="outline">{knowledgeSources.length} 个候选来源</Badge>
            </div>
            <div className="divide-y">
              {knowledgeSources.map((source, index) => (
                <MotionListItem key={source.url} delay={index * 0.025}>
                  <article className="motion-interactive grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_180px]">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {trustLevelLabels[source.trustLevel]}
                        </Badge>
                        <Badge variant="outline">{source.reviewState}</Badge>
                      </div>
                      <h3 className="mt-3 font-medium">{source.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {source.owner} · {source.sourceType}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {source.intendedFields.map((field) => (
                          <Badge key={field} variant="outline">
                            {field}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {source.aiUse}
                      </p>
                    </div>
                    <div className="flex flex-col gap-3 text-sm">
                      <div className="rounded-md bg-surface p-3">
                        <div className="text-xs text-muted-foreground">刷新策略</div>
                        <div className="mt-1 font-medium">{source.refreshCadence}</div>
                      </div>
                      <Link
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="motion-interactive inline-flex items-center gap-2 rounded-md border px-3 py-2 font-medium text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        查看来源
                        <ExternalLink className="size-4" />
                      </Link>
                    </div>
                  </article>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section
            className="workbench-panel"
            aria-labelledby="learning-loop-title"
          >
            <div className="border-b px-5 py-4">
              <h2 id="learning-loop-title" className="text-base font-semibold">
                知识到 AI 的学习闭环
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                每一步都需要可追踪状态，避免把网页内容或 AI 建议直接当成销售事实。
              </p>
            </div>
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {learningStages.map((stage, index) => (
                <MotionListItem
                  key={stage.title}
                  delay={index * 0.025}
                  className="motion-interactive workbench-row min-h-36 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <stage.icon className="size-5 text-primary" />
                    <Badge variant="outline">{stage.status}</Badge>
                  </div>
                  <h3 className="mt-4 text-sm font-medium">{stage.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {stage.description}
                  </p>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <LockKeyhole className="size-4 text-primary" />
            <h2 className="text-base font-semibold">当前边界</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            当前页面不是采集器，也不是知识库后台。它只固定信息架构：哪些来源值得跟踪、如何审核、AI
            未来如何引用，以及运营反馈如何变成评估信号。
          </p>
          <Separator className="my-4" />
          <div className="grid gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <RadioTower className="size-4 text-primary" />
              未连接外部网站抓取任务
            </div>
            <div className="flex items-center gap-2">
              <RefreshCcw className="size-4 text-primary" />
              未写入数据库或审核队列
            </div>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.16}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">AI 反馈信号</h2>
            <Badge variant="outline">未来输入</Badge>
          </div>
          <div className="mt-4 grid gap-3">
            {feedbackSignals.map((signal, index) => (
              <MotionListItem
                key={signal.label}
                delay={index * 0.025}
                className="workbench-row p-3"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <signal.icon className="size-4 text-primary" />
                  {signal.label}
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {signal.description}
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  后续用途：{signal.futureUse}
                </p>
              </MotionListItem>
            ))}
          </div>
        </MotionPanel>
      </aside>
    </div>
  )
}
