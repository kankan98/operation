"use client"

import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  ClipboardList,
  Loader2,
  LogIn,
  Plus,
  RefreshCcw,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from "react"

import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  blockerLabels,
  createDefaultSessionCaptureForm,
  createSessionCaptureDraftPayload,
  createSessionCapturePayload,
  isSessionFormReady,
  operatorV0BootstrapCsrfHeaderName,
  operatorV0BootstrapCsrfHeaderValue,
  readinessLabels,
  sessionCaptureMutationCsrfHeaderName,
  sessionCaptureMutationCsrfHeaderValue,
  sessionStatusLabels,
  sessionToForm,
  userMessageFromApiError,
  type ApiErrorBody,
  type OperatorV0Scope,
  type SessionCaptureFormState,
  type SessionCaptureView,
} from "@/lib/session-capture-workflow"
import {
  bootstrapBodyToInternalTrialScope as toScope,
  readInternalTrialApiBody as readBody,
  readStoredInternalTrialScopeOrDefault as readStoredScope,
  scopedInternalTrialApiUrl as scopedApi,
  sessionBodyToInternalTrialScope as toScopeFromSession,
  storeInternalTrialScope as storeScope,
} from "@/lib/internal-trial-access"
import { cn } from "@/lib/utils"

type AuthSessionBody =
  | ApiErrorBody
  | {
      authenticated: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
    }

type BootstrapBody =
  | ApiErrorBody
  | {
      ok: true
      actor: {
        displayName: string
      }
      tenant: {
        id: string
        name: string
      }
      team: {
        id: string
        name: string
      }
    }

type SessionListBody =
  | ApiErrorBody
  | {
      ok: true
      sessions: SessionCaptureView[]
    }

type SessionSingleBody =
  | ApiErrorBody
  | {
      ok: true
      session: SessionCaptureView
    }

type WorkbenchPhase = "checking" | "entry" | "ready" | "error"
type ActionState =
  | "idle"
  | "entering"
  | "loading"
  | "creating"
  | "saving"
  | "submitting"

const fieldClassName =
  "min-h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"

const textareaClassName = cn(fieldClassName, "min-h-24 resize-y leading-6")

