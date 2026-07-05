## 1. Contract

- [x] 1.1 Extend shared opportunity research export filter schemas with `actionOutcome` and `actionId`.
- [x] 1.2 Update backend OpenAPI documentation/tests so export filters document practice filter support.

## 2. Backend Export Behavior

- [x] 2.1 Verify filtered export requests use practice filters through the existing opportunity list read model.
- [x] 2.2 Add backend tests for exporting with `actionOutcome` and `actionId`.

## 3. Frontend Export Behavior

- [x] 3.1 Include active practice filters in filter-based opportunity workspace exports.
- [x] 3.2 Add frontend tests for practice-filtered export payloads while preserving explicit selected-product export behavior.

## 4. Documentation and Specs

- [x] 4.1 Update opportunity research workspace documentation and main spec with practice-filtered export semantics.
- [x] 4.2 Update roadmap/current change state for this change.

## 5. Verification

- [x] 5.1 Run focused backend schema/API/OpenAPI tests for opportunity research export filters.
- [x] 5.2 Run focused frontend Opportunities tests and frontend build.
- [x] 5.3 Run OpenSpec change validation and main spec validation.
