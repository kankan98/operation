## ADDED Requirements

### Requirement: Auth team tenant contract records cookie runtime status
The auth team tenant contract SHALL be updated when the local-only auth cookie
runtime is implemented so future agents can distinguish contract-only planning,
local guard foundation, local session runtime, and request-cookie runtime from
a complete provider/login system.

#### Scenario: Local cookie runtime is implemented
- **WHEN** the project adds safe auth cookie serialization, request-cookie
  resolution, logout invalidation, cookie clearing, and local cookie
  verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented cookie
  runtime surface, remaining non-goals, sensitive data rules, and the fact that
  provider login, middleware/proxy protection, team management, and public
  protected CRUD remain blocked until future OpenSpec changes

#### Scenario: Future login or protected browser workflow is proposed
- **WHEN** a future change proposes provider login, login/logout routes,
  middleware/proxy protection, protected Route Handlers, protected Server
  Actions, browser save flows, AI/RAG calls from user context, exports, or team
  management
- **THEN** the agent starts from the updated auth contract and verifies whether
  the cookie runtime is sufficient or whether provider, CSRF, middleware,
  invitation, team switching, role, audit, or sensitive data assumptions must
  change
