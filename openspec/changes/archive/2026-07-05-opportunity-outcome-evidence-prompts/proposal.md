## Why

The action outcome form now shows completion criteria, but the free-text result field still gives no action-specific cue for what to write. Static evidence prompts can help users capture reusable review evidence without turning the workflow into scoring, grading, or coaching.

## What Changes

- Add a static outcome evidence prompt for each daily action id.
- Show the selected action's prompt as the action outcome textarea placeholder.
- Update the prompt when the user changes action type or when daily action/practice bucket context preselects an action.
- Keep prompts as manual writing guidance only; they must not add semantic validation, AI coaching, reminders, streaks, training grades, analytics, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: action outcome recording now gives action-specific static prompts for writing better workflow evidence.

## Impact

- Frontend opportunity workspace action outcome form and tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
