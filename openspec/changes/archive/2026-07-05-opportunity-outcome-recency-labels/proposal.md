## Why

Latest action outcomes are visible, but users must parse an absolute timestamp to understand whether the execution evidence is fresh. A small day-level recency label makes practice coverage easier to scan without creating reminders or stale-work automation.

## What Changes

- Show a day-level recency label for latest action outcome completion timestamps.
- Surface the label in the selected opportunity action outcome panel and compact research summary.
- Keep the label display-only; it must not add stale filters, reminders, alerts, streaks, training grades, analytics, AI coaching, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: latest action outcome displays now include human-readable recency labels for manual review.

## Impact

- Frontend opportunity workspace display helpers and tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
