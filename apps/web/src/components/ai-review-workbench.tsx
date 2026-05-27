"use client"

import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  ClipboardList,
  FileWarning,
  GitBranch,
  Loader2,
  LogIn,
  RefreshCcw,
  Sparkles,
  ThumbsDown,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react"

import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  aiReviewMutationCsrfHeaderName,
  aiReviewMutationCsrfHeaderValue,
  authSessionBodyToScope,
  bootstrapBodyToScope,
  createAiReviewPreparePayload,
  createAiReviewFeedbackPayload,
  createAiReviewPromptVersionPayloadForMode,
  createAiReviewProviderPolicyForMode,
  defaultOperatorV0Scope,
  feedbackPriorityLabels,
  feedbackRouteLabels,
  feedbackSignalLabels,
  formatDateTime,
  isSessionReadyForAiReview,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readApiBody,
  recentAiReviewFeedback,
  readStoredOperatorV0Scope,
  reviewStateLabels,
  runStatusLabels,
  scopedApi,
  sectionTypeLabels,
  sessionAiReviewBlockers,
  storeOperatorV0Scope,
  summarizeAiReviewEvidenceConfidence,
  summarizeAiReviewFeedback,
  summarizeAiReviewQualityTriage,
  summarizeAiReviewSectionEvidence,
  summarizeSectionItems,
  userMessageFromAiReviewError,
  validationStatusLabels,
  type AiReviewApiErrorBody,
  type AiReviewDecisionView,
  type AiReviewEvidenceConfidenceSummary,
  type AiReviewFeedbackSignalView,
  type AiReviewFeedbackSignalType,
  type AiReviewGenerationMode,
  type AiReviewLiveModelStatus,
  type AiReviewQualityTriageSection,
  type AiReviewQualityTriageSummary,
  type AiReviewRunDetail,
  type AiReviewRunView,
  type AiReviewSectionEvidenceSummary,
  type AiReviewSectionView,
  type AuthSessionBody,
  type BootstrapBody,
  type DecisionBody,
  type FeedbackSignalBody,
  type PromptVersionBody,
  type RunCreateBody,
  type RunDetailBody,
  type RunExecuteBody,
  type RunListBody,
  type SessionListBody,
  type LiveModelStatusBody,
} from "@/lib/ai-review-v0-workflow"
import {
  createAiReviewDownstreamPayload,
  downstreamArtifactTypeForSection,
  isAcceptedSection,
  userMessageFromDownstreamError,
  type AiReviewDownstreamBody,
  type DownstreamApiErrorBody,
} from "@/lib/downstream-v0-workflow"
import type { OperatorV0Scope, SessionCaptureView } from "@/lib/session-capture-workflow"
import { blockerLabels, sessionStatusLabels } from "@/lib/session-capture-workflow"
import { cn } from "@/lib/utils"

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState =
  | "idle"
  | "entering"
  | "loading"
  | "preparing"
  | "executing"
  | "reviewing"
  | "feedback"
  | "downstream"

type ReviewDecision = AiReviewDecisionView["decision"]

const statusTone: Record<string, string> = {
  ready: "workbench-status-success",
  warning: "workbench-status-warning",
  info: "workbench-status-info",
  muted: "workbench-status-muted",
  danger: "workbench-status-warning",
}

function getSessionBlockerLabel(blocker: string): string {
  return blockerLabels[blocker] ?? (blocker === "not_review_ready" ? "未提交复盘" : "暂未就绪")
}

function updateRunList(runs: AiReviewRunView[], nextRun: AiReviewRunView) {
  const existingIndex = runs.findIndex((run) => run.id === nextRun.id)

  if (existingIndex === -1) {
    return [nextRun, ...runs]
  }

  return runs.map((run) => (run.id === nextRun.id ? nextRun : run))
}

