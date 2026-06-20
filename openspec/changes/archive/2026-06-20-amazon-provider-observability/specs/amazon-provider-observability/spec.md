## ADDED Requirements

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
