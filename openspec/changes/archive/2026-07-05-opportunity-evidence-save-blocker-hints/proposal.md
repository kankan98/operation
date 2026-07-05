## Why

The opportunity workspace now guards decision and action outcome saves with several local conditions, but users only see a disabled button when a condition is not satisfied. Showing a neutral blocker hint makes manual evidence recording easier to recover without changing the underlying workflow model.

## What Changes

- Show a concise save blocker hint near the decision save controls when the selected decision cannot be saved.
- Show a concise save blocker hint near the action outcome save controls when the latest action outcome cannot be saved.
- Reuse the same local conditions that already disable saving, including empty evidence, over-limit evidence text, invalid or future completion dates, and missing research entry where applicable.
- Keep hints scoped to manual workflow evidence entry; they must not add semantic validation, AI coaching, reminders, alerts, scheduled actions, streaks, training grades, analytics, persistence, history, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision and action outcome forms now explain why manual evidence cannot currently be saved.

## Impact

- Frontend opportunity workspace decision and action outcome form.
- Frontend opportunity workspace tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
