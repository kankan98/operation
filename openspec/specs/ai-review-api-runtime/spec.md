# ai-review-api-runtime Specification

## Purpose
TBD - created by archiving change implement-ai-review-api-runtime. Update Purpose after archive.
## Requirements
### Requirement: AI review protected API runtime exists
The system SHALL provide a local-only protected App Router API runtime for AI
review prompt metadata, runs, execution, human decisions, feedback, downstream
artifact references, and archive actions.

#### Scenario: API files expose the AI review workflow
- **WHEN** the change is implemented
- **THEN** App Router Route Handlers exist for prompt-version creation, run list,
  run creation, run detail, run execution, review decisions, feedback signals,
  downstream artifact references, and archive

#### Scenario: Route helper is server-only
- **WHEN** application code imports the AI review API route helper
- **THEN** it is server-only and does not create a database connection or
  provider instance at module top level

#### Scenario: API responses are not cached
- **WHEN** any AI review API route returns success or error JSON
- **THEN** the response includes `Cache-Control: no-store`

### Requirement: AI review API enforces auth, scope, permission, and CSRF gates
The system SHALL enforce auth cookie, explicit tenant/team scope, mutation CSRF,
and server-side permission checks for AI review API requests.

#### Scenario: Read request has no auth cookie
- **WHEN** a client reads AI review runs without an auth session cookie
- **THEN** the API returns 401 without opening a database connection

#### Scenario: Mutation request has no CSRF header
- **WHEN** a client prepares, executes, reviews, feeds back, creates downstream
  references, archives, or creates prompt metadata without the AI review CSRF
  header
- **THEN** the API returns 403 without opening a database connection

#### Scenario: Request has no tenant or team scope
- **WHEN** a client calls an AI review route without explicit `tenantId` and
  `teamId` query params or auth scope headers
- **THEN** the API returns a safe scope error and does not access cross-team data

#### Scenario: Actor lacks AI review permission
- **WHEN** an authenticated actor without `run_ai_review` permission calls a
  mutation route
- **THEN** the API returns a safe forbidden response and does not persist data

#### Scenario: Cross-team actor reads a run
- **WHEN** an actor from another team requests an existing AI review run ID
- **THEN** the API returns safe not-found or forbidden JSON without exposing the
  other team's run data

### Requirement: AI review API prepares and reads bounded runs
The system SHALL allow authorized actors to create bounded AI review runs from
redacted input snapshots and reviewed knowledge snapshots, then list and inspect
those runs within tenant/team scope.

#### Scenario: Prepare run succeeds
- **WHEN** an authorized actor creates a run with review-ready session input,
  redacted long-input-safe data, and current reviewed knowledge
- **THEN** the API returns 201 with the new run in `input_ready` state

#### Scenario: Prepare run blocks unsafe snapshots
- **WHEN** an authorized actor creates a run with blocked redaction, blocked
  long input, stale-blocked knowledge, conflicting knowledge, or insufficient
  evidence
- **THEN** the API returns a safe non-success response and does not create a
  usable run

#### Scenario: List runs is scoped
- **WHEN** an authorized actor lists AI review runs with optional status filters
  and limit
- **THEN** the API returns only tenant/team-scoped runs ordered by creation time

#### Scenario: Detail includes review state
- **WHEN** an authorized actor reads an AI review run detail
- **THEN** the API returns the run, snapshots, prompt metadata, provider
  metadata, output, sections, validation results, decisions, feedback signals,
  and downstream artifact references for that tenant/team only

### Requirement: AI review API executes runs through the provider port safely
The system SHALL execute prepared AI review runs through the existing execution
service and injected `AiProviderPort` while preserving provider-neutral errors
and sensitive-data redaction.

#### Scenario: Execute run succeeds with fake provider
- **WHEN** the local route verifier executes an input-ready run through a fake
  provider using reviewed prompt metadata and provider policy
- **THEN** the API records provider metadata, structured output, validation
  results, and returns a review-ready run detail without calling a real provider

#### Scenario: Execute run records provider failure
- **WHEN** the provider returns timeout, rate-limit, refusal, malformed output,
  partial output, schema mismatch, unavailable, or policy-blocked failure
- **THEN** the API returns a safe error, records the safe failure state when
  possible, and does not expose full prompt text or provider payloads

#### Scenario: Execute run rejects invalid state
- **WHEN** a client executes an archived, review-ready, validation-failed,
  provider-failed, accepted, rejected, downstream-ready, or otherwise
  non-executable run
- **THEN** the API rejects the request before provider invocation

#### Scenario: Missing provider configuration is safe
- **WHEN** a correctly authenticated execute request reaches the App Router
  runtime without valid provider configuration
- **THEN** the API returns a safe provider configuration error without leaking
  environment variable values or secrets

### Requirement: AI review API records human decisions, feedback, and downstream references
The system SHALL expose protected routes for human review decisions, quality
feedback, and downstream draft references without turning AI output into
authoritative facts.

#### Scenario: Reviewer accepts or edits a section
- **WHEN** an authorized actor records an accept or edit-accept decision for a
  review-ready section
- **THEN** the API records the decision, updates section review state, and
  updates the run review status according to remaining pending sections

#### Scenario: Reviewer rejects or requests regeneration
- **WHEN** an authorized actor rejects a section or requests regeneration
- **THEN** the API records the decision and prevents that section from creating
  downstream references

#### Scenario: Feedback signal is recorded
- **WHEN** an authorized actor records accepted, edited, rejected, regenerated,
  missing-knowledge, wrong-source, evidence-weak, or downstream-used feedback
- **THEN** the API stores the signal with review priority and route without
  changing authoritative knowledge

#### Scenario: Downstream reference requires accepted section
- **WHEN** an authorized actor creates a downstream artifact reference
- **THEN** the API requires the source run and section to be accepted or edited
  and records only a draft reference to talk-track, short-video-topic,
  next-session-task, or knowledge-gap output

#### Scenario: Archive run succeeds
- **WHEN** an authorized actor archives a tenant/team-scoped AI review run
- **THEN** the API marks the run archived and future invalid state operations are
  rejected safely

### Requirement: AI review API runtime is locally verifiable
The system SHALL provide a local route verifier for the AI review API runtime
that uses rollback transactions and a fake provider by default.

#### Scenario: Route check verifies success and safety
- **WHEN** `pnpm ai-review:route-check` runs against the local development
  database
- **THEN** it verifies prompt metadata creation, run preparation, list, detail,
  execution, decisions, feedback, downstream references, archive, no-store
  responses, auth failure, CSRF failure, cross-team isolation, safe provider
  failure, and transaction rollback

#### Scenario: Route check does not call live provider
- **WHEN** route-check runs in an environment that contains provider credentials
- **THEN** it still uses a fake provider and does not make a live DeepSeek
  request

#### Scenario: Route responses are redacted
- **WHEN** the route verifier inspects API responses and safe errors
- **THEN** it fails if responses include raw session cookies, auth session
  references, provider keys, Authorization headers, full prompts, full provider
  payloads, raw transcripts, DB URLs, or cross-team fixture markers
