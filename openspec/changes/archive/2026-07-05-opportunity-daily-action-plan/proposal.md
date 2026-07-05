## Why

The opportunity workspace now shows review workload counts, but counts alone do not teach the user which operating habit to practice first. A deterministic daily action plan turns the summary into a short work queue: clear missing next actions, revisit stale decisions, and decide the strongest undecided candidates.

## What Changes

- Add a derived daily action plan for active opportunity research entries.
- Return ordered action items with a workflow reason, count, priority, suggested filter state, and non-scoring caveat.
- Surface the plan in the opportunity workspace so the user can start each session from a small, explicit operating queue.
- Allow action items to drive existing workspace filters instead of introducing a separate task/reminder system.
- Keep the action plan workflow-only; it must not change opportunity score, recommendation, confidence, gates, factor contributions, or market/business evidence.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add a derived daily action plan for active review work and expose it in the workspace UI.

## Impact

- Shared schemas: add daily action plan response/action item types.
- Backend: derive ordered action items from existing opportunity research metadata and decision review state; expose a read-only endpoint.
- Frontend: fetch and render action items in the opportunity workspace; wire items to existing review filters.
- Tests/docs: cover action ordering, active-only scope, non-scoring behavior, and UI rendering/filter behavior.
