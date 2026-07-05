## Why

Decision snapshots already capture business signal completeness and missing business assumptions, but selected decision detail does not show that decision-time business context. Showing the saved business summary helps the user review whether a decision was made before cost, fees, or other merchant assumptions were complete.

## What Changes

- Show saved `decision.snapshot.businessSignals.completeness` in the selected opportunity decision detail with a neutral snapshot business label.
- Show saved `decision.snapshot.businessSignals.missingSignals` when present.
- Keep the display scoped to the saved decision snapshot; do not infer or replace it with current opportunity business signals.
- Do not change backend models, persistence, score calculations, recommendations, gates, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, or action history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail surfaces saved business summary context from the existing decision snapshot.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for saved snapshot business summary display and source isolation.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
