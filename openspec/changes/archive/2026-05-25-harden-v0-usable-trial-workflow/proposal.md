## Why

The project already has six operator V0 workbenches, trial entry, protected APIs,
and public Docker preview, but evaluators still have to infer whether the V0 is
usable from scattered page states. This change closes the internal trial V0 into
a clearer usable release path so an operator can enter the demo team, see current
workflow progress, choose the next useful action, and recover safely when a
trial surface is empty or unavailable.

Source research supports this scope:

- OWASP Session Management and CSRF Prevention Cheat Sheets support keeping
  session secrets in server-owned cookies, using explicit mutation protection,
  and avoiding leaked session metadata in UI or JSON responses.
- Next.js App Router documentation supports Route Handlers, cookie-aware server
  boundaries, and no-store protected responses for the existing trial APIs.
- Docker restart policy documentation supports the existing `unless-stopped`
  preview container strategy for server or daemon restarts.
- Nielsen Norman Group usability heuristics support visible system status,
  match with operator language, and recoverable errors as V0 usability criteria.
- W3C WCAG 2.2 supports visible focus, responsive layouts, and avoiding
  mobile/desktop text overflow during pre-archive browser verification.

Skill-backed value exploration:

- `openspec-explore`: keep this as a workflow-level V0 closeout, not a narrow
  endpoint change.
- `roadmap-planning`: define two completion tracks: internal usable V0 now,
  production-grade V1/V2 later.
- `problem-framing-canvas`: the current pain is evaluator uncertainty, not lack
  of more isolated CRUD endpoints.
- `ui-ux-pro-max`: reject marketing/webinar styling; keep a calm operator
  dashboard and use the accessibility/status checklist.

## What Changes

- Add a trial workflow readiness model that summarizes the six implemented V0
  workbenches from existing scoped, protected list APIs.
- Update the overview/trial cockpit so a verified evaluator can see per-step
  counts, readiness state, and the next recommended workbench.
- Keep entry, loading, refresh, error, retry, and logout recovery visible without
  exposing session, cookie, database, provider, or raw protected data details.
- Extend the local trial MVP verifier to cover the readiness model and safe
  summary behavior.
- Update roadmap documentation with a concrete V0 progress/completion boundary
  and the accelerated development policy: ship usable internal V0 first, then
  iterate toward production authentication, RAG/Q&A, integrations, and
  production operations.
- No new dependency, provider, production auth, RAG, source discovery, queue,
  object storage, observability provider, or external commerce integration is
  introduced.

## Capabilities

### New Capabilities

- `v0-usable-trial-workflow`: Defines the internal usable V0 trial workflow
  summary, next-step guidance, recovery states, and verification boundary.

### Modified Capabilities

- `internal-trial-mvp-hardening`: Extends the existing trial MVP hardening
  requirements to include dynamic readiness summary and V0 completion evidence.
- `internal-trial-access-workflow`: Extends the overview cockpit expectations to
  include current workflow progress and next useful action after session
  verification.

## Impact

- Affected UI: overview cockpit and shared internal/public trial access
  components.
- Affected client/domain helpers: trial workflow readiness typing, count
  extraction, next-step computation, and safe error messaging.
- Affected verification: `trial-mvp:check`, `openspec validate`, lint,
  typecheck, build, and pre-archive Playwright desktop/mobile checks.
- Affected docs: autonomous roadmap and AI continuous development goal progress
  sections.
- Runtime boundaries stay unchanged: UI calls existing protected Route Handlers;
  server-side auth, tenant/team scope, repository authorization, CSRF mutation
  headers, and no-store responses remain the source of truth.
