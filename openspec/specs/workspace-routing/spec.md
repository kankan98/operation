# workspace-routing Specification

## Purpose
Define the stable App Router workspace routes, shared navigation behavior, active route state, and placeholder workflow page boundaries for the operator workspace.
## Requirements
### Requirement: Workspace routes are stable
The web application SHALL provide stable App Router pages for each planned
operator workflow without relying on hash-anchor navigation.

#### Scenario: Operator opens a workflow route
- **WHEN** an operator opens `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, or `/next-actions`
- **THEN** the application renders a Chinese route-specific workspace page for that workflow

#### Scenario: Operator opens the overview route
- **WHEN** an operator opens `/`
- **THEN** the application renders the Chinese workspace overview route

#### Scenario: Unknown route is requested
- **WHEN** an operator opens an unknown route
- **THEN** the existing Chinese not-found surface remains available with a clear path back to `/`

### Requirement: Navigation uses route paths and active state
The workspace shell SHALL use real route paths for primary navigation and SHALL
communicate the current route in desktop and mobile navigation.

#### Scenario: Desktop navigation shows active route
- **WHEN** a workspace route renders on a desktop viewport
- **THEN** the sidebar shows the matching navigation item as the current page using accessible current-page state

#### Scenario: Mobile navigation lists route links
- **WHEN** a workspace route renders on a mobile viewport
- **THEN** the mobile navigation sheet lists the same route paths as the desktop sidebar

### Requirement: Placeholder workflow pages do not imply live capabilities
Each new workflow page SHALL make unavailable capabilities explicit and SHALL NOT
persist data, read protected data, call AI providers, or integrate with external
platforms.

#### Scenario: Workflow action is unavailable
- **WHEN** an operator views any new workflow page
- **THEN** the primary workflow action is disabled or clearly marked unavailable until a future OpenSpec change implements the capability

#### Scenario: Empty state explains boundaries
- **WHEN** an operator views any new workflow page
- **THEN** the page explains in Chinese that real data, authentication, AI analysis, or integrations are not connected in this slice

#### Scenario: Static preview content is shown
- **WHEN** a workflow page shows preview rows, checklist items, or metric labels
- **THEN** the content is static product-planning copy and does not contain customer data, business metrics, transcripts, prompts, or AI outputs

### Requirement: Workspace route verification remains repeatable
The route implementation SHALL preserve existing root verification commands and
add browser smoke coverage for each new workspace route.

#### Scenario: Static verification passes
- **WHEN** implementation is complete
- **THEN** `pnpm lint`, `pnpm typecheck`, and `pnpm build` pass from the repository root

#### Scenario: Container build remains valid
- **WHEN** implementation is complete
- **THEN** `pnpm docker:build` still produces a runnable production image

#### Scenario: Browser smoke checks cover routes
- **WHEN** browser verification runs
- **THEN** `/`, `/sessions`, `/rackets`, `/knowledge`, `/ai-review`, `/talk-tracks`, and `/next-actions` render without console errors, text overflow, or incoherent overlap on desktop and mobile viewports

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
