"use client"

import Link from "next/link"
import { Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { primaryNavItems } from "@/lib/workspace"
import { cn } from "@/lib/utils"

export function MobileNav({ activePath }: { activePath: string }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className="md:hidden"
          size="icon"
          variant="outline"
          aria-label="打开导航"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] max-w-[86vw] p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle>运营导航</SheetTitle>
          <SheetDescription className="sr-only">
            在移动端切换直播场次、球拍产品、资料来源、智能复盘、话术资产和下场任务。
          </SheetDescription>
        </SheetHeader>
        <nav className="grid gap-1 p-3" aria-label="移动端主导航">
          {primaryNavItems.map((item) => {
            const isActive = item.href === activePath

            return (
              <Link
                key={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "motion-interactive grid grid-cols-[32px_1fr] gap-3 rounded-md px-3 py-3 text-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-muted",
                )}
              >
                <item.icon className="mt-0.5 size-4 text-primary" />
                <span>
                  <span className="block font-medium text-foreground">
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
      </SheetContent>
    </Sheet>
  )
}
