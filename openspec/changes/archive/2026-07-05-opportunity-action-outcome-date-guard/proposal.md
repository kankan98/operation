## Why

Action outcomes now support explicit completion dates, but neither the frontend nor the API prevents users from saving a future completion date. Future-dated outcomes weaken the review evidence model because they can make practice coverage look complete before the work happened.

## What Changes

- Reject action outcome `completedAt` values that are later than the current time.
- Prevent the opportunity workspace completion date control from selecting dates after the user's current local date.
- Disable action outcome saving when the selected completion date is invalid or in the future.
- Keep the guard scoped to workflow evidence integrity; it must not add reminders, history, streaks, training grades, AI coaching, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: action outcome recording now guards completion dates so future dates cannot be saved as latest workflow evidence.

## Impact

- Shared opportunity research action outcome request schema and generated JavaScript schema.
- Backend request validation and API/schema tests.
- Frontend opportunity workspace action outcome date control and tests.
- Opportunity research workspace documentation and spec.
