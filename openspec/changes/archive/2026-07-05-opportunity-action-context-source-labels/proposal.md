## Why

The action outcome form already preselects a daily action id from transient workflow context, but the context chip does not distinguish whether that context came from a daily action plan item or a practice summary bucket. Showing the source helps users understand why the form is prefilled before they save execution evidence.

## What Changes

- Show a source-specific label in the action outcome context chip for daily action plan selections.
- Show a source-specific label in the action outcome context chip for practice action bucket selections.
- Keep the existing action id prefill and saved-outcome priority behavior unchanged.
- Keep the labels display-only; they do not change scoring, persistence, read models, reminders, analytics, or automation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome transient context display clarifies whether the preselected action came from a daily action or a practice bucket.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
