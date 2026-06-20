## Context

The current scraper stack is intentionally simple:
- `AmazonScraper` opens a Playwright page, waits briefly, and extracts fields with a few selectors.
- `ScraperService` supports only Amazon and runs monitoring products serially with a fixed 2-second delay.
- The scheduler directly calls `scrapeAllMonitoringProducts()` every hour.
- Failures are plain strings, so robot checks, captcha pages, geo restrictions, selector drift, and real missing-price pages are indistinguishable.
- Tests already include mock Amazon robot-check HTML, but production code does not classify that state.

The system now needs marketplace data that can survive real-world collection failures across Amazon and later platforms. The best direction is not to make one browser scraper more aggressive; it is to build a reliable acquisition layer that can choose sources, record attempts, back off, and explain failures.

## Goals / Non-Goals

**Goals:**
- Introduce a provider-based acquisition architecture for product data.
- Prefer official or approved API/data providers when configured.
- Keep Playwright browser scraping as a controlled fallback.
- Persist scrape jobs and attempts in SQLite for local-first reliability.
- Return structured acquisition results and failure reasons to APIs, logs, tests, and future UI.
- Add Amazon browser fallback detection for blocked, captcha, geo-restricted, unavailable, missing-price, and selector-drift states.
- Preserve existing price snapshot and alert workflows when acquisition succeeds.

**Non-Goals:**
- Automatically solve captcha or robot-check challenges.
- Promise that browser scraping will work against every protected marketplace page.
- Add Redis/BullMQ in the first implementation.
- Build a full admin UI for job monitoring in this change.
- Implement every marketplace provider at once.
- Replace existing product, snapshot, alert, or chat modules.

## Decisions

### Decision 1: Build a provider router instead of expanding AmazonScraper directly

**Choice:** Add a `ProductDataProvider` contract and `ProductDataProviderRouter`.

Providers return a common result:
- `success`
- `data`
- `source`
- `provider`
- `confidence`
- `freshnessMs`
- `durationMs`
- `failureReason`
- `diagnostics`

The router selects providers by platform and configuration. For Amazon, the first implementation can include:
- configured API/third-party provider placeholders
- existing browser fallback provider
- cache fallback when previous data is still acceptable

**Why this is best:** It separates product data acquisition from browser mechanics. Amazon, eBay, Walmart, AliExpress, API providers, and cached fallback can share orchestration, retry, logging, and result contracts.

**Alternatives considered:**
- **Patch AmazonScraper only:** Faster, but keeps the system stuck on one brittle path and does not help other platforms.
- **Replace scraping with one third-party API immediately:** More reliable for Amazon but creates vendor lock-in before the app has provider abstractions.
- **Build each platform independently:** Simple initially, but duplicates retries, diagnostics, config, and API response handling.

### Decision 2: Use SQLite-backed jobs before Redis/BullMQ

**Choice:** Add `scrape_jobs` and `scrape_attempts` tables managed by backend services.

Jobs track:
- product ID
- status
- priority
- next run timestamp
- attempt count
- max attempts
- last failure reason
- lock/lease metadata

Attempts track:
- job ID and product ID
- provider and source
- status
- failure reason
- duration
- confidence
- HTTP/page status when available
- diagnostic metadata

**Why this is best:** The project already uses SQLite and Drizzle. A local job table gives observability, retry, and backoff without requiring Redis in development or deployment.

**Alternatives considered:**
- **BullMQ + Redis now:** Strong queue semantics, but adds operational weight before the app has enough volume to justify it.
- **Keep in-memory scheduling:** Easy but loses jobs on restart and cannot expose useful history.
- **Cron-only direct scraping:** Current approach; no per-product retry, no backoff, no attempt history.

### Decision 3: Treat captcha and robot checks as classified stop states

**Choice:** Browser providers must detect robot-check/captcha pages and return `failureReason: "captcha"` or `"blocked"` with diagnostics. They must not attempt automatic captcha solving.

**Why this is best:** It is operationally honest, testable, and safer. The correct reaction is backoff, source switching, credentials/API configuration, or manual review.

**Alternatives considered:**
- **Try to bypass captcha:** Risky, brittle, and outside the intended product scope.
- **Treat captcha as missing price:** Misleading; it causes repeated bad retries and hides the real blocker.

### Decision 4: Use source confidence and provenance on successful snapshots

**Choice:** Successful acquisitions should include provider/source metadata in snapshot or related attempt metadata.

Examples:
- `provider: "amazon-browser"`
- `source: "browser"`
- `confidence: 0.76`
- `attemptId: "..."`
- `freshnessMs: 0`

**Why this is best:** Price alerts and future UI can distinguish fresh API data, browser data, and cached fallback. This makes automation less mysterious when data quality varies.

**Alternatives considered:**
- **Only store price:** Current behavior, but no traceability.
- **Store provider details only in logs:** Logs are useful but not enough for product history and API users.

### Decision 5: Add `cheerio` only if static parsing makes implementation simpler

**Choice:** Keep Playwright as the browser engine. Optionally add `cheerio` for deterministic parsing of saved HTML or provider fixtures.

**Why this is best:** `cheerio` is small and useful for tests and diagnostics, while the core runtime can still rely on Playwright for dynamic pages.

**Alternatives considered:**
- **Use Playwright for every test path:** Works, but slower and harder to classify static blocked pages.
- **Use only HTTP + Cheerio:** Too weak for dynamic marketplace pages.

## Risks / Trade-offs

**[Risk] Amazon browser scraping may still fail frequently** -> Mitigate by preferring official/approved providers, recording blocked states, and falling back to cached data only when freshness allows.

**[Risk] SQLite job locking can be tricky with multiple backend processes** -> Start with single-process semantics and simple leases; document that BullMQ/Redis is the scale-out path.

**[Risk] Provider API credentials may not be available initially** -> Implement provider interfaces and config gates first, so browser fallback remains usable while API providers are added incrementally.

**[Risk] More structured errors require API and test updates** -> Add response schemas and contract tests before changing scheduler behavior.

**[Trade-off] More tables and types increase upfront work** -> The added model pays for itself by making failures visible and preventing blind retry loops.

## Migration Plan

1. Add provider/result/job/attempt types without changing public behavior.
2. Add database schema and migration for `scrape_jobs` and `scrape_attempts`.
3. Implement job and attempt services with unit tests.
4. Wrap current Amazon scraper as an `amazon-browser` provider.
5. Add page-state classification and diagnostics to Amazon browser fallback.
6. Replace `ScraperService` internals with provider router and attempt recording.
7. Update scraper API responses to include structured result and attempt/job IDs.
8. Update scheduler to enqueue due jobs and process them with backoff.
9. Keep rollback simple: disable the new scheduler path and call the existing direct scrape path until migration is stable.

## Open Questions

- Which Amazon data source should be configured first when credentials are available: Product Advertising API, Keepa, Rainforest API, SerpApi, or another approved provider?
- What freshness window is acceptable for cached fallback in alerts: 6 hours, 12 hours, or product-specific `checkInterval`?
- Should attempt diagnostics store full HTML/screenshots locally, or only metadata by default with opt-in artifact capture?
