## Context

The product platform can already collect current listing data through provider chains, persist acquisition attempts, display provider health, and compute opportunity scores from current price, price history, acquisition health, rating/review proxies, and merchant-entered business assumptions. The main gap is external market trend evidence: price history from the monitored system is only as deep as local snapshots, and current listing fields do not provide reliable demand or market movement.

Keepa is the best next slice because it can provide compliant Amazon historical signals such as price history, sales rank history, review count movement, rating movement, and data freshness. Those signals should improve opportunity scoring confidence and explanations, but they must remain clearly labeled as trend/proxy evidence rather than verified sales, profit, or demand facts.

## Goals / Non-Goals

**Goals:**

- Add a Keepa market signal provider for Amazon products with separate configuration and bounded diagnostics.
- Normalize Keepa product/history responses into market signal snapshots that can be stored and queried independently from current listing acquisition attempts.
- Track market signal provider health, freshness, failure reasons, and token/quota-related remediation guidance.
- Feed market trend summaries into opportunity scoring as explicit factors and confidence inputs.
- Surface market signal summaries and missing-signal caveats in product detail, opportunity workbench, OpenAPI, shared schemas, and Chat tools.

**Non-Goals:**

- Replace Rainforest or Amazon browser fallback for current listing acquisition.
- Claim verified sales volume, demand, margin, ROI, or profitability from Keepa rank or review signals.
- Implement Keepa product search for ambiguous product discovery in this slice.
- Add Walmart, AliExpress, or eBay historical market signal providers.
- Build a high-throughput distributed queue; reuse the current local scheduling model where possible.

## Decisions

1. Keep market signal acquisition separate from current listing acquisition.

   Keepa should write market signal snapshots and provider health records rather than price snapshots produced by current listing acquisition. This preserves the meaning of `price_snapshots` as observed listing checks and lets Keepa trend data include historical windows without pretending each point was locally acquired at that time.

   Alternative considered: hydrate `price_snapshots` directly from Keepa history. That would make charts deeper quickly, but it would blur provenance and make alert semantics confusing because imported historical points were not live monitoring observations.

2. Use exact identifiers only: ASIN first, optional product metadata second.

   The provider should require a deterministic ASIN from the product record or safe metadata. It should not use broad title search by default because ambiguous matches would pollute scoring and trend history.

   Alternative considered: use Keepa search by title when ASIN is missing. That may increase coverage but is too risky for automated opportunity scoring.

3. Persist summarized signals, not raw provider payloads.

   Market signal snapshots should store bounded fields: source/provider, product ID, platform, ASIN, window, freshness, price trend summary, rank trend summary, review velocity, rating movement, confidence, missing signals, and safe metadata. Raw Keepa arrays should be normalized at ingest and discarded unless a future debug mode adds explicitly bounded samples.

   Alternative considered: persist full Keepa responses. That is easier to reprocess but creates large payloads, schema drift risk, and unnecessary diagnostic exposure.

4. Reuse provider health semantics with market-signal-specific categories.

   Keepa failures should map to bounded reasons such as `missing_credentials`, `auth_failed`, `quota_exhausted`, `rate_limited`, `not_found`, `unsupported_product`, `insufficient_history`, `network_timeout`, and `unknown`. Health output should distinguish market signal freshness from listing acquisition health.

   Alternative considered: hide Keepa status behind opportunity scoring only. That would make degraded scores harder for users and operators to diagnose.

5. Add scoring factors, not hidden score boosts.

   Opportunity scoring should expose market signal factors such as price stability, rank trend, review velocity, and signal freshness. Missing or stale market signals should lower confidence and add missing signals; they should not silently penalize every product as a bad opportunity.

   Alternative considered: fold all Keepa data into one opaque demand score. That would be faster to ship but harder to explain and easier to overstate.

## Risks / Trade-offs

- [Risk] Keepa credentials or token quota may be unavailable. -> Mitigation: return structured provider-unavailable/quota failures, expose health recommendations, and keep opportunity scoring functional with missing-signal caveats.
- [Risk] Sales rank is a proxy and can be category-dependent. -> Mitigation: label it as rank trend evidence, preserve category context when available, and avoid converting it to sales volume.
- [Risk] Imported historical provider data may be mistaken for local monitoring snapshots. -> Mitigation: store it in market signal snapshots with provider/source provenance and do not backfill `price_snapshots`.
- [Risk] Keepa history arrays can be large. -> Mitigation: normalize to bounded summaries during ingestion and define windowed refresh behavior.
- [Risk] Multi-source trend data may later need reconciliation. -> Mitigation: include provider/source/window/freshness fields in snapshots from the first implementation.

## Migration Plan

1. Add Keepa configuration, provider/source/root-cause schema values, and database migration for market signal snapshots.
2. Implement Keepa provider normalization with fixture-based tests and no live network dependency.
3. Add backend service/API routes for refresh, latest snapshot, history, and provider health.
4. Integrate latest market signals into opportunity scoring, product detail, opportunity workbench, and Chat tool output.
5. Update OpenAPI, shared schemas, backend docs, roadmap, and validation evidence.

Rollback is configuration-safe: disabling the Keepa provider or removing credentials should return market signals to missing/degraded states while preserving current listing acquisition and existing opportunity scoring.

## Open Questions

- Should the first implementation request only 90-day summaries or support configurable 30/90/180-day windows?
- Should market signal refresh be triggered only manually at first, or queued with the existing scrape job scheduler?
- Which Keepa plan/quota assumptions should drive default refresh cadence?
