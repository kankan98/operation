## Why

Current product scraping is a single Amazon Playwright flow with fixed selectors, fixed pacing, and string-only errors. This makes real marketplace data acquisition fragile: Amazon robot checks, geo restrictions, selector drift, provider outages, and unsupported platforms all collapse into generic failures, so the system cannot choose a better source, retry intelligently, or explain why data was not collected.

This change introduces a reliable product data acquisition layer that prioritizes compliant data sources, classifies failures, records each attempt, and uses browser scraping only as a controlled fallback.

## What Changes

- Add a provider-based product data acquisition layer with a common `ProductDataProvider` contract.
- Add provider routing so the system can try configured API/third-party providers before browser fallback.
- Add structured acquisition results with source, confidence, freshness, duration, and failure classification.
- Add persistent scrape jobs and scrape attempts so scheduled/manual scraping can retry, back off, and expose diagnostics.
- Add Amazon browser fallback hardening for page-state detection, selector fallback, and diagnostic capture.
- Update scraper API responses to return structured acquisition status instead of generic success/error strings.
- Update scheduler behavior to enqueue due monitoring jobs instead of directly scraping all products in a fixed loop.
- Keep the first implementation SQLite-backed; avoid Redis/BullMQ until scale requires it.

## Capabilities

### New Capabilities
- `product-data-acquisition`: Provider routing, structured acquisition results, attempt logging, data provenance, retry/backoff, and source confidence for product price data.

### Modified Capabilities
- `amazon-scraper`: Add page-state classification for blocked, captcha, geo-restricted, unavailable, missing-price, and selector-drift outcomes; add selector fallback and diagnostics for browser fallback.
- `scraper-api`: Return structured scrape job/acquisition results and expose attempt history instead of only immediate success/failure summaries.
- `scheduler`: Enqueue due acquisition jobs with retry/backoff controls instead of directly running a fixed serial scrape loop.

## Impact

**Affected backend areas:**
- `backend/src/scrapers/*` - keep Playwright browser fallback but make it a provider implementation.
- `backend/src/services/scraperService.ts` - delegate to provider router/job orchestration.
- `backend/src/services/schedulerService.ts` - enqueue due jobs instead of directly scraping all products.
- `backend/src/routes/scraper.ts` - return job and structured result data.
- `backend/src/db/schema.ts` - add scrape job and attempt persistence.
- `backend/src/types/index.ts` - add provider, job, attempt, failure reason, and acquisition result types.
- `backend/src/config/index.ts` - add acquisition provider configuration and rate/retry settings.

**Affected specs:**
- New `product-data-acquisition` capability.
- Delta specs for `amazon-scraper`, `scraper-api`, and `scheduler`.

**Dependencies:**
- Recommended first implementation: no required runtime infrastructure beyond existing SQLite/Drizzle/Playwright.
- Optional package: `cheerio` for deterministic static HTML parsing and diagnostics tests.
- Defer Redis/BullMQ until product volume or multi-worker execution requires it.

**Operational considerations:**
- The system should treat captcha/robot pages as a classified blocked state, not as something to solve automatically.
- Official or approved data APIs should be preferred when credentials are configured.
- Browser scraping remains a best-effort fallback and may still fail on protected marketplace pages.
