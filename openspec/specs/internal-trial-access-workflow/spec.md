# internal-trial-access-workflow Specification

## Purpose
Define the internal V0 trial access workflow that lets evaluators enter,
verify, use, and leave the deterministic demo team context without exposing
session secrets or presenting the internal bootstrap as production login.
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

### Requirement: Internal trial access remains bounded after public trial entry is introduced
The existing internal V0 trial access workflow SHALL remain available only as the app-owned bootstrap/session mechanism behind public trial entry and internal preview evaluation, not as a claim of production login.

#### Scenario: Public trial entry uses existing internal bootstrap
- **WHEN** the public trial entry starts a controlled trial session
- **THEN** it MAY reuse the existing `POST /api/auth/operator-v0-session`, `GET /api/auth/session`, and `POST /api/auth/logout` runtime while presenting the workflow as trial access rather than production authentication

#### Scenario: Internal preview language is reviewed
- **WHEN** docs, specs, or UI describe the internal V0 HTTP preview path
- **THEN** they SHALL keep the boundary clear that internal preview cookies and deterministic V0 teams are for demo/evaluation data only and do not authorize real customer, order, private message, supplier, pricing, or full raw transcript data

#### Scenario: Future provider login replaces trial bootstrap for production
- **WHEN** a future production auth provider is implemented
- **THEN** the internal bootstrap path SHALL remain gated for demo/internal evaluation or be retired through a separate OpenSpec change with migration and verification

### Requirement: Internal trial overview acts as MVP cockpit
The internal trial overview SHALL act as a compact MVP cockpit that helps
evaluators understand the verified demo team state, current workflow step, and
available implemented workbenches.

#### Scenario: MVP cockpit is ready
- **WHEN** the internal trial session is verified
- **THEN** the overview SHALL show the demo team, actor display name, recommended
  workflow sequence, route availability for all implemented V0 workbenches, and
  direct actions to continue the trial path

#### Scenario: MVP cockpit needs re-entry
- **WHEN** the stored display scope is missing, stale, logged out, or rejected
  by the safe session route
- **THEN** the overview SHALL show a re-enter trial action and SHALL NOT claim
  that protected V0 data or team context is ready

#### Scenario: Workbench route is selected from cockpit
- **WHEN** an evaluator opens any implemented workbench from the cockpit
- **THEN** the target workbench SHALL still verify the app-owned session cookie,
  explicit tenant/team scope, permissions, CSRF requirements for mutations, and
  repository ownership before loading or mutating protected data

### Requirement: Internal trial recovery avoids implementation detail
The internal trial workflow SHALL present recoverable failures in operator-facing
language that supports the next useful action.

#### Scenario: Session verification fails
- **WHEN** the safe session route rejects or cannot verify the current trial
  scope
- **THEN** the UI SHALL offer refresh, logout, or re-enter actions and SHALL NOT
  render raw cookies, opaque session references, database URLs, CSRF tokens,
  provider config, stack traces, or raw protected records

#### Scenario: Workbench route fails to load
- **WHEN** a workbench cannot load due to auth, scope, route, network, or data
  readiness failure
- **THEN** the UI SHALL keep the trial status inspectable and offer a safe return
  or retry path instead of leaving the evaluator on an empty or frozen view

### Requirement: Internal trial cockpit shows dynamic V0 progress
The internal trial overview cockpit SHALL show dynamic V0 workflow progress
after the evaluator's trial session is verified.

#### Scenario: Cockpit progress is ready
- **WHEN** the overview verifies the trial session and the protected list checks
  succeed
- **THEN** the cockpit SHALL show each implemented V0 workbench with a safe
  started or empty state, count summary, and direct link

#### Scenario: Cockpit progress is loading
- **WHEN** the overview is checking the verified trial workflow progress
- **THEN** the cockpit SHALL show a visible loading state and SHALL NOT claim
  that protected workbench data has loaded

#### Scenario: Cockpit progress is retryable
- **WHEN** workflow progress loading fails
- **THEN** the cockpit SHALL keep the trial access controls available and SHALL
  offer a safe retry or refresh action without exposing implementation details

#### Scenario: Cockpit next action is available
- **WHEN** the readiness model identifies a next useful workbench
- **THEN** the cockpit SHALL offer a primary continuation action to that
  workbench while preserving direct access to the other implemented V0
  workbenches

