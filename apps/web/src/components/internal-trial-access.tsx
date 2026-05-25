"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  LogIn,
  LogOut,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"

import {
  clearStoredInternalTrialScope,
  enterInternalTrial,
  leaveInternalTrial,
  readStoredInternalTrialScope,
  verifyInternalTrialSession,
  type OperatorV0Scope,
} from "@/lib/internal-trial-access"
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

const workflowPath = [
  {
    title: "记录直播场次",
    href: "/sessions",
  },
  {
    title: "复核球拍资料",
    href: "/rackets",
  },
  {
    title: "整理可信来源",
    href: "/knowledge",
  },
  {
    title: "生成复盘建议",
    href: "/ai-review",
  },
  {
    title: "沉淀话术资产",
    href: "/talk-tracks",
  },
  {
    title: "安排下场任务",
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

export function InternalTrialAccessCard({
  className,
}: {
  className?: string
}) {
  const { enter, isBusy, leave, refresh, state } = useInternalTrialAccess()
  const readyScope = state.phase === "ready" ? state.scope : null
  const isReady = Boolean(readyScope)

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

      <div className="mt-3 min-h-16 text-xs leading-5 text-muted-foreground">
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
  const nextWorkflow = useMemo(() => workflowPath[0], [])

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
            <p className="text-sm leading-6 text-muted-foreground">
              {state.message}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          {workflowPath.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className="motion-interactive grid min-h-12 grid-cols-[2rem_1fr_auto] items-center gap-3 rounded-md border bg-background px-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Badge variant="secondary">0{index + 1}</Badge>
              <span className="min-w-0 truncate font-medium">{item.title}</span>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          ))}
        </div>
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
