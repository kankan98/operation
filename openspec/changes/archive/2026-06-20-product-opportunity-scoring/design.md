## Context

The current platform has product monitoring, price snapshots, alerting, provider-based acquisition, scrape attempts, and Chat tools. That foundation tells users what happened to a product, but it does not yet answer the selection question: which products deserve attention first and why.

The first opportunity scoring iteration should reuse existing local data so it can ship without another external provider dependency. The score can become richer later as Keepa, eBay, Walmart, AliExpress, advertising, cost, and margin signals are added.

## Goals / Non-Goals

**Goals:**
- Rank monitored and candidate products with a transparent opportunity score from 0 to 100.
- Return factor-level explanations so sellers can trust and debug the score.
- Use existing product fields, price snapshots, scrape attempt health, and acquisition freshness.
- Expose a backend API, frontend workbench, and Chat tool path for opportunity review.
- Keep scoring deterministic and fixture-testable.

**Non-Goals:**
- Do not claim real sales volume, demand, or margin when those data sources are not present.
- Do not add a new paid provider in this change.
- Do not add machine learning infrastructure.
- Do not redesign all product management screens.
- Do not persist scores in the database until the scoring formula and signals stabilize.

## Decisions

### Decision 1: Compute opportunity scores on demand

**Choice:** Add an on-demand scoring service that computes scores from current database state and returns ranked results.

**Why:** The product set is still small enough that on-demand scoring is simpler, safer, and easier to explain. It avoids migration churn while the formula evolves.

**Alternatives considered:**
- **Persist score snapshots:** Better for historical score tracking, but premature before the formula is stable.
- **Batch recompute through scheduler:** Useful later, but the first user value is interactive ranking.

### Decision 2: Use a transparent weighted factor model

**Choice:** Score each product from factors such as price movement, price stability, acquisition freshness, acquisition reliability, rating/review signal, availability, and monitoring status.

**Why:** Sellers need to understand why a product ranks highly. A transparent factor model is easier to test and explain than a black-box model.

**Alternatives considered:**
- **LLM-only ranking:** Flexible, but not deterministic enough for core ranking and harder to test.
- **ML model:** Overkill without labeled outcomes or large historical data.

### Decision 3: Treat missing signals explicitly

**Choice:** Return a confidence value and missing signal list alongside each score.

**Why:** Early data will be incomplete. The UI and Chat should distinguish "good opportunity" from "not enough evidence." This also guides users toward manual checks or adding missing metadata.

**Alternatives considered:**
- **Default missing data to neutral only:** Simple, but hides data quality issues.
- **Drop products with missing data:** Too strict for a monitoring tool that is still building history.

### Decision 4: Add a dedicated read-only API surface

**Choice:** Add endpoints such as `GET /api/opportunities/products` and `GET /api/opportunities/products/:productId`.

**Why:** Opportunity ranking is a distinct user workflow. A dedicated route avoids overloading price analysis endpoints while still reusing analysis internals.

**Alternatives considered:**
- **Put everything under `/api/analysis`:** Reasonable, but opportunity ranking will likely grow into its own area with filters, saved lists, and exports.

### Decision 5: Build the UI as a workbench view, not just badges

**Choice:** Add an opportunity workbench reachable from product navigation, with ranked rows/cards, filters, score breakdown, and actions to view detail or run acquisition.

**Why:** Quick selection requires scanning, comparison, and triage. A badge alone does not create a workflow.

**Alternatives considered:**
- **Only update product cards:** Lower effort, but users still lack a ranking surface.
- **Only Chat ranking:** Useful, but selection users need a visual list for repeated review.

## Risks / Trade-offs

**[Risk] Score may imply more certainty than the data supports** -> Mitigate with confidence, missing signals, and explanatory factor breakdowns.

**[Risk] Ranking can become biased toward products with more history** -> Mitigate by separating opportunity score from confidence and showing "needs data" states.

**[Risk] On-demand scoring could become slow with large catalogs** -> Mitigate with pagination, bounded history windows, and future cached score snapshots if needed.

**[Risk] Users may expect profit/margin scoring immediately** -> Mitigate by labeling margin as unavailable until cost, fees, shipping, and marketplace data exist.

## Migration Plan

1. Add opportunity scoring types and schemas.
2. Implement deterministic scoring service and factor helpers.
3. Add read-only opportunity API endpoints.
4. Add Chat tools for opportunity ranking and score explanation.
5. Add frontend workbench view with filters and score breakdown.
6. Update roadmap and docs to mark provider observability complete and selection scoring as the next implementation slice.
7. Validate with backend tests, frontend tests, build, and OpenSpec checks.

Rollback is straightforward because the change is read-only and computes scores on demand. Remove the route/UI/tool registration to disable the feature without changing existing product monitoring data.

## Open Questions

- Should the initial workbench live under `/products/opportunities` or a top-level `/opportunities` route?
- Should the score default to all products or only monitored products?
- What factor weights should become configurable first: price movement, acquisition confidence, or review signal?
