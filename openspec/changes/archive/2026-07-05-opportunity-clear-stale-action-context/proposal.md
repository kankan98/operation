## Why

Daily action and practice bucket selections intentionally prefill the action outcome form, but that transient context can remain after the user manually changes discovery or review filters. If it persists into a different candidate set, the form can preselect the wrong action id and reduce the quality of manually recorded workflow evidence.

## What Changes

- Clear transient action context when the user manually edits opportunity workspace filters or mode controls.
- Preserve action context when it is intentionally set by daily action plan or practice bucket controls.
- Preserve saved latest action outcomes as the source of truth; saved outcome action ids still override transient context.
- Keep the behavior UI-only and non-scoring; it must not add reminders, alerts, streaks, grades, analytics, AI coaching, task history, or persistence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Add UI behavior to clear stale transient action context after manual filter/mode edits so action outcome prefill stays tied to the selected workflow action.

## Impact

- Frontend opportunity workspace state handling.
- Focused Opportunities page tests for clearing action context after manual filter edits.
- OpenSpec and development documentation for action context lifetime.
