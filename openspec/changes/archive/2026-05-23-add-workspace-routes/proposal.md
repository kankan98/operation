## Why

The verified web baseline currently exposes the operator work areas only as
hash-anchor placeholders on the root page. The next product step is to give each
planned workflow a stable route surface so later OpenSpec changes can attach
auth, data, and AI behavior without changing the information architecture.

## What Changes

- Add real Next.js App Router pages for live sessions, racket products, seed
  knowledge, AI review, talk-track assets, and next-session actions.
- Keep the root route as a Chinese operator dashboard overview.
- Convert navigation metadata from hash anchors to real paths and show active
  route state in desktop and mobile navigation.
- Add route-specific Chinese empty states, disabled actions, and readiness
  checklists that make unavailable capabilities explicit.
- Define a modern global theme token baseline in `globals.css` so shadcn
  semantic colors, sidebar surfaces, charts, and product states are controlled
  from CSS variables instead of component-level hardcoded colors.
- Do not add authentication, database access, AI calls, persistence, object
  storage, external integrations, or new dependencies.

## Capabilities

### New Capabilities

- `workspace-routing`: Defines the stable operator workspace routes, shared
  navigation behavior, active route state, and route-level placeholder surfaces
  for future workflow implementation.
- `workspace-theme`: Defines the global token-based visual theme for the
  operator workspace, including semantic shadcn variables and product-specific
  surface, status, and chart tokens.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/web/src/app/**`, `apps/web/src/components/**`,
  `apps/web/src/lib/**`, and `apps/web/src/app/globals.css`.
- Affected UX: navigation changes from single-page anchors to stable workspace
  paths.
- APIs/dependencies: none.
- Data/security: no protected data is read, written, generated, or logged.
