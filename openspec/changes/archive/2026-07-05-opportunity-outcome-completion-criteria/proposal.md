## Why

Daily action plans already define completion criteria, but those criteria are only visible on the plan cards. When users record an action outcome from the selected opportunity detail, the form does not remind them what evidence should count as complete for the selected action type.

## What Changes

- Show the selected daily action's fixed completion criteria inside the action outcome form.
- Update the criteria when the user changes the action outcome type or when transient action context preselects an action.
- Keep the criteria as workflow practice guidance only; it must not add outcome scoring, training grades, reminders, streaks, AI coaching, history, or new persistence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: action outcome recording now surfaces the selected action's completion criteria at the point of recording evidence.

## Impact

- Frontend opportunity workspace action outcome form and tests.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
