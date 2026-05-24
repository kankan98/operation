## Context

The project has completed Stage 1 contract work for racket products, session
capture, knowledge lifecycle, AI review runs, and Q&A answer runs. Every future
runtime workflow will handle protected team data: live notes, product facts,
pricing context, customer questions, AI outputs, prompt metadata, source review,
feedback, and downstream tasks.

The staged technical roadmap says Stage 2 must introduce authentication, team,
tenant, role, and server-side guard boundaries before Stage 3 data persistence
and later AI/RAG runtime work. This change defines that boundary without
choosing a provider or adding code.

Research and skill exploration affected the design:

- Next.js official authentication guidance reinforced that auth and
  authorization must be checked around middleware, route handlers, server
  components/actions, and data access rather than only in client UI.
- Auth.js and Vercel auth-provider guidance showed several viable provider
  directions, but also reinforced the need for `AuthPort` so the domain and data
  layers are not coupled to a provider SDK.
- OWASP authentication and session guidance influenced session state,
  invitation handling, cookie/session safety, reauthentication, and logging
  controls.
- NIST SP 800-63B influenced authenticator lifecycle, recovery, session, and
  account-state requirements.
- `roadmap-planning` kept this wave sequenced before database foundation,
  because protected records need tenant/team ownership from the start.

## Goals / Non-Goals

**Goals:**

- Define the future auth/team/tenant runtime boundary before provider or
  database implementation.
- Define tenants, teams, user profiles, provider identities, memberships,
  roles, permissions, invitations, sessions, guard decisions, and audit events.
- Preserve provider replaceability through `AuthPort` or an equivalent
  project-owned boundary.
- Make server-side tenant/team authorization a prerequisite for protected
  product, session, knowledge, AI review, Q&A, talk-track, and task records.
- Define lifecycle states and errors for login, logout, invitation, membership,
  role changes, session invalidation, and cross-tenant access.
- Define sensitive data and logging boundaries for tokens, cookies, provider
  identifiers, customer data, prompts, AI outputs, and business records.

**Non-Goals:**

- No auth provider selection or account setup.
- No SDK installation, middleware, route handler, Server Action, database
  table, migration, repository, login page, or protected UI.
- No production deployment, domain, SSL, analytics, observability, queue, or
  object storage decision.
- No final role matrix for a real business team beyond a contract baseline; the
  future runtime implementation can tighten roles with business input.

## Decisions

### Decision 1: Contract before provider

This wave defines `AuthPort` behavior, domain entities, authorization decisions,
and audit fields without choosing Clerk, Auth.js, Auth0, Descope, or a custom
session system.

Alternatives considered:

- Choose a provider immediately: faster to demo but risky without real account,
  cost, data boundary, tenant model, and rollback decisions.
- Build custom auth immediately: maximum control but too much security and
  maintenance responsibility before persistence is ready.

### Decision 2: Authorization is server-side and tenant-scoped

Every protected command/query must validate authenticated actor, tenant, team,
membership state, role, permission, and target record ownership on the server.
UI may hide controls later, but it cannot be the enforcement layer.

Alternatives considered:

- Use route-level protection only: necessary but insufficient because a user may
  be logged in and still lack access to a team, record, or action.
- Rely on client-visible team selection: unsafe because client state can drift
  or be tampered with.

### Decision 3: Membership and role history are first-class

The contract will model `TenantMembership`, `TeamMembership`, role assignment,
invitation, suspension, removal, and audit events. This preserves accountability
when a reviewer approves knowledge, an operator creates a session, or an admin
changes access.

Alternatives considered:

- Store only a `user.role` field: too weak for multi-team, future tenant
  separation, and role-history audit.
- Model a complex permission system now: overbuilt before real usage; define
  stable roles and permission checks first.

### Decision 4: Provider identity is separate from user profile

The contract separates provider account identifiers from application user
profiles and team membership. Provider metadata should be minimal and never
treated as the source of business authorization.

Alternatives considered:

- Use provider user objects directly throughout the app: convenient but couples
  domain and data layers to provider shape.
- Copy all provider profile fields into the database: unnecessary data exposure
  and migration risk.

### Decision 5: Invitation and recovery flows are part of the contract

Team access depends on controlled invitations, acceptance, expiration,
revocation, and audit. Account recovery and session invalidation must also be
represented so future protected data can be secured when users leave a team or
lose access.

Alternatives considered:

- Defer invitations until after basic login: acceptable for a single-user demo
  but wrong for the target team workflow and would force role/tenant retrofits.
- Treat deactivated users as soft UI state: unsafe because existing sessions and
  API access need server-side invalidation.

## Risks / Trade-offs

- Defining auth before provider could miss provider-specific constraints -> Keep
  provider details behind `AuthPort`; future provider OpenSpec must update the
  contract if assumptions change.
- Role model may be too broad -> Start with common roles (`operator`, `host`,
  `product_owner`, `reviewer`, `admin`) and require runtime work to test real
  permission needs.
- Contract adds documentation before visible product changes -> This is a
  required prerequisite for safely storing protected data and enabling later
  operator workflows.
- Multi-tenant concepts can be overbuilt -> Use tenant/team ownership only
  where needed for access control and audit; do not create billing or enterprise
  organization features in this wave.

## Migration Plan

1. Add `docs/contracts/auth-team-tenant.md`.
2. Update `docs/contracts/README.md`.
3. Update technical roadmap and autonomous goal/roadmap notes so auth runtime
   and protected persistence start from the contract.
4. Validate OpenSpec and markdown hygiene.
5. Archive the completed change.

Rollback is documentation-only: revert the contract and spec additions. No
runtime data, dependency, provider account, Docker image, or deployed behavior
changes.

## Open Questions

- Which auth provider, if any, should be selected when runtime implementation
  begins.
- Whether the first runtime slice should support email/password, magic link,
  OAuth, SSO, or a hosted provider flow.
- Whether tenant and team are separate business concepts for the first real
  customer, or whether tenant initially maps one-to-one with team.
- Whether reviewer/admin actions need step-up authentication for sensitive
  approvals.
- How long sessions, invitation tokens, audit logs, and inactive memberships
  should be retained.
