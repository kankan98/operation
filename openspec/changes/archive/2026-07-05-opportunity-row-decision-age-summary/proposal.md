## Why

Opportunity rows already show saved decision reasons and next actions, but the row does not show how old a current decision is unless the user opens the selected detail. A compact decision age summary helps users scan review freshness while staying within the manual-first review workflow.

## What Changes

- Show a concise row-level decision age summary when a researched opportunity has current decision review metadata with `daysSinceDecision`.
- Use neutral labels such as `今天决策`, `昨天决策`, or `N 天前决策`.
- Keep the summary display-only and scoped to workflow review metadata.
- Do not add stale filters, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: opportunity rows now surface current decision age as neutral workflow review metadata.

## Impact

- Frontend opportunity row research summary display.
- Focused Opportunities page tests for row-level decision age summaries.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
