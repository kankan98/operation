## Context

Opportunity rows already display research status, priority, decision status, review badges, saved decision reason, saved next action, and latest action outcome metadata. The selected detail panel also shows how many days a decision has been recorded, using `decisionReview.daysSinceDecision`, but that freshness signal is not visible during row scanning.

This change is UI-only. It should reuse existing `decisionReview` metadata returned by the opportunity read model and must not introduce a new review threshold, filter, persistence, or scoring behavior.

## Goals / Non-Goals

**Goals:**

- Show decision age on researched opportunity rows when a current decision has `daysSinceDecision`.
- Use neutral day-level labels: `今天决策`, `昨天决策`, or `N 天前决策`.
- Keep the row summary compact and display-only.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not add stale filters, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, or new persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Use `research.decisionReview.daysSinceDecision` instead of recomputing age from timestamps in the frontend. The backend already owns review metadata, including the existing 14-day stale threshold.
- Render the age as a short text row near the saved decision reason and next action. It belongs with decision workflow evidence, not with score or market signals.
- Hide the age summary when there is no current decision or `daysSinceDecision` is `null`, to avoid inventing an age for undecided candidates.

## Risks / Trade-offs

- Row summaries can become dense. Mitigation: keep the label one short line and use existing muted text styling.
- `daysSinceDecision` can change over time without user edits. Mitigation: the label is display-only metadata and does not create persistence, filters, or scoring changes.
