## Why

Opportunity decisions are now captured as go/hold/no-go traces, but they are still mostly visible only inside individual candidate details. A solo operator needs a repeatable review queue to follow up next actions, revisit stale decisions, and learn from past judgment instead of losing decisions in the shortlist.

## What Changes

- Add a decision review loop to the opportunity research workspace.
- Expose decision-focused filters so clients can list decided opportunities by status, next action presence, and review freshness.
- Add review metadata derived from existing decision fields, such as days since decision, whether a next action is missing, and whether the decision is stale enough to revisit.
- Add UI affordances in the opportunity workspace to switch between score discovery and decision review.
- Keep decision review metadata non-scoring; it must not change opportunity score, recommendation, confidence, or factor contributions.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: extend research listing and workspace UI with decision review filters, stale-decision indicators, and follow-up context.

## Impact

- Shared schemas: add decision review query fields and derived metadata in research read models.
- Backend: extend opportunity research filters and list/explain enrichment without changing scoring logic.
- Frontend: add a decision review view/filter surface in the opportunity workspace.
- OpenAPI/tests/docs: document and verify decision review behavior and score separation.
