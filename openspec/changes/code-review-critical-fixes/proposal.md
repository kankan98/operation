## Why

The current working tree has review-blocking issues: database schema changes are not in the runtime Drizzle migration path, backend tests fail on shared schema compatibility, and frontend/backend lint fail. These need to be fixed before the project can be safely shipped or used as a stable base for the operations training platform.

## What Changes

- Bring decision/action-outcome research columns into the Drizzle migration path used by `pnpm -C backend db:migrate`.
- Restore shared schema compatibility for product and opportunity responses while keeping new recommendation gate fields supported.
- Fix current frontend and backend lint blockers without changing user-facing behavior.
- Keep the existing reviewed functionality intact and verify backend/frontend builds, tests, lint, OpenSpec validation, and diff whitespace.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `deployment-operations`: Database migrations used by deployment must include schema changes needed by current backend code.
- `shared-schemas`: Shared response schemas must stay compatible with real backend nullable fields and older opportunity responses while supporting newer fields.
- `quality-assurance`: Project quality gates must catch and pass critical lint/build/test checks before release.

## Impact

- Backend migration artifacts under `backend/drizzle`.
- Shared schemas under `shared/schemas`.
- Backend route typing in `backend/src/routes/opportunities.ts`.
- Frontend opportunity detail state initialization in `frontend/src/pages/Opportunities.tsx`.
- Focused tests for shared schema compatibility and existing backend/frontend suites.
