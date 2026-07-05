## Context

The opportunity research workspace already requests a review summary read model that includes `generatedAt`. The current UI renders the workflow counts but does not expose when those counts were generated, while adjacent daily action and practice summary surfaces already show their returned generated times.

## Goals / Non-Goals

**Goals:**

- Show `summary.generatedAt` near the review summary cards when loaded data is available.
- Keep the timestamp clearly labeled as neutral read model metadata.
- Cover loaded and loading/missing states in focused frontend tests.

**Non-Goals:**

- No API, backend schema, OpenAPI, persistence, scoring, recommendation, market signal, or business metric changes.
- No automation, reminders, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or new task system.
- No fallback from render time or other read models when review summary `generatedAt` is absent.

## Decisions

- Render the timestamp inside `ReviewSummaryCards` from `summary.generatedAt` only.
  - Rationale: the component already owns the loaded/missing state for review summary counts, so it is the narrowest place to keep display logic scoped.
  - Alternative considered: deriving a timestamp in the parent from request timing; rejected because it would blur returned read model time with UI render time.
- Use the existing `formatDecisionTime` formatter and `汇总时间` label.
  - Rationale: this matches adjacent summary timestamp displays and avoids introducing a new formatting path.
  - Alternative considered: a separate `复盘汇总时间` label; rejected because the component context already establishes this is the review summary.

## Risks / Trade-offs

- Timestamp visibility may be mistaken for a freshness guarantee -> mitigate by labeling it as display-only summary metadata in docs/specs.
- Snapshot tests could become time-sensitive -> mitigate by using deterministic `generatedAt` values in frontend tests.
