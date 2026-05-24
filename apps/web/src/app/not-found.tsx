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
          这个地址暂不可用。请从工作台导航进入需要的页面。
        </p>
        <Button className="mt-5" variant="outline" asChild>
          <Link href="/">返回运营工作台</Link>
        </Button>
      </section>
    </main>
  )
}
