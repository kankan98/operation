# Amazon Provider Observability

## Scope

Amazon provider health describes data-source reliability only. It helps operators understand whether Amazon acquisition is using the primary Rainforest path, browser fallback, cache fallback, or no usable path. It must not be treated as evidence of demand, sales volume, margin, or product-market fit.

## Root Cause Codes

| Code | Meaning | Typical next action |
|------|---------|---------------------|
| `missing_api_key` | Rainforest is configured but credentials are absent | Configure `RAINFOREST_API_KEY` and verify provider order |
| `invalid_key` | Provider rejected authorization or key access | Check key validity, plan access, and environment configuration |
| `quota_exhausted` | Provider credits, quota, or plan allowance is exhausted | Check provider quota and reduce acquisition frequency |
| `rate_limited` | Provider is temporarily throttling requests | Delay retries and lower concurrent acquisition volume |
| `marketplace_mismatch` | Marketplace or Amazon domain does not match provider support | Verify marketplace resolution from product URL |
| `captcha_or_blocked` | Browser fallback hit Amazon blocking, captcha, or geo restriction | Restore primary provider path; treat browser data as degraded |
| `selector_drift` | Browser parser no longer matches page structure | Update selectors and add fixture coverage |
| `cache_only` | Fresh live acquisition failed and cached data was returned | Check freshness and live provider failures |
| `insufficient_history` | No recent attempts exist for the requested window | Run a manual acquisition or wait for scheduled jobs |
| `insufficient_diagnostics` | Legacy or sparse attempt data lacks enough detail | Keep compatibility and improve future diagnostics |
| `unknown` | Failure is not yet classified | Inspect sanitized diagnostics and add a specific mapping if repeated |

## Safe Diagnostic Fields

Provider diagnostics may include only bounded operational fields:

- provider, source, status, failure reason, root cause, fallback type
- marketplace, HTTP status, duration, confidence, freshness age
- sanitized provider message, provider error code, selector version
- bounded provider failure summaries for prior providers in the chain

Diagnostics must not include API keys, cookies, authorization headers, raw HTML, raw Amazon or Rainforest payloads, full request URLs with query strings, product titles, or user-entered free text.

## Recommended Triage Flow

1. Check `/api/scraper/providers/amazon/health?windowHours=24` for status, top root causes, degraded path counts, and recommendations.
2. If `missing_api_key` or `invalid_key` appears, fix Rainforest configuration before tuning browser fallback.
3. If `quota_exhausted` or `rate_limited` appears, reduce acquisition frequency and check provider quota.
4. If browser fallback is common, treat the system as degraded even when acquisition succeeds.
5. If cache fallback is common, validate freshness before using current prices for opportunity decisions.
6. If `unknown` repeats, add a fixture test and normalize the provider error into a specific root cause.

## Validation Evidence

Completion for Amazon provider observability must include:

- targeted backend tests for provider health, Rainforest diagnostics, scraper API, OpenAPI, and chat tool output
- targeted frontend tests for product detail provider health rendering
- `openspec validate --changes amazon-provider-observability --json`
- `openspec validate --specs --json`
