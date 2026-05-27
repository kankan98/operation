"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldCheck,
  Target,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  clearStoredInternalTrialScope,
  enterInternalTrial,
  leaveInternalTrial,
  readStoredInternalTrialScope,
  readInternalTrialApiBody,
  verifyInternalTrialSession,
  scopedInternalTrialApiUrl,
  trialAccessUserMessage,
  type OperatorV0Scope,
} from "@/lib/internal-trial-access"
import { getSafePublicTrialNextPath } from "@/lib/public-trial-auth"
import {
  buildTrialWorkflowReadinessSummary,
  extractTrialWorkflowCollectionCount,
  trialWorkflowSteps,
  type TrialWorkflowReadinessSummary,
  type TrialWorkflowStepCheck,
} from "@/lib/trial-workflow-readiness"
import {
  buildV0TrialReadinessCockpit,
  type V0TrialReadinessStage,
} from "@/lib/v0-trial-readiness-cockpit"
import {
  feedbackOptionLabel,
  listV0TrialFeedback,
  submitV0TrialFeedback,
  trialFeedbackUserMessage,
  v0TrialFeedbackEvaluatorRoleOptions,
  v0TrialFeedbackIssueTypeOptions,
  v0TrialFeedbackRealWorkSignalOptions,
  v0TrialFeedbackWorkbenchOptions,
  type V0TrialFeedbackEvidenceFocus,
  type V0TrialFeedbackEvidenceSummary,
  type V0TrialFeedbackInput,
  type V0TrialFeedbackItem,
  type V0TrialFeedbackWorkbench,
} from "@/lib/v0-trial-feedback"
import { primaryNavItems } from "@/lib/workspace"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

type TrialPhase =
  | "checking"
  | "entry"
  | "ready"
  | "error"
  | "entering"
  | "refreshing"
  | "leaving"

type TrialState = {
  phase: TrialPhase
  scope: OperatorV0Scope | null
  message: string
}

const trialAccessChangedEvent = "operation:internal-trial-access-changed"

const workflowPath = trialWorkflowSteps.map((step) => ({
  title: step.nextActionLabel,
  href: step.href,
  status: "可试用",
}))

const demoScenarioQuickLinks = [
  {
    title: "看场次样例",
    href: "/sessions",
  },
  {
    title: "看 AI 复盘",
    href: "/ai-review",
  },
  {
    title: "看下场任务",
    href: "/next-actions",
  },
]

function notifyTrialAccessChanged() {
  window.dispatchEvent(new Event(trialAccessChangedEvent))
}

function useInternalTrialAccess() {
  const [state, setState] = useState<TrialState>({
    phase: "checking",
    scope: null,
    message: "正在检查内部试用",
  })

  const verify = useCallback(async (scope: OperatorV0Scope, phase: TrialPhase) => {
    setState((current) => ({
      ...current,
      phase,
      scope,
      message: phase === "refreshing" ? "正在刷新团队状态" : "正在检查内部试用",
    }))

    const result = await verifyInternalTrialSession({ scope })

    if (result.ok) {
      setState({
        phase: "ready",
        scope: result.scope,
        message: "已进入团队",
      })
      return
    }

    setState({
      phase: "error",
      scope: null,
      message: result.userMessage,
    })
  }, [])

  useEffect(() => {
    const checkStoredScope = () => {
      const storedScope = readStoredInternalTrialScope()

      if (!storedScope) {
        setState({
          phase: "entry",
          scope: null,
          message: "进入内部试用后开始处理",
        })
        return
      }

      void verify(storedScope, "checking")
    }

    checkStoredScope()
    window.addEventListener(trialAccessChangedEvent, checkStoredScope)

    return () => {
      window.removeEventListener(trialAccessChangedEvent, checkStoredScope)
    }
  }, [verify])

  const enter = useCallback(async () => {
    setState((current) => ({
      ...current,
      phase: "entering",
      message: "正在进入内部试用",
    }))

    const result = await enterInternalTrial()

    if (result.ok) {
      setState({
        phase: "ready",
        scope: result.scope,
        message: "已进入团队",
      })
      notifyTrialAccessChanged()
      return
    }

    setState({
      phase: "error",
      scope: null,
      message: result.userMessage,
    })
  }, [])

  const refresh = useCallback(async () => {
    const scope = state.scope ?? readStoredInternalTrialScope()

    if (!scope) {
      clearStoredInternalTrialScope()
      setState({
        phase: "entry",
        scope: null,
        message: "进入内部试用后开始处理",
      })
      notifyTrialAccessChanged()
      return
    }

    await verify(scope, "refreshing")
  }, [state.scope, verify])

  const leave = useCallback(async () => {
    setState((current) => ({
      ...current,
      phase: "leaving",
      message: "正在退出内部试用",
    }))

    await leaveInternalTrial()
    setState({
      phase: "entry",
      scope: null,
      message: "已退出内部试用",
    })
    notifyTrialAccessChanged()
  }, [])

  const isBusy =
    state.phase === "checking" ||
    state.phase === "entering" ||
    state.phase === "refreshing" ||
    state.phase === "leaving"

  return {
    enter,
    isBusy,
    leave,
    refresh,
    state,
  }
}

