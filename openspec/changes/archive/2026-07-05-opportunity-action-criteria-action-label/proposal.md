## Why

The action outcome form shows completion criteria that change with the selected action type, but the criteria panel itself only says "completion definition". Adding the selected action label inside the criteria panel makes the guidance easier to scan and reduces context switching while users write workflow evidence.

## What Changes

- Show the selected action type inside the action outcome completion criteria panel.
- Keep the label synchronized when users change the action type or enter from transient workflow context.
- Preserve existing selected action summary, transient context chip, evidence prompt, save payload, and saved outcome priority behavior.
- Keep the change display-only; it does not change persistence, scoring, reminders, analytics, automation, backend APIs, or schemas.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome completion criteria identify which daily action type they apply to.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
