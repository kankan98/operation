# operator-v0-ai-review-workflow Specification

## Purpose
TBD - created by archiving change implement-ai-review-v0-browser-workflow. Update Purpose after archive.
## Requirements
### Requirement: AI review V0 resolves local team context before review data
The `/ai-review` browser workflow SHALL resolve the same local V0 authenticated tenant/team context used by `/sessions` before listing sessions, preparing AI review runs, executing V0 review, or recording review decisions.

#### Scenario: Operator has no usable session
- **WHEN** an operator opens `/ai-review` without a usable auth session cookie
- **THEN** the page SHALL show a concise V0 entry action and SHALL NOT call protected session or AI review data endpoints until the operator enters a team-scoped session

#### Scenario: Operator enters V0 review context
- **WHEN** the operator activates the V0 entry action
- **THEN** the browser SHALL call the local bootstrap route with the custom CSRF header, verify `/api/auth/session` with explicit scope, store only safe tenant/team display context, and load scoped review-ready sessions

#### Scenario: Existing V0 context loads
- **WHEN** an operator already has a valid auth session and stored tenant/team context
- **THEN** `/ai-review` SHALL verify the context through `/api/auth/session` and then load only scoped session captures and AI review runs

#### Scenario: Context failure is safe
- **WHEN** auth verification, scope resolution, or protected loading fails
- **THEN** the page SHALL show an operator-facing retry or re-enter state without exposing raw cookies, session references, provider keys, database URLs, prompts, provider payloads, or cross-team data

### Requirement: AI review V0 selects review-ready session captures
The `/ai-review` browser workflow SHALL let an authenticated V0 operator select a submitted or review-ready live-session capture as the bounded source input for AI review.

#### Scenario: Review-ready sessions are listed
- **WHEN** scoped session captures include review-ready or processed sessions
- **THEN** the page SHALL show selectable session cards with title, session date, status, summary, question/objection counts, and downstream readiness for AI review

#### Scenario: No review-ready sessions exist
- **WHEN** scoped session captures are empty or none are ready for review
- **THEN** the page SHALL show an empty state that directs the operator to create and submit a session capture before running AI review

#### Scenario: Draft sessions cannot run review
- **WHEN** a scoped session is still draft, autosaved, failed, archived, deleted, or otherwise not ready
- **THEN** the page SHALL keep AI review actions disabled for that session and show a concise readiness reason

### Requirement: AI review V0 prepares bounded runs from selected sessions
The `/ai-review` browser workflow SHALL prepare AI review runs through the existing protected AI review run API using bounded session snapshots and an explicit local V0 knowledge snapshot.

#### Scenario: Prepare run succeeds
- **WHEN** an authenticated V0 operator selects a review-ready session and starts review preparation
- **THEN** the browser SHALL call `POST /api/ai-review/runs` with explicit tenant/team scope, the existing AI review mutation CSRF header, requested review sections, a bounded input snapshot, and a local V0 knowledge snapshot, then show the returned run in `input_ready` state

#### Scenario: Prepare run blocks unsafe input
- **WHEN** the selected session has blocked redaction, blocked long-input policy, missing required session signal, or insufficient review readiness
- **THEN** the page SHALL show an actionable safe error and SHALL NOT claim that AI review generation has started

#### Scenario: Prepared run detail is inspectable
- **WHEN** a run has been prepared or loaded from the scoped run list
- **THEN** the page SHALL show run status, requested sections, input snapshot summary, knowledge snapshot summary, validation state, and available next actions without exposing full prompt text or provider payloads

### Requirement: AI review V0 executes through a local fake provider by default
The V0 browser workflow SHALL execute prepared AI review runs through a local/internal fake `AiProviderPort` path by default, while preserving the existing production provider route behavior.

#### Scenario: V0 execute route is gated
- **WHEN** the local V0 execute route is called while V0 bootstrap is disabled
- **THEN** it SHALL return a safe disabled response, SHALL NOT open the database, and SHALL NOT call any live AI provider

#### Scenario: V0 execute requires auth, scope, CSRF, and permission
- **WHEN** a client calls the local V0 execute route without auth cookie, explicit tenant/team scope, valid AI review CSRF header, or `run_ai_review` permission
- **THEN** it SHALL return safe non-success JSON and SHALL NOT execute the run

#### Scenario: V0 execute succeeds without live provider
- **WHEN** an authenticated V0 operator executes an input-ready run through the V0 route
- **THEN** the route SHALL use a deterministic fake provider, record provider metadata, structured output, validation results, and return a review-ready run detail without reading live DeepSeek credentials or making a network provider call

#### Scenario: Existing production execute behavior remains unchanged
- **WHEN** a client calls the existing production execute route
- **THEN** it SHALL continue to use the configured provider adapter gate and SHALL return a safe provider configuration error when provider environment is missing or invalid

### Requirement: AI review V0 supports human section decisions
The `/ai-review` browser workflow SHALL let the authenticated V0 operator record simple human review decisions for generated sections without turning AI output into authoritative facts.

#### Scenario: Operator accepts a generated section
- **WHEN** a review-ready run has pending sections and the operator accepts a section
- **THEN** the browser SHALL call the existing decisions route with explicit scope and CSRF, update section review state, and show the updated run status

#### Scenario: Operator rejects or requests regeneration
- **WHEN** the operator rejects a section or marks that it needs regeneration
- **THEN** the browser SHALL record the decision through the existing API and SHALL NOT create downstream artifact references from that section

#### Scenario: AI output remains reviewable
- **WHEN** generated sections are displayed
- **THEN** the UI SHALL label them as AI suggestions needing human review and SHALL distinguish them from human-entered session facts and local V0 review context

### Requirement: AI review V0 verification is repeatable
The project SHALL provide repeatable verification for the AI review V0 browser workflow across local route behavior and rendered browser behavior.

#### Scenario: Local workflow check passes
- **WHEN** local PostgreSQL is available and the AI review V0 workflow check command runs
- **THEN** it SHALL verify V0 route disabled behavior, CSRF blocking, auth/scope blocking, successful fake-provider execution, safe prompt/output redaction, decision recording, and transaction rollback or deterministic cleanup

#### Scenario: Browser verification runs before archive
- **WHEN** this change is ready to archive
- **THEN** Playwright SHALL verify `/ai-review` on desktop and mobile for entry state, authenticated workflow state where local secure-cookie behavior allows it, session selection, prepare/execute/review interactions, absence of console errors, and no incoherent text overflow or overlap
