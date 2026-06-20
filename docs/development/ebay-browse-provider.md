# eBay Browse Provider

## Purpose

`ebay-browse` adds a second marketplace data source through the official eBay Browse API. It reuses the existing provider router, scrape jobs, scrape attempts, cache fallback, provider health, Product Detail, Opportunity, and Chat explanation model.

## Configuration

Required for live eBay acquisition:

- `EBAY_CLIENT_ID`
- `EBAY_CLIENT_SECRET`

Optional:

- `EBAY_MARKETPLACE`, default `EBAY_US`
- `EBAY_API_BASE_URL`, default `https://api.ebay.com`
- `EBAY_OAUTH_BASE_URL`, default `https://api.ebay.com`
- `EBAY_TIMEOUT_MS`, default `30000`
- `EBAY_CAPTURE_DIAGNOSTICS`, default follows `ACQUISITION_CAPTURE_DIAGNOSTICS`

Recommended provider order:

```text
ACQUISITION_PROVIDER_ORDER=rainforest,amazon-browser,ebay-browse
```

The router still selects providers by product platform, so `amazon-browser` is not used for eBay products.

## Item Resolution

The provider only performs deterministic item lookup:

- Prefer product metadata keys: `ebayItemId`, `itemId`, `legacyItemId`, `ebayLegacyItemId`.
- Otherwise parse supported URLs such as `https://www.ebay.com/itm/123456789012` or `/itm/<slug>/123456789012`.
- If no item ID can be resolved, return `failureReason=unsupported_url` and `rootCause=unsupported_url`.

Broad title search is intentionally not used because it can attach the wrong listing to monitored price history.

## Failure Mapping

Common root causes:

- `missing_credentials`
- `auth_failed`
- `rate_limited`
- `quota_exhausted`
- `not_found`
- `marketplace_mismatch`
- `unsupported_url`
- `price_missing`
- `network_timeout`
- `unknown`

Provider health recommendations map these to eBay-specific remediation: configure credentials, check OAuth credentials/scopes, check marketplace, check item ID, and reduce acquisition frequency after rate-limit or quota failures.

## Diagnostics Safety

Diagnostics must never persist or return:

- eBay client secrets
- OAuth access tokens
- Authorization headers
- credential-bearing URLs
- raw provider payloads

Safe diagnostics can include provider error code, root cause, HTTP status, marketplace, sanitized message, eBay item ID, legacy item ID, item ID kind, and sanitized listing URL.

## Data Interpretation

Browse API item data is current listing data. It can support price monitoring and listing availability, but it does not prove:

- demand
- sales volume
- verified profitability
- ROI
- ad performance

Opportunity and Chat explanations must keep those missing signals visible and identify merchant-provided business assumptions separately from platform facts.
