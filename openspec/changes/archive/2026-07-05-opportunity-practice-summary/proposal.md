## Why

The workspace can now guide daily actions and record the latest action outcome, but the user still has to inspect entries one by one to know whether practice is actually being completed. A derived practice summary gives quick feedback on action-outcome coverage while staying manual-first and non-scoring.

## What Changes

- Add a derived opportunity practice summary for active research entries.
- Summarize active entries, entries with a latest action outcome, entries missing an outcome, counts by daily action id, and the latest completion timestamp.
- Expose the summary through a read-only API and render it near the existing review summary and daily action plan.
- Keep the summary workflow-only; it must not change opportunity score, recommendation, confidence, gates, market signals, business metrics, or factor contributions.
- Do not add action history tables, streaks, reminders, habit analytics, AI coaching, or persistent training scores.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: expose and display a derived practice summary from latest daily action outcomes.

## Impact

- Shared schemas/types: add practice summary response contract.
- Backend: derive practice summary from active opportunity research entries.
- API/OpenAPI: add a read-only practice summary endpoint.
- Frontend: fetch and show practice summary cards in the opportunity workspace.
- Tests/docs: cover summary derivation, non-scoring behavior, UI rendering, and roadmap/development docs.
