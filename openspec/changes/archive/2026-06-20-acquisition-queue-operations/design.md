## Context

The project already has provider-chain acquisition, scrape job persistence, attempt history, cache fallback, provider health, Keepa market signals, opportunity scoring, and research workflows. The current scheduler is still a single local cron process that enqueues and processes jobs directly. That is good for development, but it does not expose worker health, backlog pressure, provider throttling, or multi-worker safety strongly enough for merchants who need reliable monitoring across many products and platforms.

The next slice should improve the operational layer before adding more platform crawlers. A queue operations layer gives the system a stable place to reason about job lifecycle, worker capacity, manual refresh throttling, provider limits, and remediation guidance without changing score semantics or provider data contracts.

## Goals / Non-Goals

**Goals:**

- Keep existing SQLite `scrape_jobs` and `scrape_attempts` as durable business provenance.
- Add a queue adapter abstraction with SQLite as the default local backend and BullMQ/Redis as an optional production backend.
- Track worker heartbeats, stale workers, backlog size, running jobs, retry-scheduled jobs, provider rate-limit state, and stalled/expired leases.
- Expose read APIs for queue health, worker health, provider queue state, and product job diagnostics.
- Add bounded job control actions for retry and cancel that preserve attempt/job history.
- Make scheduled and manual acquisition respect worker capacity, provider limits, retry timing, and manual refresh throttles.
- Surface queue/worker health in product detail, opportunity workbench, and Chat as operational context only.
- Add schemas, OpenAPI docs, development docs, and fixture tests without requiring live marketplace or live Redis in normal CI.

**Non-Goals:**

- Replacing `scrape_jobs` and `scrape_attempts` with Redis-only state.
- Building a full admin console for queue operations.
- Adding new marketplace providers in this slice.
- Changing opportunity score, market signal scoring, business metrics, or research metadata semantics.
- Guaranteeing exactly-once marketplace acquisition; the target is observable at-least-once processing with idempotent job claiming and durable attempts.

## Decisions

1. Use a queue adapter with SQLite default and optional BullMQ.

   Define an `AcquisitionQueueAdapter` interface for enqueue, claim, complete, fail/retry, cancel, health, and worker heartbeat operations. The SQLite adapter wraps the existing `ScrapeJobService` and remains the default. A BullMQ adapter can be enabled with `ACQUISITION_QUEUE_BACKEND=bullmq` and `REDIS_URL`.

   Alternative considered: migrate entirely to BullMQ. That would solve multi-worker execution but make local development and tests depend on Redis and risk losing SQLite job provenance. The adapter approach keeps local simplicity while allowing production scale.

2. Preserve SQLite as source of truth for business observability.

   BullMQ should orchestrate execution, but successful and failed provider attempts still write `scrape_attempts`, and job lifecycle still updates `scrape_jobs` or a compatible queue operation table. Redis state must not be the only place where job history exists.

   Alternative considered: store detailed history in BullMQ job logs. That is not sufficient for API diagnostics, Chat explanations, or historical provider health.

3. Add worker heartbeat records.

   Add a small persistent worker table or equivalent schema with worker ID, backend, queues, status, concurrency, current job count, last heartbeat, started time, and safe metadata. A worker is stale when no heartbeat is seen within the configured threshold.

   Alternative considered: infer worker health only from running jobs. That cannot distinguish a quiet healthy worker from a dead worker and gives weak remediation guidance.

4. Model provider limits separately from product opportunity signals.

   Provider limit state should include provider, platform, limit status, reset time, current concurrency, recent rate-limit/quota failures, and recommendations. This state gates acquisition scheduling but must never lower product opportunity score directly.

   Alternative considered: fold provider limit state into provider health only. Provider health is historical reliability; queue operations need active scheduling gates and reset timing.

5. Keep Chat read-only for queue operations in this slice.

   Chat may explain queue health, worker state, delayed jobs, and provider limits. It must not retry or cancel jobs without a future explicit write workflow.

   Alternative considered: allow Chat to retry jobs. That is useful later, but job mutation should require confirmation and audit semantics.

6. Limit job control to retry and cancel.

   API job controls should allow retrying failed/cancelled jobs and cancelling pending/retry-scheduled jobs. Running jobs can be marked cancel-requested only if the backend supports cooperative cancellation; otherwise cancellation waits for lease expiry.

   Alternative considered: support pause/resume/reprioritize in the first slice. Useful, but retry/cancel plus health is enough to make operations actionable without widening the surface too far.

## Risks / Trade-offs

- [Risk] Two queue backends can diverge in behavior. -> Mitigation: adapter contract tests must run against SQLite and mocked BullMQ behavior, with shared lifecycle fixtures.
- [Risk] Redis may be unavailable in local or CI environments. -> Mitigation: SQLite remains default; BullMQ tests use a mock or test container only when explicitly enabled.
- [Risk] Job control can hide provider failures if it deletes state. -> Mitigation: retry/cancel actions must append/update durable job state and never delete attempt history.
- [Risk] Queue health could be mistaken for product quality. -> Mitigation: API, UI, Chat, and export wording must label queue state as operational data-source reliability only.
- [Risk] Provider rate limits can block too much work. -> Mitigation: expose reset time, affected provider/platform, remediation guidance, and allow unaffected providers to continue.
- [Risk] Worker heartbeat records can become noisy. -> Mitigation: store bounded metadata and aggregate stale/healthy counts for UI and Chat.

## Migration Plan

1. Add shared queue operation schemas and backend types.
2. Add additive migration for worker heartbeat and optional queue event/provider limit tables if needed.
3. Extract current `ScrapeJobService` operations behind a SQLite queue adapter.
4. Add optional BullMQ adapter and configuration without making Redis mandatory.
5. Update scheduler and scraper service to use the queue operations service.
6. Add queue health, worker health, product job diagnostics, retry, cancel, and provider queue status routes.
7. Add Chat read-only queue status tools and OpenAPI docs.
8. Update product detail and opportunity workbench operational indicators.
9. Add tests, docs, and validation evidence.

Rollback: set `ACQUISITION_QUEUE_BACKEND=sqlite`, remove BullMQ worker startup, and keep existing SQLite job processing path. Additive worker/queue tables can remain unused if rollback is needed.

## Open Questions

- Should BullMQ be enabled by default in production when `REDIS_URL` exists, or should production still require an explicit `ACQUISITION_QUEUE_BACKEND=bullmq`?
- Should job cancellation support cooperative provider cancellation immediately, or only cancel pending/retry jobs in the first implementation?
- What default provider concurrency limits should be used for Rainforest, Keepa, eBay, and browser fallback?
