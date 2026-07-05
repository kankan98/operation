## Why

Decision reasons capture the user's judgment evidence, but the opportunity row currently shows only the decision status and follow-up next action. During review, users need to scan not just what to do next, but also why the current decision exists, without opening each candidate detail.

## What Changes

- Show a concise row-level decision reason summary when a researched opportunity has a current decision.
- Keep the summary display-only and scoped to user-authored workflow evidence.
- Preserve existing selected detail decision display, decision badges, next-action summaries, scoring, exports, and backend read models.
- Do not add generated rationale, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, or persistence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Add UI behavior for opportunity rows to surface saved decision reasons as neutral workflow evidence metadata.

## Impact

- Frontend opportunity row research summary display.
- Focused Opportunities page tests for row-level decision reason summaries.
- OpenSpec and development documentation for opportunity research workspace scanning behavior.
