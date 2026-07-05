## Why

Decision next actions are the clearest manual follow-up instructions in the opportunity workspace, but they are only visible after opening a candidate detail. Users scanning the review list need to see saved next actions inline so the queue reads like an operating checklist instead of just status badges.

## What Changes

- Show a concise row-level next action summary when a researched opportunity has a current decision with `nextAction`.
- Keep the summary display-only and scoped to workflow follow-up metadata.
- Keep existing decision badges, missing-next-action badges, selected detail decision display, scoring, exports, and backend read models unchanged.
- Do not add reminders, alerts, scheduled actions, streaks, grades, analytics, AI coaching, task history, or persistence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Add UI behavior for opportunity rows to surface saved decision next actions as neutral workflow follow-up metadata.

## Impact

- Frontend opportunity row research summary display.
- Focused Opportunities page tests for row-level next action summaries.
- OpenSpec and development documentation for opportunity research workspace scanning behavior.
