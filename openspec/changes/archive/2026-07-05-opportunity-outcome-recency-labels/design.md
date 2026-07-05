## Context

The opportunity workspace stores and displays the latest action outcome `completedAt` timestamp. The selected detail panel and compact research summary currently show action outcome evidence, but the user must mentally translate timestamps into recency when scanning execution coverage.

## Goals / Non-Goals

**Goals:**

- Add a day-level recency formatter for latest action outcome completion timestamps.
- Show recency labels in the selected opportunity action outcome panel.
- Show recency labels in the compact research summary when a latest action outcome exists.

**Non-Goals:**

- No backend, database, schema, API, or export changes.
- No stale outcome filter, alert, reminder, streak, grade, AI coaching, analytics, or scoring input.
- No changes to how action outcomes are saved or cleared.

## Decisions

1. Compute recency in the frontend from local calendar days.

   Rationale: the UI already treats action outcomes as day-level workflow evidence, and this change only improves display. Alternative considered: adding backend-derived recency, but that would add API churn for a presentation-only cue.

2. Use simple labels: `今天完成`, `昨天完成`, and `<N> 天前完成`.

   Rationale: these labels are fast to scan and avoid implying a threshold or stale state.

3. Keep the existing absolute timestamp visible in the selected detail panel.

   Rationale: recency helps scanning, while the exact timestamp remains useful evidence. Compact summaries can use the recency label to avoid visual noise.

## Risks / Trade-offs

- [Risk] Client clock or timezone can differ from server time. -> Mitigation: the label is display-only; server validation still controls saved timestamps.
- [Risk] Users may infer stale thresholds from older labels. -> Mitigation: do not style older labels as warnings and do not add filters or alerts.
