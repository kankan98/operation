## ADDED Requirements

### Requirement: Public trial entry is available
The workspace SHALL provide a dedicated public trial entry surface that lets an evaluator start or verify the controlled trial team context before opening implemented operator workbenches.

#### Scenario: Evaluator opens trial entry without session
- **WHEN** an evaluator opens `/trial` without a usable trial session cookie
- **THEN** the page SHALL show a concise trial entry action and SHALL NOT claim that protected team data is loaded

#### Scenario: Evaluator enters trial
- **WHEN** the evaluator activates the trial entry action
- **THEN** the browser SHALL call the existing V0 bootstrap route with its CSRF header, verify the safe auth session route with explicit tenant/team scope, store only safe display scope, and offer to continue to the requested or recommended workbench route

#### Scenario: Evaluator opens trial entry with existing session
- **WHEN** the evaluator opens `/trial` with stored display scope and a usable session cookie
- **THEN** the page SHALL verify the safe auth session route before showing the trial team as ready

#### Scenario: Evaluator leaves trial
- **WHEN** the evaluator uses the leave action from the trial entry or workspace status surface
- **THEN** the browser SHALL call the existing logout route with its CSRF header, clear stored display scope, and return to a non-ready entry state

### Requirement: Protected workspace routes require trial access
Implemented operator workbench routes SHALL use a route-level trial access gate before rendering the workbench page for visitors without the app-owned auth session cookie.

#### Scenario: Visitor opens protected workbench without session cookie
- **WHEN** a visitor opens `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, or `/next-actions` without the app-owned session cookie
- **THEN** the request SHALL redirect to `/trial` with a sanitized `next` value for the requested workbench path

#### Scenario: Visitor opens protected workbench with session cookie
- **WHEN** a visitor opens a protected workbench route with the app-owned session cookie present
- **THEN** the route-level gate SHALL allow the page request to continue and the workbench SHALL still verify tenant/team authorization through existing protected APIs before loading data

#### Scenario: Visitor opens public or framework route
- **WHEN** a visitor opens `/`, `/trial`, API routes, Next.js asset routes, static assets, or an unknown non-workspace route
- **THEN** the route-level trial access gate SHALL NOT redirect the request as a protected workbench route

### Requirement: Trial next path is constrained
The public trial entry SHALL only continue to known workspace routes and SHALL reject unsafe or unknown redirect targets.

#### Scenario: Known workspace next path is provided
- **WHEN** `/trial` receives a `next` value of `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, or `/next-actions`
- **THEN** the trial entry SHALL use that path as the continue destination after session readiness is verified

#### Scenario: Unsafe next path is provided
- **WHEN** `/trial` receives an absolute URL, protocol-relative URL, API path, static asset path, unknown route, empty value, or malformed path as `next`
- **THEN** the trial entry SHALL ignore that value and fall back to the recommended first workbench path

### Requirement: Public trial status protects session boundaries
The public trial access UI SHALL show access state and team context without exposing session secrets or implementation details.

#### Scenario: Trial status is ready
- **WHEN** the trial session is verified
- **THEN** the UI SHALL show the safe team name, actor display name, and continue action without rendering raw cookies, session references, provider payloads, database URLs, invitation secrets, API keys, or authorization headers

#### Scenario: Trial status fails
- **WHEN** bootstrap, session verification, protected data loading, or logout fails
- **THEN** the UI SHALL show an operator-facing retry or re-enter action without exposing internal error payloads or sensitive metadata

### Requirement: Public trial auth verification is repeatable
The project SHALL include repeatable verification for public trial route protection and session boundary behavior.

#### Scenario: Route decision check passes
- **WHEN** the public trial auth route-decision check runs
- **THEN** it SHALL verify missing-cookie redirects, cookie-present pass-through, public route exclusions, unsafe next-path fallback, no-store redirect responses, and redaction of sensitive metadata

#### Scenario: Browser verification runs before archive
- **WHEN** the public trial auth foundation is ready to archive
- **THEN** Playwright SHALL verify trial entry, protected route redirect, ready state, at least one continue path, absence of console errors, and no incoherent text overflow or overlap on desktop and mobile