function formatDateTime(value: string | null): string {
  if (!value) {
    return "暂无"
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

function updateSessionList(
  sessions: SessionCaptureView[],
  nextSession: SessionCaptureView,
): SessionCaptureView[] {
  const existingIndex = sessions.findIndex((item) => item.id === nextSession.id)

  if (existingIndex === -1) {
    return [nextSession, ...sessions]
  }

  return sessions.map((item) =>
    item.id === nextSession.id ? nextSession : item,
  )
}

export function SessionCaptureWorkbench() {
  const [phase, setPhase] = useState<WorkbenchPhase>("checking")
  const [actionState, setActionState] = useState<ActionState>("idle")
  const [scope, setScope] = useState<OperatorV0Scope>(() => readStoredScope())
  const [sessions, setSessions] = useState<SessionCaptureView[]>([])
  const [selectedSession, setSelectedSession] =
    useState<SessionCaptureView | null>(null)
  const [form, setForm] = useState<SessionCaptureFormState>(() =>
    createDefaultSessionCaptureForm(),
  )
  const [message, setMessage] = useState("正在检查登录状态")
  const [error, setError] = useState("")

  const isBusy = actionState !== "idle"
  const hasRequiredFields = useMemo(() => isSessionFormReady(form), [form])
  const isExistingSession = Boolean(selectedSession)
  const canCreate = !isExistingSession && hasRequiredFields && !isBusy
  const canSave =
    Boolean(selectedSession) &&
    selectedSession?.status !== "review_ready" &&
    selectedSession?.status !== "processed" &&
    !isBusy
  const canSubmit =
    Boolean(selectedSession) &&
    hasRequiredFields &&
    selectedSession?.status !== "review_ready" &&
    selectedSession?.status !== "processed" &&
    !isBusy

  const applySession = useCallback((session: SessionCaptureView) => {
    setSelectedSession(session)
    setForm(sessionToForm(session))
    setSessions((current) => updateSessionList(current, session))
  }, [])

  const loadSessions = useCallback(
    async (nextScope: OperatorV0Scope) => {
      setActionState("loading")
      const response = await fetch(
        scopedApi("/api/sessions/captures", nextScope),
        {
          credentials: "include",
          cache: "no-store",
        },
      )
      const body = await readBody<SessionListBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromApiError(body as ApiErrorBody))
      }

      setSessions(body.sessions)
      if (body.sessions[0]) {
        setSelectedSession(body.sessions[0])
        setForm(sessionToForm(body.sessions[0]))
      } else {
        setSelectedSession(null)
        setForm(createDefaultSessionCaptureForm())
      }
      setMessage(
        body.sessions.length > 0 ? "已加载团队场次" : "暂无场次，先创建草稿",
      )
    },
    [],
  )

  const verifyContext = useCallback(async () => {
    const nextScope = readStoredScope()
    setActionState("loading")
    setError("")

    try {
      const response = await fetch(scopedApi("/api/auth/session", nextScope), {
        credentials: "include",
        cache: "no-store",
      })
      const body = await readBody<AuthSessionBody>(response)

      if ("authenticated" in body && body.authenticated === true) {
        const verifiedScope = toScopeFromSession(body)
        setScope(verifiedScope)
        storeScope(verifiedScope)
        setPhase("ready")
        await loadSessions(verifiedScope)
      } else {
        setPhase("entry")
        setMessage("进入运营工作台后可以保存场次")
      }
    } catch (caught) {
      setPhase("error")
      setError(caught instanceof Error ? caught.message : "登录状态检查失败")
    } finally {
      setActionState("idle")
    }
  }, [loadSessions])

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
      const body = await readBody<BootstrapBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromApiError(body as ApiErrorBody))
      }

      const nextScope = toScope(body)
      setScope(nextScope)
      storeScope(nextScope)
      setPhase("ready")
      await loadSessions(nextScope)
      setMessage("已进入运营工作台")
    } catch (caught) {
      setPhase("entry")
      setError(caught instanceof Error ? caught.message : "进入失败")
    } finally {
      setActionState("idle")
    }
  }

  function startNewDraft() {
    setSelectedSession(null)
    setForm(createDefaultSessionCaptureForm())
    setError("")
    setMessage("正在填写新场次")
  }

  async function createDraft() {
    if (!canCreate) {
      return
    }

    setActionState("creating")
    setError("")

    try {
      const response = await fetch(scopedApi("/api/sessions/captures", scope), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "content-type": "application/json",
          [sessionCaptureMutationCsrfHeaderName]:
            sessionCaptureMutationCsrfHeaderValue,
        },
        body: JSON.stringify(createSessionCapturePayload(form)),
      })
      const body = await readBody<SessionSingleBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromApiError(body as ApiErrorBody))
      }

      applySession(body.session)
      setMessage("草稿已创建")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "创建失败")
    } finally {
      setActionState("idle")
    }
  }

  async function saveDraft() {
    if (!selectedSession || !canSave) {
      return
    }

    setActionState("saving")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/sessions/captures/${selectedSession.id}/draft`, scope),
        {
          method: "PATCH",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [sessionCaptureMutationCsrfHeaderName]:
              sessionCaptureMutationCsrfHeaderValue,
          },
          body: JSON.stringify(
            createSessionCaptureDraftPayload(selectedSession, form),
          ),
        },
      )
      const body = await readBody<SessionSingleBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromApiError(body as ApiErrorBody))
      }

      applySession(body.session)
      setMessage("草稿已保存")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "保存失败")
    } finally {
      setActionState("idle")
    }
  }

  async function submitDraft() {
    if (!selectedSession || !canSubmit) {
      return
    }

    setActionState("submitting")
    setError("")

    try {
      const response = await fetch(
        scopedApi(`/api/sessions/captures/${selectedSession.id}/submit`, scope),
        {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: {
            "content-type": "application/json",
            [sessionCaptureMutationCsrfHeaderName]:
              sessionCaptureMutationCsrfHeaderValue,
          },
          body: JSON.stringify({
            draftVersion: selectedSession.draftVersion,
          }),
        },
      )
      const body = await readBody<SessionSingleBody>(response)

      if (!response.ok || !("ok" in body) || body.ok !== true) {
        throw new Error(userMessageFromApiError(body as ApiErrorBody))
      }

      applySession(body.session)
      setMessage("已提交，复盘准备完成")
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "提交失败")
    } finally {
      setActionState("idle")
    }
  }

  function updateForm<K extends keyof SessionCaptureFormState>(
    key: K,
    value: SessionCaptureFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
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
                  <Badge variant="secondary">直播采集</Badge>
                  <Badge variant="outline">需要进入团队</Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  进入运营工作台
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  进入后可以创建场次、保存草稿，并提交给复盘流程使用。
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
              icon={ShieldCheck}
              title="团队上下文"
              description="进入后会使用当前团队范围保存记录。"
            />
            <EntryPoint
              icon={ClipboardList}
              title="场次草稿"
              description="先保存主题、主播、商品顺序和问题。"
            />
            <EntryPoint
              icon={ArrowRight}
              title="复盘准备"
              description="提交后显示复盘、话术和任务准备状态。"
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
            <div>
              <Badge variant="secondary">已进入团队</Badge>
              <h2 className="mt-3 text-base font-semibold">{scope.teamName}</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {scope.actorName} · {scope.tenantName}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-sm"
              aria-label="重新加载场次"
              onClick={() => void loadSessions(scope).finally(() => setActionState("idle"))}
              disabled={isBusy}
            >
              <RefreshCcw />
            </Button>
          </div>
          <Button
            variant="outline"
            className="mt-4 w-full justify-start"
            onClick={startNewDraft}
            disabled={isBusy}
          >
            <Plus data-icon="inline-start" />
            新建场次
          </Button>
        </MotionPanel>

        <MotionPanel className="workbench-panel overflow-hidden" delay={0.04}>
          <div className="border-b px-5 py-4">
            <h2 className="text-base font-semibold">场次列表</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              选择记录继续补充。
            </p>
          </div>
          <div className="max-h-[560px] divide-y overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="p-5 text-sm leading-6 text-muted-foreground">
                暂无场次。先创建一条草稿。
              </div>
            ) : (
              sessions.map((session, index) => (
                <MotionListItem key={session.id} delay={index * 0.02}>
                  <button
                    type="button"
                    onClick={() => applySession(session)}
                    className={cn(
                      "w-full px-5 py-4 text-left transition hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
                      selectedSession?.id === session.id && "bg-muted",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 text-sm font-medium leading-6">
                        {session.title}
                      </span>
                      <Badge variant="outline">
                        {sessionStatusLabels[session.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(session.sessionDate)} · 版本{" "}
                      {session.draftVersion}
                    </p>
                  </button>
                </MotionListItem>
              ))
            )}
          </div>
        </MotionPanel>
      </aside>

      <section className="min-w-0 space-y-5">
        <MotionPanel className="workbench-panel overflow-hidden" delay={0.05}>
          <div className="border-b bg-surface px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="workspace-readable">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">手动采集</Badge>
                  <Badge variant="outline">
                    {selectedSession
                      ? sessionStatusLabels[selectedSession.status]
                      : "新草稿"}
                  </Badge>
                  <Badge variant="outline">
                    {selectedSession
                      ? `版本 ${selectedSession.draftVersion}`
                      : "待创建"}
                  </Badge>
                </div>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                  记录一场直播
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                  填主题、主播、商品顺序和观众问题。保存后可以提交给复盘流程。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
                <Button onClick={createDraft} disabled={!canCreate}>
                  {actionState === "creating" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Plus data-icon="inline-start" />
                  )}
                  创建
                </Button>
                <Button variant="outline" onClick={saveDraft} disabled={!canSave}>
                  {actionState === "saving" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Save data-icon="inline-start" />
                  )}
                  保存
                </Button>
                <Button
                  variant="outline"
                  onClick={submitDraft}
                  disabled={!canSubmit}
                >
                  {actionState === "submitting" ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <Send data-icon="inline-start" />
                  )}
                  提交
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-0 divide-y md:grid-cols-4 md:divide-x md:divide-y-0">
            <Metric label="保存状态" value={message} />
            <Metric
              label="最近保存"
              value={formatDateTime(selectedSession?.lastAutosavedAt ?? null)}
            />
            <Metric
              label="问题记录"
              value={form.questionText.trim() ? "已填写" : "可补充"}
            />
            <Metric
              label="提交状态"
              value={
                selectedSession?.status === "review_ready" ? "可复盘" : "未提交"
              }
            />
          </div>
          <div className="border-t px-5 py-3" aria-live="polite">
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </MotionPanel>

        <MotionPanel delay={0.08}>
          <section className="workbench-panel" aria-labelledby="session-form-title">
            <SectionHeader
              id="session-form-title"
              title="场次事实"
              description={
                selectedSession
                  ? "基础信息已创建，本轮继续补充复盘内容。"
                  : "先补齐主题、主播和商品。"
              }
            />
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <Field
                label="场次主题"
                value={form.title}
                disabled={isExistingSession}
                onChange={(event) => updateForm("title", event.target.value)}
              />
              <Field
                label="直播时间"
                type="datetime-local"
                value={form.sessionDate}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm("sessionDate", event.target.value)
                }
              />
              <SelectField
                label="平台"
                value={form.platform}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm(
                    "platform",
                    event.target.value as SessionCaptureFormState["platform"],
                  )
                }
                options={[
                  ["douyin", "抖音"],
                  ["kuaishou", "快手"],
                  ["video_account", "视频号"],
                  ["offline_notes", "线下记录"],
                  ["other", "其他"],
                ]}
              />
              <Field
                label="主播"
                value={form.hostName}
                disabled={isExistingSession}
                onChange={(event) => updateForm("hostName", event.target.value)}
              />
              <TextArea
                label="主播职责"
                value={form.hostResponsibility}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm("hostResponsibility", event.target.value)
                }
              />
              <TextArea
                label="场次摘要"
                value={form.summary}
                onChange={(event) => updateForm("summary", event.target.value)}
              />
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section className="workbench-panel" aria-labelledby="product-form-title">
            <SectionHeader
              id="product-form-title"
              title="商品讲解顺序"
              description="V0 先记录一个主讲商品，后续再扩展排序编辑。"
            />
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <Field
                label="球拍型号"
                value={form.productModel}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm("productModel", event.target.value)
                }
              />
              <SelectField
                label="讲解角色"
                value={form.productRole}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm(
                    "productRole",
                    event.target
                      .value as SessionCaptureFormState["productRole"],
                  )
                }
                options={[
                  ["opening_compare", "开场对比"],
                  ["main_offer", "主推成交"],
                  ["objection_bridge", "异议承接"],
                  ["alternative", "替代推荐"],
                  ["closing_push", "收口促单"],
                ]}
              />
              <TextArea
                label="讲解重点"
                value={form.talkingPoints}
                disabled={isExistingSession}
                onChange={(event) =>
                  updateForm("talkingPoints", event.target.value)
                }
              />
              <TextArea
                label="适合人群"
                value={form.customerFit}
                disabled={isExistingSession}
                onChange={(event) => updateForm("customerFit", event.target.value)}
              />
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.12}>
          <section className="workbench-panel" aria-labelledby="review-input-title">
            <SectionHeader
              id="review-input-title"
              title="问题和缺口"
              description="只记录脱敏后的问题和购买阻力。"
            />
            <div className="grid gap-4 p-5 lg:grid-cols-2">
              <TextArea
                label="讲解缺口"
                value={form.noteContent}
                onChange={(event) => updateForm("noteContent", event.target.value)}
              />
              <TextArea
                label="客户问题"
                value={form.questionText}
                onChange={(event) =>
                  updateForm("questionText", event.target.value)
                }
              />
              <SelectField
                label="问题主题"
                value={form.questionTopic}
                onChange={(event) =>
                  updateForm(
                    "questionTopic",
                    event.target
                      .value as SessionCaptureFormState["questionTopic"],
                  )
                }
                options={[
                  ["fit", "适配打法"],
                  ["tension", "拉线磅数"],
                  ["weight", "重量"],
                  ["balance", "平衡点"],
                  ["price", "价格"],
                  ["durability", "耐用"],
                  ["comparison", "型号对比"],
                  ["after_sales", "售后"],
                  ["other", "其他"],
                ]}
              />
              <TextArea
                label="当场回答"
                value={form.answerGiven}
                onChange={(event) => updateForm("answerGiven", event.target.value)}
              />
              <TextArea
                label="购买异议"
                value={form.objectionContent}
                onChange={(event) =>
                  updateForm("objectionContent", event.target.value)
                }
              />
              <TextArea
                label="回应方式"
                value={form.responseUsed}
                onChange={(event) => updateForm("responseUsed", event.target.value)}
              />
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.needsKnowledge}
                  onChange={(event) =>
                    updateForm("needsKnowledge", event.target.checked)
                  }
                  className="size-4"
                />
                这个问题需要补知识
              </label>
              <label className="flex min-h-10 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.followUpNeeded}
                  onChange={(event) =>
                    updateForm("followUpNeeded", event.target.checked)
                  }
                  className="size-4"
                />
                这个异议需要下场跟进
              </label>
            </div>
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="workbench-panel p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <BadgeCheck className="size-4 text-primary" />
            <h2 className="text-base font-semibold">复盘准备</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {selectedSession ? (
              selectedSession.downstreamReadiness.map((item) => (
                <div key={item.workflow} className="workbench-row p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {readinessLabels[item.workflow]}
                    </span>
                    <Badge variant={item.ready ? "secondary" : "outline"}>
                      {item.ready ? "已就绪" : "未就绪"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    {item.ready
                      ? "可以进入后续流程"
                      : item.blockedBy
                          .map((blocker) => blockerLabels[blocker] ?? blocker)
                          .join("、")}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-muted-foreground">
                创建草稿后显示复盘、话术和任务准备状态。
              </p>
            )}
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.15}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-primary" />
            <h2 className="text-base font-semibold">保存检查</h2>
          </div>
          <div className="mt-4 grid gap-2 text-sm leading-6">
            <CheckItem checked={Boolean(form.title.trim())} label="已填写主题" />
            <CheckItem
              checked={Boolean(form.hostName.trim())}
              label="已填写主播"
            />
            <CheckItem
              checked={Boolean(form.productModel.trim())}
              label="已填写商品"
            />
            <CheckItem checked={Boolean(selectedSession)} label="已创建草稿" />
            <CheckItem
              checked={selectedSession?.status === "review_ready"}
              label="已提交复盘准备"
            />
          </div>
        </MotionPanel>

        <MotionPanel className="workbench-panel p-5" delay={0.18}>
          <div className="flex items-center gap-2">
            <ArrowRight className="size-4 text-primary" />
            <h2 className="text-base font-semibold">暂未开放</h2>
          </div>
          <div className="mt-4 grid gap-2">
            {["导入转录", "平台同步", "直接生成复盘", "创建任务"].map((item) => (
              <Badge
                key={item}
                variant="outline"
                className="h-auto min-h-7 justify-start whitespace-normal py-1"
              >
                {item}
              </Badge>
            ))}
          </div>
        </MotionPanel>
      </aside>
    </div>
  )
}

function EntryPoint({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ShieldCheck
  title: string
  description: string
}) {
  return (
    <div className="workbench-row min-h-28 p-4">
      <Icon className="size-4 text-primary" />
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
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
  icon: typeof Loader2
  title: string
  message: string
  spin?: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className={cn("size-5 text-primary", spin && "animate-spin")} />
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-24 p-4">
      <div className="text-sm font-medium">{label}</div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  )
}

function SectionHeader({
  id,
  title,
  description,
}: {
  id: string
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-3 border-b px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-4 text-primary" />
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
}: {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  type?: string
  disabled?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className={fieldClassName}
        value={value}
        type={type}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  )
}

function TextArea({
  label,
  value,
  onChange,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  disabled?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <textarea
        className={textareaClassName}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    </label>
  )
}

function SelectField<TValue extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string
  value: TValue
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void
  options: Array<[TValue, string]>
  disabled?: boolean
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <select
        className={fieldClassName}
        value={value}
        onChange={onChange}
        disabled={disabled}
      >
        {options.map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  )
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "flex size-5 items-center justify-center rounded-full border",
          checked
            ? "workbench-status-success"
            : "workbench-status-muted text-muted-foreground",
        )}
        aria-hidden="true"
      >
        {checked ? <BadgeCheck className="size-3" /> : null}
      </span>
      <span>{label}</span>
    </div>
  )
}
