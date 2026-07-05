## Why

The opportunity workspace now captures decisions and review queues, but the user still has to inspect filters one at a time to know what needs attention today. A compact review summary turns the workspace into a daily operations surface: it shows where judgment, follow-up, or stale-review work is waiting.

## What Changes

- Add a derived opportunity review summary read model for active research entries.
- Expose counts for shortlisted entries, decided/undecided entries, decisions missing next action, stale decisions, and status/priority buckets.
- Add an API endpoint clients can use without issuing multiple filtered list calls.
- Show the summary in the opportunity workspace so review mode starts with a clear workload overview.
- Keep summary counts workflow-only; they must not change score, recommendation, confidence, gates, or factor contributions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: add a derived review summary for active opportunity research entries and surface it in the workspace UI.

## Impact

- Shared schemas: add summary response schema/types.
- Backend: derive summary counts from existing opportunity research metadata; add route and OpenAPI docs.
- Frontend: fetch and render summary metrics in the opportunity workspace.
- Tests/docs: cover summary counts, non-scoring behavior, and workspace rendering.
