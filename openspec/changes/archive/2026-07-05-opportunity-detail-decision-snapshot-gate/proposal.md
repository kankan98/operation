## Why

Decision snapshots already capture the recommendation gate that shaped the saved score and recommendation, but the selected decision detail only shows the snapshot score, recommendation, reasons, and missing signals. Surfacing saved gate context helps the user understand whether the decision was made under a blocked or caution state without confusing it with the current live gate.

## What Changes

- Show saved `decision.snapshot.recommendationGate` status in the selected opportunity decision detail when the saved gate was applied, blocked, caution, or contains gate evidence.
- Show saved snapshot gate reasons, signals, and next actions with neutral snapshot labels.
- Preserve empty and clear states; do not infer or backfill snapshot gate context from the current opportunity `recommendationGate`.
- Do not change backend models, persistence, scoring, recommendations, gates, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, or action history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail surfaces saved recommendation gate context from the existing decision snapshot.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for saved snapshot gate context and clear-state behavior.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
