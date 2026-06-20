## Why

The platform can now collect product data from multiple providers and turn that data into opportunity research, but acquisition execution is still optimized for a single local process. To support reliable cross-border product monitoring at larger scale, the system needs observable queue operations, worker health, rate limits, and recovery semantics before adding more platform crawlers.

## What Changes

- Add an acquisition queue operations layer that keeps SQLite job/attempt tables as the business source of truth while allowing a Redis/BullMQ-backed execution adapter for multi-worker deployments.
- Add worker heartbeat, queue backlog, stale lease, retry/backoff, manual refresh throttling, provider rate-limit, and quota-state visibility.
- Add bounded APIs for queue health, worker status, job retry/cancel, and queue/provider remediation recommendations.
- Extend scheduler behavior so scheduled and manual acquisition jobs respect queue backend, worker capacity, retry timing, provider limits, and degraded-provider states.
- Extend product detail, opportunity workbench, and Chat explanations with queue/worker health context without presenting queue failures as product demand, sales, or profit signals.
- Add shared schemas, OpenAPI documentation, development docs, and fixture-based tests for queue operations and provider-safe diagnostics.
- No breaking API changes are intended; SQLite remains the default local queue backend.

## Capabilities

### New Capabilities

- `acquisition-queue-operations`: Queue backend selection, worker heartbeats, backlog health, job control, provider limits, queue-safe diagnostics, and operational remediation for product acquisition.

### Modified Capabilities

- `product-data-acquisition`: Acquisition jobs SHALL be routed through a queue operations layer that preserves existing job/attempt provenance while supporting multi-worker execution.
- `scheduler`: Scheduled and manual acquisition SHALL respect queue backend capacity, retry timing, active leases, and provider limits.
- `scraper-api`: Scraper APIs SHALL expose queue health, worker status, and bounded job control endpoints.
- `chat-agent-tools`: Chat SHALL be able to explain queue/worker/provider operational state without triggering hidden acquisition or misrepresenting operational failures as market facts.
- `openapi-generation`: OpenAPI SHALL document queue operations schemas, endpoints, limits, and examples.
- `shared-schemas`: Shared schemas SHALL define queue health, worker heartbeat, job control, provider limit, and remediation response contracts.
- `product-detail-ui`: Product detail SHALL surface queue/job health for a product when acquisition is delayed, stuck, degraded, retried, or rate limited.
- `product-module`: Opportunity workbench SHALL distinguish queue/provider operational degradation from opportunity score and business/market signals.

## Impact

- Backend services: new queue adapter interface, SQLite adapter, optional BullMQ adapter, worker registry/heartbeat service, provider limit service, and queue health aggregation.
- Backend routes: queue health, worker health, product job diagnostics, retry/cancel controls, and provider queue status endpoints.
- Dependencies/config: optional Redis/BullMQ configuration such as `ACQUISITION_QUEUE_BACKEND`, `REDIS_URL`, worker concurrency, heartbeat interval, stalled job threshold, and provider rate-limit settings.
- Database: additive migration for worker heartbeat and queue operation event records if the SQLite tables cannot hold the needed operational state cleanly.
- Frontend: product detail and opportunity workbench indicators for queue backlog, worker health, delayed jobs, and provider rate-limit states.
- Chat/OpenAPI/docs/tests: read-only queue explanations, no hidden job mutations from Chat, API docs, and fixture-based validation without live marketplace or Redis requirements.
