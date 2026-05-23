import Link from "next/link"
import { SearchX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
        <SearchX className="mx-auto size-8 text-primary" />
        <h1 className="mt-4 text-xl font-semibold">没有找到这个工作面</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          当前阶段只开放工作台根页面。直播场次、产品库、知识库和 AI 复盘会在后续变更中逐步接入。
        </p>
        <Button className="mt-5" variant="outline" asChild>
          <Link href="/">返回运营工作台</Link>
        </Button>
      </section>
    </main>
  )
}
