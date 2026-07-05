## Why

Users deciding opportunity candidates currently start the decision reason from a blank textarea. A small static writing frame can help them turn manual evidence into a structured decision record without introducing automation, scoring, or backend changes.

## What Changes

- Add a decision-form control that fills an empty decision reason with an editable static evidence frame for the currently selected decision status.
- Keep the frame aligned with the selected status when the user switches between go, hold, and no-go before filling.
- Disable the fill control when the decision reason already contains text so manual evidence is not overwritten.
- Keep saving explicit: filling a frame does not auto-save and does not change decision snapshot, scoring, analytics, reminders, or training behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: Add frontend-only manual decision evidence frame filling for the selected opportunity decision form.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Specs/docs: `openspec/specs/opportunity-research-workspace/spec.md`, `docs/development/opportunity-research-workspace.md`, `docs/roadmap.md`, `.claude/state/current-change.json`
- No backend schema, OpenAPI, dependency, persistence, scoring, automation, reminder, alert, scheduled action, stale-filter, streak, analytics, AI coaching, or training-grade changes.
