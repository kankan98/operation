## Why

Practice summary already exposes the latest action completion timestamp, but the summary card shows only an absolute time. Reusing the neutral recency label makes the practice coverage overview faster to scan without adding reminders, stale rules, or scoring behavior.

## What Changes

- Show a day-level recency label for the practice summary `latestCompletedAt` value.
- Keep the absolute completion time visible as secondary detail when a latest completion exists.
- Keep the label display-only; it must not add stale filters, reminders, alerts, streaks, training grades, analytics, AI coaching, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: practice summary latest completion display now includes a neutral recency label.

## Impact

- Frontend opportunity workspace practice summary UI and tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
