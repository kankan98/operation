## Why

Selected opportunity detail now labels saved decision reason and saved next action, but a go/hold decision that still lacks a next action only relies on review badges outside the saved evidence block. Showing a compact gap indicator inside the decision detail keeps the missing follow-up visible where the user reviews the decision evidence.

## What Changes

- Show a neutral `待补下一步` indicator in selected decision detail when the current decision review metadata says the decision needs a next action.
- Keep saved `下一步 · ...` display unchanged when a next action exists.
- Avoid showing the indicator for no-go decisions, undecided candidates, or cases without `needsNextAction`.
- Do not generate or infer a next action, and do not add reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail surfaces the existing next-action gap alongside saved decision evidence.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for selected detail next-action gap display.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
