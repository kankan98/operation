## Why

The workspace can summarize practice coverage, but the user still has to manually scan the list to find candidates missing execution evidence or belonging to a specific action bucket. Turning practice coverage into explicit filters makes the daily operations loop actionable without adding automation or scoring.

## What Changes

- Add workflow-only query filters for latest daily action outcome coverage.
- Let opportunity and research list APIs filter by entries with outcomes, entries without outcomes, and a specific latest action id.
- Let the opportunity workspace apply practice summary filters from the compact practice coverage strip.
- Keep these filters non-scoring; they must not change opportunity score, recommendation, confidence, market signals, business metrics, or factor contributions.
- Do not add action history, reminders, streaks, habits, training grades, AI coaching, or persistent task systems.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add workflow practice filters based on latest daily action outcome metadata.

## Impact

- Shared schemas/types: extend opportunity and research list query contracts with action outcome coverage filters.
- Backend: apply filters against research metadata in opportunity list and research list read models.
- Frontend: add practice coverage filter state and clickable practice summary bucket controls.
- Tests/docs/specs: cover query validation, archived behavior, UI filtering, and non-scoring caveats.
