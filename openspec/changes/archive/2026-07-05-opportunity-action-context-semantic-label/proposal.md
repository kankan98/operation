## Why

The action outcome form now shows transient workflow action context, source labels, and manual override state, but assistive technology and tests can only infer that state from separate visible tokens. A single semantic label makes the whole context state easier to read without changing the existing workflow behavior.

## What Changes

- Add an accessible semantic label to the action outcome context chip when transient workflow context is shown.
- Include the context source, original preselected action, and overridden action-to-save in that label when applicable.
- Keep saved latest action outcomes as the source of truth and avoid exposing transient context semantics when a saved outcome exists.
- Keep the change display-only; it does not change action outcome persistence, scoring, reminders, analytics, automation, or backend behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome transient context display exposes its current source, preselected action, and manual override state as one semantic label.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, analytics, or automation changes.
