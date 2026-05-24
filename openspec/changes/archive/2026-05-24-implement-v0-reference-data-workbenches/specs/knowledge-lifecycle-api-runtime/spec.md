## MODIFIED Requirements

### Requirement: Knowledge lifecycle API runtime remains local-only and protected
The project SHALL expose the knowledge lifecycle workflow through local-only
Route Handlers that require the existing app-owned auth cookie/session runtime,
explicit tenant/team scope, server-side authorization, existing repository
business rules, safe no-store JSON responses, and rollback-based local
verification.

#### Scenario: Public workspace remains static without database config
- **WHEN** existing public workspace pages render without `DATABASE_URL`
- **THEN** they SHALL continue to render safe entry/static states and SHALL NOT
  import knowledge lifecycle repository modules or attempt protected data access
  before an authenticated scoped browser workflow is entered

#### Scenario: No provider or RAG system is introduced
- **WHEN** the knowledge lifecycle API runtime is used by a local V0 browser workbench
- **THEN** it SHALL NOT add a login provider, provider callback, middleware,
  team management UI, source discovery, source refresh job, RAG retrieval, Q&A
  generation, AI provider call, queue, object storage, analytics,
  observability provider, or production database provider; browser forms SHALL
  call the existing protected Route Handlers with explicit scope and CSRF

## ADDED Requirements

### Requirement: Knowledge lifecycle API supports V0 browser reference-data creation
The existing knowledge lifecycle API runtime SHALL support V0 browser creation, review, and publication-gated display of scoped knowledge records without requiring new database tables or external providers.

#### Scenario: Browser registers source
- **WHEN** an authenticated V0 operator calls the source registration route with explicit scope, CSRF, source type, title, owner, URL where applicable, trust level, refresh cadence, and intended use
- **THEN** the route SHALL register a scoped source through the existing repository and return safe no-store JSON with the source view

#### Scenario: Browser creates manual content
- **WHEN** an authenticated V0 operator calls the claim or team-note route with explicit scope, CSRF, source references where applicable, content type, subject or knowledge key, and non-sensitive content
- **THEN** the route SHALL create scoped pending or draft knowledge content through the existing repository and return safe no-store JSON with the content view

#### Scenario: Browser records review and publish actions
- **WHEN** an authenticated V0 operator calls supported review, conflict, or version publication routes with explicit scope and CSRF
- **THEN** the route SHALL delegate to existing repository gates, return updated safe views, and preserve no-store response headers

#### Scenario: Unsafe knowledge creation is rejected safely
- **WHEN** the browser sends sensitive, duplicate, malformed, unsupported, invalid-transition, missing-source, conflict-blocked, or cross-team knowledge data
- **THEN** the route SHALL return the existing safe route error without exposing raw cookies, auth references, database URLs, prompts, provider payloads, raw customer messages, unpublished source text, or cross-team records
