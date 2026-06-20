# Acquisition Queue Operations

## Scope

Acquisition queue operations describe data-source execution reliability only. They help operators answer whether product acquisition is pending, delayed, running, retryable, rate-limited, quota-gated, or blocked by stale workers. They must not be used as evidence of sales, demand, margin, ROI, or profitability.

## Architecture

The queue layer keeps SQLite as the durable source of truth:

- `scrape_jobs` stores job lifecycle, retry timing, lease state, cancellation, and manual/scheduled provenance.
- `scrape_attempts` stores provider/source/status/duration/confidence/failure diagnostics.
- `acquisition_queue_workers` stores worker heartbeat and capacity.
- `acquisition_provider_limits` stores active provider gates such as rate limits, quota exhaustion, and fallback concurrency.
- `acquisition_queue_events` stores bounded operational events for audit and troubleshooting.

`AcquisitionQueueService` coordinates job lifecycle and delegates backend-specific execution to `AcquisitionQueueAdapter`.

## Adapter Contract

All adapters must preserve these behaviors:

- `enqueue` persists a SQLite job before execution is attempted.
- `claimDueJob` grants only one active lease for a due job.
- `completeJob` and `failJob` are idempotent and must not overwrite a newer lease owner.
- `retryJob` preserves prior attempts and moves failed/cancelled jobs back to a claimable state.
- `cancelJob` preserves history and only cancels supported states.
- BullMQ may orchestrate worker delivery, but SQLite job and attempt rows remain the API and Chat provenance source.

Default local mode uses `SQLiteAcquisitionQueueAdapter`. Production multi-worker mode may set:

```bash
ACQUISITION_QUEUE_BACKEND=bullmq
REDIS_URL=redis://localhost:6379
```

Startup validation must fail when `ACQUISITION_QUEUE_BACKEND=bullmq` has no Redis URL. Do not silently fall back to SQLite in that case.

## Worker Heartbeat

Workers should register and refresh heartbeat with:

- worker ID
- backend
- status
- concurrency
- active job count
- queues
- started time
- last heartbeat time
- safe metadata

A worker is stale when `lastHeartbeatAt` exceeds `ACQUISITION_STALE_WORKER_THRESHOLD_MS`. Queue health should surface stale workers with remediation guidance instead of inferring health from running jobs alone.

## Provider Limits

Provider gates are separate from historical provider health. They control whether the scheduler/worker may claim work now:

- `open` means claim is allowed within concurrency.
- `rate_limited` delays affected provider/platform jobs until reset.
- `quota_exhausted` blocks affected provider/platform jobs until reset or configuration changes.
- `unavailable` indicates credentials, provider outage, or unsupported path.
- `disabled` indicates configuration intentionally disables that path.

Unaffected providers should continue. A Rainforest gate must not block eBay Browse jobs, and Keepa market signal gates must not be treated as listing acquisition failure.

## Manual Refresh Throttle

Manual product checks must reuse or report an existing recent manual job when a product is already pending, running, retry-scheduled, or inside `ACQUISITION_MANUAL_REFRESH_THROTTLE_MS`. This prevents repeated UI clicks or Chat requests from amplifying provider rate limits.

## Diagnostics Safety

Queue metadata and diagnostics may include bounded operational details such as provider, platform, status, reset time, root cause, HTTP status, duration, confidence, and sanitized provider message.

They must not include:

- Redis credentials or connection URLs with passwords
- API keys, tokens, authorization headers, cookies, or passwords
- raw provider payloads, raw HTML, or large response bodies
- high-cardinality free text such as full product titles or unbounded error dumps

Shared schema tests should reject unsafe metadata before it reaches API, UI, Chat, or OpenAPI examples.

## API And UI Surfaces

Primary endpoints:

```http
GET /api/scraper/queue/health
GET /api/scraper/queue/workers
GET /api/scraper/queue/providers/status
GET /api/scraper/product/:productId/job-diagnostics
POST /api/scraper/jobs/:jobId/retry
POST /api/scraper/jobs/:jobId/cancel
```

Product detail may expose retry for failed/cancelled jobs and cancel for pending/retry-scheduled jobs. Chat tools remain read-only in this slice and must not enqueue, retry, or cancel hidden jobs.

Opportunity workbench should show queue operations separately from opportunity score, market trend signals, business assumptions, and research metadata.

## Validation Checklist

- Backend build and lint pass.
- Targeted backend tests cover schema safety, SQLite adapter lifecycle, mocked BullMQ contract, stale leases, provider gates, manual throttle, retry/cancel, scheduler, scraper API, Chat read-only tools, OpenAPI examples, and score determinism.
- Frontend tests cover operational state, delayed/retryable filters, queue caveat visibility, and score separation.
- `openspec validate --changes acquisition-queue-operations --json` passes.
- `openspec validate --specs --json` passes with zero failed specs.
