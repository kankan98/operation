## Context

The previous wave added local-only V0 feedback capture. Verified trial
evaluators can submit role, workbench, ratings, issue type, note, and real-work
signal from `/trial` and the overview cockpit. The remaining gap is the review
loop: feedback exists as records, but there is no operator-facing evidence
summary that helps decide whether the next V0 wave should focus on experience
polish, AI quality, source trust, downstream conversion, sample data, or
production readiness.

This change stays inside the current local runtime architecture:
PostgreSQL/Drizzle, Zod validation, server-only repository logic, protected
Route Handlers, explicit tenant/team scope, app-owned trial session cookies, and
no-store safe JSON. It does not introduce analytics infrastructure or a new data
model because the existing `v0_trial_feedback` table already contains the
required evidence fields.

Primary users are team leads and evaluators reviewing V0 trial usefulness. The
improved workflow is: enter trial, try one or more workbenches, submit feedback,
then immediately see a scoped evidence snapshot and the recommended next focus.

## Goals / Non-Goals

**Goals:**

- Summarize scoped V0 trial feedback into evidence that is readable by a team
  lead or evaluator without leaving the trial cockpit.
- Group feedback by workbench, issue type, ratings, real-work signal, and recent
  representative notes.
- Produce deterministic prioritization guidance that maps common issue types to
  V0 next-step categories.
- Keep the API protected by the existing session, tenant/team scope, no-store
  responses, and safe error model.
- Update route checks and roadmap docs so this feedback review becomes the
  explicit decision gate for the next wave.

**Non-Goals:**

- No external telemetry, product analytics SDK, third-party survey, warehouse,
  event stream, or new dependency.
- No production login, invitation, team switching, HTTPS, or real customer-data
  entry.
- No AI-generated prioritization, live model calls, RAG, or automatic roadmap
  mutation.
- No new feedback table or migration unless implementation evidence shows the
  existing table cannot support the review summary.
- No broad redesign of the workspace.

## Decisions

1. **Use repository-level deterministic aggregation.**

   The feedback table already stores the dimensions needed for evidence review.
   Aggregating in the server-only repository keeps business rules close to data
   access, avoids exposing raw records as the only way to reason about feedback,
   and remains testable through the existing local check pattern. Alternative:
   aggregate in the React component. Rejected because UI-only aggregation would
   duplicate prioritization rules and make API verification weaker.

2. **Return summary from the existing protected feedback route.**

   The current `GET /api/trial-feedback` route already handles auth, scope, and
   no-store list behavior. The route can include a `summary` object in the
   success body without breaking existing clients that read `feedback`.
   Alternative: create `/api/trial-feedback/summary`. Rejected for this wave
   because the data boundary, permission model, and verification path are the
   same, and a separate route would add boilerplate without user value.

3. **Keep prioritization transparent and rule-based.**

   The recommendation will not call AI. It will derive a next focus from
   observable feedback signals:
   - no or sparse feedback -> collect more complete trial paths
   - many `missing_data` issues -> improve sample/demo data quality
   - many `ai_quality` issues or low usefulness on AI review -> AI review quality
   - many `source_trust` issues -> source trust and knowledge review
   - many `downstream_action` issues -> talk-track/task handoff continuity
   - many workflow, copy, mobile, or performance issues -> V0 experience polish
   - strong positive real-work signal with limited severe issues -> production
     readiness prerequisites

   Alternative: use a weighted scoring framework with configurable admin
   settings. Rejected because current V0 needs a clear default, not another
   configuration surface.

4. **Expose a compact evidence panel inside existing trial surfaces.**

   The panel will be shown after verified trial readiness, near the existing
   progress/feedback controls. It should present small metrics, top hotspots,
   recent notes, and next focus without a dashboard-heavy redesign. The panel
   uses existing workspace styles and Chinese operator copy. Alternative:
   build a new `/feedback` route. Rejected for this wave because feedback review
   must stay close to the trial flow and avoid expanding navigation before V0 is
   validated.

5. **Cap included records while preserving total count.**

   The repository can count all scoped feedback and fetch the most recent
   bounded set for grouped evidence. The summary will report both `totalCount`
   and `includedCount` so the UI does not imply exhaustive note analysis when
   data grows. This avoids unbounded response payloads while keeping V0 simple.

## Risks / Trade-offs

- **Small feedback samples can mislead priority decisions** -> Show sparse-data
  guidance when fewer than three feedback records exist and label the next focus
  as a recommendation, not a final roadmap decision.
- **Summary could expose sensitive note content** -> Reuse existing note
  validation, return only concise recent notes already permitted by feedback
  storage rules, and avoid logs with note content.
- **Rule-based recommendation may be too simple** -> Keep mapping transparent in
  code and docs; future waves can feed formal evaluation or analytics only after
  V0 evidence proves the need.
- **Evidence panel can clutter trial surfaces** -> Use compact metrics and
  collapsible-looking sections through existing card density; do not add hero
  copy, marketing layout, or large decorative visuals.
- **Counting and aggregating all scoped feedback may become expensive later** ->
  V0 feedback volume is intentionally small. If production feedback grows, a
  later OpenSpec can add materialized summaries, pagination, or analytics
  infrastructure.

## Migration Plan

1. Extend the trial feedback repository with summary types and aggregation
   helpers over existing records.
2. Extend the list route success body with `summary` while preserving existing
   `feedback` response shape.
3. Extend client helper types and the trial/overview cockpit to render evidence
   summary states.
4. Update local trial feedback checks to seed multiple feedback scenarios and
   assert summary counts, hotspots, safe scope, and recommendation behavior.
5. Update roadmap docs with the new V0 evidence review status.
6. Run OpenSpec validation, local checks, lint/type/build, and Playwright before
   archive.

Rollback: remove the summary UI and API fields while leaving feedback capture
records intact. No migration rollback is expected because this wave should not
change the database schema.

## Open Questions

None for this wave. A future production feedback/analytics wave may revisit
dedicated dashboards, configurable scoring, formal evaluation datasets, or
integration with a production auth/team model after V0 evidence is reviewed.
