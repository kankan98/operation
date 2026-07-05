## Why

The action outcome form already updates completion criteria and evidence prompts as the selected action type changes, but when there is no transient workflow context the form does not summarize which action type will be saved. A small selected-action summary reduces ambiguity in the default/manual-entry path.

## What Changes

- Show a neutral selected-action summary in the action outcome form whenever no saved latest action outcome is taking priority.
- Keep transient action context chip behavior unchanged; when context exists, the summary should match the current selected action type while the context chip still explains source and overrides.
- Keep completion criteria, evidence prompt, and save payload tied to the selected action type.
- Keep the change display-only; it does not change persistence, scoring, reminders, analytics, automation, backend APIs, or schemas.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome forms summarize the currently selected action type that will be saved before users record workflow evidence.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
