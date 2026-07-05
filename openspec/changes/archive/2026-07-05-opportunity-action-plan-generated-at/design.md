## Context

The daily action plan read model already includes `generatedAt`, and the API/spec describe it as workflow practice metadata. The opportunity workspace panel currently shows action items and the caveat, but not the timestamp that tells the user when the displayed plan was generated.

This change only surfaces the existing `plan.generatedAt` value in the daily action plan panel.

## Goals / Non-Goals

**Goals:**

- Show the returned daily action plan generation time when a plan is loaded.
- Use a neutral `计划时间 · ...` label near the plan caveat.
- Preserve loading and no-plan states without inferred timestamps.
- Keep the display read-only workflow practice metadata and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new plan scheduling, reminders, alerts, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No recalculation or normalization of plan timestamps.

## Decisions

- Read plan time only from `plan.generatedAt`.
  - Rationale: this is the read model timestamp returned with the action plan. Render time, practice summary time, action outcome time, or decision timestamps are not plan generation evidence.
  - Alternative considered: use current browser time when the panel renders. Rejected because that would imply a generated plan time not returned by the read model.

- Reuse `formatDecisionTime` for the absolute timestamp.
  - Rationale: the opportunity workspace already uses this formatter for audit timestamps, keeping display consistent without new formatting dependencies.
  - Alternative considered: show only a date. Rejected because action plan generated time should preserve the existing timestamp precision.

- Render plan time only when a plan object is loaded.
  - Rationale: loading and missing-plan states should not show inferred or placeholder timestamps.
  - Alternative considered: show a placeholder plan time. Rejected because it implies a generated read model exists.

## Risks / Trade-offs

- Extra metadata can add noise below the action cards -> Mitigation: render it as one compact muted line near the existing caveat.
- Users could mistake the timestamp for an automation schedule -> Mitigation: label it as `计划时间` and keep the caveat visible.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether the daily action plan generation time is visible. Existing persisted data, action plan derivation, and scoring outputs remain unchanged.

## Open Questions

None.
