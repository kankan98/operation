## Why

The roadmap now needs the Stage 2 boundary that allows future product,
session, knowledge, AI, RAG, feedback, and task records to be protected by real
server-side tenant/team authorization. Defining the auth/team/tenant contract
before provider or database implementation prevents the next runtime wave from
treating permissions as UI visibility or binding business logic to a vendor SDK.

Pre-proposal evidence:

- Reliable sources checked:
  - Next.js official authentication guidance
    (`https://nextjs.org/docs/app/guides/authentication`) was checked because
    the current app uses App Router and future auth must preserve the framework
    boundary between UI, middleware, route handlers, and data access.
  - Auth.js official getting-started documentation
    (`https://authjs.dev/getting-started`) was checked as a provider-neutral
    open-source option for future comparison, not as a selected dependency.
  - Vercel authentication integration guidance and vendor docs for Clerk,
    Descope, and Auth0 were reviewed through the installed `vercel:auth` skill
    to understand hosted-provider integration patterns and avoid prematurely
    hard-coding one provider.
  - OWASP Authentication Cheat Sheet
    (`https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html`)
    and Session Management Cheat Sheet
    (`https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html`)
    were checked for authentication, session, cookie, reauthentication, and
    account-lifecycle security risks.
  - NIST Digital Identity Guidelines SP 800-63B
    (`https://pages.nist.gov/800-63-4/sp800-63b.html`) was checked for
    current authentication lifecycle, authenticator, session, and recovery
    guidance.
- Relevant skills used:
  - `openspec-explore`: confirmed this should be an auth/team/tenant contract
    wave, not a runtime provider integration.
  - `roadmap-planning`: confirmed auth/team/tenant belongs before database
    persistence and protected workflow runtime, because it is a dependency for
    all later saved business data.
  - `vercel:auth`: clarified common Next.js provider integration patterns and
    reinforced keeping provider SDKs behind a project-owned boundary.
- User-value check:
  - Target roles: live operator, host/assistant, product owner, reviewer, and
    team admin.
  - Workflow improved: safely saving and reviewing product, session, knowledge,
    AI review, Q&A, talk-track, and task records without cross-team leakage.
  - Expected result: future users can work inside the right team context with
    role-appropriate actions, while sensitive live-commerce data stays isolated.
  - Product highlight: a clear team membership and permission ledger that makes
    later AI and knowledge features feel trustworthy instead of opaque.

## What Changes

- Add an `auth-team-tenant` contract draft under `docs/contracts/` that defines:
  - runtime non-implementation boundary and use case,
  - tenant, team, user profile, auth identity, membership, role, permission,
    invitation, session, auth provider account, guard decision, and audit
    entities,
  - commands, queries, request and response shapes,
  - account, membership, invitation, session, and authorization state machines,
  - error cases for unauthenticated access, forbidden roles, tenant mismatch,
    expired invitations, session invalidation, provider callback failures, and
    sensitive logging,
  - provider boundary, authorization rules, sensitive data, audit metadata, and
    verification requirements.
- Update `docs/contracts/README.md` so `auth-team-tenant` is listed as draft and
  remains runtime-not-implemented.
- Update roadmap and goal notes so future authentication, protected routes,
  team management, tenant isolation, database persistence, and AI/RAG runtime
  work starts from this contract.
- Update the staged technical roadmap so `auth-team-tenant` is treated as a
  Stage 2 prerequisite before protected records or provider adoption.
- Update OpenSpec specs so `auth-team-tenant` is a contract-first prerequisite
  before auth provider selection, middleware, protected APIs, persistent
  business data, or server-side authorization checks.
- No runtime code, UI behavior, package, database, middleware, API route,
  provider integration, Docker image, or public preview change is introduced.

## Capabilities

### New Capabilities

- `auth-team-tenant-contract`: Defines the future authentication, team, tenant,
  role, membership, invitation, session, provider boundary, server-side
  authorization, audit, sensitive data, and verification contract.

### Modified Capabilities

- `continuous-improvement-roadmap`: Adds `auth-team-tenant` as a prerequisite
  before protected persistence, AI/RAG runtime, team-scoped workflows, and
  provider adoption.
- `technical-architecture-foundation`: Adds explicit auth/team/tenant contract
  requirements before auth provider implementation, protected routes, protected
  API routes, Server Actions, repositories, or tenant-scoped records.

## Impact

- Affected documentation: `docs/contracts/auth-team-tenant.md`,
  `docs/contracts/README.md`,
  `docs/architecture/technical-implementation-roadmap.md`,
  `docs/roadmap/ai-continuous-development-goal.md`, and
  `docs/roadmap/autonomous-development-roadmap.md`.
- Affected OpenSpec specs after archive: new `auth-team-tenant-contract` and
  updated `continuous-improvement-roadmap` and
  `technical-architecture-foundation`.
- Affected runtime: none.
- Dependencies: none.
- Verification: `openspec validate define-auth-team-tenant-contract`,
  markdown hygiene checks, and `openspec validate --all`. Playwright is skipped
  because this is a contract/documentation change with no rendered UI change.
