# Workspace Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build stable Chinese operator workspace routes and a global token-based visual theme for the six planned workflows without adding data, auth, AI, or integrations.

**Architecture:** Static TypeScript workspace metadata drives a shared operator shell and route-specific placeholder pages. The shell stays server-rendered except for the existing mobile sheet navigation, which receives active route state as a prop. Global visual styling is controlled through shadcn-compatible CSS variables in `globals.css`.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS v4, shadcn-compatible local primitives, lucide-react.

---

## File Structure

- Modify: `apps/web/src/lib/workspace.ts`
  - Owns route ids, route metadata, readiness copy, overview cards, and placeholder content.
- Create: `apps/web/src/components/workspace-shell.tsx`
  - Shared desktop/mobile shell, sticky header, sidebar, active navigation, and layout frame.
- Modify: `apps/web/src/components/mobile-nav.tsx`
  - Accepts `activePath` and renders real route links with `aria-current`.
- Modify: `apps/web/src/components/navigation.ts`
  - Re-exports route metadata for compatibility or becomes a thin wrapper around `workspace.ts`.
- Create: `apps/web/src/components/workspace-pages.tsx`
  - Renders overview and workflow placeholder content from metadata.
- Modify: `apps/web/src/app/page.tsx`
  - Renders the overview through the shared shell.
- Modify: `apps/web/src/app/globals.css`
  - Defines the global semantic, sidebar, surface, status, and chart theme tokens.
- Create route files:
  - `apps/web/src/app/sessions/page.tsx`
  - `apps/web/src/app/rackets/page.tsx`
  - `apps/web/src/app/knowledge/page.tsx`
  - `apps/web/src/app/ai-review/page.tsx`
  - `apps/web/src/app/talk-tracks/page.tsx`
  - `apps/web/src/app/next-actions/page.tsx`
- Modify: `apps/web/README.md`
  - Document workspace routes and explicit non-goals.
- Modify: `openspec/changes/add-workspace-routes/tasks.md`
  - Check off tasks as implementation and verification complete.

## Task 1: Add Workspace Metadata

**Files:**
- Create: `apps/web/src/lib/workspace.ts`

- [ ] **Step 1: Create typed route metadata**

Add `WorkspaceRoute`, `WorkflowRoute`, overview cards, and route content. Use static Chinese copy only; do not include customer data, transcripts, business metrics, prompts, or AI output.

Expected shape:

```ts
export type WorkspaceRouteId =
  | "overview"
  | "sessions"
  | "rackets"
  | "knowledge"
  | "ai-review"
  | "talk-tracks"
  | "next-actions"

export type WorkspaceRoute = {
  id: WorkspaceRouteId
  title: string
  description: string
  href: string
  status: string
  eyebrow: string
  unavailableReason: string
  primaryAction: string
  readiness: string[]
  preview: string[]
  icon: React.ComponentType<{ className?: string }>
}
```

- [ ] **Step 2: Verify route constants compile**

Run: `pnpm typecheck`

Expected: TypeScript either passes or reports only implementation errors in the new file that must be fixed before moving on.

## Task 2: Extract Shared Shell And Navigation

**Files:**
- Create: `apps/web/src/components/workspace-shell.tsx`
- Modify: `apps/web/src/components/mobile-nav.tsx`
- Modify: `apps/web/src/components/navigation.ts`

- [ ] **Step 1: Create `WorkspaceShell`**

Implement a server component with this public interface:

```tsx
type WorkspaceShellProps = {
  activePath: string
  title: string
  subtitle: string
  badge?: string
  children: React.ReactNode
}
```

It should preserve the existing two-column desktop layout, sticky sidebar, sticky header, and mobile menu trigger.

- [ ] **Step 2: Update `MobileNav`**

Change `MobileNav` to:

```tsx
export function MobileNav({ activePath }: { activePath: string }) {
  // render workspace route links and set aria-current when href matches activePath
}
```

Use `Link` from `next/link`, keep `SheetTitle`, and preserve the existing accessible trigger label.

- [ ] **Step 3: Re-export navigation metadata**

