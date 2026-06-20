## ADDED Requirements

### Requirement: Preserve provider-chain outcome context for health aggregation
The system SHALL preserve safe provider-chain outcome context whenever an Amazon acquisition uses multiple providers or falls back to cached data.

#### Scenario: Primary provider fails and fallback succeeds
- **WHEN** Rainforest fails and `amazon-browser` later succeeds for the same acquisition request
- **THEN** persisted attempt history or final diagnostics SHALL preserve the Rainforest provider, failure reason, root cause, duration, and sanitized summary so health aggregation can report fallback usage

#### Scenario: Live providers fail and cache succeeds
- **WHEN** all live Amazon providers fail and cache fallback returns product data within the freshness window
- **THEN** persisted attempt history or final diagnostics SHALL identify the result as cache fallback and preserve safe failure context for the live providers

#### Scenario: All providers fail
- **WHEN** every configured Amazon provider fails
- **THEN** the final acquisition result SHALL include a safe provider-chain summary with attempted providers, sources, failure reasons, root causes when available, and sanitized messages

### Requirement: Normalize provider attempt diagnostics at persistence boundaries
The system SHALL normalize and sanitize provider diagnostics before persisting acquisition attempts.

#### Scenario: Rainforest diagnostics are normalized
- **WHEN** a Rainforest attempt is recorded
- **THEN** diagnostics SHALL include allowlisted fields such as provider code, root cause, HTTP status, marketplace, credits remaining, duration, and sanitized provider message

#### Scenario: Browser diagnostics are normalized
- **WHEN** an Amazon browser attempt is recorded
- **THEN** diagnostics SHALL include allowlisted fields such as root cause, failure category, duration, selector version when available, and sanitized message

#### Scenario: Unsafe diagnostics are rejected or redacted
- **WHEN** provider diagnostics contain API keys, cookies, raw HTML, credential-bearing URLs, or raw provider payloads
- **THEN** those values MUST be rejected, omitted, or redacted before the attempt is persisted

### Requirement: Distinguish healthy live acquisition from degraded data paths
The system SHALL distinguish healthy live acquisition, browser fallback acquisition, cache fallback acquisition, and failed acquisition in persisted attempts and API-facing results.

#### Scenario: Third-party provider success
- **WHEN** Rainforest returns a successful Amazon acquisition result
- **THEN** the result and attempt SHALL identify provider `rainforest`, source `third_party`, and live acquisition confidence

#### Scenario: Browser fallback success
- **WHEN** `amazon-browser` succeeds after a primary provider failure
- **THEN** the result and attempt SHALL identify provider `amazon-browser`, source `browser`, and degraded fallback context

#### Scenario: Cache fallback success
- **WHEN** cache fallback succeeds after live provider failures
- **THEN** the result SHALL identify source `cache`, lower confidence than live data, freshness age, and the safe live-provider failure context

### Requirement: Keep provider health API documentation in sync with acquisition contracts
The system SHALL document provider health request and response contracts whenever acquisition health fields change.

#### Scenario: OpenAPI documents new health fields
- **WHEN** OpenAPI documentation is generated
- **THEN** it SHALL include root causes, degraded path counters, latest safe attempts, recommendation codes, and insufficient-history examples for the Amazon provider health endpoint

#### Scenario: Maintainer docs explain safety boundaries
- **WHEN** maintainers read the acquisition documentation
- **THEN** the documentation SHALL explain which diagnostics are safe to store or return and which data MUST remain excluded