export function AiReviewWorkbench() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => defaultOperatorV0Scope())
  const [sessions, setSessions] = useState<SessionCaptureView[]>([])
  const [runs, setRuns] = useState<AiReviewRunView[]>([])
  const [generationMode, setGenerationMode] = useState<AiReviewGenerationMode>("fake")
  const [liveModel, setLiveModel] = useState<AiReviewLiveModelStatus | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionCaptureView | null>(null)
  const [selectedRunDetail, setSelectedRunDetail] = useState<AiReviewRunDetail | null>(null)
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const readySessions = useMemo(
    () => sessions.filter((session) => isSessionReadyForAiReview(session)),
    [sessions],
  )
  const selectedRun = useMemo(() => {
    if (selectedRunDetail) {
      return selectedRunDetail.run
    }

    if (!selectedSession) {
      return null
    }

    return runs.find((run) => run.sessionId === selectedSession.id) ?? null
  }, [runs, selectedRunDetail, selectedSession])
  const selectedSessionReady = selectedSession
    ? isSessionReadyForAiReview(selectedSession)
    : false
  const canPrepare = Boolean(selectedSession && selectedSessionReady && !selectedRun && !isBusy)
  const liveModeReady = liveModel?.ready === true
  const effectiveGenerationMode =
    generationMode === "live" && liveModeReady ? "live" : "fake"
  const canExecute = Boolean(
    selectedRun?.status === "input_ready" &&
      !isBusy &&
      (generationMode === "fake" || liveModeReady),
  )
  const hasReviewOutput = Boolean(selectedRunDetail?.sections.length)
  const feedbackSummary = useMemo(
    () => summarizeAiReviewFeedback(selectedRunDetail?.feedbackSignals ?? []),
    [selectedRunDetail?.feedbackSignals],
  )
  const recentFeedback = useMemo(
    () => recentAiReviewFeedback(selectedRunDetail?.feedbackSignals ?? []),
    [selectedRunDetail?.feedbackSignals],
  )
  const evidenceConfidence = useMemo(
    () =>
      selectedRunDetail
        ? summarizeAiReviewEvidenceConfidence(selectedRunDetail)
        : null,
    [selectedRunDetail],
  )
  const qualityTriage = useMemo(
    () =>
      selectedRunDetail ? summarizeAiReviewQualityTriage(selectedRunDetail) : null,
    [selectedRunDetail],
  )

  const loadLiveModelStatus = useCallback(async (nextScope: OperatorV0Scope) => {
    const response = await fetch(
      scopedApi("/api/ai-review/live-model/status", nextScope),
      {
        credentials: "include",
        cache: "no-store",
      },
    )
    const body = await readApiBody<LiveModelStatusBody>(response)

    if (!response.ok || !("ok" in body) || body.ok !== true) {
      setLiveModel({
        enabled: false,
        configured: false,
        ready: false,
        provider: "deepseek",
        providerApi: "chat_completions",
        model: "deepseek-v4-pro",
        modeLabel: "真实模型",
        code: "AI_REVIEW_LIVE_MODEL_DISABLED",
        userMessage: userMessageFromAiReviewError(body as AiReviewApiErrorBody),
      })
      setGenerationMode("fake")
      return
    }

    setLiveModel(body.liveModel)
    if (!body.liveModel.ready) {
      setGenerationMode("fake")
    }
  }, [])

  const loadRunDetail = useCallback(
    async (nextScope: OperatorV0Scope, runId: string) => {
      const response = await fetch(
        scopedApi(`/api/ai-review/runs/${runId}`, nextScope),
        {
          credentials: "include",
          cache: "no-store",
        },
      )
      const body = await readApiBody<RunDetailBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromAiReviewError(body as AiReviewApiErrorBody))
      }

      setSelectedRunDetail(body.detail)
      setRuns((current) => updateRunList(current, body.detail.run))

      return body.detail
    },
    [],
  )

  const loadWorkspace = useCallback(
    async (nextScope: OperatorV0Scope) => {
      setActionState("loading")
      setError("")

      const [sessionsResponse, runsResponse] = await Promise.all([
        fetch(scopedApi("/api/sessions/captures", nextScope), {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(scopedApi("/api/ai-review/runs", nextScope), {
          credentials: "include",
          cache: "no-store",
        }),
      ])
      const [sessionsBody, runsBody] = await Promise.all([
        readApiBody<SessionListBody>(sessionsResponse),
        readApiBody<RunListBody>(runsResponse),
      ])

      if (
        !sessionsResponse.ok ||
        !("ok" in sessionsBody) ||
        sessionsBody.ok !== true
      ) {
        throw new Error(userMessageFromAiReviewError(sessionsBody as AiReviewApiErrorBody))
      }

      if (!runsResponse.ok || !("ok" in runsBody) || runsBody.ok !== true) {
        throw new Error(userMessageFromAiReviewError(runsBody as AiReviewApiErrorBody))
      }

      await loadLiveModelStatus(nextScope)

      setSessions(sessionsBody.sessions)
      setRuns(runsBody.runs)

      const nextSelectedSession =
        sessionsBody.sessions.find((session) => selectedSession?.id === session.id) ??
        sessionsBody.sessions.find((session) => isSessionReadyForAiReview(session)) ??
        sessionsBody.sessions[0] ??
        null
      setSelectedSession(nextSelectedSession)
      setSelectedRunDetail(null)

      const matchingRun = nextSelectedSession
        ? runsBody.runs.find((run) => run.sessionId === nextSelectedSession.id)
        : null

      if (matchingRun) {
        await loadRunDetail(nextScope, matchingRun.id)
      }

      setMessage(
        readySessions.length > 0 || sessionsBody.sessions.some(isSessionReadyForAiReview)
          ? "已加载可复盘场次"
          : "暂无可复盘场次，请先提交直播记录",
      )
    },
    [loadLiveModelStatus, loadRunDetail, readySessions.length, selectedSession?.id],
  )

  const verifyContext = useCallback(async () => {
    const nextScope = readStoredOperatorV0Scope()
    setActionState("loading")
    setError("")

    try {
      const response = await fetch(scopedApi("/api/auth/session", nextScope), {
        credentials: "include",
        cache: "no-store",
      })
      const body = await readApiBody<AuthSessionBody>(response)

      if ("authenticated" in body && body.authenticated === true) {
        const verifiedScope = authSessionBodyToScope(body)
        setScope(verifiedScope)
        storeOperatorV0Scope(verifiedScope)
        setPhase("ready")
        await loadWorkspace(verifiedScope)
      } else {
        setPhase("entry")
        setMessage("进入运营工作台后可以生成 V0 复盘")
      }
    } catch (caught) {
      setPhase("error")
      setError(caught instanceof Error ? caught.message : "登录状态检查失败")
    } finally {
      setActionState("idle")
    }
  }, [loadWorkspace])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void verifyContext()
    }, 0)

    return () => window.clearTimeout(timer)
  }, [verifyContext])

  async function enterOperatorV0() {
    setActionState("entering")
    setError("")

    try {
      const response = await fetch("/api/auth/operator-v0-session", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          [operatorV0BootstrapCsrfHeaderName]: operatorV0BootstrapCsrfHeaderValue,
        },
      })
      const body = await readApiBody<BootstrapBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromAiReviewError(body as AiReviewApiErrorBody))
      }

      const nextScope = bootstrapBodyToScope(body)
      setScope(nextScope)
      storeOperatorV0Scope(nextScope)
      setPhase("ready")
      await loadWorkspace(nextScope)
      setMessage("已进入智能复盘工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  async function selectSession(session: SessionCaptureView) {
    setSelectedSession(session)
    setSelectedRunDetail(null)
    setError("")
    setMessage(
      isSessionReadyForAiReview(session)
        ? "已选择可复盘场次"
        : "该场次需要先提交后再复盘",
    )

    const matchingRun = runs.find((run) => run.sessionId === session.id)

    if (!matchingRun) {
      return
    }

    setActionState("loading")
    try {
      await loadRunDetail(scope, matchingRun.id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "加载复盘详情失败")
    } finally {
      setActionState("idle")
    }
  }

  async function prepareRun() {
    if (!selectedSession || !canPrepare) {
      return
    }

    setActionState("preparing")
    setError("")

    try {
      const response = await fetch(scopedApi("/api/ai-review/runs", scope), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
        },
        body: JSON.stringify(createAiReviewPreparePayload(selectedSession)),
      })
      const body = await readApiBody<RunCreateBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromAiReviewError(body as AiReviewApiErrorBody))
      }

      setRuns((current) => updateRunList(current, body.run))
      await loadRunDetail(scope, body.run.id)
      setMessage("复盘输入已准备好")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "准备复盘失败")
    } finally {
      setActionState("idle")
    }
  }

  async function executeRun() {
    if (!selectedRun || !canExecute) {
      return
    }

    setActionState("executing")
    setError("")

    try {
      const runMode = effectiveGenerationMode
      const promptResponse = await fetch(scopedApi("/api/ai-review/prompt-versions", scope), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
        },
        body: JSON.stringify(createAiReviewPromptVersionPayloadForMode(runMode)),
      })
      const promptBody = await readApiBody<PromptVersionBody>(promptResponse)

      if (!promptResponse.ok || !("ok" in promptBody) || promptBody.ok !== true) {
        throw new Error(userMessageFromAiReviewError(promptBody as AiReviewApiErrorBody))
      }

      const executeResponse = await fetch(
        scopedApi(
          `/api/ai-review/runs/${selectedRun.id}/${
            runMode === "live" ? "execute" : "execute-v0"
          }`,
          scope,
        ),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
          },
          body: JSON.stringify({
            promptVersionId: promptBody.promptVersion.id,
            providerPolicy: createAiReviewProviderPolicyForMode(runMode, liveModel),
          }),
        },
      )
      const executeBody = await readApiBody<RunExecuteBody>(executeResponse)

      if (!executeResponse.ok || !("ok" in executeBody) || executeBody.ok !== true) {
        throw new Error(userMessageFromAiReviewError(executeBody as AiReviewApiErrorBody))
      }

      setSelectedRunDetail(executeBody.result.detail)
      setRuns((current) => updateRunList(current, executeBody.result.detail.run))
      setMessage(runMode === "live" ? "真实模型复盘已生成，需人工审核" : "复盘建议已生成，需人工审核")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "生成复盘失败")
    } finally {
      setActionState("idle")
    }
  }

  async function recordDecision(section: AiReviewSectionView, decision: ReviewDecision) {
    if (!selectedRun || isBusy) {
      return
    }

    setActionState("reviewing")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/ai-review/runs/${selectedRun.id}/decisions`, scope),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
          },
          body: JSON.stringify({
            targetType: "section",
            targetId: section.id,
            decision,
            reason:
              decision === "accept"
                ? "V0 浏览器工作流采纳该复盘区块"
                : "V0 浏览器工作流标记该复盘区块暂不使用",
          }),
        },
      )
      const body = await readApiBody<DecisionBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromAiReviewError(body as AiReviewApiErrorBody))
      }

      let feedbackSaved = true
      try {
        await saveFeedbackSignal(
          section,
          decision === "accept" ? "accepted" : "rejected",
        )
      } catch {
        feedbackSaved = false
      }

      await loadRunDetail(scope, selectedRun.id)
      setMessage(
        decision === "accept"
          ? feedbackSaved
            ? "已采纳该建议，并记录反馈信号"
            : "已采纳该建议，反馈信号暂未记录"
          : feedbackSaved
            ? "已记录审核决定和反馈信号"
            : "已记录审核决定，反馈信号暂未记录",
      )
      if (!feedbackSaved) {
        setError("审核结果已保存，反馈信号暂未记录，可稍后再标记质量问题。")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存审核结果失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveFeedbackSignal(
    section: AiReviewSectionView,
    signalType: AiReviewFeedbackSignalType,
  ) {
    if (!selectedRun) {
      throw new Error("请先选择复盘记录")
    }

    const response = await fetch(
      scopedApi(`/api/ai-review/runs/${selectedRun.id}/feedback-signals`, scope),
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
        },
        body: JSON.stringify(createAiReviewFeedbackPayload(section, signalType)),
      },
    )
    const body = await readApiBody<FeedbackSignalBody>(response)

    if (!response.ok || !("ok" in body) || body.ok !== true) {
      throw new Error(userMessageFromAiReviewError(body as AiReviewApiErrorBody))
    }

    return body.signal
  }

  async function recordQualityFeedback(
    section: AiReviewSectionView,
    signalType: AiReviewFeedbackSignalType,
  ) {
    if (!selectedRun || isBusy) {
      return
    }

    setActionState("feedback")
    setError("")

    try {
      await saveFeedbackSignal(section, signalType)
      await loadRunDetail(scope, selectedRun.id)
      setMessage(`已记录${feedbackSignalLabels[signalType]}反馈`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存反馈失败")
    } finally {
      setActionState("idle")
    }
  }

  async function createDownstreamReference(section: AiReviewSectionView) {
    if (!selectedRun || isBusy) {
      return
    }

    const artifactType = downstreamArtifactTypeForSection(section)

    if (!artifactType) {
      setError("请先采纳该建议")
      return
    }

    setActionState("downstream")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/ai-review/runs/${selectedRun.id}/downstream-artifacts`, scope),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [aiReviewMutationCsrfHeaderName]: aiReviewMutationCsrfHeaderValue,
          },
          body: JSON.stringify(createAiReviewDownstreamPayload(section)),
        },
      )
      const body = await readApiBody<AiReviewDownstreamBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromDownstreamError(body as DownstreamApiErrorBody))
      }

      let feedbackSaved = true
      try {
        await saveFeedbackSignal(section, "downstream_used")
      } catch {
        feedbackSaved = false
      }

      await loadRunDetail(scope, selectedRun.id)
      setMessage(
        feedbackSaved
          ? "已记录下游草稿来源和复用反馈"
          : "已记录下游草稿来源，复用反馈暂未记录",
      )

      if (feedbackSaved) {
        window.location.assign(
          artifactType === "next_session_task" ? "/next-actions" : "/talk-tracks",
        )
      } else {
        setError("下游草稿来源已保存，复用反馈暂未记录，可稍后在复盘页补充。")
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建下游来源失败")
    } finally {
      setActionState("idle")
    }
  }

  if (phase === "checking") {
    return (
      <div className="workspace-page">
        <MotionPanel className="workbench-panel p-6">
          <StatusMessage icon={Loader2} title="正在载入" message={message} spin />
        </MotionPanel>
      </div>
    )
  }

  if (phase === "entry" || phase === "error") {
    return (
      <div className="workspace-page xl:grid-cols-[minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">智能复盘</Badge>
                  <Badge variant="outline">需要进入团队</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  进入复盘工作台
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  进入后可以选择已提交场次，生成本地 V0 复盘建议，并记录人工审核结果。
                </p>
              </div>
              <Button
                onClick={enterOperatorV0}
                disabled={actionState === "entering"}
                className="w-full sm:w-fit"
              >
                {actionState === "entering" ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <LogIn data-icon="inline-start" />
                )}
                进入工作台
              </Button>
            </div>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <EntryPoint
              icon={ClipboardList}
              title="选择场次"
              description="只使用当前团队已提交的直播记录。"
            />
            <EntryPoint
              icon={Sparkles}
              title="生成建议"
              description="本地 V0 生成，不调用正式 AI 服务。"
            />
            <EntryPoint
              icon={ClipboardCheck}
              title="人工审核"
              description="采纳前先确认，不自动发布事实。"
            />
          </div>
          {error ? (
            <div className="border-t px-5 py-4" role="alert">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}
        </MotionPanel>
      </div>
    )
  }

  return (
    <div className="workspace-page xl:grid-cols-[minmax(260px,0.34fr)_minmax(0,1fr)_minmax(300px,var(--workspace-aside-width-md))]">
      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="secondary">已进入团队</Badge>
              <h2 className="mt-3 truncate text-base font-semibold">{scope.teamName}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {scope.actorName} · {scope.tenantName}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="重新加载复盘工作台"
              onClick={() => void loadWorkspace(scope).finally(() => setActionState("idle"))}
              disabled={isBusy}
            >
              <RefreshCcw />
            </Button>
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel overflow-hidden" delay={0.04}>
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">可复盘场次</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              从直播采集提交后进入这里。
            </p>
          </div>
          <div className="max-h-[560px] divide-y overflow-y-auto">
            {sessions.length === 0 ? (
              <EmptyList message="暂无场次。请先到直播采集创建并提交。" />
            ) : (
              sessions.map((session, index) => {
                const ready = isSessionReadyForAiReview(session)
                const blockers = sessionAiReviewBlockers(session)

                return (
                  <MotionListItem key={session.id} delay={index * 0.02}>
                    <button
                      type="button"
                      onClick={() => void selectSession(session)}
                      className={cn(
                        "w-full px-5 py-4 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                        selectedSession?.id === session.id && "bg-muted",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 break-words text-sm font-medium leading-6">
                          {session.title}
                        </span>
                        <Badge variant={ready ? "secondary" : "outline"}>
                          {ready ? "可复盘" : sessionStatusLabels[session.status]}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(session.sessionDate)} · 问题{" "}
                        {session.customerQuestions.length} · 异议{" "}
                        {session.customerObjections.length}
                      </p>
                      {!ready ? (
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                          {blockers.map(getSessionBlockerLabel).join("、")}
                        </p>
                      ) : null}
                    </button>
                  </MotionListItem>
                )
              })
            )}
          </div>
        </MotionPanel>
      </aside>

      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden">
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">智能复盘</Badge>
                  <Badge variant={selectedSessionReady ? "secondary" : "outline"}>
                    {selectedSessionReady ? "场次可复盘" : "等待提交场次"}
                  </Badge>
                  <Badge variant={effectiveGenerationMode === "live" ? "secondary" : "outline"}>
                    {effectiveGenerationMode === "live" ? "真实模型" : "本地演示"}
                  </Badge>
                  {selectedRun ? (
                    <Badge variant="outline">{runStatusLabels[selectedRun.status]}</Badge>
                  ) : null}
                </div>
                <h2 className="mt-3 break-words text-2xl font-semibold tracking-normal md:text-3xl">
                  {selectedSession?.title ?? "选择一场直播记录"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  先确认场次内容，再生成复盘建议。建议必须人工采纳后，后续才能进入话术或任务。
                </p>
                <GenerationModeControl
                  mode={generationMode}
                  liveModel={liveModel}
                  busy={isBusy}
                  onChange={setGenerationMode}
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:w-[300px] lg:grid-cols-1">
                <Button
                  onClick={prepareRun}
                  disabled={!canPrepare}
                  aria-label="准备智能复盘输入"
                >
                  {actionState === "preparing" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <ClipboardList data-icon="inline-start" />
                  )}
                  准备复盘
                </Button>
                <Button
                  onClick={executeRun}
                  disabled={!canExecute}
                  variant={canExecute ? "default" : "outline"}
                  aria-label="生成智能复盘建议"
                >
                  {actionState === "executing" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Sparkles data-icon="inline-start" />
                  )}
                  {effectiveGenerationMode === "live" ? "真实模型生成" : "生成建议"}
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-5 md:divide-x md:divide-y-0">
            <Metric label="可复盘场次" value={`${readySessions.length}`} description="来自已提交直播记录" />
            <Metric
              label="生成模式"
              value={effectiveGenerationMode === "live" ? "真实模型" : "本地演示"}
              description={liveModel?.userMessage ?? "正在检查真实模型状态"}
            />
            <Metric
              label="复盘状态"
              value={selectedRun ? runStatusLabels[selectedRun.status] : "未准备"}
              description="准备后可生成建议"
            />
            <Metric
              label="输出区块"
              value={selectedRunDetail ? `${selectedRunDetail.sections.length}` : "0"}
              description="摘要、诊断、问题、异议等"
            />
            <Metric
              label="人工审核"
              value={selectedRunDetail ? `${selectedRunDetail.decisions.length}` : "0"}
              description="采纳、拒绝或重生成"
            />
          </div>
        </MotionPanel>

        {error ? (
          <MotionPanel
            className="workbench-panel border-destructive/30 p-5"
            delay={0.03}
          >
            <div role="alert">
              <StatusMessage icon={AlertTriangle} title="操作失败" message={error} />
            </div>
          </MotionPanel>
        ) : null}

        {selectedSession ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <MotionPanel delay={0.06}>
              <section className="workbench-panel h-full" aria-labelledby="review-input-title">
                <SectionHeader
                  id="review-input-title"
                  icon={ClipboardList}
                  title="场次输入"
                  description="这些人工记录会进入本次复盘快照。"
                  badge={sessionStatusLabels[selectedSession.status]}
                />
                <div className="divide-y">
                  <FactRow label="直播平台" value={selectedSession.platform} state="人工记录" />
                  <FactRow label="主播/职责" value={selectedSession.hostRoles.map((host) => `${host.displayName}：${host.responsibility}`).join("；") || "暂无"} state="人工记录" />
                  <FactRow label="商品顺序" value={selectedSession.productOrder.map((product) => product.displayModel).join(" -> ") || "暂无"} state="人工记录" />
                  <FactRow label="场次摘要" value={selectedSession.summary || "暂无摘要"} state="人工记录" />
                </div>
              </section>
            </MotionPanel>

            <MotionPanel delay={0.08}>
              <section className="workbench-panel h-full" aria-labelledby="review-context-title">
                <SectionHeader
                  id="review-context-title"
                  icon={Bot}
                  title="复盘上下文"
                  description="本轮 V0 使用可审核基线，不自动写入知识库。"
                  badge={selectedRunDetail?.knowledgeSnapshot ? "已准备" : "待准备"}
                />
                <div className="grid gap-3 p-5">
                  <ContextItem
                    label="问题数量"
                    value={`${selectedSession.customerQuestions.length}`}
                    description={selectedSession.customerQuestions[0]?.questionText ?? "暂无问题记录"}
                  />
                  <ContextItem
                    label="异议数量"
                    value={`${selectedSession.customerObjections.length}`}
                    description={selectedSession.customerObjections[0]?.content ?? "暂无异议记录"}
                  />
                  <ContextItem
                    label="来源基线"
                    value={selectedRunDetail?.knowledgeSnapshot?.reviewState ?? "待准备"}
                    description="仅作为本地 V0 复盘依据，正式知识审核后再复用。"
                  />
                </div>
              </section>
            </MotionPanel>
          </div>
        ) : (
          <MotionPanel className="workbench-panel p-6" delay={0.06}>
            <StatusMessage
              icon={FileWarning}
              title="暂无可复盘场次"
              message="请先到直播采集创建场次并提交，再回到这里生成复盘建议。"
            />
          </MotionPanel>
        )}

        {selectedRunDetail && evidenceConfidence ? (
          <MotionPanel delay={0.09}>
            <EvidenceConfidencePanel summary={evidenceConfidence} />
          </MotionPanel>
        ) : null}

        {selectedRunDetail && qualityTriage ? (
          <MotionPanel delay={0.095}>
            <QualityTriagePanel summary={qualityTriage} />
          </MotionPanel>
        ) : null}

        <MotionPanel delay={0.1}>
          <section className="workbench-panel" aria-labelledby="analysis-output-title">
            <SectionHeader
              id="analysis-output-title"
              icon={Sparkles}
              title="复盘结果"
              description="生成后先审核，再用于话术和任务。"
              badge={hasReviewOutput ? "已生成" : "待生成"}
            />
            {hasReviewOutput && selectedRunDetail ? (
              <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
                {selectedRunDetail.sections.map((section, index) => (
                  <ReviewSectionCard
                    key={section.id}
                    section={section}
                    evidence={summarizeAiReviewSectionEvidence(
                      selectedRunDetail,
                      section,
                    )}
                    triage={
                      qualityTriage?.sections.find(
                        (item) => item.sectionId === section.id,
                      ) ?? null
                    }
                    delay={index * 0.025}
                    busy={isBusy}
                    feedbackSignals={selectedRunDetail.feedbackSignals.filter(
                      (signal) => signal.sectionId === section.id,
                    )}
                    onDecision={(decision) => void recordDecision(section, decision)}
                    onFeedback={(signalType) =>
                      void recordQualityFeedback(section, signalType)
                    }
                    onDownstream={() => void createDownstreamReference(section)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-5">
                <StatusMessage
                  icon={CircleDashed}
                  title="尚未生成建议"
                  message="选择可复盘场次后，先准备复盘，再生成本地 V0 建议。"
                />
              </div>
            )}
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            <h2 className="text-base font-semibold">运行记录</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {runs.length === 0 ? (
              <p className="text-sm leading-6 text-muted-foreground">暂无复盘记录。</p>
            ) : (
              runs.slice(0, 6).map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => void loadRunDetail(scope, run.id)}
                  className={cn(
                    "workbench-row w-full p-3 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                    selectedRun?.id === run.id && "bg-muted",
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {runStatusLabels[run.status]}
                    </span>
                    <Badge variant="outline">{run.requestedSections.length} 类</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {formatDateTime(run.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.15}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary" />
            <h2 className="text-base font-semibold">校验提示</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {selectedRunDetail?.validationResults.length ? (
              selectedRunDetail.validationResults.map((result) => (
                <div key={result.id} className="workbench-row p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {validationStatusLabels[result.status]}
                    </span>
                    <Badge variant="outline">{result.checkType}</Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {result.message}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                生成后会显示结构、来源、敏感内容和长文本校验。
              </p>
            )}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.18}>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="size-4 text-primary" />
            <h2 className="text-base font-semibold">反馈学习</h2>
          </div>
          <div className="mt-4">
            {selectedRunDetail ? (
              <FeedbackLearningSummary
                summary={feedbackSummary}
                recentFeedback={recentFeedback}
              />
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                生成并审核建议后，这里会显示反馈信号。
              </p>
            )}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.2}>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            <h2 className="text-base font-semibold">后续去向</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <NextStep label="话术资产" description="采纳后的话术候选可进入话术工作台。" />
            <NextStep label="短视频选题" description="高频问题可以转成短视频钩子草稿。" />
            <NextStep label="下场任务" description="下场动作可进入任务工作台继续推进。" />
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
  icon: ComponentType<{ className?: string }>
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
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <Badge variant="outline" className="w-fit">
        {badge}
      </Badge>
    </div>
  )
}

function Metric({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <MotionListItem className="min-h-28 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className={cn("rounded-4xl border px-2 py-0.5 text-xs font-medium", statusTone.info)}>
          {value}
        </span>
      </div>
      <p className="mt-5 text-xs leading-5 text-muted-foreground">{description}</p>
    </MotionListItem>
  )
}

function EntryPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="workbench-row min-h-28 p-4">
      <Icon className="size-4 text-primary" />
      <h3 className="mt-4 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}

function GenerationModeControl({
  mode,
  liveModel,
  busy,
  onChange,
}: {
  mode: AiReviewGenerationMode
  liveModel: AiReviewLiveModelStatus | null
  busy: boolean
  onChange: (mode: AiReviewGenerationMode) => void
}) {
  const liveReady = liveModel?.ready === true

  return (
    <div className="mt-4 grid gap-2">
      <div
        className="grid w-full max-w-xl grid-cols-2 rounded-lg border bg-surface p-1"
        aria-label="选择复盘生成模式"
      >
        <button
          type="button"
          onClick={() => onChange("fake")}
          disabled={busy}
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
            mode === "fake" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          本地演示
        </button>
        <button
          type="button"
          onClick={() => liveReady && onChange("live")}
          disabled={busy || !liveReady}
          className={cn(
            "min-h-10 rounded-md px-3 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60",
            mode === "live" && liveReady
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          真实模型
        </button>
      </div>
      <p className="max-w-xl text-xs leading-5 text-muted-foreground" aria-live="polite">
        {liveModel?.userMessage ?? "正在检查真实模型状态"}
      </p>
    </div>
  )
}

function StatusMessage({
  icon: Icon,
  title,
  message,
  spin = false,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  message: string
  spin?: boolean
}) {
  return (
    <div className="grid grid-cols-[36px_1fr] gap-3">
      <span className="workbench-icon-surface">
        <Icon className={cn("size-4 text-primary", spin && "animate-spin")} />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-muted-foreground">
          {message}
        </span>
      </span>
    </div>
  )
}

function EmptyList({ message }: { message: string }) {
  return <div className="p-5 text-sm leading-6 text-muted-foreground">{message}</div>
}

function FactRow({
  label,
  value,
  state,
}: {
  label: string
  value: string
  state: string
}) {
  return (
    <div className="grid gap-2 px-5 py-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium">{label}</span>
        <Badge variant="secondary">{state}</Badge>
      </div>
      <p className="break-words leading-6 text-muted-foreground">{value}</p>
    </div>
  )
}

function ContextItem({
  label,
  value,
  description,
}: {
  label: string
  value: string
  description: string
}) {
  return (
    <div className="workbench-row p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">{value}</Badge>
      </div>
      <p className="mt-3 break-words text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function EvidenceConfidencePanel({
  summary,
}: {
  summary: AiReviewEvidenceConfidenceSummary
}) {
  const metricItems = [
    {
      label: "证据阶段",
      value: summary.stage.label,
      description: summary.stage.description,
      tone: summary.stage.tone,
    },
    {
      label: "整体置信",
      value: summary.confidence.label,
      description: summary.confidence.description,
      tone: summary.confidence.tone,
    },
    {
      label: "来源覆盖",
      value: summary.sourceCoverage.label,
      description: `${summary.sourceCoverage.sectionsWithSources}/${summary.sourceCoverage.totalSections} 个区块有来源，合计 ${summary.sourceCoverage.totalSourceRefs} 条引用`,
      tone: summary.sourceCoverage.tone,
    },
    {
      label: "校验状态",
      value: summary.validation.label,
      description: `${summary.validation.warningCount} 个提醒，${summary.validation.blockerCount} 个阻断`,
      tone: summary.validation.tone,
    },
    {
      label: "人工审核",
      value: summary.reviewProgress.label,
      description: `${summary.reviewProgress.acceptedSections} 个采纳，${summary.reviewProgress.rejectedSections} 个暂不用，${summary.reviewProgress.pendingSections} 个待审核`,
      tone: summary.reviewProgress.tone,
    },
    {
      label: "反馈热点",
      value: summary.feedback.hotspotLabel,
      description: summary.feedback.hotspotDescription,
      tone: summary.feedback.tone,
    },
  ]

  return (
    <section className="workbench-panel" aria-labelledby="evidence-confidence-title">
      <SectionHeader
        id="evidence-confidence-title"
        icon={ClipboardCheck}
        title="证据可信度"
        description="先看证据和复核状态，再决定是否进入下游。"
        badge={summary.nextAction.label}
      />
      <div className="grid gap-0 divide-y md:grid-cols-3 md:divide-x md:divide-y-0 xl:grid-cols-6">
        {metricItems.map((item) => (
          <EvidenceMetric key={item.label} {...item} />
        ))}
      </div>
      <div className="border-t px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">下一步</Badge>
              <Badge
                variant="outline"
                className={statusTone[summary.nextAction.tone]}
              >
                {summary.downstreamReady ? "已有可下游区块" : "尚未准备下游"}
              </Badge>
            </div>
            <p className="mt-2 break-words text-sm font-medium">
              {summary.nextAction.label}
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
              {summary.nextAction.description}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn("w-fit", statusTone[summary.stage.tone])}
          >
            {summary.stage.label}
          </Badge>
        </div>
      </div>
    </section>
  )
}

function EvidenceMetric({
  label,
  value,
  description,
  tone,
}: {
  label: string
  value: string
  description: string
  tone: AiReviewEvidenceConfidenceSummary["stage"]["tone"]
}) {
  return (
    <div className="min-h-28 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span
          className={cn(
            "rounded-4xl border px-2 py-0.5 text-xs font-medium",
            statusTone[tone],
          )}
        >
          {value}
        </span>
      </div>
      <p className="mt-5 break-words text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}

function QualityTriagePanel({
  summary,
}: {
  summary: AiReviewQualityTriageSummary
}) {
  const visibleSections = summary.sections
    .filter(
      (section) =>
        section.priorityKey !== "downstream_ready" &&
        section.priorityKey !== "review_complete",
    )
    .slice(0, 4)
  const sectionsToShow = visibleSections.length
    ? visibleSections
    : summary.sections.slice(0, 4)

  return (
    <section className="workbench-panel" aria-labelledby="quality-triage-title">
      <SectionHeader
        id="quality-triage-title"
        icon={AlertTriangle}
        title="质量卡点"
        description="把复盘问题转成可处理的修复路径。"
        badge={summary.priority.label}
      />
      <div className="grid gap-0 divide-y lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:divide-x lg:divide-y-0">
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className={statusTone[summary.priority.tone]}
            >
              {summary.priority.label}
            </Badge>
            <Badge variant="secondary">{summary.repairRouteLabel}</Badge>
            <Badge variant="outline">
              {summary.affectedSections}/{summary.totalSections} 个需处理
            </Badge>
          </div>
          <p className="mt-3 break-words text-sm font-medium">
            {summary.nextAction.label}
          </p>
          <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
            {summary.nextAction.description}
          </p>
          <div className="mt-4 rounded-lg border bg-surface px-3 py-2 text-xs leading-5 text-muted-foreground">
            {summary.downstreamReady
              ? "已有人工采纳区块可进入下游草稿，发布和任务完成仍需在下游工作台确认。"
              : "先处理质量卡点，再把建议带到话术或任务工作台。"}
          </div>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {sectionsToShow.length ? (
            sectionsToShow.map((section) => (
              <div key={section.sectionId} className="workbench-row p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {sectionTypeLabels[section.sectionType]}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={statusTone[section.tone]}
                  >
                    {section.priorityLabel}
                  </Badge>
                </div>
                <p className="mt-2 break-words text-sm font-medium">
                  {section.title}
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-muted-foreground">
                  {section.guidanceDescription}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm leading-6 text-muted-foreground">
              生成复盘建议后会显示需要处理的区块。
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

function ReviewSectionCard({
  section,
  evidence,
  triage,
  delay,
  busy,
  feedbackSignals,
  onDecision,
  onFeedback,
  onDownstream,
}: {
  section: AiReviewSectionView
  evidence: AiReviewSectionEvidenceSummary
  triage: AiReviewQualityTriageSection | null
  delay: number
  busy: boolean
  feedbackSignals: AiReviewFeedbackSignalView[]
  onDecision: (decision: ReviewDecision) => void
  onFeedback: (signalType: AiReviewFeedbackSignalType) => void
  onDownstream: () => void
}) {
  const reviewed = section.reviewState !== "pending"
  const downstreamTarget = downstreamTargetForSection(section)
  const canCreateDownstream = Boolean(downstreamTarget && isAcceptedSection(section))
  const recentSectionFeedback = recentAiReviewFeedback(feedbackSignals, 3)

  return (
    <MotionListItem
      delay={delay}
      className="motion-interactive workbench-row flex min-h-72 flex-col p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Sparkles className="size-4 text-primary" />
          <h3 className="mt-3 break-words text-sm font-semibold">
            {section.title || sectionTypeLabels[section.sectionType]}
          </h3>
        </div>
        <Badge variant="outline">{reviewStateLabels[section.reviewState]}</Badge>
      </div>
      <p className="mt-3 break-words text-sm leading-6 text-muted-foreground">
        {section.summary}
      </p>
      <div className="mt-3 rounded-lg border bg-surface px-3 py-2 text-xs leading-5 text-muted-foreground">
        {summarizeSectionItems(section.items)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge variant="secondary">{sectionTypeLabels[section.sectionType]}</Badge>
        <Badge variant="outline">{evidence.confidenceLabel}</Badge>
        <Badge variant="outline">{evidence.sourceLabel}</Badge>
      </div>
      {triage ? (
        <div className={cn("mt-3 rounded-lg border px-3 py-2", statusTone[triage.tone])}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{triage.guidanceLabel}</Badge>
            <Badge variant="outline">{triage.repairRouteLabel}</Badge>
            {triage.repairReasons.slice(0, 3).map((label) => (
              <Badge key={label} variant="outline">
                {label}
              </Badge>
            ))}
          </div>
          <p className="mt-2 break-words text-xs leading-5">
            {triage.guidanceDescription}
          </p>
        </div>
      ) : null}
      <div className={cn("mt-3 rounded-lg border px-3 py-2", statusTone[evidence.tone])}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{evidence.guidanceLabel}</Badge>
          {evidence.issueLabels.slice(0, 3).map((label) => (
            <Badge key={label} variant="outline">
              {label}
            </Badge>
          ))}
        </div>
        <p className="mt-2 break-words text-xs leading-5">
          {evidence.guidanceDescription}
        </p>
      </div>
      {recentSectionFeedback.length ? (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="最近反馈">
          {recentSectionFeedback.map((signal) => (
            <Badge key={signal.id} variant="outline">
              {feedbackSignalLabels[signal.signalType]}
            </Badge>
          ))}
        </div>
      ) : null}
      <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
        <Button
          size="sm"
          onClick={() => onDecision("accept")}
          disabled={busy || reviewed}
        >
          <CheckCircle2 data-icon="inline-start" />
          采纳
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDecision("reject")}
          disabled={busy || reviewed}
        >
          <ThumbsDown data-icon="inline-start" />
          暂不用
        </Button>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onFeedback("missing_knowledge")}
          disabled={busy}
          title="标记缺少可审核知识"
        >
          <AlertTriangle data-icon="inline-start" />
          缺知识
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onFeedback("wrong_source")}
          disabled={busy}
          title="标记来源或依据不准确"
        >
          <AlertTriangle data-icon="inline-start" />
          来源不准
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onFeedback("evidence_weak")}
          disabled={busy}
          title="标记证据不足"
        >
          <AlertTriangle data-icon="inline-start" />
          证据弱
        </Button>
      </div>
      {downstreamTarget ? (
        <Button
          size="sm"
          variant={
            canCreateDownstream && evidence.downstreamState !== "review_issue"
              ? "default"
              : "outline"
          }
          onClick={onDownstream}
          disabled={busy || !canCreateDownstream}
          className="mt-2 w-full"
        >
          {busy ? (
            <Loader2 className="animate-spin" data-icon="inline-start" />
          ) : (
            <ArrowRight data-icon="inline-start" />
          )}
          {canCreateDownstream ? downstreamTarget.actionLabel : "采纳后可创建"}
        </Button>
      ) : null}
    </MotionListItem>
  )
}

function FeedbackLearningSummary({
  summary,
  recentFeedback,
}: {
  summary: ReturnType<typeof summarizeAiReviewFeedback>
  recentFeedback: AiReviewFeedbackSignalView[]
}) {
  const metrics = [
    ["采纳", summary.accepted],
    ["暂不用", summary.rejected],
    ["缺知识", summary.missingKnowledge],
    ["来源不准", summary.wrongSource],
    ["证据弱", summary.evidenceWeak],
    ["下游使用", summary.downstreamUsed],
    ["待复核", summary.routedReview],
  ] as const

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="workbench-row min-h-16 p-3">
            <div className="text-xs text-muted-foreground">{label}</div>
            <div className="mt-1 text-lg font-semibold">{value}</div>
          </div>
        ))}
      </div>
      {summary.total === 0 ? (
        <p className="text-sm leading-6 text-muted-foreground">
          暂无反馈。先审核生成区块，再把可用建议交给下游工作台。
        </p>
      ) : (
        <div className="grid gap-2">
          {recentFeedback.map((signal) => (
            <div key={signal.id} className="workbench-row p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {feedbackSignalLabels[signal.signalType]}
                </Badge>
                <Badge variant="outline">
                  {feedbackRouteLabels[signal.routesTo]}
                </Badge>
                <Badge variant="outline">
                  {feedbackPriorityLabels[signal.reviewPriority]}
                </Badge>
              </div>
              <p className="mt-2 break-words text-xs leading-5 text-muted-foreground">
                {signal.reason}
              </p>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs leading-5 text-muted-foreground">
        反馈只进入评测或复核，不会自动改知识库。
      </p>
    </div>
  )
}

function downstreamTargetForSection(section: AiReviewSectionView):
  | {
      actionLabel: string
    }
  | null {
  if (section.sectionType === "talk_track_candidate") {
    return {
      actionLabel: "去创建话术草稿",
    }
  }

  if (section.sectionType === "short_video_topic") {
    return {
      actionLabel: "去创建短视频钩子",
    }
  }

  if (section.sectionType === "next_session_action") {
    return {
      actionLabel: "去创建下场任务",
    }
  }

  return null
}

function NextStep({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="workbench-row p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Badge variant="outline">待接入</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  )
}
