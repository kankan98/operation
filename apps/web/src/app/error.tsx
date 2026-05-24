"use client"

import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Route error", {
      message: error.message,
      digest: error.digest,
    })
  }, [error])

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4">
      <section className="w-full max-w-md rounded-lg border bg-card p-6 text-center">
        <AlertTriangle className="mx-auto size-8 text-destructive" />
        <h1 className="mt-4 text-xl font-semibold">页面加载失败</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          请重新加载页面，或返回工作台继续操作。
        </p>
        <Button className="mt-5" onClick={reset}>
          <RotateCcw data-icon="inline-start" />
          重新加载
        </Button>
      </section>
    </main>
  )
}
