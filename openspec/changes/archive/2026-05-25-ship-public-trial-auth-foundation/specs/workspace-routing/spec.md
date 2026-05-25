## ADDED Requirements

### Requirement: Implemented workbench routes respect public trial access
The workspace routing layer SHALL route unauthenticated visitors through public trial entry before rendering implemented operator workbenches.

#### Scenario: Unauthenticated visitor opens implemented workbench
- **WHEN** an unauthenticated visitor opens `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, or `/next-actions`
- **THEN** workspace routing SHALL redirect the request to `/trial` with a sanitized destination for the requested workbench

#### Scenario: Trial-ready visitor opens implemented workbench
- **WHEN** a visitor with the app-owned session cookie opens an implemented workbench route
- **THEN** workspace routing SHALL allow the page to render and the workbench SHALL rely on existing scoped API/session verification before loading protected data

#### Scenario: Visitor opens overview
- **WHEN** a visitor opens `/`
- **THEN** workspace routing SHALL render the overview route so the user can understand and enter the trial workflow without a redirect loop

#### Scenario: Visitor opens trial entry
- **WHEN** a visitor opens `/trial`
- **THEN** workspace routing SHALL render the public trial entry route without requiring an existing session cookie

### Requirement: Workspace route verification includes protected routing
Workspace route verification SHALL cover the trial gate in addition to rendered route smoke checks.

#### Scenario: Protected routing check passes
- **WHEN** route verification runs for the public trial auth foundation
- **THEN** it SHALL prove protected workbench paths redirect without a session cookie, pass through with the session cookie present, and exclude `/`, `/trial`, APIs, static assets, and unknown non-workspace routes from trial redirects

#### Scenario: Browser smoke checks include trial entry
- **WHEN** browser verification runs for this change
- **THEN** `/trial` and at least one protected workbench redirect/continue path SHALL render without console errors, text overflow, or incoherent overlap on desktop and mobile viewports
