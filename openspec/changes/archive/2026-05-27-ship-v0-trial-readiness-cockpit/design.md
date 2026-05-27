## Context

The project already has the pieces needed for an internal usable V0:

- `/trial` and `/` can create or verify an internal demo operator session.
- Six V0 workbenches expose protected scoped list surfaces.
- `trial-workflow-readiness` summarizes whether those workbenches have records.
- `v0-trial-feedback` stores scoped evaluator feedback and returns an evidence
  summary with hotspots and a next-focus recommendation.
- The latest roadmap separates internal V0 progress from production readiness.

The missing piece is an operator-facing readiness decision that combines the
workflow path and evidence review. The implementation should not introduce a new
backend stage, schema, analytics service, or AI call; it should compose existing
safe signals into a clearer cockpit.

## Goals / Non-Goals

**Goals:**

- Show evaluators a V0.9 readiness stage after session verification.
- Explain the next evaluation action in concise Chinese operator language.
- Provide a six-step trial run checklist that says what to test and what
  feedback to capture.
- Keep readiness deterministic and testable with pure helper logic.
- Preserve the local-only, demo-only security boundary and avoid production
  claims.

**Non-Goals:**

- No production auth/login, HTTPS/domain, team invitation, or real sensitive data
  ingestion.
- No database migration, new external dependency, external analytics SDK, RAG, or
  live AI call.
- No long-form onboarding wizard, marketing landing hero, decorative charts, or
  broad dashboard redesign.
- No automatic roadmap mutation from feedback; the cockpit only recommends the
  next focus for human review.

## Decisions

### Compose readiness in a pure client/domain helper

Create a small helper such as `apps/web/src/lib/v0-trial-readiness-cockpit.ts`
that accepts:

- `TrialWorkflowReadinessSummary | null`
- `V0TrialFeedbackEvidenceSummary | null`

and returns:

- readiness stage
- badge label
- headline
- concise rationale
- next action label and optional href
- checklist items derived from the six existing trial workflow steps

Rationale: the signal currently lives in client-loaded protected list results
and feedback evidence. A pure helper keeps UI rendering small, lets checks cover
stage rules without browser automation, and avoids changing API contracts.

Alternative considered: add a server-side `/api/trial-readiness` route. That
would centralize the decision but repeat several protected list calls, add a new
API contract, and increase scope without a current need.

### Deterministic stage mapping

Use a conservative ordered mapping:

1. `fix_blockers` if workflow checks failed or feedback shows severe blockers
   such as low usefulness, low clarity, or real-work `no` signals.
2. `collect_evidence` if the workflow is not complete or fewer than three scoped
   feedback records exist.
3. `prepare_production_gate` if the workflow is complete, at least three scoped
   records exist, no severe blockers are present, and the feedback summary
   recommendation is `production_readiness`.
4. `ready_for_internal_trial` for the remaining complete, low-risk internal trial
   state.

Rationale: V0.9 is an internal readiness gate, not a production certification.
The mapping intentionally errs toward more evidence or blocker fixing before
suggesting production planning.

Alternative considered: compute a numeric percentage. That looks precise but is
less useful to an evaluator than a concrete next action.

### UI placement and density

Render a compact readiness cockpit inside the existing `InternalTrialCockpit`
and `PublicTrialEntryPanel` after `TrialWorkflowReadinessPanel` and before the
feedback form, so the evaluator sees:

- readiness stage and rationale
- next action
- six-step run checklist
- explicit internal/demo-only boundary

Rationale: this placement keeps the cockpit close to the existing progress
summary and before feedback submission, matching the user task: run the path,
then submit evidence.

Alternative considered: replace existing readiness and feedback panels with a
larger dashboard. That would increase visual churn and risk regressions in a
surface that is already working.

### Verification scope

Add a local script/check for helper stage mapping and checklist output. Reuse
existing `trial-feedback:check`, `trial-mvp:check`, lint, typecheck, build, and
OpenSpec validation. Playwright remains a pre-archive rendered check, not every
minor iteration.

## Risks / Trade-offs

- Readiness could look like a production claim -> The copy must explicitly say
  "内部 V0.9" and distinguish production login, HTTPS, backup, sensitive data,
  RAG/Q&A, and monitoring as later gates.
- Sparse feedback could over-direct the roadmap -> The stage mapping keeps
  fewer than three records in `collect_evidence`.
- The existing cockpit component is already large -> Put decision logic in a
  helper and add only a small render component instead of embedding rules inline.
- UI could become noisy -> Use badges, compact checklist rows, and existing
  card/border styles without charts or marketing copy.
- Future production readiness will need stronger evidence -> Keep current helper
  names V0-specific and document that production gates need separate OpenSpec.

## Migration Plan

1. Add helper types and tests/checks without changing runtime behavior.
2. Render the new cockpit section using existing readiness/evidence state.
3. Update docs and accepted spec purpose text where needed.
4. Validate the active change, run checks, then perform pre-archive Playwright.

Rollback is straightforward: remove the helper/component and revert docs/spec
deltas. No persisted data or schema migration is introduced.
