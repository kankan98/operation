export default function Loading() {
  return (
    <main className="min-h-dvh bg-background">
      <div className="workspace-shell-grid">
        <div className="hidden h-dvh border-r bg-muted md:block" />
        <div className="workspace-page content-start">
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
