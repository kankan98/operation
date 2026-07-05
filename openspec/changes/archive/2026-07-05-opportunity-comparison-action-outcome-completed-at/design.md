## Context

The opportunity comparison table already shows the saved latest action outcome action label, recency label, and outcome text. The selected opportunity detail shows the saved absolute completion time as well, which is useful for auditing exactly when workflow evidence was completed.

This change only surfaces the existing `research.lastActionOutcome.completedAt` value in the comparison table.

## Goals / Non-Goals

**Goals:**

- Show saved latest action outcome completion time in the comparison table when `lastActionOutcome` exists.
- Use a neutral `完成时间 · ...` label.
- Preserve missing outcome state without inferring completion time from other fields.
- Keep the display read-only workflow practice evidence and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new comparison columns.
- No new action history, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No recalculation or normalization of completion timestamps.

## Decisions

- Read completion time only from `item.research?.lastActionOutcome?.completedAt`.
  - Rationale: this is the saved execution evidence timestamp. Other fields such as update time, decision time, daily action metadata, or render time are not action completion evidence.
  - Alternative considered: use `updatedAt` if `completedAt` is missing. Rejected because update time is not the user-recorded completion date.

- Reuse `formatDecisionTime` for the absolute timestamp.
  - Rationale: selected detail already uses this formatter for action outcome completion time, keeping date formatting consistent across views.
  - Alternative considered: show only a date. Rejected because the comparison table should preserve the same audit precision as detail.

- Render completion time only when a latest action outcome exists.
  - Rationale: missing outcome state should remain a neutral `未记录` state without inferred timestamps.
  - Alternative considered: show placeholder completion time. Rejected because it adds noise and can imply evidence that does not exist.

## Risks / Trade-offs

- More text in the action outcome column can increase row height -> Mitigation: one compact line and existing line-clamped outcome text.
- Relative recency and absolute timestamp may feel redundant -> Mitigation: recency helps scanning; absolute time supports audit.
- Missing outcome rows could look sparse -> Mitigation: existing `未记录` state remains unchanged.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether saved latest outcome completion time is visible in the comparison table. Existing persisted data and scoring outputs remain unchanged.

## Open Questions

None.
