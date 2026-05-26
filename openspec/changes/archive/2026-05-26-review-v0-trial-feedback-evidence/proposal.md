## Why

The V0 trial can now collect evaluator feedback, but operators and team leads
still cannot turn that feedback into a clear decision about what blocks a usable
version. This matters now because the project goal is to accelerate a usable V0:
the next wave should close the loop from feedback capture to evidence review,
not continue adding unrelated capabilities.

Pre-proposal research and value exploration:

- Nielsen Norman Group usability guidance was checked as a professional UX
  source for small-sample qualitative testing. It supports using a few real
  evaluator sessions to uncover the most severe workflow friction quickly.
- GOV.UK Service Manual user research guidance was checked as an official public
  service source. It reinforces planning research around actual users, tasks,
  evidence, and actionable findings rather than generic satisfaction surveys.
- NIST AI Risk Management Framework was checked as a standards-body source for
  AI-product governance. It supports keeping human feedback, traceability, and
  oversight visible before expanding AI automation.
- UI/UX skill guidance recommended a trust-oriented dashboard style, but the
  durable project decision is to adapt only the useful parts: dense evidence
  summaries, accessible controls, clear status labels, and restrained visual
  treatment. No landing-page or marketing comparison layout will be used.
- JTBD and opportunity-tree exploration identified the target job: when a team
  lead or evaluator finishes trying the V0 path, they need to know which
  workflow friction is most likely to stop real usage and what to fix next. The
  highest-value opportunity is converting scattered notes into grouped,
  severity-aware evidence.

## What Changes

- Extend the V0 trial feedback capability with an evidence review workflow.
- Add server-side feedback summary logic that groups scoped feedback by
  workbench, issue type, real-work signal, ratings, and recent notes.
- Add protected summary support to the existing feedback API without adding an
  external analytics provider or new dependency.
- Add an internal evidence panel to the trial and overview cockpit after a
  verified session is ready, showing:
  - total scoped feedback count
  - low-usefulness / low-clarity counts
  - real-work readiness distribution
  - top issue/workbench hotspots
  - recent representative notes
  - recommended next focus for V0 prioritization
- Update local checks so feedback evidence review is verified alongside create
  and list behavior.
- Update roadmap docs so the current V0 completion estimate and next-wave
  decision path are based on feedback evidence review.

No production analytics SDK, external telemetry, production login, RAG, live AI
call, third-party survey service, or real customer data ingestion is introduced.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `v0-trial-feedback`: add scoped feedback evidence summary, cockpit review
  surface, and prioritization guidance requirements.

## Impact

- Affected app areas: `apps/web/src/server/trial-feedback/*`,
  `apps/web/src/app/api/trial-feedback/route.ts`,
  `apps/web/src/lib/v0-trial-feedback.ts`,
  `apps/web/src/components/internal-trial-access.tsx`, package scripts if
  needed, and roadmap docs.
- Data impact: no new table required; uses the existing local-only
  `v0_trial_feedback` records and preserves tenant/team/actor scope.
- API impact: existing protected feedback route gains summary capability while
  preserving app-owned session cookie auth, explicit tenant/team scope,
  no-store JSON, safe errors, and mutation CSRF for writes.
- Security impact: evidence summaries must not expose raw cookies, session
  references, database URLs, API keys, authorization headers, stack traces, raw
  transcripts, raw prompts, or cross-team feedback.
- Dependency impact: no new runtime or development dependencies.
- Verification impact: OpenSpec validation, feedback check updates, affected
  trial/auth checks, lint, typecheck, build, Playwright before archive, then
  archive, conventional commit, push, Docker redeploy, and public smoke.
