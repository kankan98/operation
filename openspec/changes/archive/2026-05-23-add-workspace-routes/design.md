## Context

The accepted web baseline provides a verified Next.js App Router application
with a Chinese operations shell on `/`. The six planned work areas are currently
represented as hash anchors and placeholder rows inside the root page:

- live sessions
- racket products
- seed knowledge
- AI review
- talk-track assets
- next-session actions

The deployment baseline is verified through Docker, so the next change should
preserve that portability. The project still has no accepted authentication,
database, AI provider, object storage, analytics, or external platform
integration implementation.

## Goals / Non-Goals

**Goals:**

- Introduce stable App Router pages for each planned operator workflow.
- Keep the root page as the workspace overview.
- Share route metadata and shell rendering so navigation stays consistent across
  desktop and mobile.
- Show Chinese empty states and disabled workflow actions that clearly state no
  real data, auth, AI, or integration is active.
- Establish a global modern theme using CSS variables so future screens can be
  restyled through tokens rather than scattered component classes.
- Preserve current verification commands and Docker build readiness.

**Non-Goals:**

- Do not add auth, sessions, protected routes, roles, tenant membership, or
  server-side authorization.
- Do not add persistence, database schema, migrations, API routes, or server
  actions.
- Do not add AI prompts, model calls, structured AI output, or provider
  configuration.
- Do not add file upload, object storage, analytics, external commerce platform
  integrations, or new dependencies.

## Decisions

1. **Use real route paths instead of hash anchors.**
   - Rationale: Future waves need stable URLs for workflow-specific code,
     browser checks, and protected route boundaries. Hash anchors keep all
     behavior trapped in one page.
   - Alternative considered: keep the single-page overview and expand sections
     inline. Rejected because it would make future workflow implementation and
     route-level verification harder.

2. **Create a shared operator shell component.**
   - Rationale: The sidebar, mobile navigation, sticky header, status badge, and
     page body frame should remain consistent across `/` and all workspace
     pages. A shared shell avoids duplicating navigation markup in each route.
   - Alternative considered: repeat the shell in every page. Rejected because
     the active-route state and future layout changes would drift.

3. **Keep route data as static TypeScript metadata.**
   - Rationale: This slice is routing and UI structure only. Static metadata is
     enough to render titles, descriptions, readiness items, empty states, and
     disabled actions while avoiding premature data-layer design.
   - Alternative considered: define domain repositories or mock API handlers.
     Rejected because that would imply data architecture before the relevant
     OpenSpec wave.

4. **Use server components by default and client components only for mobile
   navigation interactivity.**
   - Rationale: The pages are static and do not need client state. This follows
     the current App Router baseline and keeps the client bundle small.
   - Alternative considered: make a client-side shell for active navigation.
     Rejected because the active route can be passed from each route as metadata.

5. **Use semantic CSS variables for the visual system.**
   - Rationale: The project uses shadcn-compatible primitives, so global theme
     control should live in `globals.css` through variables such as
     `--background`, `--foreground`, `--primary`, `--sidebar`, `--chart-*`, and
     product-specific tokens like `--surface`, `--success`, `--warning`, and
     `--info`.
   - Visual direction: modern operational dashboard, cool neutral surfaces,
     teal-blue primary actions, amber emphasis for operational attention, and a
     mixed chart palette for future analysis views.
   - Alternatives considered: hardcode Tailwind colors in components or install
     a new theme package. Rejected because hardcoded colors prevent global
     control and a new package is unnecessary for this scope.

## Risks / Trade-offs

- Route pages may look more complete than they are -> Mitigation: every page
  includes disabled actions and explicit "not connected yet" copy.
- Shared shell refactor could disturb the verified root page -> Mitigation:
  keep visual structure close to the existing baseline and verify `/` on desktop
  and mobile.
- Static route metadata could grow large -> Mitigation: keep it scoped to route
  placeholders only; future data-backed features get their own modules and
  OpenSpec changes.
- Theme changes could reduce contrast or create a one-note palette ->
  Mitigation: use high-contrast foreground/muted tokens, separate sidebar and
  surface tokens, and a mixed chart palette instead of only one hue family.
- Mobile navigation can remain open after selecting a route -> Mitigation: use
  normal links inside the existing sheet and verify mobile layout; close-on-link
  behavior can be added later if it becomes a usability issue.

## Migration Plan

1. Add shared route metadata for the overview and six workflow routes.
2. Extract the common workspace shell from the root page.
3. Update desktop and mobile navigation to use real paths and active state.
4. Update global theme tokens in `globals.css`.
5. Add static route pages for the six planned workflows.
6. Keep `/` as the dashboard overview and preserve route-state files.
7. Run OpenSpec validation, lint, typecheck, build, Docker build, and browser
   smoke checks.

Rollback: restore the previous root-page-only navigation and remove the new
route directories. No persisted data or external services are affected.

## Open Questions

- None for this slice. Auth, tenant access, persistence, and AI behavior remain
  separate future OpenSpec changes.
