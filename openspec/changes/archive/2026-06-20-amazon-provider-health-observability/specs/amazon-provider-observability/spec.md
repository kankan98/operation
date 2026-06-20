## ADDED Requirements

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

### Requirement: Test Amazon provider observability without live provider calls
The system SHALL test Amazon provider health aggregation and diagnostics without calling Rainforest or Amazon.

#### Scenario: Aggregation tests use persisted attempt fixtures
- **WHEN** provider health tests run
- **THEN** they SHALL use local attempt fixtures covering Rainforest success, Rainforest failure, browser fallback, cache fallback, and no-attempt states

#### Scenario: Diagnostics safety tests reject sensitive fields
- **WHEN** diagnostics serialization tests run
- **THEN** they SHALL verify that secrets, raw HTML, and raw provider payloads are not present in stored or returned diagnostics
