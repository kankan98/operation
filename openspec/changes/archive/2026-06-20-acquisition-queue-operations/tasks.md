## 1. Schemas, Configuration, And Migration

- [x] 1.1 Add shared schemas and exported types for queue health, worker heartbeat, product job diagnostics, provider limit state, job control requests, and queue caveats.
- [x] 1.2 Add backend request/response schemas for queue health filters, worker health filters, product job diagnostics, retry requests, and cancel requests.
- [x] 1.3 Add queue configuration for backend selection, Redis URL, worker concurrency, heartbeat interval, stale worker threshold, manual refresh throttle, and provider concurrency/rate-limit defaults.
- [x] 1.4 Add additive migration and rollback for worker heartbeat and queue operation/provider limit state tables if existing scrape job tables are insufficient.
- [x] 1.5 Add schema and migration tests for bounded diagnostics, unsafe secret rejection, default SQLite backend config, BullMQ config validation, and worker heartbeat persistence.

## 2. Queue Operations Core

- [x] 2.1 Define `AcquisitionQueueAdapter` and implement a SQLite adapter around existing scrape job claiming, retry, success, failure, lease, and cancellation behavior.
- [x] 2.2 Add an optional BullMQ adapter that maps queue enqueue/claim/complete/fail/cancel operations to BullMQ while preserving SQLite job and attempt provenance.
- [x] 2.3 Implement queue operations service for enqueueing, claiming, completing, retrying, cancelling, product job diagnostics, and idempotent completion with stale lease protection.
- [x] 2.4 Implement worker heartbeat registration, stale worker detection, worker summary aggregation, and safe metadata redaction.
- [x] 2.5 Implement provider operational limits for rate-limit, quota exhaustion, browser fallback concurrency, reset timing, and unaffected-provider continuation.
- [x] 2.6 Update scraper service and scheduler service to use queue operations service for scheduled and manual acquisition.
- [x] 2.7 Add manual refresh throttling so duplicate recent product checks reuse or report existing jobs instead of creating duplicate provider work.
- [x] 2.8 Add backend unit tests for SQLite adapter lifecycle, mocked BullMQ adapter contract, worker heartbeat, stale lease recovery, provider gates, manual throttle, retry, cancel, and score determinism.

## 3. API, OpenAPI, And Chat

- [x] 3.1 Add scraper API routes for queue health, worker health, product job diagnostics, provider queue status, retry job, and cancel job.
- [x] 3.2 Add API tests for queue health filters, insufficient-history state, degraded backlog/stale worker state, product job diagnostics, retry/cancel validation, and secret-safe diagnostics.
- [x] 3.3 Register queue operation schemas, endpoints, examples, caveats, and error responses in OpenAPI generation.
- [x] 3.4 Extend Chat agent tools with read-only acquisition queue health and product job diagnostics.
- [x] 3.5 Ensure Chat refuses hidden retry/cancel/enqueue mutations and clearly separates queue operations from opportunity, market, and business signals.
- [x] 3.6 Add Chat and OpenAPI tests for queue health explanations, delayed product job explanations, provider gate remediation, read-only behavior, and caveat examples.

## 4. Frontend Operations Visibility

- [x] 4.1 Add frontend API methods and React Query hooks for queue health, worker health, product job diagnostics, retry, cancel, and provider queue status.
- [x] 4.2 Update product detail to show product acquisition job state, queue delay reason, retry timing, worker/provider gate context, latest attempt summary, and queue caveat.
- [x] 4.3 Add safe retry/cancel actions on product detail for supported job states, including disabled explanations for unsupported states.
- [x] 4.4 Update opportunity workbench to show operational status separately from opportunity score, market signals, business assumptions, and research metadata.
- [x] 4.5 Add filters for delayed acquisition and retryable acquisition jobs in the opportunity workbench.
- [x] 4.6 Add frontend tests for product job health states, queue caveat visibility, retry/cancel actions, opportunity operational filters, and score separation.

## 5. Documentation And Roadmap

- [x] 5.1 Update backend README/API docs with queue backend configuration, Redis/BullMQ setup, queue health endpoints, worker health endpoints, provider gates, retry/cancel limits, and caveat semantics.
- [x] 5.2 Add development docs for acquisition queue operations, adapter contracts, local SQLite mode, optional BullMQ mode, worker heartbeat, provider limits, manual throttle, and diagnostics safety.
- [x] 5.3 Update roadmap to mark `acquisition-queue-operations` as the active P5 slice and list pending completed changes that still need archive.

## 6. Verification

- [x] 6.1 Run backend lint and build.
- [x] 6.2 Run backend targeted tests for queue schemas, migration, adapters, queue operations service, scheduler, scraper API, Chat tools, OpenAPI, and score determinism.
- [x] 6.3 Run full backend tests.
- [x] 6.4 Run frontend relevant tests and frontend build.
- [x] 6.5 Run `openspec validate --changes acquisition-queue-operations --json` and repair any change-spec issues.
- [x] 6.6 Run `openspec validate --specs --json` and keep the main spec library at zero failed specs.
- [x] 6.7 Record validation evidence in `openspec/changes/acquisition-queue-operations/VALIDATION.md`.
