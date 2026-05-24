## ADDED Requirements

### Requirement: Auth team tenant contract records session runtime status
The auth team tenant contract SHALL be updated when the local-only app-owned
auth session runtime is implemented so future agents can distinguish
contract-only planning, local guard foundation, and local session runtime from a
complete provider/login system.

#### Scenario: Local session runtime is implemented
- **WHEN** the project adds an app-owned auth session ledger, session reference
  hashing, provider-neutral session resolver, and local session verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented local
  session surface, remaining non-goals, sensitive data rules, and the fact that
  provider login, cookies, middleware, and public protected CRUD remain blocked
  until future OpenSpec changes

#### Scenario: Future protected workflow runtime is proposed
- **WHEN** a future change proposes protected Route Handlers, protected Server
  Actions, browser save flows, AI/RAG calls from user context, exports, or team
  management
- **THEN** the agent starts from the updated auth contract and verifies whether
  the local session runtime is sufficient or whether provider login, cookie,
  middleware, invitation, role, audit, or sensitive data assumptions must change
