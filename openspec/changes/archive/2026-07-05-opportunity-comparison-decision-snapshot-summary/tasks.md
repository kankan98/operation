## 1. Frontend Display

- [x] 1.1 Render saved `research.decision.snapshot.score` and `research.decision.snapshot.recommendation` in the comparison table decision column with a snapshot label.
- [x] 1.2 Preserve missing-decision state without inferred snapshot fallback text or scoring changes.

## 2. Tests

- [x] 2.1 Add comparison-table coverage for saved decision snapshot score and recommendation display.
- [x] 2.2 Add source-isolation coverage proving the comparison snapshot summary uses saved decision snapshot values instead of current score, current recommendation, notes, action outcomes, review metadata, or render time.

## 3. Documentation And Validation

- [x] 3.1 Sync the main opportunity research workspace spec and developer/roadmap docs.
- [x] 3.2 Run focused frontend tests, frontend build, OpenSpec validation, and diff checks before archiving.
