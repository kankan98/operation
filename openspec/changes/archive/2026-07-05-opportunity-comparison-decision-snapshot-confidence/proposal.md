## Why

The comparison table now shows saved decision snapshot score and recommendation, but it still hides the saved snapshot confidence. Users need the confidence value while comparing decisions so they can judge whether a saved decision was based on reliable evidence or weak/incomplete signals.

## What Changes

- Show saved `research.decision.snapshot.confidence` in the comparison table decision column when a current decision exists.
- Label the value as `快照置信度` so it is distinct from the current confidence shown in the score column.
- Preserve undecided or missing-decision state without inventing confidence evidence.
- Keep the display read-only and non-scoring.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: comparison view decision evidence now includes saved decision snapshot confidence when present.

## Impact

- Frontend: `frontend/src/pages/Opportunities.tsx`
- Tests: `frontend/tests/pages/Opportunities.test.tsx`
- Documentation/specs: opportunity research workspace spec and development notes
- No backend API, database, schema, dependency, OpenAPI, analytics, automation, or scoring changes
