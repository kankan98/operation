## Why

Opportunity rows now use neutral day-level decision age labels, but the selected detail still says `已记录 N 天`. Aligning the detail panel with the row language makes review freshness easier to scan without changing the decision review model.

## What Changes

- Show `今天决策`, `昨天决策`, or `N 天前决策` in the selected opportunity decision review context.
- Reuse the existing `decisionReview.daysSinceDecision` metadata and existing row age formatter.
- Keep the label display-only and scoped to workflow review metadata.
- Do not add stale filters, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity detail now uses neutral decision age labels consistent with row-level decision age summaries.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for selected detail decision age labels.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
