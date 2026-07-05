## Why

Practice summary filters already show how many active research entries still lack latest action outcome evidence, but the candidate list does not mark those gaps per row. This makes it harder to scan the active queue and immediately see which researched opportunities still need manual execution evidence.

## What Changes

- Show a neutral row-level workflow practice indicator for researched, non-archived opportunities that do not have a latest action outcome.
- Keep existing latest action outcome summaries unchanged for entries that already have execution evidence.
- Keep the indicator display-only and scoped to manual workflow evidence; it must not create reminders, stale filters, alerts, streaks, grades, AI coaching, analytics, scoring inputs, or additional persistence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Add a UI requirement for candidate rows to surface missing latest action outcome evidence as neutral workflow practice metadata.

## Impact

- Frontend opportunity workspace row summary display.
- Focused frontend tests for opportunity row practice evidence states.
- OpenSpec and development documentation for the opportunity research workspace.
