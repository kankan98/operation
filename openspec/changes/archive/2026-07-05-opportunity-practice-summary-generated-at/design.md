## Context

The practice summary read model already includes `generatedAt`, and the workspace uses the summary to show workflow practice coverage near the review summary and daily action plan. The UI currently shows coverage counts, latest completion, action buckets, and the caveat, but not the timestamp that tells the user when the displayed summary was generated.

This change only surfaces the existing `summary.generatedAt` value in the practice summary strip.

## Goals / Non-Goals

**Goals:**

- Show the returned practice summary generation time when summary data is loaded.
- Use a neutral `汇总时间 · ...` label near the practice summary caveat.
- Preserve loading and missing-summary states without inferred timestamps.
- Keep the display read-only workflow practice coverage metadata and non-scoring.

**Non-Goals:**

- No backend API, database, schema, OpenAPI, dependency, or scoring changes.
- No new practice history, reminders, alerts, stale filters, streaks, training grades, AI coaching, analytics, or persistent task systems.
- No recalculation or normalization of summary timestamps.

## Decisions

- Read summary time only from `summary.generatedAt`.
  - Rationale: this is the read model timestamp returned with practice coverage. Render time, daily action plan time, action outcome time, review summary time, or decision timestamps are not practice summary generation evidence.
  - Alternative considered: use current browser time when the strip renders. Rejected because that would imply a generated summary time not returned by the read model.

- Reuse `formatDecisionTime` for the absolute timestamp.
  - Rationale: the workspace already uses this formatter for audit timestamps, keeping practice summary, action plan, and evidence displays consistent.
  - Alternative considered: show only a date. Rejected because summary generated time should preserve existing timestamp precision.

- Render summary time only when a summary object is loaded.
  - Rationale: loading and missing-summary states should not show inferred or placeholder timestamps.
  - Alternative considered: show a placeholder summary time. Rejected because it implies a generated read model exists.

## Risks / Trade-offs

- Extra metadata can add noise below the coverage cards -> Mitigation: render it as one compact muted line near the existing caveat.
- Users could mistake the timestamp for a performance metric -> Mitigation: label it as `汇总时间` and keep the caveat visible.

## Migration Plan

This is frontend-only display work. Deploying or rolling back only changes whether the practice summary generation time is visible. Existing persisted data, practice summary derivation, and scoring outputs remain unchanged.

## Open Questions

None.
