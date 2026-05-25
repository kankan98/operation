## Why

The project now has a broad operator V0 surface and a gated live AI review path,
but the user-facing trial experience still feels like a collection of separate
workbenches rather than one dependable MVP. The next highest-value wave is to
make the existing trial loop easier to enter, verify, recover, and evaluate
without adding production auth, RAG, queues, external commerce integrations, or
new providers.

This directly supports the current goal of shipping a usable version first:
evaluators should be able to open the public preview, enter the demo team,
follow the intended live-commerce workflow, understand which mode is active, and
recover from common trial/session/data loading failures.

## Source Research

- Next.js App Router documentation remains the primary source for keeping Route
  Handlers and future thin Server Actions as the framework boundary:
  https://nextjs.org/docs/app
- Docker restart policy documentation confirms that named preview containers
  with `--restart unless-stopped` are the correct preview self-recovery path
  after Docker daemon or server restarts:
  https://docs.docker.com/engine/containers/start-containers-automatically/
- OWASP Top 10 for LLM Applications reinforces that AI suggestions, prompts,
  provider state, and sensitive operator/customer data need explicit boundaries
  and should not be exposed through trial UI, logs, or browser errors:
  https://owasp.org/www-project-top-10-for-large-language-model-applications/
- Nielsen Norman Group's usability heuristics support this wave's focus on
  visible system status, user control, error prevention, and recovery rather
  than decorative redesign:
  https://www.nngroup.com/articles/ten-usability-heuristics/
- W3C WAI WCAG guidance supports keeping trial controls keyboard accessible,
  error states announced, and mobile text free from overlap:
  https://www.w3.org/WAI/WCAG22/quickref/

## Skill-Backed Value Exploration

- OpenSpec exploration: The smallest coherent next wave is a trial MVP hardening
  pass that spans entry, overview, all implemented workbenches, verification,
  docs, and public preview evidence. Splitting this into route-by-route changes
  would slow down usable-release progress.
- Prioritization advisor: Given early MVP state, small-team constraints, limited
  real usage data, and the need to balance quick wins against production
  architecture, use a value/effort lens. Trial continuity, recovery, and
  verification score higher than new AI/RAG functionality because they unblock
  user evaluation of what already exists.
- UI/UX skill search: Marketing-style webinar/vibrant recommendations are not
  appropriate for this calm operations tool. Keep the existing dense dashboard
  language and adopt only the relevant guidance: loading feedback, empty states,
  accessible errors, clear recovery actions, and responsive checks.

## What Changes

- Add an internal trial MVP hardening layer that defines the expected public
  preview evaluation path across `/trial`, `/`, `/sessions`, `/rackets`,
  `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions`.
- Tighten the public trial continue flow so a verified trial session reliably
  opens the requested known workbench path, with safe fallback when the next
  path is unsafe, stale, or blocked.
- Improve the overview/trial cockpit so evaluators can see the recommended V0
  path, current team/session state, available workbenches, and clear recovery
  actions without seeing OpenSpec, provider, cookie, database, or architecture
  details.
- Add consistent MVP-ready states for loading, empty, error, retry/re-enter,
  disabled, saved/generated/review-ready, and public-preview-safe boundaries
  across the implemented workbenches where gaps are found.
- Add or extend a repeatable trial MVP verifier that exercises trial entry,
  session verification, all six implemented workbench routes, safe failure
  boundaries, and route-gate behavior with rollback or deterministic cleanup.
- Add Playwright verification for the public preview path and representative
  desktop/mobile screens before archive.
- Update roadmap and README language so the project clearly distinguishes
  internal trial MVP, public preview, and future production release.
- No production auth provider, team invitation, real customer data entry,
  external platform integration, RAG/Q&A generation, queue, object storage,
  analytics provider, or new dependency is introduced in this wave.

## Capabilities

### New Capabilities

- `internal-trial-mvp-hardening`: Trial MVP readiness, cross-workbench trial
  continuity, public preview smoke expectations, safe recovery states, and
  verification for the usable V0 release.

### Modified Capabilities

- `public-trial-auth-foundation`: Clarify that a verified trial continue action
  must reliably navigate to a known workspace route or fall back safely.
- `internal-trial-access-workflow`: Extend the trial overview expectation from
  simple entry/ready state to MVP cockpit guidance and cross-route readiness.
- `workspace-layout-copy`: Tighten operator-facing copy requirements for trial
  MVP status, recovery, and unavailable behavior.

## Impact

- Affected routes and UI: `/`, `/trial`, workspace shell/trial status, and the
  existing V0 workbenches for sessions, rackets, knowledge, AI review, talk
  tracks, and next actions.
- Affected client helpers: shared internal trial/session display helpers and
  scoped API URL utilities if behavior gaps require changes.
- Affected API/runtime: existing auth/session/bootstrap/logout routes and
  protected workbench APIs may receive verifier-only coverage or small safe
  response/copy adjustments, but no new auth provider or data provider.
- Affected verification: OpenSpec validation, focused trial MVP verifier,
  lint/typecheck/build, and Playwright checks on local and public preview.
- Affected docs/specs: README, app README, autonomous roadmap, goal document,
  technical roadmap if preview/recovery expectations change, and the capability
  specs listed above.
