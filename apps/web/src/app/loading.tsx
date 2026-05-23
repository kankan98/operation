export default function Loading() {
  return (
    <main className="min-h-dvh bg-background p-4 md:p-6">
      <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-[248px_1fr]">
        <div className="hidden h-[calc(100dvh-48px)] rounded-lg border bg-muted md:block" />
        <div className="space-y-4">
          <div className="h-14 rounded-lg border bg-card" />
          <div className="h-44 rounded-lg border bg-card" />
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-lg border bg-muted" />
            ))}
          </div>
          <div className="h-72 rounded-lg border bg-card" />
        </div>
      </div>
    </main>
  )
}
