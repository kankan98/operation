## Why

Daily action plan items already apply focused workflow filters, but the panel does not show which action remains the current entry point after selection. Adding an explicit active state helps users keep orientation while practicing review work from the action plan.

## What Changes

- Show a visual active state on the daily action plan item whose filters exactly match the current UI state.
- Expose `aria-pressed=true` for the active daily action item and `aria-pressed=false` for inactive items.
- Avoid claiming an active daily action when extra filters narrow the list or when the transient action context is missing or points to a different action.
- Keep the behavior display-only and frontend-derived; it does not change scoring, action plan read models, persistence, reminders, analytics, or automation.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Daily action plan items gain display-only active/pressed state when the current UI filters exactly match the selected action item.

## Impact

- Affected code: `frontend/src/pages/Opportunities.tsx`
- Affected tests: `frontend/tests/pages/Opportunities.test.tsx`
- Affected docs/specs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`
- No backend, schema, OpenAPI, dependency, scoring, scheduling, reminder, or automation changes.
