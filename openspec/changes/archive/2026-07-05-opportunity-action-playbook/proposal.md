## Why

The daily action plan can point the user to the right queue, but it still assumes the user already knows what good execution looks like. Adding deterministic playbook guidance turns each action into a small operating drill: what skill to practice, what steps to take, and what outcome counts as complete.

## What Changes

- Extend daily opportunity action items with a learning goal, execution steps, and completion criteria.
- Keep guidance deterministic and bounded by action type; do not generate AI coaching text or persist new task records.
- Render the playbook guidance in the opportunity workspace action panel so the user can act from the same surface.
- Keep guidance workflow-only; it must not change opportunity score, recommendation, confidence, gates, market signals, business metrics, or factor contributions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: enrich daily action plan items with deterministic playbook guidance and surface it in the workspace UI.

## Impact

- Shared schemas: add playbook fields to daily action item schema/types.
- Backend: attach deterministic guidance for each action id in `OpportunityResearchService`.
- Frontend: render learning goal, steps, and completion criteria inside the existing daily action plan panel.
- Tests/docs: cover schema/API/OpenAPI contract, UI rendering, and non-scoring caveats.
