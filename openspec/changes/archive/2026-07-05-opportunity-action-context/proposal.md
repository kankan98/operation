## Why

The workspace can now filter candidates by practice coverage, but recording an outcome still starts from a generic action id. Carrying the selected workflow action into the outcome form reduces manual mismatch and makes the daily action loop easier to complete.

## What Changes

- Track the active workflow action context when the user selects a daily action item or a practice action bucket.
- Prefill the action outcome form with that action id when the selected candidate has no existing latest outcome.
- Display a compact workflow context label near the action outcome form.
- Keep the context UI-only and non-scoring; it must not add persistence, history, reminders, habits, training grades, or AI coaching.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: preserve selected action context through the opportunity workspace UI and use it to prefill manual action outcome recording.

## Impact

- Frontend: add transient action context state and pass it to the selected opportunity decision/outcome panel.
- Tests: cover daily action and practice bucket context prefill behavior.
- Docs/specs: document that action context is workflow-only and does not affect scoring or stored metadata until the user explicitly saves an outcome.
