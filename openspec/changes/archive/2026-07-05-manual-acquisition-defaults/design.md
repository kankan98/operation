## Context

The project roadmap has shifted to a manual-first research assistant for a solo user. Current code still exposes bulk acquisition and queue operations as if automation is the primary workflow: `/api/scraper/all` queues every due monitored product, product detail shows queue health, and OpenSpec still frames queue upgrades as active platform direction.

The goal of this slice is to reduce default automation weight without deleting useful compatibility pieces. Single-product manual checks remain available, while bulk and queue-operation surfaces become explicit opt-ins or diagnostics.

## Goals / Non-Goals

**Goals:**

- Disable bulk monitoring acquisition by default.
- Preserve explicit single-product manual acquisition.
- Add configuration flags so automation can be re-enabled deliberately.
- Keep queue tables, job controls, attempts, and diagnostics available for existing data and manual checks.
- Update API docs/tests/specs so manual-first defaults are visible.

**Non-Goals:**

- Dropping queue tables or migrations.
- Removing job retry/cancel APIs.
- Removing provider health or attempt history.
- Reworking product detail UX beyond hiding or labeling queue operations as non-primary diagnostics.

## Decisions

### Use feature flags instead of destructive deletion

Add `ACQUISITION_BULK_ENABLED=false` and `ACQUISITION_QUEUE_OPERATIONS_VISIBLE=false` defaults. The bulk endpoint uses the first flag to return a disabled response unless explicitly enabled. UI or API clients can use the second flag later to hide operational queue surfaces.

Alternative considered: delete `/api/scraper/all` and queue health routes immediately. That would better enforce manual-first behavior, but it is unnecessarily risky while job diagnostics still support single-product checks and existing tests/data.

### Return a structured disabled response for bulk acquisition

When bulk acquisition is disabled, `POST /api/scraper/all` returns `200` with `enabled=false`, zero queued jobs, and a caveat explaining manual-first mode. This keeps callers from treating the endpoint as a server error while making it impossible to accidentally enqueue work.

Alternative considered: `403` or `410`. Those communicate stronger blocking, but a structured no-op is easier to roll out in local tooling and tests without adding error handling.

### Keep single-product checks as explicit manual actions

`POST /api/scraper/product/:productId` keeps its current behavior. It is a user-triggered check and still writes source/provenance, so it fits the manual-first workflow.

Alternative considered: route single-product checks directly to providers without queue job rows. That may be cleaner later, but it would require larger changes across attempts, diagnostics, and retry/cancel behavior.

### Treat queue operations as diagnostics

Queue health, worker health, provider gates, and job controls remain available but are documented as operational diagnostics and compatibility plumbing. They are not the default user path for improving selection decisions.

Alternative considered: hide all queue UI now. That can be done in a later frontend-focused slice after the backend default is safe.

## Risks / Trade-offs

- Existing callers may expect `/api/scraper/all` to enqueue jobs -> return a clear disabled response with an opt-in environment variable.
- Queue specs may still look heavier than the product direction -> modify specs and roadmap to describe queue operations as deprecated/default-off.
- Feature flags can drift if undocumented -> cover config defaults and endpoint behavior in tests.
- Bulk acquisition may be useful later if paid providers are configured -> keep an explicit opt-in flag rather than removing the code path.

## Migration Plan

1. Add config flags with manual-first defaults.
2. Gate `scrapeAllMonitoringProducts` or its route behind the bulk flag.
3. Update API/OpenAPI/tests to cover disabled and enabled behavior.
4. Update roadmap/spec language to mark queue operations as diagnostic/default-off.

## Open Questions

- None for this slice.
