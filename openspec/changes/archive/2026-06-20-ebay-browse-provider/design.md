## Context

The acquisition layer already has the pieces needed for a second marketplace: `ProductDataProvider`, provider ordering, scrape jobs, scrape attempts, cache fallback, provider diagnostics, product detail acquisition status, opportunity scoring, and Chat explanations. Amazon currently uses Rainforest as the preferred API-like provider with browser fallback as a last resort.

eBay should follow the same architecture, but it should use the official eBay Browse API rather than a browser crawler. This keeps the platform aligned with the existing "compliance API first" route and avoids building anti-bot bypass logic.

## Goals / Non-Goals

**Goals:**

- Add an `ebay-browse` provider for products whose platform is `ebay`.
- Authenticate with eBay OAuth client credentials and cache short-lived access tokens safely.
- Resolve supported eBay item URLs or item IDs to Browse API item detail calls.
- Normalize eBay item details into the existing acquisition result model.
- Persist provider attempts, safe diagnostics, fallback/cache provenance, and provider health for platform `ebay`.
- Surface eBay acquisition status through APIs, OpenAPI, product detail, opportunities, and Chat explanations.

**Non-Goals:**

- Build an eBay scraping fallback in this change.
- Add eBay Sell APIs, seller inventory management, order data, promoted listing/ad data, or verified demand metrics.
- Implement cross-market currency conversion.
- Infer profit, sales velocity, or demand from eBay item availability alone.
- Add heavy queue infrastructure such as Redis/BullMQ.

## Decisions

1. Use eBay Browse API as the primary and only live eBay provider in this change.

   The provider name will be `ebay-browse` and source will be `official_api`. It will support products with platform `ebay` and will be selected by the existing provider router when `ACQUISITION_PROVIDER_ORDER` or an eBay-specific provider order includes it.

   Alternative considered: Playwright-based eBay scraping. That would be faster to prototype but weaker for reliability, compliance, diagnostics, and long-term maintainability.

2. Add a small eBay auth client with token caching.

   The provider should exchange `EBAY_CLIENT_ID` and `EBAY_CLIENT_SECRET` for an OAuth access token using the client-credentials flow and cache the token until shortly before expiry. Logs and diagnostics must redact client IDs, secrets, access tokens, authorization headers, and full credential-bearing URLs.

   Alternative considered: request a token for every acquisition. That avoids caching state, but it wastes rate limit, increases latency, and makes failures harder to interpret.

3. Prefer deterministic item resolution from product URL metadata.

   The provider should extract an eBay legacy item ID from supported URLs such as `/itm/<id>` or use a stored item ID/metadata field when present. It should call the Browse API item detail path for that ID. Broad search by title should not be the default because it can return the wrong product and pollute monitoring history.

   Alternative considered: use Browse search for every eBay product. That may find something, but it is too ambiguous for price monitoring.

4. Normalize eBay response data into the existing acquisition shape.

   The provider should map item title, image URL, price/currency, item availability, condition, seller username, item location, item ID, and listing URL into product data and metadata. Confidence should be high for direct item detail responses and lower for any future ambiguous lookup path.

   Alternative considered: add an eBay-specific product table. That would fragment product detail and opportunity scoring; provider-specific metadata is enough for this slice.

5. Reuse provider health and attempt history with platform scoping.

   eBay attempts should be written to `scrape_attempts` with platform inferred from the product, provider `ebay-browse`, source `official_api`, normalized failure reason, root cause, safe diagnostic fields, duration, confidence, and timestamp. Existing health aggregation should work for platform `ebay`; API and OpenAPI should expose eBay health using the same contract as Amazon where possible.

   Alternative considered: create a separate eBay health endpoint shape. That would duplicate frontend and Chat logic without providing a better operator model.

## Risks / Trade-offs

- [Risk] eBay API credentials may be missing or scoped incorrectly. -> Mitigation: return `provider_unavailable` with root cause `missing_credentials` or `auth_failed`, and show remediation in provider health.
- [Risk] eBay URL formats vary by locale and listing type. -> Mitigation: support the common item ID patterns first, test fixture variants, and return `unsupported_url` diagnostics rather than guessing.
- [Risk] Browse API rate limits may affect scheduled monitoring. -> Mitigation: classify rate-limit/quota responses, schedule retries through existing backoff, and expose health recommendations.
- [Risk] eBay item price fields may include converted prices, shipping, or bid state. -> Mitigation: use the primary item price as current price, preserve shipping/bid details in metadata when safe, and do not claim total landed cost until a separate fee/shipping model is added.
- [Risk] Multi-platform opportunities may appear more comparable than they are. -> Mitigation: keep platform/source/currency visible and preserve missing-signal caveats in opportunity and Chat responses.

## Migration Plan

1. Add eBay configuration to backend config and `.env.example`.
2. Add provider-name/source schema support for `ebay-browse` and `official_api`.
3. Implement eBay URL/item ID parsing, OAuth token client, provider request/response mapping, and safe diagnostics.
4. Register the provider in the default router while keeping browser fallback disabled for eBay unless a future approved provider exists.
5. Extend scraper API/OpenAPI/provider health examples for platform `ebay`.
6. Update product detail, opportunity workbench, and Chat explanations to display eBay provider metadata through existing components.
7. Validate with provider fixture tests, router tests, scraper service/API tests, OpenAPI tests, frontend relevant tests, build/lint, and OpenSpec validation.

Rollback is configuration-safe: disabling `ebay-browse` in provider order or removing eBay credentials returns eBay products to structured provider-unavailable states without affecting Amazon acquisition.

## Open Questions

- Should eBay Browse API marketplace default to `EBAY_US`, or should it be inferred from URL host/merchant setting?
- Should future work support multiple eBay item candidates for a monitored search query, or only exact item monitoring?
- Should shipping price be included in acquisition metadata only, or should a later change add platform-specific landed-cost metrics?
