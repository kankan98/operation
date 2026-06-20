# Amazon Provider Observability

## Purpose

This capability makes Amazon acquisition reliability visible by aggregating provider attempts, safe diagnostics, fallback usage, cache usage, and remediation guidance without exposing secrets or overstating product demand signals.

## Requirements

### Requirement: Summarize Amazon provider health
The system SHALL provide an Amazon provider health summary built from recent acquisition attempts.

#### Scenario: Health summary includes provider-level metrics
- **WHEN** Amazon provider health is requested
- **THEN** the response SHALL include per-provider attempt count, success count, failure count, success rate, average duration, latest success timestamp, latest failure reason, and latest confidence when available

#### Scenario: Health summary distinguishes fallback and cache
- **WHEN** recent Amazon acquisitions include browser fallback or cache results
- **THEN** the response SHALL report browser fallback count and cache result count separately from primary third-party provider success

#### Scenario: Health summary supports bounded time windows
- **WHEN** provider health is requested with a supported time window
- **THEN** the system SHALL aggregate only attempts whose timestamp falls inside that window

### Requirement: Expose Amazon provider diagnostics safely
The system SHALL expose only safe diagnostic metadata for Amazon provider health and recent attempt inspection.

#### Scenario: Diagnostics use allowlisted fields
- **WHEN** diagnostics are returned in an Amazon provider health response
- **THEN** the diagnostics SHALL include only allowlisted operational fields such as provider error code, HTTP status, marketplace, credits remaining, duration, fallback providers, and sanitized provider message

#### Scenario: Sensitive values are omitted
- **WHEN** diagnostics are persisted or returned
- **THEN** API keys, cookies, raw HTML, full credential-bearing URLs, and raw third-party response payloads MUST NOT be included

#### Scenario: Oversized diagnostics are summarized
- **WHEN** provider diagnostics contain large nested error payloads
- **THEN** the system SHALL store and return a bounded summary instead of the full payload

### Requirement: Recommend operator next actions
The system SHALL include actionable provider-health recommendations without presenting fallback scraping as the preferred Amazon strategy.

#### Scenario: Missing Rainforest configuration recommendation
- **WHEN** Amazon provider health shows Rainforest failures caused by missing credentials
- **THEN** the response SHALL recommend configuring `RAINFOREST_API_KEY` and verifying provider order

#### Scenario: Quota or rate-limit recommendation
- **WHEN** Amazon provider health shows provider quota or rate-limit failures
- **THEN** the response SHALL recommend checking Rainforest quota, reducing acquisition frequency, or delaying retries

#### Scenario: Browser fallback warning
- **WHEN** Amazon provider health shows frequent browser fallback usage
- **THEN** the response SHALL identify browser fallback as degraded diagnostic behavior rather than a healthy primary data path

### Requirement: Classify Amazon provider health root causes
The system SHALL classify Amazon provider health with normalized root-cause codes derived from safe provider diagnostics and acquisition outcomes.

#### Scenario: Missing Rainforest key root cause
- **WHEN** recent Amazon attempts include Rainforest failures caused by missing credentials
- **THEN** the provider health response SHALL include root cause `missing_api_key` and a recommendation to configure `RAINFOREST_API_KEY`

#### Scenario: Provider quota root cause
- **WHEN** recent Amazon attempts include Rainforest authorization, quota, credit, plan-limit, or rate-limit failures
- **THEN** the provider health response SHALL include a provider availability root cause such as `invalid_key`, `quota_exhausted`, or `rate_limited` when the safe diagnostics support that distinction

#### Scenario: Browser blocking root cause
- **WHEN** recent Amazon attempts include browser fallback failures caused by captcha, blocked access, geo restriction, or selector drift
- **THEN** the provider health response SHALL include a browser degradation root cause without presenting browser fallback as the preferred Amazon data path

#### Scenario: Unknown root cause
- **WHEN** recent Amazon attempts do not include enough safe diagnostics to determine a root cause
- **THEN** the provider health response SHALL use `unknown` or `insufficient_diagnostics` rather than failing the health request

### Requirement: Provide safe recent attempt drilldown
The system SHALL expose bounded recent Amazon attempt details that help diagnose provider behavior without exposing sensitive data.

#### Scenario: Drilldown includes operational fields
- **WHEN** Amazon provider health is requested
- **THEN** recent attempts SHALL include only bounded operational fields such as timestamp, product ID, provider, source, status, failure reason, root cause, marketplace, HTTP status, duration, confidence, fallback type, and sanitized message

#### Scenario: Drilldown omits sensitive payloads
- **WHEN** recent attempts contain API keys, cookies, raw HTML, credential-bearing URLs, ASIN request URLs, or raw provider payload fragments in diagnostics
- **THEN** those values MUST be omitted or redacted before the health response is returned

#### Scenario: Drilldown limit is bounded
- **WHEN** Amazon provider health is requested with many matching attempts
- **THEN** the response SHALL return a bounded latest-attempt list and aggregate counts for the full requested window

### Requirement: Recommend remediation by degraded path
The system SHALL return actionable remediation recommendations for Amazon provider states while distinguishing primary provider health from degraded fallback behavior.

#### Scenario: Primary provider unhealthy but fallback succeeds
- **WHEN** Rainforest fails and browser or cache fallback later succeeds
- **THEN** the provider health response SHALL mark the path as degraded and recommend restoring the primary provider path

#### Scenario: Cache fallback dominates
- **WHEN** cache fallback count is high relative to live provider success in the requested window
- **THEN** the provider health response SHALL recommend checking provider failures and product freshness instead of treating cached data as fresh market evidence

#### Scenario: Insufficient history
- **WHEN** no Amazon acquisition attempts exist in the requested window
- **THEN** the provider health response SHALL return status `insufficient_history` with guidance to run a manual acquisition or wait for scheduled jobs

### Requirement: Emit low-cardinality Amazon provider observability signals
The system SHALL emit low-cardinality observability signals for Amazon acquisition attempts and health aggregation.

#### Scenario: Attempt signal labels are bounded
- **WHEN** an Amazon provider attempt completes
- **THEN** logs or metrics SHALL use bounded labels such as provider, source, status, failure reason, root cause, marketplace, and fallback type

#### Scenario: Signals omit user and payload data
- **WHEN** observability signals are emitted
- **THEN** they MUST NOT include API keys, cookies, raw URLs with query strings, raw HTML, raw provider payloads, product titles, or user-provided free text

#### Scenario: Health aggregation signal
- **WHEN** Amazon provider health is requested
- **THEN** the system SHALL emit a summary signal containing health status, window, provider count, fallback count, cache count, and top root causes without high-cardinality identifiers

### Requirement: Test Amazon provider observability without live provider calls
The system SHALL test Amazon provider health aggregation and diagnostics without calling Rainforest or Amazon.

#### Scenario: Aggregation tests use persisted attempt fixtures
- **WHEN** provider health tests run
- **THEN** they SHALL use local attempt fixtures covering Rainforest success, Rainforest failure, browser fallback, cache fallback, and no-attempt states

#### Scenario: Diagnostics safety tests reject sensitive fields
- **WHEN** diagnostics serialization tests run
- **THEN** they SHALL verify that secrets, raw HTML, and raw provider payloads are not present in stored or returned diagnostics
