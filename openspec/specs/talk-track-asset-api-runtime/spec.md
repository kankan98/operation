# talk-track-asset-api-runtime Specification

## Purpose
Define the local-only protected Route Handler runtime for talk-track candidates,
source-grounded assets, human review, publication, archive/restore lifecycle,
usage signals, auth/session scope, CSRF protection, safe responses, and rollback
verification before browser save UI, AI downstream creation, RAG, or production
persistence is implemented.
## Requirements
### Requirement: Talk-track API routes expose a protected asset workflow
The system SHALL provide local-only protected Route Handlers for listing,
creating, reading, submitting, publishing, archiving, and restoring
source-grounded talk-track assets through the existing auth cookie/session
runtime and talk-track repository.

#### Scenario: Authorized actor creates and reads a scoped asset
- **WHEN** an authenticated actor with talk-track management permission calls the
  talk-track asset create route with explicit tenant/team scope and the
  required mutation CSRF header
- **THEN** the route SHALL create the asset through the repository, return
  no-store JSON with the asset view, and allow the same team to list and read
  the asset detail

#### Scenario: Cross-team asset detail is requested
- **WHEN** an authenticated actor requests a talk-track asset ID that belongs to
  another team or tenant
- **THEN** the route SHALL return a safe not-found style response without
  exposing the asset contents or cross-team record existence

#### Scenario: Asset lifecycle mutation is missing CSRF
- **WHEN** a create, submit, publish, archive, or restore request omits the
  talk-track mutation CSRF header
- **THEN** the route SHALL return a forbidden safe JSON response before
  repository access

### Requirement: Talk-track API routes preserve candidate review and publication gates
The system SHALL provide local-only protected Route Handlers for talk-track
candidate creation, human candidate review, version review decisions, and
publish attempts while preserving repository gates for source grounding,
sensitive data, reviewer role, and AI candidate review state.

#### Scenario: AI candidate cannot publish before human review
- **WHEN** an asset version is linked to an AI candidate whose review state is
  still pending or rejected
- **THEN** the publish route SHALL reject publication with a safe unprocessable
  response and the asset SHALL remain unpublished

#### Scenario: Reviewer approves candidate and publishes version
- **WHEN** an eligible reviewer records an approving review decision, accepts or
  edits the linked candidate, and calls publish on a current source-grounded
  version
- **THEN** the route SHALL return no-store JSON with a published asset view and
  repository-calculated readiness

#### Scenario: Missing or unsafe source blocks publish
- **WHEN** a version has required-evidence segments but no current
  non-conflicted source grounding, stale-blocked source, conflict-blocked
  source, or blocked sensitive source
- **THEN** the publish route SHALL return a safe unprocessable response and
  SHALL NOT publish the version

### Requirement: Talk-track API routes record reuse signals as audit-only feedback
The system SHALL provide a local-only protected Route Handler for recording
usage signals for published talk-track versions without rewriting the published
body, candidate, source grounding, or review decision.

#### Scenario: Usage signal is recorded for a published version
- **WHEN** an authenticated actor with talk-track management permission records
  that a published talk-track was used, edited before use, rejected in use,
  reported wrong, or needs update
- **THEN** the route SHALL store the signal through the repository, return
  no-store JSON with the signal view, and leave the published version body
  unchanged

#### Scenario: Usage signal on unpublished asset is rejected
- **WHEN** an authenticated actor records a usage signal for a draft, reviewing,
  rejected, archived, or deprecated-unpublished asset version
- **THEN** the route SHALL return a safe state-transition response and SHALL NOT
  create a usage signal

### Requirement: Talk-track API route verification is rollback based
The system SHALL provide a local verification command that exercises the
talk-track Route Handler workflow against the development PostgreSQL database
and rolls back all seeded records.

#### Scenario: Local talk-track route verifier succeeds
- **WHEN** `pnpm talk-tracks:route-check` is run with a valid local
  `DATABASE_URL`
- **THEN** it SHALL verify no-cookie denial, missing scope, CSRF blocking,
  authorized candidate/asset/review/publish/usage workflows, duplicate scenario
  rejection, missing permission, cross-team isolation, no-store responses,
  response redaction, and transaction rollback

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
