## Why

The action outcome textarea already shows the evidence prompt visually, but assistive technology users need the same guidance associated with the input instead of only nearby on the page. Binding the prompt as descriptive text keeps the evidence capture workflow reviewable without changing saved data or scoring behavior.

## What Changes

- Associate the action outcome textarea with the visible evidence prompt using a stable `aria-describedby` target.
- Keep the existing visible `证据提示 · ...` copy synchronized with the selected action type.
- Add focused coverage that verifies the textarea references the visible evidence prompt.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome evidence guidance becomes an accessible description of the action outcome input.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`, `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, opportunity research workspace development notes, roadmap
- No API, database schema, dependency, automation, analytics, scoring, alerting, reminder, or training-grade changes.
