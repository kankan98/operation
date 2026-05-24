## ADDED Requirements

### Requirement: Auth team tenant contract gates protected architecture
The technical architecture SHALL require an `auth-team-tenant` contract before
auth provider implementation, protected routes, protected API routes, protected
Server Actions, tenant-scoped repositories, protected records, or provider SDK
adoption.

#### Scenario: Auth provider is proposed
- **WHEN** a future OpenSpec change proposes Clerk, Auth.js, Auth0, Descope,
  custom sessions, or another authentication provider
- **THEN** the design starts from `docs/contracts/auth-team-tenant.md`, compares
  alternatives with official sources, records data flow, session behavior,
  provider boundary, failure modes, security impact, rollback path, and
  verification before adopting the provider

#### Scenario: Protected record is introduced
- **WHEN** a future change introduces persistent protected products, sessions,
  knowledge, AI review runs, Q&A answers, talk tracks, next-session tasks,
  feedback, source review, or exports
- **THEN** the implementation enforces tenant/team ownership, active membership,
  role permission, and server-side authorization at the route/service/repository
  boundary before the record is saved or returned

#### Scenario: Authorization boundary is crossed
- **WHEN** UI, domain, data, AI, or integration code needs actor, tenant, team,
  role, or session information
- **THEN** it consumes a project-owned auth context or guard result rather than
  directly depending on provider SDK objects outside the auth adapter boundary
