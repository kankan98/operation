## 1. Data And Contracts

- [x] 1.1 Add nullable latest action outcome columns and migration/rollback for opportunity research entries.
- [x] 1.2 Extend shared schemas/types with action outcome metadata and write request contracts.
- [x] 1.3 Update backend TypeScript types and OpenAPI documentation for action outcome endpoints and read models.

## 2. Backend Behavior

- [x] 2.1 Implement save and clear action outcome service methods with bounded validation and product existence checks.
- [x] 2.2 Add product-scoped API routes for recording and clearing latest action outcomes.
- [x] 2.3 Include latest action outcome fields in metadata read models, opportunity lists, comparisons, and exports without changing scores.

## 3. Frontend Workspace

- [x] 3.1 Add API client and hooks for saving and clearing latest action outcomes.
- [x] 3.2 Render latest action outcome evidence in selected opportunity detail/review cards.
- [x] 3.3 Add a compact manual outcome form that uses existing daily action labels and refreshes opportunity context after writes.

## 4. Tests And Documentation

- [x] 4.1 Add backend schema/API/export tests for outcome validation, persistence, clearing, and non-scoring behavior.
- [x] 4.2 Add frontend opportunity workspace tests for outcome rendering, saving, clearing, and refresh behavior.
- [x] 4.3 Update roadmap and opportunity research workspace docs for action outcomes.

## 5. Verification

- [x] 5.1 Run targeted backend opportunity research and OpenAPI tests.
- [x] 5.2 Run targeted frontend opportunity workspace tests and frontend build.
- [x] 5.3 Run backend build and OpenSpec change validation.
