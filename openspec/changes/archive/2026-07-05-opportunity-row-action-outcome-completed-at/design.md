## Context

Opportunity list rows already show the saved latest action outcome action label, recency label, and outcome text. Selected detail and comparison views now also show the saved absolute completion time, which is useful for auditing when workflow evidence was completed.

This change only surfaces the existing `research.lastActionOutcome.completedAt` value in the row research summary.

## Goals / Non-Goals

**Goals:**

- Show saved latest action outcome completion time in opportunity list row research summaries when `lastActionOutcome` exists.
- Use a neutral `完成时间 · ...` label.
- Preserve missing outcome state without inferring completion time from other fields.
- Keep the display read-only workflow practice evidence and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new list columns, row actions, action history, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No recalculation or normalization of completion timestamps.

## Decisions

- Read completion time only from `research.lastActionOutcome.completedAt`.
  - Rationale: this is the saved execution evidence timestamp. Notes, decisions, review metadata, action update time, or render time are not action completion evidence.
  - Alternative considered: use `updatedAt` if `completedAt` is missing. Rejected because update time is not the user-recorded completion date.

- Reuse `formatDecisionTime` for the absolute timestamp.
  - Rationale: selected detail and comparison views use the same formatter for action outcome completion time, keeping row/detail/comparison display consistent.
  - Alternative considered: show only a date. Rejected because row summaries should preserve the same audit precision as the other workflow evidence surfaces.

- Render completion time only when a latest action outcome exists.
  - Rationale: missing outcome rows should keep the existing neutral `待补行动结果` state without inferred timestamps.
  - Alternative considered: show placeholder completion time. Rejected because it implies execution evidence that does not exist.

## Risks / Trade-offs

- More text in the row summary can make cards taller -> Mitigation: one compact secondary line using existing small muted text.
- Relative recency and absolute timestamp may feel redundant -> Mitigation: recency helps scanning; absolute time supports audit.
- Missing outcome rows could look sparse -> Mitigation: existing `待补行动结果` state remains unchanged.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved latest outcome completion time is visible in opportunity list row summaries. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
