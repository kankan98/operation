## ADDED Requirements

### Requirement: Auth team tenant contract records route runtime status
The auth team tenant contract SHALL be updated when the local-only auth Route
Handler runtime is implemented so future agents can distinguish contract-only
planning, local guard foundation, local session runtime, cookie/request runtime,
and public auth route runtime from a complete provider/login system.

#### Scenario: Local auth route runtime is implemented
- **WHEN** the project adds public `GET /api/auth/session` and
  `POST /api/auth/logout` Route Handlers over the existing app-owned
  cookie/session runtime
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented route
  surface, safe response shape, logout CSRF header requirement, remaining
  provider/login/middleware/team-management non-goals, and the fact that
  protected business CRUD remains blocked until future OpenSpec changes

#### Scenario: Future protected browser workflow is proposed
- **WHEN** a future change proposes protected product, session, knowledge, AI,
  Q&A, talk-track, task, export, team, or member Route Handlers or Server
  Actions
- **THEN** the agent starts from the updated auth contract and verifies whether
  the auth route runtime is sufficient or whether provider login, middleware,
  team switching, CSRF/origin checks, invitation, role, audit, or sensitive data
  assumptions must change
