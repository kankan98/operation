## ADDED Requirements

### Requirement: Auth team tenant contract records public trial auth foundation status
The auth team tenant contract SHALL be updated when public trial route protection and trial entry are implemented so future agents can distinguish internal V0 bootstrap, public trial access, and later production auth provider work.

#### Scenario: Public trial auth foundation is implemented
- **WHEN** the project adds a public trial entry route, protected workspace route gate, team context status, and route-decision verification over the existing app-owned auth runtime
- **THEN** `docs/contracts/auth-team-tenant.md` SHALL record the implemented public trial surface, route protection boundary, safe session behavior, remaining provider-login exclusions, and verification commands

#### Scenario: Future production auth provider work is proposed
- **WHEN** a future change proposes Auth.js, OAuth, magic link, password login, hosted identity provider, invitation acceptance, team administration, production HTTPS rollout, or real sensitive data entry
- **THEN** the agent SHALL start from the updated auth contract and verify whether public trial access is sufficient or whether provider, session lifecycle, CSRF/origin, invitation, team switching, role, audit, backup, observability, or sensitive data assumptions must change

### Requirement: Route-level protection is not authoritative authorization
The auth team tenant contract SHALL require any public trial route gate or middleware to be treated as an optimistic access gate while server-side tenant/team authorization remains authoritative.

#### Scenario: Protected page route is allowed by route gate
- **WHEN** a protected workspace page request has the app-owned session cookie and passes the route-level gate
- **THEN** protected business data SHALL still require existing server Route Handler, session resolver, permission, membership, tenant/team, and record-ownership checks before it is returned

#### Scenario: Route gate lacks database context
- **WHEN** middleware or another lightweight route gate cannot validate membership state, role, session expiry, or tenant/team ownership from the database
- **THEN** it SHALL only decide whether to redirect to trial entry and SHALL NOT be documented or implemented as the final authorization layer