Make `apps/web/src/components/navigation.ts` source its primary nav items from `workspace.ts` so old imports do not drift while the shell moves to the new metadata.

## Task 3: Build Overview And Workflow Page Components

**Files:**
- Create: `apps/web/src/components/workspace-pages.tsx`

- [ ] **Step 1: Add `WorkspaceOverview`**

Render the overview cards, next-workflow list, explicit scope boundary, and baseline verification card using the shared static metadata.

- [ ] **Step 2: Add `WorkflowPlaceholderPage`**

Public interface:

```tsx
export function WorkflowPlaceholderPage({ routeId }: { routeId: WorkflowRouteId }) {
  // look up route content and render title, disabled action, readiness list, preview rows, and boundary copy
}
```

The primary workflow action must be disabled and the page must state that real data, auth, AI, and integrations are not connected.

## Task 4: Add Real App Router Pages

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/sessions/page.tsx`
- Create: `apps/web/src/app/rackets/page.tsx`
- Create: `apps/web/src/app/knowledge/page.tsx`
- Create: `apps/web/src/app/ai-review/page.tsx`
- Create: `apps/web/src/app/talk-tracks/page.tsx`
- Create: `apps/web/src/app/next-actions/page.tsx`

- [ ] **Step 1: Replace root page with overview shell**

`apps/web/src/app/page.tsx` should render:

```tsx
<WorkspaceShell activePath="/" title="运营工作台总览" subtitle="Wave 0/线路补充：稳定入口与空状态" badge="无业务数据">
  <WorkspaceOverview />
</WorkspaceShell>
```

- [ ] **Step 2: Add each workflow route file**

Each route file should render the shared shell with the matching `activePath` and `WorkflowPlaceholderPage` route id.

Example:

```tsx
export default function SessionsPage() {
  return (
    <WorkspaceShell activePath="/sessions" title="直播场次" subtitle="记录主题、主播、商品顺序和问题" badge="占位">
      <WorkflowPlaceholderPage routeId="sessions" />
    </WorkspaceShell>
  )
}
```

- [ ] **Step 3: Run static checks**

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands pass.

## Task 5: Add Global Theme Tokens

**Files:**
- Modify: `apps/web/src/app/globals.css`

- [ ] **Step 1: Define semantic shadcn variables**

Update `:root` and `.dark` with coherent `--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, and `--ring` values.

- [ ] **Step 2: Define product tokens**

Expose `--surface`, `--surface-subtle`, `--surface-strong`, `--success`, `--warning`, `--info`, and `--chart-1` through `--chart-5`, then map them in `@theme inline`.

- [ ] **Step 3: Verify no new dependencies**

Run:

```bash
git diff -- apps/web/package.json package.json
```

Expected: no dependency changes for theme work.

## Task 6: Documentation And OpenSpec Task Updates

**Files:**
- Modify: `apps/web/README.md`
- Modify: `openspec/changes/add-workspace-routes/tasks.md`

- [ ] **Step 1: Document workspace routes**

Add a README section listing the seven routes and stating that the six workflow routes are static placeholders with no auth, persistence, AI, or integrations.

- [ ] **Step 2: Mark completed implementation tasks**

Update `openspec/changes/add-workspace-routes/tasks.md` as each task group completes.

- [ ] **Step 3: Validate OpenSpec**

Run:

```bash
openspec validate add-workspace-routes
```

Expected: change is valid.

## Task 7: Browser And Docker Verification

**Files:**
- No source file changes expected unless verification finds defects.

- [ ] **Step 1: Start dev server**

Run:

```bash
pnpm dev
```

Expected: Next.js dev server serves the app on an available localhost port.

- [ ] **Step 2: Browser-check all routes**

Use Playwright to visit `/`, `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions` on desktop and mobile. Check for console errors, text overflow, and incoherent overlap.

- [ ] **Step 3: Build Docker image**

Run:

```bash
pnpm docker:build
```

Expected: image `operation-web:latest` builds successfully.

- [ ] **Step 4: Mark verification tasks complete**

Update `openspec/changes/add-workspace-routes/tasks.md` only after observing passing command output.
