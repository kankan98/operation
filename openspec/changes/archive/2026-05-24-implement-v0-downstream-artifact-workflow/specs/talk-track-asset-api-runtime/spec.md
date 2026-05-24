## ADDED Requirements

### Requirement: Talk-track API supports V0 browser downstream creation
The existing talk-track API runtime SHALL support V0 browser creation of manual and AI-review-sourced draft assets without requiring new database tables or external providers.

#### Scenario: Browser creates AI-review-sourced draft asset
- **WHEN** an authenticated V0 operator calls the asset create route with explicit scope, CSRF, AI review source metadata, accepted-section summary, scenario metadata, and source grounding
- **THEN** the route SHALL create a scoped draft asset through the existing repository and return safe no-store JSON with the asset view

#### Scenario: Browser creates manual draft asset
- **WHEN** an authenticated V0 operator calls the asset create route with explicit scope, CSRF, manual body, scenario metadata, and no AI section
- **THEN** the route SHALL create a scoped manual draft asset and SHALL NOT require AI run metadata

#### Scenario: Unsafe draft creation is rejected safely
- **WHEN** the browser sends sensitive, duplicate, malformed, or unsupported talk-track data
- **THEN** the route SHALL return the existing safe route error without exposing raw cookies, auth references, database URLs, prompts, provider payloads, or cross-team records
