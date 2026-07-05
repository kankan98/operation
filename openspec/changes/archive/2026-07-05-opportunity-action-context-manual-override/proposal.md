## Why

Action context helps preselect an action outcome type, but users can still manually change the action type before saving. When the selected action differs from the transient context, the form should make that override explicit so users know which action id will be saved.

## What Changes

- Detect when the selected action outcome type differs from the transient action context.
- Show a display-only override indicator that distinguishes the original preselected action from the current action type that will be saved.
- Keep completion criteria and evidence prompts tied to the current selected action type.
- Keep saved latest action outcomes as the source of truth and avoid showing override labels when a saved outcome exists.
- No backend, schema, API, scoring, reminder, analytics, or automation changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome forms clarify when a transient workflow action context has been manually overridden before saving.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
