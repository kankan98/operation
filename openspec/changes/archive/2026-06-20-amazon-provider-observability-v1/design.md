## Context

The previous reliable product data acquisition change introduced the right foundation: provider routing, scrape jobs, scrape attempts, structured failure reasons, cache fallback, and Amazon browser page-state classification. The remaining gap is practical usefulness. Amazon acquisition still defaults to the browser fallback, which is exactly the path most likely to hit captcha, robot checks, geo restrictions, or selector drift.

The frontend also has a user-facing gap. Product detail exposes a "check now" button, but the currently useful backend acquisition endpoint is `/api/scraper/product/:productId`, and recent scrape attempts are not visible in the product UI. When acquisition fails, users and the Chat assistant cannot explain whether the issue is missing credentials, blocked browser fallback, geo restrictions, or stale data.

There is also planning debt: `openspec validate --specs --json` currently reports 14 failed specs. Most failures are structural spec format issues, not feature behavior issues. This change should clear those failures before the new feature work is considered done.

## Goals / Non-Goals

**Goals:**
- Add Rainforest API as the first real Amazon data provider in the existing provider chain.
- Keep `amazon-browser` as the controlled fallback, not the primary route when API credentials are configured.
- Preserve acquisition provenance through provider, source, confidence, freshness, job ID, and attempt ID.
- Make manual product acquisition observable in product detail.
- Let Chat explain acquisition status and structured failure reasons.
- Fix the main OpenSpec spec validation debt and make zero failed specs a completion gate.

**Non-Goals:**
- Do not bypass captcha, robot checks, or platform anti-bot protections.
- Do not add Redis/BullMQ or a distributed queue in this change.
- Do not implement Keepa, PA-API, SP-API, eBay, Walmart, or AliExpress providers in this change.
- Do not redesign the whole product detail page beyond the acquisition status and attempts area.
- Do not make real Amazon or Rainforest network calls in unit tests.

## Decisions

### Decision 1: Use Rainforest as the first real provider

**Choice:** Add a `rainforest` provider that supports Amazon products and runs before `amazon-browser` when configured.

**Why:** Rainforest is closer to the current need: fetch current Amazon product details from URL or ASIN and map them into the existing `ScrapedProductData` shape. Keepa is strong for historical price intelligence, but the immediate failure is current product acquisition.

**Alternatives considered:**
- **Keepa first:** Good for price history, but less directly aligned with current product-page replacement.
- **Amazon Product Advertising API first:** Official, but depends on affiliate access and has eligibility constraints.
- **Amazon SP-API first:** Useful for seller-owned operational data, but not the general product-monitoring path.

### Decision 2: Treat missing provider credentials as a normal provider failure

**Choice:** If `RAINFOREST_API_KEY` is missing, the provider SHALL return `provider_unavailable` and the router SHALL continue to the next provider.

**Why:** Local development and deployments should not fail hard just because a premium provider is not configured. The provider chain already has the right failure semantics; credential absence should use them.

**Alternatives considered:**
- **Fail startup when credentials are missing:** Too strict while browser fallback remains available.
- **Hide the provider when credentials are missing:** Less observable; attempts should show why the preferred provider was skipped.

### Decision 3: Keep provider response mapping narrow and explicit

**Choice:** Map only fields used by the current acquisition contract: price, currency, availability, title, image URL, rating, review count, seller, shipping cost, and condition when available.

**Why:** This avoids creating a large provider-specific domain model before the application has UI or analytics for extra fields.

**Alternatives considered:**
- **Persist raw provider payloads:** Useful for debugging but risks storing large or sensitive data and couples the app to a vendor schema.
- **Normalize every provider field now:** Premature; it increases migration and UI work without immediate product value.

### Decision 4: Put observability in product detail first

**Choice:** Product detail SHALL own the first acquisition UI: manual check action, latest result state, job link/status, and recent attempts panel.

**Why:** Product detail is where users already inspect price history and current product status. It is the shortest path from "check now" to "why did this fail?"

**Alternatives considered:**
- **Dedicated operations page first:** Useful later, but adds navigation and scope before the core user loop works.
- **Only Chat explanation:** Helpful, but users still need a visual record in the product workflow.

### Decision 5: Chat explains attempts; it does not run hidden acquisition by default

**Choice:** Add a tool path that reads recent attempts and job status to explain acquisition health. Chat may reference manual acquisition APIs only when a user explicitly asks to check a product.

**Why:** Explanation is low-risk and immediately useful. Automatically triggering network acquisition during ordinary analysis would create surprise provider usage and rate-limit risk.

**Alternatives considered:**
- **Always scrape before answering product questions:** Better freshness, but too expensive and noisy.
- **No Chat integration:** Leaves the assistant unable to explain the new structured failures.

### Decision 6: Fix spec validation debt as a first-class task, not a side quest

**Choice:** The implementation work SHALL first repair main spec formatting and normative wording failures until `openspec validate --specs --json` reports zero failed specs.

**Why:** OpenSpec is the planning source of truth. If the main spec library remains invalid, future archives and proposal reviews stay ambiguous.

**Alternatives considered:**
- **Ignore old spec failures:** Faster now, but keeps every future change noisy.
- **Create a separate cleanup change:** Cleaner separation, but the user explicitly asked to handle the debt with this proposal.

## Risks / Trade-offs

**[Risk] Rainforest response shapes may vary by product, locale, or availability** -> Mitigate with fixture-based mapping tests for complete product, missing price, unavailable product, rate limit, invalid key, and empty result.

**[Risk] Provider API usage can cost money or hit rate limits** -> Mitigate by only calling Rainforest through explicit acquisition jobs, using provider order config, and avoiding hidden Chat-triggered acquisition unless requested.

**[Risk] Product detail could become visually crowded** -> Mitigate with a compact attempts table or collapsible diagnostics area and concise failure labels.

**[Risk] OpenSpec debt repair may touch many historical spec files** -> Mitigate by limiting edits to structural headers and SHALL/MUST wording unless a requirement is clearly malformed.

**[Risk] Browser fallback remains unreliable** -> Mitigate by keeping classified failure output visible and ensuring the API provider is preferred when configured.

## Migration Plan

1. Repair existing main spec validation failures and record before/after validation output.
2. Add Rainforest config keys to environment examples and backend config.
3. Implement the Rainforest provider behind the existing `ProductDataProvider` contract.
4. Update provider registration and default recommended provider order to `rainforest,amazon-browser`.
5. Add backend unit tests using mocked Rainforest HTTP responses and no real provider calls.
6. Add frontend API methods and hooks for manual acquisition, attempts, and job status.
7. Add product detail UI for check-now state and recent attempts.
8. Add Chat agent tool support for acquisition status explanation.
9. Run backend, frontend, and OpenSpec validation gates.

Rollback is config-driven: remove `rainforest` from `ACQUISITION_PROVIDER_ORDER` or unset `RAINFOREST_API_KEY` to return to browser fallback behavior. The new UI should continue to display attempts even if only browser attempts exist.

## Open Questions

- Which Amazon marketplace should be the default Rainforest locale: `amazon.com`, a configured marketplace, or derived from product URL?
- Should successful Rainforest responses use confidence `0.9` or `1.0` by default?
- Should product detail poll job status after manual check, or should the initial implementation rely on the synchronous single-product scrape result?
