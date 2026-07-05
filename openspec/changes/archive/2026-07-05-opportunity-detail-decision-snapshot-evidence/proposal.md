## Why

Selected opportunity decision detail shows the saved decision status, user reason, next action, and snapshot score, but it does not expose the evidence lists captured in the same decision snapshot. Showing the saved snapshot reasons and gaps helps the user review what framed the decision at the time it was made.

## What Changes

- Show saved `decision.snapshot.keyReasons` in the selected opportunity decision detail with a neutral snapshot evidence label.
- Show saved `decision.snapshot.missingSignals` in the same detail area with a neutral snapshot gap label.
- Preserve empty states; do not infer snapshot evidence from current opportunity data when the saved snapshot arrays are empty.
- Do not change backend models, persistence, score calculations, recommendations, gates, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, or action history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail surfaces saved decision snapshot evidence and gaps from the existing snapshot.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for saved snapshot evidence display and empty-state behavior.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
