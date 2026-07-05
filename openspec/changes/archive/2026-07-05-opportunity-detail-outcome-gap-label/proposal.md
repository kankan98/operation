## Why

Opportunity rows now flag active researched candidates that still lack latest action outcome evidence, but the selected detail action outcome panel only says to record the latest review result. Mirroring the gap in detail helps the user keep the evidence loop visible while they are already in the place where the outcome can be recorded.

## What Changes

- Show a neutral `待补行动结果` indicator in the selected opportunity action outcome detail when an active research entry has no latest action outcome.
- Keep the existing saved outcome display unchanged when latest action outcome metadata exists.
- Keep non-researched or archived candidates out of the active outcome-gap state.
- Do not add stale filters, reminders, alerts, scheduled actions, streaks, analytics, AI coaching, task history, persistence, or scoring inputs.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: selected opportunity detail surfaces the same active latest-outcome gap that candidate rows already expose.

## Impact

- Frontend selected opportunity action outcome detail display.
- Focused Opportunities page tests for detail outcome-gap display.
- Opportunity research workspace documentation and spec.
- Roadmap/current change state.
