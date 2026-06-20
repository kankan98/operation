## Why

The platform now has reliable Amazon acquisition and opportunity scoring, but fast cross-border product selection needs coverage beyond one marketplace. eBay should be added through its official Browse API so the system can compare and monitor a second platform without relying on fragile scraping or anti-bot workarounds.

## What Changes

- Add an eBay Browse API provider that acquires current product data for eBay products through official OAuth and Browse API endpoints.
- Normalize eBay item data into the existing product acquisition result shape, including price, currency, availability, title, image, seller, condition, item ID, confidence, and safe provider diagnostics.
- Reuse the existing provider router, scrape jobs, scrape attempts, cache fallback, failure classification, and provider health aggregation patterns.
- Add eBay-specific configuration, validation, fixture tests, provider diagnostics, and operator documentation.
- Extend API, OpenAPI, product detail, opportunity scoring, and Chat explanations so eBay acquisition health and missing signals are visible without implying unsupported sales, demand, or profitability facts.
- No breaking API changes are intended.

## Capabilities

### New Capabilities

- `ebay-browse-provider`: Official eBay Browse API acquisition provider, diagnostics, credential handling, and data normalization.

### Modified Capabilities

- `product-data-acquisition`: Extend the provider chain and attempt provenance model from Amazon-only provider examples to eBay Browse API acquisition.
- `scraper-api`: Expose eBay provider health and manual acquisition behavior through existing scraper API patterns.
- `product-module`: Display eBay acquisition status, provider/source metadata, and safe diagnostics in product detail and opportunity workflows.
- `chat-agent-tools`: Explain eBay acquisition status and missing data without overstating demand, sales volume, or verified profitability.
- `openapi-generation`: Document eBay provider configuration-dependent responses, health endpoints, and acquisition response examples.
- `shared-schemas`: Extend shared provider and acquisition schemas to include eBay Browse provider metadata where needed.

## Impact

- Backend providers, acquisition router, scraper service, provider diagnostics, configuration, and tests.
- eBay OAuth client-credentials handling and Browse API item lookup/search integration.
- Scrape attempt persistence and provider health aggregation for platform `ebay`.
- API routes and OpenAPI examples for eBay acquisition and provider health.
- Product detail, opportunity workbench, Chat tool explanations, and documentation for multi-platform acquisition.
