## 1. Data Model And Schemas

- [x] 1.1 Add additive database and rollback migrations for opportunity decision columns.
- [x] 1.2 Extend Drizzle schema, backend/shared types, and TS/JS shared schemas for decision trace metadata, write requests, and export fields.
- [x] 1.3 Add schema tests for decision status, bounded text, and nullable/cleared decision metadata.

## 2. Backend Decision Flow

- [x] 2.1 Extend opportunity research persistence to parse, save, clear, and return current decision traces.
- [x] 2.2 Add dedicated decision save and clear API routes that create backend evidence snapshots from the current opportunity explanation.
- [x] 2.3 Include decision fields in comparison and CSV/JSON export rows without changing score calculations.
- [x] 2.4 Add API tests for save/update/clear decision, list/explain/compare/export visibility, validation, and score determinism.

## 3. Frontend Workspace

- [x] 3.1 Add API client and React Query mutations for saving and clearing opportunity decisions with query invalidation.
- [x] 3.2 Add compact selected-opportunity decision controls and decision summary display.
- [x] 3.3 Add frontend tests for saving, clearing, and rendering decision snapshot context.

## 4. Verification

- [x] 4.1 Run relevant backend schema/API/scoring tests.
- [x] 4.2 Run relevant frontend opportunities tests.
- [x] 4.3 Run backend/frontend builds and OpenSpec validation for the change.
