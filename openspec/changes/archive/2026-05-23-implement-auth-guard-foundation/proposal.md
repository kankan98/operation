## Why

The local data foundation now has tenant/team/user/membership tables, but there
is still no service-side way to resolve an actor's current team context or deny
cross-team, inactive-membership, or missing-permission access before protected
workflow persistence begins. The next smallest useful wave is a provider-neutral
authorization guard foundation that future product/session/knowledge CRUD can
reuse without binding the app to an auth provider too early.

Pre-proposal evidence:

- Reliable sources checked:
  - Next.js authentication guidance
    (`https://nextjs.org/docs/app/guides/authentication`) was checked because
    future App Router route handlers and Server Actions need authorization near
    the data access boundary rather than UI-only gating.
  - OWASP Session Management Cheat Sheet
    (`https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`)
    was checked because the runtime must not expose or log session secrets and
    should not make session identifiers carry business meaning.
  - OWASP Authorization Cheat Sheet
    (`https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html`)
    was checked because the guard should deny by default, enforce least
    privilege, and validate authorization on the server for every protected
    operation.
  - Auth.js Drizzle adapter docs
    (`https://authjs.dev/getting-started/adapters/drizzle`) were checked as a
    candidate provider path, but this wave does not adopt it because provider
    sessions, OAuth/email credentials, and adapter tables should be selected in
    a separate provider decision once the app-owned guard boundary is stable.
- Relevant skills used:
  - `openspec-explore`: confirmed this belongs in stage 2 before workflow CRUD,
    while avoiding provider SDK coupling or public UI persistence.
  - `roadmap-planning`: confirmed auth guard foundation is the next prerequisite
    after local data foundation and before product/session/knowledge save flows.
  - `superpowers:brainstorming`: compared provider-first auth, docs-only
    planning, and provider-neutral guard implementation; selected the guard
    foundation as the smallest verifiable slice.
  - `vercel:nextjs`: reinforced lazy/server-only boundaries and keeping data
    access behind App Router server surfaces.
- User-value check:
  - Target roles: live operators, hosts/assistants, product owners, reviewers,
    and team leads benefit indirectly because future saved records can be
    protected by team scope and role before real business data is stored.
  - Workflow improved: future product library, session capture, knowledge
    review, AI review, talk-track, and next-session task CRUD can share one
    authorization decision path.
  - Expected result: teams get safer save/review/recover flows, and future UI
    can display concise states such as "需要管理员权限" based on server decisions.
  - Product highlight: invisible but valuable trust foundation: every future
    workflow can fail closed with a clear, auditable reason instead of relying on
    hidden buttons or client-selected team IDs.

## What Changes

- Add a local-only, provider-neutral auth guard foundation under the web app:
  - Auth roles, permissions, errors, and safe view-model types.
  - Server-only `AuthPort`-style resolver that maps app-owned tenant/team/user
    membership rows to an `AuthContext`.
  - Authorization guard helpers that deny unauthenticated, inactive membership,
    cross-team, missing-permission, and forbidden-role access.
  - Conversion from authorized auth context to the existing data access context
    used by repositories.
  - Local verification script that seeds fixture tenant/team/user rows inside a
    rollback transaction and proves allowed and denied paths.
- Update the auth contract, roadmap, and architecture docs to mark the runtime
  surface as partially implemented while keeping login provider selection out
  of scope.
- Keep this wave non-user-facing:
  - No login page, middleware, public protected route, OAuth callback, magic
    link, password flow, invitation UI, or team management UI.
  - No Auth.js, Clerk, Auth0, Descope, email provider, or production auth
    provider is adopted.
  - No product/session/knowledge/AI/talk-track/task persistence is exposed.
  - No public Docker preview deployment is required unless later frontend
    behavior changes.

## Capabilities

### New Capabilities

- `auth-guard-foundation`: Defines the provider-neutral local authorization
  runtime foundation for resolving team-scoped auth context, enforcing role and
  permission decisions, producing safe error/view shapes, and verifying
  positive and negative authorization paths.

### Modified Capabilities

- `auth-team-tenant-contract`: Updates runtime status from contract-only to
  partially implemented local guard foundation, while keeping provider/login
  runtime, invitations, sessions, and UI out of scope.
- `continuous-improvement-roadmap`: Records auth guard foundation as the current
  prerequisite before protected workflow persistence.
- `technical-architecture-foundation`: Adds explicit requirements that protected
  data access must flow through provider-neutral server-side auth/guard
  boundaries before repositories are called.

## Impact

- Affected code: `apps/web/src/server/auth/**`, root/app package scripts, and
  local verification commands.
- Affected data: reads and verifies existing local data foundation tables for
  tenants, teams, app users, tenant memberships, team memberships, role
  permissions, audit events, and idempotency records. No new migration is
  expected in this wave unless implementation reveals a contract gap.
- Dependencies: no new runtime provider SDK or auth package. Use existing
  TypeScript, Zod, Drizzle, and PostgreSQL local runtime.
- Affected docs/specs: `docs/contracts/auth-team-tenant.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`,
  `docs/roadmap/autonomous-development-roadmap.md`, and the OpenSpec specs
  listed above.
- Verification: `openspec validate implement-auth-guard-foundation`,
  lint/typecheck/build, local auth guard verification against PostgreSQL when
  available, targeted sensitive-output checks, and no public Docker redeploy
  unless frontend behavior changes.
