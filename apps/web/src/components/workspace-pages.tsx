import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CircleDashed,
  Clock3,
  FileText,
  LockKeyhole,
} from "lucide-react"

import {
  bootstrapChecks,
  deferredCapabilities,
  getRequiredWorkspaceRoute,
  overviewReadinessItems,
  primaryNavItems,
  type WorkflowRouteId,
} from "@/lib/workspace"
import { MotionListItem, MotionPanel } from "@/components/workspace-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export function WorkspaceOverview() {
  return (
    <div className="grid gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="rounded-lg border bg-card p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-medium text-primary">内部运营工具</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal md:text-3xl">
                羽毛球拍直播团队的稳定工作区线路
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                本阶段把首页锚点升级为真实路由：直播场次、球拍产品、种子知识库、AI
                复盘、话术资产和下场任务都有独立入口。页面仍不读取或保存真实业务数据。
              </p>
            </div>
            <Button variant="outline" className="w-full md:w-auto" asChild>
              <Link href="/sessions">
                查看直播场次
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>
        </MotionPanel>

        <section
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="线路状态"
        >
          {overviewReadinessItems.map((item, index) => (
            <MotionListItem
              key={item.label}
              delay={index * 0.035}
              className="motion-interactive min-h-28 rounded-lg border bg-card p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <item.icon className="size-4 text-primary" />
                <Badge variant="secondary">{item.value}</Badge>
              </div>
              <div className="mt-5 text-sm font-medium">{item.label}</div>
            </MotionListItem>
          ))}
        </section>

        <MotionPanel delay={0.08}>
          <section
            className="rounded-lg border bg-card"
            aria-labelledby="work-surfaces-title"
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2 id="work-surfaces-title" className="text-base font-semibold">
                  工作区线路
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  每条线路已具备独立路由，当前仍是静态占位。
                </p>
              </div>
              <Badge variant="outline">6 条线路</Badge>
            </div>
            <div className="divide-y">
              {primaryNavItems.map((item, index) => (
                <MotionListItem key={item.id} delay={index * 0.025}>
                  <Link
                    href={item.href}
                    className="motion-interactive grid gap-3 px-5 py-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid-cols-[36px_1fr_120px]"
                  >
                    <item.icon className="size-5 text-primary" />
                    <span className="min-w-0">
                      <span className="block font-medium">{item.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                    <span className="flex items-center md:justify-end">
                      <Badge variant="outline">{item.status}</Badge>
                    </span>
                  </Link>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>
      </section>

      <OverviewAside />
    </div>
  )
}

export function WorkflowPlaceholderPage({
  routeId,
}: {
  routeId: WorkflowRouteId
}) {
  const route = getRequiredWorkspaceRoute(routeId)

  return (
    <div className="grid gap-5 px-4 py-5 md:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0 space-y-5">
        <MotionPanel className="rounded-lg border bg-card p-5 shadow-xs">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{route.eyebrow}</Badge>
                <Badge variant="outline">{route.status}</Badge>
              </div>
              <h2 className="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
                {route.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {route.description}。当前页面用于固定工作区入口和后续实现边界，不读取、不生成、不保存真实业务数据。
              </p>
            </div>
            <Button disabled className="w-full md:w-auto">
              {route.primaryAction}
            </Button>
          </div>
        </MotionPanel>

        <MotionPanel delay={0.05}>
          <section
            className="rounded-lg border bg-card"
            aria-labelledby={`${route.id}-readiness-title`}
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div>
                <h2
                  id={`${route.id}-readiness-title`}
                  className="text-base font-semibold"
                >
                  接入前检查
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  这些能力需要未来 OpenSpec 变更逐项实现。
                </p>
              </div>
              <Badge variant="outline">未接入</Badge>
            </div>
            <div className="grid gap-3 p-5 sm:grid-cols-2">
              {route.readiness.map((item, index) => (
                <MotionListItem
                  key={item}
                  delay={index * 0.025}
                  className="motion-interactive flex min-h-12 items-start gap-3 rounded-md border bg-background p-3 text-sm"
                >
                  <CircleDashed className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="leading-6">{item}</span>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>

        <MotionPanel delay={0.1}>
          <section
            className="rounded-lg border bg-card"
            aria-labelledby={`${route.id}-preview-title`}
          >
            <div className="border-b px-5 py-4">
              <h2
                id={`${route.id}-preview-title`}
                className="text-base font-semibold"
              >
                未来页面会承载的信息
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                下列只是规划标签，不是导入数据或 AI 输出。
              </p>
            </div>
            <div className="divide-y">
              {route.preview.map((item, index) => (
                <MotionListItem
                  key={item}
                  delay={index * 0.025}
                  className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[48px_1fr_120px]"
                >
                  <Badge variant="secondary">0{index + 1}</Badge>
                  <div className="font-medium">{item}</div>
                  <div className="text-muted-foreground md:text-right">
                    规划中
                  </div>
                </MotionListItem>
              ))}
            </div>
          </section>
        </MotionPanel>
      </section>

      <aside className="space-y-5">
        <MotionPanel className="rounded-lg border bg-card p-5" delay={0.12}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <h2 className="text-base font-semibold">当前边界</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {route.unavailableReason}
          </p>
          <Separator className="my-4" />
          <div className="flex items-start gap-2 text-sm leading-6">
            <LockKeyhole className="mt-1 size-4 shrink-0 text-primary" />
            <span>认证、团队权限和服务器授权均未接入。</span>
          </div>
        </MotionPanel>

        <MotionPanel className="rounded-lg border bg-card p-5" delay={0.16}>
          <div className="flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            <h2 className="text-base font-semibold">后续实现条件</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {bootstrapChecks.slice(0, 4).map((check) => (
              <div key={check} className="flex items-center gap-2 text-sm">
                <Clock3 className="size-3.5 text-muted-foreground" />
                {check}
              </div>
            ))}
          </div>
        </MotionPanel>
      </aside>
    </div>
  )
}

function OverviewAside() {
  return (
    <aside className="space-y-5">
      <MotionPanel className="rounded-lg border bg-card p-5" delay={0.12}>
        <div className="flex items-center gap-2">
          <CircleDashed className="size-4 text-primary" />
          <h2 className="text-base font-semibold">本阶段验收</h2>
        </div>
        <div className="mt-4 grid gap-3">
          {bootstrapChecks.map((check) => (
            <div key={check} className="flex items-center gap-2 text-sm">
              <Clock3 className="size-3.5 text-muted-foreground" />
              {check}
            </div>
          ))}
        </div>
      </MotionPanel>

      <MotionPanel className="rounded-lg border bg-card p-5" delay={0.16}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <h2 className="text-base font-semibold">明确未实现</h2>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {deferredCapabilities.map((capability) => (
            <Badge key={capability} variant="outline">
              {capability}
            </Badge>
          ))}
        </div>
      </MotionPanel>

      <MotionPanel className="rounded-lg border bg-card p-5" delay={0.2}>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-base font-semibold">后续开发基线</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          新功能必须先创建 OpenSpec 变更，再按认证、产品库、动态种子知识库、直播记录、AI
          复盘的波次推进。
        </p>
      </MotionPanel>
    </aside>
  )
}
