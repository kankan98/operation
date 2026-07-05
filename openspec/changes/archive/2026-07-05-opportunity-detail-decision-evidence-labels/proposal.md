## Why

Opportunity rows label saved decision evidence as `决策依据 · ...` and `下一步 · ...`, but the selected opportunity decision detail still renders the saved reason and next action as unlabeled text. Adding the same labels to the detail panel makes the decision evidence easier to scan at the point where the user reviews or edits it.

## What Changes

- Show the saved selected-detail decision reason with a neutral `决策依据 · ...` label.
- Show the saved selected-detail decision next action with a neutral `下一步 · ...` label when it exists.
- Preserve the absent-next-action state; do not invent or infer a next action.
- Do not change backend models, persistence, scoring, recommendations, gates, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, or task history.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity decision detail labels saved decision evidence consistently with row-level summaries.

## Impact

- Frontend selected opportunity decision detail display.
- Focused Opportunities page tests for detail decision evidence labels.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
