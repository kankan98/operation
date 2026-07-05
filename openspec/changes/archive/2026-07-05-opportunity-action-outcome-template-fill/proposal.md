## Why

Evidence examples help users understand good action outcome notes, but the next improvement is reducing the friction of starting a structured record. A one-click action-specific record frame helps users practice consistent operational review notes while keeping the user in control of the final saved evidence.

## What Changes

- Add an action-specific `填入记录框架` control beside the action outcome input.
- Fill the empty action outcome textarea with a static structure for the selected action type.
- Disable the frame-fill control once the user has entered outcome text so existing manual work is not overwritten.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Action outcome evidence writing supports an optional static record frame for the selected action type.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`, `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, opportunity research workspace development notes, roadmap
- No API, database schema, dependency, scoring, analytics, reminders, alerts, automation, semantic validation, AI coaching, or training-grade changes.
