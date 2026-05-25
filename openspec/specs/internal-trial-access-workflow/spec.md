# internal-trial-access-workflow Specification

## Purpose
TBD - created by archiving change ship-internal-trial-access-workflow. Update Purpose after archive.
## Requirements
### Requirement: Internal trial access is available from the workspace shell
The workspace SHALL provide a unified internal V0 trial access surface that lets an evaluator enter, verify, refresh, and leave the deterministic V0 operator team context without exposing raw session secrets or requiring page-local entry knowledge.

#### Scenario: Evaluator opens workspace without trial session
- **WHEN** an evaluator opens the workspace without a usable V0 auth session cookie
- **THEN** the shell or overview SHALL show a concise internal trial entry action and SHALL NOT claim protected V0 data is loaded

#### Scenario: Evaluator enters internal trial
- **WHEN** the evaluator activates the internal trial entry action
- **THEN** the browser SHALL call `POST /api/auth/operator-v0-session` with the existing custom CSRF header, verify `GET /api/auth/session` with explicit tenant/team scope, persist only safe tenant/team/actor display scope, and show the internal trial team as ready

#### Scenario: Existing trial session is verified
- **WHEN** the evaluator has a stored V0 scope and usable auth cookie
- **THEN** the browser SHALL verify the scope through `GET /api/auth/session` before showing the session as ready or loading protected trial data

#### Scenario: Evaluator leaves internal trial
- **WHEN** the evaluator uses the leave action
- **THEN** the browser SHALL call `POST /api/auth/logout` with the existing logout CSRF header, clear the stored V0 scope, and return the shell or overview to the internal trial entry state

#### Scenario: Trial access fails safely
- **WHEN** bootstrap, session verification, protected trial data loading, or logout fails
- **THEN** the UI SHALL show an operator-facing retry or re-enter action without exposing raw cookies, session references, database URLs, provider payloads, authorization headers, or protected cross-team records

### Requirement: Internal trial overview guides the implemented V0 loop
The overview SHALL act as a compact internal trial cockpit that helps evaluators follow the existing V0 workflow from live-session capture through product/knowledge review, AI review, talk-track creation, and next-session tasks.

#### Scenario: Trial overview renders ready state
- **WHEN** the internal trial session is verified
- **THEN** the overview SHALL show the current demo team, actor display name, next recommended workflow, and direct links to `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions`

#### Scenario: Trial overview renders entry state
- **WHEN** no trial session is verified
- **THEN** the overview SHALL show the internal trial entry action and a short workflow path without suggesting that real production login is active

#### Scenario: Workflow link is selected
- **WHEN** an evaluator follows a trial workflow link
- **THEN** the selected V0 workbench SHALL still verify its own session/scope before calling protected APIs

### Requirement: Internal trial browser helpers protect session boundaries
The internal trial browser helper SHALL centralize safe client-side V0 scope handling while keeping session secrets in server-owned `HttpOnly` cookies and protected Route Handlers.

#### Scenario: Scope is stored
- **WHEN** a trial session is entered or verified
- **THEN** only safe display scope fields such as tenant ID, team ID, tenant name, team name, and actor name MAY be stored in browser storage

#### Scenario: Scoped API URL is created
- **WHEN** browser code needs to call an existing protected V0 API
- **THEN** it SHALL append explicit tenant/team scope using the shared helper and SHALL rely on the `HttpOnly` session cookie for authentication

#### Scenario: Session secret handling is reviewed
- **WHEN** client-side trial helper code is reviewed
- **THEN** it SHALL NOT read, store, log, render, or return raw session references, raw cookies, provider tokens, database URLs, invitation secrets, or API keys

### Requirement: Internal trial access verification is repeatable
The project SHALL include repeatable local and browser verification for the internal trial access workflow.

#### Scenario: Local trial access check passes
- **WHEN** local PostgreSQL is migrated and the internal trial access verification command runs with a valid `DATABASE_URL`
- **THEN** it SHALL verify disabled bootstrap, CSRF blocking, successful bootstrap, scoped session verification, protected racket API access, logout invalidation, no-store responses, safe redaction, and rollback

#### Scenario: Browser verification runs before archive
- **WHEN** the internal trial access workflow is ready to archive
- **THEN** Playwright SHALL verify the overview or shell entry/ready state on desktop and mobile, at least one workflow link, absence of console errors, and no incoherent text overflow or overlap

