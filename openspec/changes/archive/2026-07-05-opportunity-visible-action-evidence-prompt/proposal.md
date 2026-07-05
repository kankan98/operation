## Why

The action outcome evidence prompt currently appears only as textarea placeholder text, so it disappears once the user starts writing. Keeping the prompt visible helps users continue writing evidence aligned to the selected workflow action.

## What Changes

- Show the selected action's evidence prompt as a visible neutral writing hint near the action outcome textarea.
- Keep the visible prompt synchronized with the selected action type, transient workflow context, manual action changes, and saved latest action outcomes.
- Preserve the existing textarea placeholder, completion criteria, selected-action summary, save payload, and saved outcome priority behavior.
- Keep the change display-only; it does not add semantic validation, AI coaching, scoring inputs, reminders, analytics, automation, backend APIs, or schemas.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome forms keep the selected action's evidence-writing prompt visible while users record workflow evidence.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
