## 1. Frontend Display

- [x] 1.1 Render saved `research.decision.snapshot.recommendationGate` status in the comparison table decision column with a neutral `快照门控` label when saved snapshot gate context exists.
- [x] 1.2 Preserve clear or empty saved snapshot gate state without inferred gate fallback text, stale filters, or scoring changes.

## 2. Tests

- [x] 2.1 Add comparison-table coverage for saved decision snapshot gate status and applied recommendation transition display.
- [x] 2.2 Add source-isolation coverage proving comparison snapshot gate uses saved decision snapshot gate context instead of current opportunity recommendation gate, score, recommendation, notes, review metadata, or render time.

## 3. Documentation And Validation

- [x] 3.1 Sync the main opportunity research workspace spec and developer/roadmap docs.
- [x] 3.2 Run focused frontend tests, frontend build, OpenSpec validation, and diff checks before archiving.