type TrialReadinessState = {
  message: string
  phase: "idle" | "loading" | "ready"
  summary: TrialWorkflowReadinessSummary | null
}

async function loadTrialWorkflowStep(
  scope: OperatorV0Scope,
  step: (typeof trialWorkflowSteps)[number],
): Promise<TrialWorkflowStepCheck> {
  try {
    const response = await fetch(scopedInternalTrialApiUrl(step.apiPath, scope), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    })
    const body = await readInternalTrialApiBody<unknown>(response)
    const count = extractTrialWorkflowCollectionCount(body, step.collectionKey)

    if (response.ok && count !== null) {
      return {
        id: step.id,
        ok: true,
        count,
      }
    }

    return {
      id: step.id,
      ok: false,
      message: trialAccessUserMessage(body),
    }
  } catch {
    return {
      id: step.id,
      ok: false,
      message: "进度检查失败，请重试",
    }
  }
}

function useTrialWorkflowReadiness(scope: OperatorV0Scope | null) {
  const [state, setState] = useState<TrialReadinessState>({
    message: "进入试用团队后检查 V0 进度",
    phase: "idle",
    summary: null,
  })

  const load = useCallback(async (targetScope: OperatorV0Scope | null) => {
    if (!targetScope) {
      setState({
        message: "进入试用团队后检查 V0 进度",
        phase: "idle",
        summary: null,
      })
      return
    }

    setState((current) => ({
      ...current,
      message: "正在检查 V0 进度",
      phase: "loading",
    }))

    const checks = await Promise.all(
      trialWorkflowSteps.map((step) => loadTrialWorkflowStep(targetScope, step)),
    )
    const summary = buildTrialWorkflowReadinessSummary(checks)

    setState({
      message:
        summary.status === "error"
          ? "部分进度暂时无法检查"
          : summary.headline,
      phase: "ready",
      summary,
    })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load(scope)
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [load, scope])

  const refresh = useCallback(() => {
    void load(scope)
  }, [load, scope])

  return {
    refresh,
    state,
  }
}

function statusBadgeLabel(phase: TrialPhase): string {
  switch (phase) {
    case "ready":
      return "已进入团队"
    case "checking":
    case "refreshing":
      return "检查中"
    case "entering":
      return "进入中"
    case "leaving":
      return "退出中"
    case "error":
      return "需重新进入"
    case "entry":
      return "内部试用"
  }
}

function StatusIcon({ phase }: { phase: TrialPhase }) {
  if (phase === "ready") {
    return <CheckCircle2 className="size-4 text-success" />
  }

  if (phase === "error") {
    return <AlertTriangle className="size-4 text-destructive" />
  }

  if (
    phase === "checking" ||
    phase === "entering" ||
    phase === "refreshing" ||
    phase === "leaving"
  ) {
    return <Loader2 className="size-4 animate-spin text-primary" />
  }

  return <ShieldCheck className="size-4 text-primary" />
}

function TrialWorkflowReadinessPanel({
  onRefresh,
  state,
}: {
  onRefresh: () => void
  state: TrialReadinessState
}) {
  const summary = state.summary
  const isLoading = state.phase === "loading"
  const isRetryable = summary?.status === "error"
  const isIdle = state.phase === "idle" && !summary

  return (
    <div className="rounded-md border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isLoading ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : isRetryable ? (
            <AlertTriangle className="size-4 text-destructive" />
          ) : isIdle ? (
            <ShieldCheck className="size-4 text-primary" />
          ) : (
            <CheckCircle2 className="size-4 text-success" />
          )}
          <h3 className="text-sm font-semibold">V0 试用进度</h3>
        </div>
        <Badge variant={isRetryable ? "outline" : "secondary"}>
          {summary?.progressLabel ?? "待检查"}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {isLoading ? "正在检查已开放工作面。" : (summary?.headline ?? state.message)}
      </p>

      {isRetryable ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={onRefresh}
        >
          <RefreshCcw />
          重试检查
        </Button>
      ) : null}

      <div className="mt-4 grid gap-2">
        {(summary?.steps ?? trialWorkflowSteps).map((step, index) => {
          const stepSummary = summary?.steps.find((item) => item.id === step.id)
          const isStepError = stepSummary?.status === "error"
          const statusLabel = isLoading
            ? "检查中"
            : (stepSummary?.statusLabel ?? "待检查")
          const countLabel = isLoading
            ? "..."
            : (stepSummary?.countLabel ?? "待检查")

          return (
            <Link
              key={step.id}
              href={step.href}
              className="motion-interactive grid min-h-14 grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant="secondary">0{index + 1}</Badge>
              <span className="min-w-0">
                <span className="block truncate font-medium">{step.title}</span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {statusLabel}
                </span>
              </span>
              <Badge variant={isStepError ? "outline" : "secondary"}>
                {countLabel}
              </Badge>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function DemoScenarioGuidance({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-md border bg-background p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Target className="size-4 text-primary" />
            <h3 className="text-sm font-semibold">已加载演示样例</h3>
            <Badge variant="secondary">脱敏数据</Badge>
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            高端进攻拍直播复盘已包含场次、球拍、资料、AI 复盘、话术和下场任务。
          </p>
        </div>
        <Badge variant="outline" className="shrink-0">
          V0-DEMO-ATTACK-900
        </Badge>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {demoScenarioQuickLinks.map((item) => (
          <Button
            key={item.href}
            asChild
            variant="outline"
            size="sm"
            className="justify-between"
          >
            <Link href={item.href}>
              {item.title}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
        ))}
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        试用时只补充演示或脱敏内容，反馈请直接记录卡点。
      </p>
    </div>
  )
}

type TrialFeedbackState = {
  evidence: V0TrialFeedbackEvidenceSummary | null
  feedback: V0TrialFeedbackInput
  message: string
  phase: "idle" | "loading" | "ready" | "submitting" | "success" | "error"
  recent: V0TrialFeedbackItem[]
}

const trialFeedbackFocusLabels: Record<V0TrialFeedbackEvidenceFocus, string> = {
  ai_quality: "复盘质量",
  collect_more_feedback: "继续收集",
  downstream_workflow: "下游承接",
  experience_polish: "体验打磨",
  production_readiness: "生产准备",
  sample_data: "示例数据",
  source_trust: "来源信任",
}

const trialReadinessStageLabels: Record<V0TrialReadinessStage, string> = {
  collect_evidence: "继续收集",
  fix_blockers: "先修卡点",
  prepare_production_gate: "生产门禁",
  ready_for_internal_trial: "V0.9 可试用",
}

function defaultTrialFeedback(
  defaultWorkbench: V0TrialFeedbackWorkbench,
): V0TrialFeedbackInput {
  return {
    evaluatorRole: "live_operator",
    workbench: defaultWorkbench,
    pagePath: defaultWorkbench === "overview" ? "/" : `/${defaultWorkbench.replace("_", "-")}`,
    usefulnessRating: 4,
    clarityRating: 4,
    issueType: "workflow_break",
    note: "",
    realWorkSignal: "maybe",
  }
}

function safeCurrentPath(defaultWorkbench: V0TrialFeedbackWorkbench): string {
  if (typeof window === "undefined") {
    return defaultWorkbench === "overview"
      ? "/"
      : `/${defaultWorkbench.replace("_", "-")}`
  }

  return window.location.pathname
}

function V0TrialReadinessCockpitPanel({
  evidence,
  isLoading,
  panelId,
  workflow,
}: {
  evidence: V0TrialFeedbackEvidenceSummary | null
  isLoading: boolean
  panelId: string
  workflow: TrialWorkflowReadinessSummary | null
}) {
  const cockpit = useMemo(
    () =>
      buildV0TrialReadinessCockpit({
        evidence,
        workflow,
      }),
    [evidence, workflow],
  )
  const isChecking = isLoading || !workflow
  const feedbackCount = evidence?.totalCount ?? 0

  return (
    <section
      className="rounded-md border bg-background p-4"
      aria-labelledby={panelId}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">V0.9 试用就绪</Badge>
            <Badge variant="outline">
              {isChecking
                ? "检查中"
                : trialReadinessStageLabels[cockpit.stage]}
            </Badge>
          </div>
          <h3 id={panelId} className="mt-3 text-base font-semibold">
            {isChecking ? "正在汇总试用就绪度" : cockpit.headline}
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            {isChecking
              ? "正在读取工作面进度和反馈证据，用于判断下一步试用动作。"
              : cockpit.rationale}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {cockpit.nextAction.href ? (
            <Button asChild size="sm">
              <Link href={cockpit.nextAction.href}>
                {cockpit.nextAction.label}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          ) : (
            <Button type="button" size="sm" variant="outline" disabled>
              {cockpit.nextAction.label}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <EvidenceMetric
          label="工作面"
          value={workflow?.progressLabel ?? "检查中"}
        />
        <EvidenceMetric label="反馈样本" value={`${feedbackCount} 条`} />
        <EvidenceMetric label="当前阶段" value={cockpit.stageLabel} />
      </div>

      <div className="mt-4 grid gap-2">
        <p className="text-xs font-medium">建议试用路径</p>
        <div className="grid gap-2">
          {cockpit.checklist.map((item, index) => (
            <Link
              key={item.id}
              href={item.href}
              className="motion-interactive grid min-h-24 gap-2 rounded-md border px-3 py-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[3.5rem_minmax(0,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-start"
            >
              <Badge variant="outline" className="w-fit">
                0{index + 1}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {item.task}
                </p>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {item.evidence}
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                {item.feedbackFocus}
              </p>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-md bg-muted/40 p-3">
        <p className="text-xs font-medium">生产化仍需单独门禁</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {cockpit.productionGateItems.map((item) => (
            <Badge key={item} variant="outline">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    </section>
  )
}

function V0TrialFeedbackEvidencePanel({
  isLoading,
  summary,
}: {
  isLoading: boolean
  summary: V0TrialFeedbackEvidenceSummary | null
}) {
  const readyCount =
    (summary?.realWorkSignals.yes ?? 0) + (summary?.realWorkSignals.maybe ?? 0)

  return (
    <div className="mt-4 border-t pt-4" aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Target className="size-4 text-primary" />
          <h4 className="text-xs font-semibold">反馈证据</h4>
        </div>
        <Badge variant="outline">
          {summary
            ? trialFeedbackFocusLabels[summary.recommendation.focus]
            : isLoading
              ? "读取中"
              : "待收集"}
        </Badge>
      </div>

      {summary ? (
        <div className="mt-3 grid gap-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <EvidenceMetric label="样本" value={`${summary.totalCount}`} />
            <EvidenceMetric label="可真实用" value={`${readyCount}`} />
            <EvidenceMetric label="低有用" value={`${summary.lowUsefulnessCount}`} />
            <EvidenceMetric label="低清晰" value={`${summary.lowClarityCount}`} />
          </div>

          <div className="rounded-md bg-muted/40 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {trialFeedbackFocusLabels[summary.recommendation.focus]}
              </Badge>
              {summary.recommendation.workbench ? (
                <span className="text-xs text-muted-foreground">
                  {feedbackOptionLabel(
                    v0TrialFeedbackWorkbenchOptions,
                    summary.recommendation.workbench,
                  )}
                </span>
              ) : null}
              {summary.recommendation.issueType ? (
                <span className="text-xs text-muted-foreground">
                  {feedbackOptionLabel(
                    v0TrialFeedbackIssueTypeOptions,
                    summary.recommendation.issueType,
                  )}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {summary.recommendation.rationale}
            </p>
          </div>

          {summary.hotspots.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-xs font-medium">主要热点</p>
              <div className="flex flex-wrap gap-2">
                {summary.hotspots.slice(0, 3).map((hotspot) => (
                  <Badge
                    key={`${hotspot.workbench}-${hotspot.issueType}`}
                    variant="outline"
                    className="max-w-full whitespace-normal text-left leading-5"
                  >
                    {feedbackOptionLabel(
                      v0TrialFeedbackWorkbenchOptions,
                      hotspot.workbench,
                    )}
                    {" / "}
                    {feedbackOptionLabel(
                      v0TrialFeedbackIssueTypeOptions,
                      hotspot.issueType,
                    )}
                    {" x"}
                    {hotspot.count}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {summary.recentNotes.length > 0 ? (
            <div className="grid gap-2">
              <p className="text-xs font-medium">代表反馈</p>
              {summary.recentNotes.slice(0, 2).map((note) => (
                <p
                  key={note.id}
                  className="line-clamp-2 text-xs leading-5 text-muted-foreground"
                >
                  {note.note}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              还没有可复盘的反馈，先跑完一条完整试用路径再提交。
            </p>
          )}

          {summary.includedCount < summary.totalCount ? (
            <p className="text-xs leading-5 text-muted-foreground">
              当前摘要纳入最近 {summary.includedCount} 条反馈。
            </p>
          ) : null}
        </div>
      ) : (
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {isLoading ? "正在读取反馈证据" : "进入试用团队后会显示反馈证据。"}
        </p>
      )}
    </div>
  )
}

function EvidenceMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-16 rounded-md border bg-background p-3">
      <p className="text-[11px] leading-4 text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold leading-6">{value}</p>
    </div>
  )
}

function V0TrialFeedbackPanel({
  defaultWorkbench,
  onEvidenceChange,
  scope,
}: {
  defaultWorkbench: V0TrialFeedbackWorkbench
  onEvidenceChange?: (evidence: V0TrialFeedbackEvidenceSummary | null) => void
  scope: OperatorV0Scope | null
}) {
  const [state, setState] = useState<TrialFeedbackState>({
    evidence: null,
    feedback: defaultTrialFeedback(defaultWorkbench),
    message: "进入试用团队后可以提交反馈",
    phase: "idle",
    recent: [],
  })
  const isReady = Boolean(scope)
  const isBusy = state.phase === "loading" || state.phase === "submitting"

  const loadRecent = useCallback(async () => {
    if (!scope) {
      setState((current) => ({
        ...current,
        evidence: null,
        message: "进入试用团队后可以提交反馈",
        phase: "idle",
        recent: [],
      }))
      onEvidenceChange?.(null)
      return
    }

    setState((current) => ({
      ...current,
      message: "正在读取最近反馈",
      phase: current.phase === "submitting" ? current.phase : "loading",
    }))

    try {
      const result = await listV0TrialFeedback({ scope, limit: 3 })

      if (
        result.ok &&
        result.body.ok === true &&
        "feedback" in result.body &&
        "summary" in result.body &&
        Array.isArray(result.body.feedback)
      ) {
        const feedback = result.body.feedback
        const summary = result.body.summary

        setState((current) => ({
          ...current,
          evidence: summary,
          message: feedback.length > 0 ? "最近反馈已更新" : "暂无反馈",
          phase: current.phase === "submitting" ? current.phase : "ready",
          recent: feedback,
        }))
        onEvidenceChange?.(summary)
        return
      }

      setState((current) => ({
        ...current,
        message: trialFeedbackUserMessage(result.body),
        phase: "error",
      }))
      onEvidenceChange?.(null)
    } catch {
      setState((current) => ({
        ...current,
        message: "反馈暂时不可用，请稍后重试",
        phase: "error",
      }))
      onEvidenceChange?.(null)
    }
  }, [onEvidenceChange, scope])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRecent()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadRecent])

  const updateFeedback = useCallback(
    <K extends keyof V0TrialFeedbackInput>(
      key: K,
      value: V0TrialFeedbackInput[K],
    ) => {
      setState((current) => ({
        ...current,
        feedback: {
          ...current.feedback,
          [key]: value,
        },
      }))
    },
    [],
  )

  const submitFeedback = useCallback(async () => {
    if (!scope) {
      setState((current) => ({
        ...current,
        message: "请先进入试用团队",
        phase: "error",
      }))
      return
    }

    const note = state.feedback.note.trim()

    if (!note) {
      setState((current) => ({
        ...current,
        message: "请先写一句反馈",
        phase: "error",
      }))
      return
    }

    setState((current) => ({
      ...current,
      feedback: {
        ...current.feedback,
        note,
        pagePath: safeCurrentPath(current.feedback.workbench),
      },
      message: "正在提交反馈",
      phase: "submitting",
    }))

    try {
      const result = await submitV0TrialFeedback({
        scope,
        feedback: {
          ...state.feedback,
          note,
          pagePath: safeCurrentPath(state.feedback.workbench),
        },
      })

      if (
        result.ok &&
        result.body.ok === true &&
        "feedback" in result.body &&
        result.body.feedback
      ) {
        const feedback = result.body.feedback

        setState((current) => ({
          ...current,
          feedback: {
            ...current.feedback,
            note: "",
          },
          message: "反馈已记录",
          phase: "success",
          recent: [feedback, ...current.recent].slice(0, 3),
        }))
        void loadRecent()
        return
      }

      setState((current) => ({
        ...current,
        message: trialFeedbackUserMessage(result.body),
        phase: "error",
      }))
    } catch {
      setState((current) => ({
        ...current,
        message: "反馈提交失败，请稍后重试",
        phase: "error",
      }))
    }
  }, [loadRecent, scope, state.feedback])

  return (
    <section
      className="rounded-md border bg-background p-4"
      aria-labelledby="v0-trial-feedback-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {isBusy ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : (
            <MessageSquareText className="size-4 text-primary" />
          )}
          <h3 id="v0-trial-feedback-title" className="text-sm font-semibold">
            试用反馈
          </h3>
        </div>
        <Badge variant={state.phase === "success" ? "secondary" : "outline"}>
          {state.phase === "success" ? "已记录" : isReady ? "可提交" : "待进入"}
        </Badge>
      </div>

      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        记录这次试用里的卡点或价值，不粘贴真实客户、订单、私信或完整转录。
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium">
          评估角色
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.evaluatorRole}
            onChange={(event) =>
              updateFeedback(
                "evaluatorRole",
                event.target.value as V0TrialFeedbackInput["evaluatorRole"],
              )
            }
            disabled={!isReady || isBusy}
          >
            {v0TrialFeedbackEvaluatorRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          试用位置
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.workbench}
            onChange={(event) =>
              updateFeedback(
                "workbench",
                event.target.value as V0TrialFeedbackWorkbench,
              )
            }
            disabled={!isReady || isBusy}
          >
            {v0TrialFeedbackWorkbenchOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          有用程度
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.usefulnessRating}
            onChange={(event) =>
              updateFeedback("usefulnessRating", Number(event.target.value))
            }
            disabled={!isReady || isBusy}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} 分
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          清晰程度
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.clarityRating}
            onChange={(event) =>
              updateFeedback("clarityRating", Number(event.target.value))
            }
            disabled={!isReady || isBusy}
          >
            {[5, 4, 3, 2, 1].map((rating) => (
              <option key={rating} value={rating}>
                {rating} 分
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          主要问题
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.issueType}
            onChange={(event) =>
              updateFeedback(
                "issueType",
                event.target.value as V0TrialFeedbackInput["issueType"],
              )
            }
            disabled={!isReady || isBusy}
          >
            {v0TrialFeedbackIssueTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-xs font-medium">
          能否用于真实工作
          <select
            className="h-9 rounded-md border bg-background px-3 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            value={state.feedback.realWorkSignal}
            onChange={(event) =>
              updateFeedback(
                "realWorkSignal",
                event.target.value as V0TrialFeedbackInput["realWorkSignal"],
              )
            }
            disabled={!isReady || isBusy}
          >
            {v0TrialFeedbackRealWorkSignalOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 grid gap-1 text-xs font-medium">
        一句话反馈
        <textarea
          className="min-h-24 resize-y rounded-md border bg-background px-3 py-2 text-sm font-normal leading-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          value={state.feedback.note}
          maxLength={800}
          onChange={(event) => updateFeedback("note", event.target.value)}
          placeholder="例如：复盘结果能用，但话术沉淀入口还不够明显。"
          disabled={!isReady || isBusy}
        />
      </label>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={cn(
            "min-h-5 text-xs leading-5 text-muted-foreground",
            state.phase === "error" && "text-destructive",
            state.phase === "success" && "text-success",
          )}
          role={state.phase === "error" ? "alert" : undefined}
        >
          {state.message}
        </p>
        <Button
          type="button"
          size="sm"
          onClick={submitFeedback}
          disabled={!isReady || isBusy}
        >
          {state.phase === "submitting" ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Send />
          )}
          提交反馈
        </Button>
      </div>

      <V0TrialFeedbackEvidencePanel
        isLoading={state.phase === "loading"}
        summary={state.evidence}
      />

      <div className="mt-4 rounded-md border bg-card p-3">
        <div className="flex items-center justify-between gap-3">
          <h4 className="text-xs font-semibold">最近反馈</h4>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadRecent}
            disabled={!isReady || isBusy}
          >
            <RefreshCcw />
            刷新
          </Button>
        </div>
        <div className="mt-2 grid gap-2">
          {state.recent.length > 0 ? (
            state.recent.map((item) => (
              <div key={item.id} className="rounded-md border bg-background p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">
                    {feedbackOptionLabel(
                      v0TrialFeedbackWorkbenchOptions,
                      item.workbench,
                    )}
                  </Badge>
                  <span className="text-muted-foreground">
                    有用 {item.usefulnessRating} / 清晰 {item.clarityRating}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.note}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              {state.phase === "loading" ? "正在读取反馈" : "暂无反馈"}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export function InternalTrialAccessCard({
  className,
}: {
  className?: string
}) {
  const { enter, isBusy, leave, refresh, state } = useInternalTrialAccess()
  const readyScope = state.phase === "ready" ? state.scope : null
  const isReady = Boolean(readyScope)
  const isError = state.phase === "error"

  return (
    <section
      className={cn("rounded-md border bg-background p-3", className)}
      aria-labelledby="internal-trial-access-title"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <StatusIcon phase={state.phase} />
          <h2
            id="internal-trial-access-title"
            className="truncate text-xs font-medium"
          >
            内部试用
          </h2>
        </div>
        <Badge variant={isReady ? "secondary" : "outline"}>
          {statusBadgeLabel(state.phase)}
        </Badge>
      </div>

      <div
        className="mt-3 min-h-16 text-xs leading-5 text-muted-foreground"
        role={isError ? "alert" : undefined}
      >
        {isReady ? (
          <div className="grid gap-1">
            <span className="truncate text-foreground">
              {readyScope?.teamName}
            </span>
            <span className="truncate">当前操作：{readyScope?.actorName}</span>
          </div>
        ) : (
          <p>{state.message}</p>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {isReady ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={refresh}
              disabled={isBusy}
              aria-label="刷新内部试用状态"
              title="刷新状态"
            >
              <RefreshCcw />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={leave}
              disabled={isBusy}
              aria-label="退出内部试用"
              title="退出"
            >
              <LogOut />
            </Button>
            <Button size="sm" className="min-w-0 flex-1" asChild>
              <Link href="/sessions">
                继续
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            className="w-full"
            onClick={enter}
            disabled={isBusy}
          >
            {isBusy ? <Loader2 className="animate-spin" /> : <LogIn />}
            进入内部试用
          </Button>
        )}
      </div>
    </section>
  )
}

export function InternalTrialCockpit({
  className,
}: {
  className?: string
}) {
  const { enter, isBusy, leave, refresh, state } = useInternalTrialAccess()
  const readyScope = state.phase === "ready" ? state.scope : null
  const isReady = Boolean(readyScope)
  const isError = state.phase === "error"
  const readiness = useTrialWorkflowReadiness(readyScope)
  const [feedbackEvidenceState, setFeedbackEvidenceState] = useState<{
    evidence: V0TrialFeedbackEvidenceSummary | null
    teamId: string | null
  }>({
    evidence: null,
    teamId: null,
  })
  const feedbackEvidence =
    feedbackEvidenceState.teamId === (readyScope?.teamId ?? null)
      ? feedbackEvidenceState.evidence
      : null
  const handleEvidenceChange = useCallback(
    (evidence: V0TrialFeedbackEvidenceSummary | null) => {
      setFeedbackEvidenceState({
        evidence,
        teamId: readyScope?.teamId ?? null,
      })
    },
    [readyScope?.teamId],
  )
  const nextWorkflow = useMemo(() => {
    const nextStep = readiness.state.summary?.nextStep

    if (!nextStep) {
      return workflowPath[0]
    }

    return {
      title:
        readiness.state.summary?.status === "complete"
          ? `查看${nextStep.title}`
          : nextStep.nextActionLabel,
      href: nextStep.href,
      status: "可试用",
    }
  }, [readiness.state.summary])

  return (
    <section
      className={cn("rounded-lg border bg-card p-5 shadow-xs", className)}
      aria-labelledby="internal-trial-cockpit-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isReady ? "secondary" : "outline"}>
              {statusBadgeLabel(state.phase)}
            </Badge>
            <span className="text-xs text-muted-foreground">内部试用</span>
          </div>
          <h2
            id="internal-trial-cockpit-title"
            className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl"
          >
            {isReady ? "按 V0 流程开始试用" : "先进入内部试用团队"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isReady
              ? "从场次记录开始，依次补产品、资料、复盘、话术和下场任务。"
              : "进入演示团队后，可以从总览直接体验已打通的工作面。"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
          {isReady ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={refresh}
                disabled={isBusy}
              >
                {state.phase === "refreshing" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RefreshCcw />
                )}
                刷新状态
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={leave}
                disabled={isBusy}
              >
                {state.phase === "leaving" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LogOut />
                )}
                退出
              </Button>
              <Button asChild>
                <Link href={nextWorkflow.href}>
                  {nextWorkflow.title}
                  <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </>
          ) : (
            <Button type="button" onClick={enter} disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" /> : <LogIn />}
              进入内部试用
            </Button>
          )}
        </div>
      </div>

      {isReady ? <DemoScenarioGuidance className="mt-5" /> : null}

      <div
        className="mt-5 grid gap-3 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]"
        aria-live="polite"
      >
        <div className="rounded-md border bg-background p-4">
          <div className="flex items-center gap-2">
            <StatusIcon phase={state.phase} />
            <h3 className="text-sm font-semibold">团队状态</h3>
          </div>
          <Separator className="my-3" />
          {isReady ? (
            <dl className="grid gap-2 text-sm">
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">团队</dt>
                <dd className="truncate font-medium">{readyScope?.teamName}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">操作人</dt>
                <dd className="truncate">{readyScope?.actorName}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">下一步</dt>
                <dd>{nextWorkflow.title}</dd>
              </div>
            </dl>
          ) : (
            <p
              className="text-sm leading-6 text-muted-foreground"
              role={isError ? "alert" : undefined}
            >
              {state.message}
            </p>
          )}
        </div>

        <TrialWorkflowReadinessPanel
          onRefresh={readiness.refresh}
          state={readiness.state}
        />
      </div>

      {isReady ? (
        <div className="mt-5">
          <V0TrialReadinessCockpitPanel
            evidence={feedbackEvidence}
            isLoading={readiness.state.phase === "loading"}
            panelId="internal-trial-readiness-title"
            workflow={readiness.state.summary}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <V0TrialFeedbackPanel
          defaultWorkbench="overview"
          onEvidenceChange={handleEvidenceChange}
          scope={readyScope}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {primaryNavItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="motion-interactive grid min-h-24 gap-3 rounded-md border bg-background p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-center justify-between gap-3">
              <item.icon className="size-4 text-primary" />
              <Badge variant="outline">{item.status}</Badge>
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{item.title}</div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {item.description}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export function PublicTrialEntryPanel({
  className,
  continuePath,
}: {
  className?: string
  continuePath?: string
}) {
  const { enter, isBusy, leave, refresh, state } = useInternalTrialAccess()
  const readyScope = state.phase === "ready" ? state.scope : null
  const isReady = Boolean(readyScope)
  const isError = state.phase === "error"
  const readiness = useTrialWorkflowReadiness(readyScope)
  const [feedbackEvidenceState, setFeedbackEvidenceState] = useState<{
    evidence: V0TrialFeedbackEvidenceSummary | null
    teamId: string | null
  }>({
    evidence: null,
    teamId: null,
  })
  const feedbackEvidence =
    feedbackEvidenceState.teamId === (readyScope?.teamId ?? null)
      ? feedbackEvidenceState.evidence
      : null
  const handleEvidenceChange = useCallback(
    (evidence: V0TrialFeedbackEvidenceSummary | null) => {
      setFeedbackEvidenceState({
        evidence,
        teamId: readyScope?.teamId ?? null,
      })
    },
    [readyScope?.teamId],
  )
  const safeContinuePath = getSafePublicTrialNextPath(continuePath)
  const continueWorkflow =
    workflowPath.find((item) => item.href === safeContinuePath) ?? workflowPath[0]
  const continueToWorkbench = useCallback(() => {
    window.location.assign(safeContinuePath)
  }, [safeContinuePath])

  return (
    <section
      className={cn("rounded-lg border bg-card p-5 shadow-xs", className)}
      aria-labelledby="public-trial-entry-title"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isReady ? "secondary" : "outline"}>
              {statusBadgeLabel(state.phase)}
            </Badge>
            <span className="text-xs text-muted-foreground">试用访问</span>
          </div>
          <h2
            id="public-trial-entry-title"
            className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl"
          >
            {isReady ? "试用团队已准备好" : "进入演示团队后继续"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isReady
              ? "确认当前团队后，继续处理已开放的运营工作面。仅使用演示或脱敏数据。"
              : "这里用于内部评估和小范围试用，请只使用演示或脱敏数据。"}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row lg:justify-end">
          {isReady ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={refresh}
                disabled={isBusy}
              >
                {state.phase === "refreshing" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <RefreshCcw />
                )}
                刷新状态
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={leave}
                disabled={isBusy}
              >
                {state.phase === "leaving" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <LogOut />
                )}
                退出
              </Button>
              <Button
                type="button"
                onClick={continueToWorkbench}
                aria-label={`继续到${continueWorkflow.title}`}
              >
                继续到{continueWorkflow.title}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </>
          ) : (
            <Button type="button" onClick={enter} disabled={isBusy}>
              {isBusy ? <Loader2 className="animate-spin" /> : <LogIn />}
              进入试用团队
            </Button>
          )}
        </div>
      </div>

      {isReady ? <DemoScenarioGuidance className="mt-5" /> : null}

      <div
        className="mt-5 grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        aria-live="polite"
      >
        <div className="rounded-md border bg-background p-4">
          <div className="flex items-center gap-2">
            <StatusIcon phase={state.phase} />
            <h3 className="text-sm font-semibold">访问状态</h3>
          </div>
          <Separator className="my-3" />
          {isReady ? (
            <dl className="grid gap-2 text-sm">
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">团队</dt>
                <dd className="truncate font-medium">{readyScope?.teamName}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">操作人</dt>
                <dd className="truncate">{readyScope?.actorName}</dd>
              </div>
              <div className="grid gap-1">
                <dt className="text-xs text-muted-foreground">继续</dt>
                <dd>{continueWorkflow.title}</dd>
              </div>
            </dl>
          ) : (
            <p
              className="text-sm leading-6 text-muted-foreground"
              role={isError ? "alert" : undefined}
            >
              {state.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          {workflowPath.map((item, index) => {
            const isCurrent = item.href === safeContinuePath

            return (
              <Link
                key={item.href}
                href={
                  isReady
                    ? item.href
                    : `/trial?next=${encodeURIComponent(item.href)}`
                }
                className={cn(
                  "motion-interactive grid min-h-12 grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCurrent && "border-primary/50",
                )}
              >
                <Badge variant={isCurrent ? "secondary" : "outline"}>
                  0{index + 1}
                </Badge>
                <span className="min-w-0 truncate font-medium">{item.title}</span>
                <span className="flex items-center gap-2">
                  <Badge variant="outline">{item.status}</Badge>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mt-5">
        <TrialWorkflowReadinessPanel
          onRefresh={readiness.refresh}
          state={readiness.state}
        />
      </div>

      {isReady ? (
        <div className="mt-5">
          <V0TrialReadinessCockpitPanel
            evidence={feedbackEvidence}
            isLoading={readiness.state.phase === "loading"}
            panelId="public-trial-readiness-title"
            workflow={readiness.state.summary}
          />
        </div>
      ) : null}

      <div className="mt-5">
        <V0TrialFeedbackPanel
          defaultWorkbench="trial"
          onEvidenceChange={handleEvidenceChange}
          scope={readyScope}
        />
      </div>
    </section>
  )
}
