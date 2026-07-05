## Why

Selected opportunity decision detail now exposes saved snapshot score, recommendation, reasons, gaps, and gate context, but it still hides the saved snapshot confidence. Showing decision-time confidence helps the user judge how reliable the saved decision evidence was when the decision was made.

## What Changes

- Show saved `decision.snapshot.confidence` in the selected opportunity decision detail with a neutral snapshot confidence label.
- Keep the value scoped to the saved decision snapshot; do not infer or replace it with current opportunity confidence.
- Do not change backend models, persistence, score calculations, recommendations, gates, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, training grades, or action history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail surfaces saved snapshot confidence from the existing decision snapshot.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for saved snapshot confidence display and source isolation.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
