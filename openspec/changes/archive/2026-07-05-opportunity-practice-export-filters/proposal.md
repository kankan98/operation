## Why

Practice coverage filters help the user find candidates that have or lack recorded workflow action outcomes, but exports do not yet preserve that filter context. This creates a gap when the user wants to take a filtered practice review list into offline supplier checks or manual evaluation.

## What Changes

- Extend opportunity research export filters to accept `actionOutcome` and `actionId`.
- Make filtered exports use the same workflow-only practice filtering semantics as the opportunity and research lists.
- Include active practice filters in the opportunity workspace export request when no explicit product selection is used.
- Keep practice filters and exported action outcome fields non-scoring metadata; they must not change score, confidence, recommendation, gates, market signals, business metrics, or factor contributions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: export behavior now supports practice outcome filters so exported rows can match the user's practice coverage view.

## Impact

- Shared opportunity research export schema and generated JavaScript schema.
- Backend opportunity research export validation, filtered export path, OpenAPI documentation, and tests.
- Frontend opportunity workspace export request construction and tests.
- Opportunity research workspace documentation and spec.
