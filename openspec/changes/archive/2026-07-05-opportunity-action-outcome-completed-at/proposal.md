## Why

Daily action outcomes already store `completedAt`, but the opportunity workspace always saves outcomes as completed "now." Users often record review work after the fact, so allowing an explicit completion date makes practice evidence more accurate without adding a full action history system.

## What Changes

- Add an action outcome completion date control to the selected opportunity detail form.
- Default new action outcomes to today's date, and initialize existing outcomes from their saved `completedAt`.
- Send the selected completion date through the existing action outcome save API.
- Keep the completion date as workflow practice evidence only; it must not affect opportunity scoring, recommendation gates, market signals, business metrics, reminders, streaks, or training grades.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: action outcome recording now lets the user choose the latest action completion date.

## Impact

- Frontend opportunity workspace action outcome form and tests.
- Opportunity research workspace documentation and main spec.
- No database migration, backend route, or shared schema change is expected because `completedAt` is already part of the action outcome request schema.
