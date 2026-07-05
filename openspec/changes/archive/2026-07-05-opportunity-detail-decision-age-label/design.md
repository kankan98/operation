## Context

The opportunity row now displays decision age as `今天决策`, `昨天决策`, or `N 天前决策` using `decisionReview.daysSinceDecision`. The selected decision detail still displays `已记录 N 天`, which is semantically equivalent but less direct for review scanning.

This is a frontend-only consistency change. It should reuse the existing `formatDecisionAge` helper and not change the backend review model.

## Goals / Non-Goals

**Goals:**

- Show neutral decision age labels in selected opportunity detail when `daysSinceDecision` is available.
- Keep the detail and row decision age language consistent.
- Preserve the existing empty state for opportunities without a current decision.

**Non-Goals:**

- Do not change backend read models, schemas, database columns, exports, or Chat tools.
- Do not add stale filters, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, or new persistence.
- Do not change opportunity score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Decisions

- Reuse `formatDecisionAge(daysSinceDecision)` rather than adding a second formatter. This keeps row and detail labels aligned.
- Keep the existing selected detail layout and only replace the text inside the decision review context. This avoids UI churn in a dense operational panel.
- Continue showing `暂无当前决策` when no current decision exists or no age metadata is available.

## Risks / Trade-offs

- Removing the literal `已记录 N 天` wording could affect tests or user recognition. Mitigation: tests will assert the clearer day-level labels and preserve the no-decision empty state.
- Decision age changes with time. Mitigation: it remains display-only derived metadata and does not create persistence, filters, or scoring behavior.
