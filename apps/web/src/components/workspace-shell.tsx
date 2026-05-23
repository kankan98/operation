import Link from "next/link"
import { LockKeyhole } from "lucide-react"

import { MobileNav } from "@/components/mobile-nav"
import { MotionPage, WorkspaceMotionProvider } from "@/components/workspace-motion"
import { primaryNavItems } from "@/lib/workspace"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

type WorkspaceShellProps = {
  activePath: string
  title: string
  subtitle: string
  badge?: string
  children: React.ReactNode
}

export function WorkspaceShell({
  activePath,
  title,
  subtitle,
  badge,
  children,
}: WorkspaceShellProps) {
  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto grid min-h-dvh w-full max-w-[1440px] grid-cols-1 md:grid-cols-[248px_1fr]">
        <aside className="hidden border-r bg-sidebar md:block">
          <div className="sticky top-0 flex h-dvh flex-col">
            <div className="px-5 py-5">
              <Link
                href="/"
                className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-current={activePath === "/" ? "page" : undefined}
              >
                <div className="text-sm font-semibold text-sidebar-foreground">
                  羽拍直播运营
                </div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  AI LiveOps Workspace
                </div>
              </Link>
            </div>
            <Separator />
            <nav className="grid gap-1 p-3" aria-label="主导航">
              {primaryNavItems.map((item) => {
                const isActive = item.href === activePath

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "motion-interactive grid grid-cols-[32px_1fr] gap-3 rounded-md px-3 py-3 text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive && "bg-sidebar-accent",
                    )}
                  >
                    <item.icon className="mt-0.5 size-4 text-primary" />
                    <span>
                      <span className="block font-medium text-sidebar-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                )
              })}
            </nav>
            <div className="mt-auto border-t p-4">
              <div className="rounded-md border bg-background p-3">
                <div className="flex items-center gap-2 text-xs font-medium">
                  <LockKeyhole className="size-3.5 text-primary" />
                  权限层未接入
                </div>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  当前工作区不处理真实团队数据；认证将在后续变更中实现。
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur md:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <MobileNav activePath={activePath} />
              <div className="min-w-0">
                <h1 className="truncate text-sm font-semibold md:text-base">
                  {title}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">
                  {subtitle}
                </p>
              </div>
            </div>
            {badge ? (
              <Badge variant="outline" className="hidden sm:inline-flex">
                {badge}
              </Badge>
            ) : null}
          </header>

          <WorkspaceMotionProvider>
            <MotionPage motionKey={activePath}>{children}</MotionPage>
          </WorkspaceMotionProvider>
        </section>
      </div>
    </main>
  )
}
