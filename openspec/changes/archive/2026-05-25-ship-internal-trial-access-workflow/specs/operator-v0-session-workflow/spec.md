## ADDED Requirements

### Requirement: Workspace-level V0 entry reuses the operator session runtime
The operator V0 session workflow SHALL support a shared workspace-level browser entry that reuses the existing local-only bootstrap, safe session view, and logout runtime without replacing page-level server authorization.

#### Scenario: Workspace entry uses bootstrap route
- **WHEN** the shared workspace trial entry starts a V0 session
- **THEN** it SHALL use the existing `POST /api/auth/operator-v0-session` route, existing bootstrap CSRF header, deterministic V0 ownership records, and app-owned auth cookie/session ledger

#### Scenario: Workspace entry verifies scope
- **WHEN** the shared workspace trial entry receives a bootstrap response or stored scope
- **THEN** it SHALL verify the context through `GET /api/auth/session` with explicit tenant/team scope before displaying the session as ready

#### Scenario: Workspace leave uses logout route
- **WHEN** the shared workspace trial leave action is used
- **THEN** it SHALL use the existing `POST /api/auth/logout` route with logout CSRF and SHALL clear browser-stored display scope

#### Scenario: Page-level workbenches remain guarded
- **WHEN** an evaluator opens any V0 workbench from the shared entry
- **THEN** that workbench and its protected APIs SHALL continue enforcing cookie/session resolution, explicit tenant/team scope, permissions, CSRF mutation headers, and repository ownership checks
