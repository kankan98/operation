## Why

The action outcome form already shows a neutral save-scope note and local save-readiness hints, but the save button itself does not reference that context. Associating the button with the visible notes helps users understand what the save action affects before they commit workflow evidence.

## What Changes

- Associate the action outcome save button with the visible save-scope note.
- When a local save-readiness hint is visible, associate the save button with that hint as well.
- Add focused coverage for enabled and disabled save states.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome save controls expose visible save scope and unavailable-save guidance as accessible descriptions.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`, `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, opportunity research workspace development notes, roadmap
- No API, database schema, dependency, scoring, analytics, reminder, alerting, automation, AI coaching, or training-grade changes.
