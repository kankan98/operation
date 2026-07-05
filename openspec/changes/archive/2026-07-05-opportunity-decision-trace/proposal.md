## Why

The research workspace can track shortlist metadata and recommendation gates, but it does not yet preserve the user's actual go/no-go decision or the evidence visible at decision time. For a solo operator, that makes it hard to audit why a product was advanced, held, or rejected after scores and signals change.

## What Changes

- Add a bounded decision trace to opportunity research entries with a current decision, reason, next action, decided timestamp, and decision evidence snapshot.
- Save decisions without changing opportunity scores, factor contributions, or recommendation gate logic.
- Surface the current decision in opportunity responses, comparison/export outputs, and the selected opportunity detail panel.
- Allow the user to record `go`, `hold`, `no_go`, or clear a decision from the opportunity workspace.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: record and display product-scoped go/no-go decision traces for researched opportunities.

## Impact

- Backend database/schema: extend opportunity research persistence with decision fields and evidence snapshot storage.
- Shared schemas/types: add decision enums, request/response shapes, and bounded validation.
- Backend API/service: add decision save/clear behavior and include decision metadata in list, explain, comparison, and export outputs.
- Frontend: add selected-candidate decision controls and compact decision display in the opportunities workspace.
- Tests: cover schema validation, persistence, API integration, export/comparison visibility, and frontend decision interactions.
