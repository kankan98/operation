# Workspace Routes Design

Date: 2026-05-23

## Context

The web app has a verified Next.js, pnpm, shadcn-compatible UI, and Docker
baseline. The current root page shows six future work areas as hash anchors, but
the application does not yet provide real route surfaces for operators to enter
those workflows.

The next slice should improve navigation and product shape without introducing
authentication, databases, AI provider calls, storage, or external integrations.

## Recommended Approach

Build real App Router pages for the existing operator work areas:

- `/sessions`
- `/rackets`
- `/knowledge`
- `/ai-review`
- `/talk-tracks`
- `/next-actions`

Keep `/` as the overview route. Convert navigation metadata from hash anchors to
real paths and reuse it across desktop and mobile navigation.

## Alternatives Considered

1. Add auth and team access first.
   This is the eventual Wave 1 direction, but it requires provider, session, and
   authorization choices that deserve their own OpenSpec change.

2. Build the racket product library prototype first.
   This gives stronger domain value, but it starts shaping product data before
   the workspace route structure is real.

3. Add static route surfaces first.
   This is the selected path because it matches the current request to supplement
   routes, keeps scope frontend-only, and gives future waves stable entry points.

## Design

Create a shared operator shell that owns the sidebar, mobile sheet navigation,
sticky header, and active-route state. Each route renders a static Chinese
operator-facing page with:

- workflow title and short purpose;
- clear "not connected yet" boundary text;
- disabled primary action for the future workflow;
- route-specific readiness checklist;
- route-specific empty state or preview rows using static sample labels only.

The pages must not persist data, read business data, call AI, or imply that auth
or integrations are active.

## Data Flow

There is no runtime data flow in this slice. All displayed content is local
static metadata defined in TypeScript. Future changes can replace the static
route payloads with authenticated server data without changing public URLs.

## Error Handling And States

The existing `loading.tsx`, `error.tsx`, and `not-found.tsx` remain the baseline
route states. New pages should make unavailable capabilities explicit through
disabled actions and empty states instead of hidden controls.

## Testing

Verification should include:

- `openspec validate add-workspace-routes`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- Playwright desktop and mobile checks for `/`, `/sessions`, `/rackets`,
  `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions`
- Docker build after route changes

## Scope Boundaries

This slice does not add auth, protected data, database schema, AI prompts,
provider configuration, object storage, analytics, or deployment provider
configuration.
