## ADDED Requirements

### Requirement: Auth team tenant contract records guard runtime status
The auth team tenant contract SHALL be updated when the local provider-neutral
auth guard foundation is implemented so future agents can distinguish
contract-only planning from partially implemented local authorization runtime.

#### Scenario: Local guard runtime is implemented
- **WHEN** the project adds provider-neutral auth context resolution,
  authorization guard helpers, safe decision/error shapes, repository context
  conversion, and local guard verification
- **THEN** `docs/contracts/auth-team-tenant.md` records the implemented local
  guard surface, remaining non-goals, and the fact that login/provider runtime
  remains blocked until future OpenSpec changes

#### Scenario: Future provider runtime is selected
- **WHEN** a future change implements Auth.js, OAuth, magic link, password,
  hosted identity, middleware, provider callbacks, invitation delivery, or team
  management UI
- **THEN** the agent starts from the updated auth contract and updates it if
  provider, session, cookie, invitation, membership, role, audit, or sensitive
  data assumptions change
