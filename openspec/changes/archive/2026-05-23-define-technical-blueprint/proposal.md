## Why

The user needs the project to settle a full technical blueprint before more
runtime work begins, so later auth, database, AI, RAG, deployment, and
integration choices do not drift into rework. The current staged roadmap is a
good start, but it needs a stricter execution baseline: stage-by-stage
technology choices, reserved boundaries, deferred-provider gates, verification
expectations, and public-preview restart guidance.

Pre-proposal evidence:

- Reliable sources checked:
  - Next.js official Backend for Frontend, Route Handlers, Server Actions, and
    authentication guidance (`https://nextjs.org/docs/app`) was checked because
    the current app is Next.js App Router and future API/BFF/auth boundaries
    must preserve framework conventions.
  - PostgreSQL official documentation for row-level security, transactions,
    constraints, indexes, and full-text search (`https://www.postgresql.org/docs/current/`)
    was checked because PostgreSQL is already accepted as the authoritative
    store and future protected records require tenant/team isolation.
  - Drizzle ORM official docs for schema and migrations
    (`https://orm.drizzle.team/docs`) were checked because future schema changes
    must be migration-managed instead of inferred from UI state.
  - Zod official docs (`https://zod.dev/`) were checked because future API,
    repository, and AI output boundaries need explicit TypeScript-compatible
    schema validation.
  - pgvector official project docs (`https://github.com/pgvector/pgvector`) were
    checked because the RAG MVP is planned on PostgreSQL + pgvector before any
    external vector database.
  - OpenAI platform docs for Responses API and structured outputs
    (`https://platform.openai.com/docs`) were checked because AI review and Q&A
    must use provider adapters, structured outputs, and validation.
  - NIST AI Risk Management Framework (`https://www.nist.gov/itl/ai-risk-management-framework`)
    and OWASP Top 10 for LLM Applications (`https://owasp.org/www-project-top-10-for-large-language-model-applications/`)
    were checked to keep AI, prompt, sensitive data, and source-grounded answer
    risks explicit.
  - Docker official restart policy documentation
    (`https://docs.docker.com/engine/containers/start-containers-automatically/`)
    was checked because the public preview should survive server restarts when
    intentionally run as a long-lived preview container.
- Relevant skills used:
  - `openspec-explore`: confirmed this is an architecture/specification wave,
    not a runtime implementation wave.
  - `openspec-propose`: used to create a governed OpenSpec change before
    touching technical governance files.
  - `roadmap-planning`: confirmed the right sequencing is stage gates and
    enabling platform work before real AI/RAG runtime.
  - `build-web-apps:supabase-postgres-best-practices`: reinforced that future
    PostgreSQL work should plan indexes, tenant filtering, connection and RLS
    risks before query-heavy implementation.
  - `ai-shaped-readiness-advisor` and `context-engineering-advisor`: reinforced
    that this product needs a durable reality/context layer and auditable agent
    loops, not one-off prompts or unbounded context stuffing.
- User-value check:
  - Target roles: live operator, host/assistant, product owner, reviewer, team
    lead, and future admin.
  - Workflow improved: future saved products, sessions, knowledge, AI review,
    Q&A, talk tracks, and next-session tasks can be implemented in the right
    order without leaking team data or making AI output untraceable.
  - Expected result: users get a trustworthy operations workspace that can grow
    from static planning to real team usage without redoing data, auth, or AI
    boundaries.
  - Product highlight: a clear staged technical spine that lets future AI
    features cite reviewed knowledge, show uncertainty, learn from feedback,
    and remain safe instead of becoming a generic chatbot.

## What Changes

- Add an execution-focused technical blueprint layer to the staged roadmap:
  accepted choices, default directions, deferred provider gates, stage outcomes,
  forbidden early work, and verification per stage.
- Add an explicit boundary map for UI, BFF/API, domain, auth, data, AI,
  retrieval, source discovery, storage, queue, observability, and external
  integrations.
- Define reserved project-owned ports/adapters so future implementations do not
  bind UI/domain code directly to provider SDKs.
- Update the roadmap and engineering standards so future runtime work must
  identify its stage, prerequisites, provider decision state, and verification
  before coding.
- Add Docker public-preview restart guidance using Docker restart policy for
  long-lived preview containers, while keeping local `docker:run` disposable.
- No database, auth provider, AI provider call, RAG index, queue, object
  storage, external platform integration, production hosting provider, or
  analytics runtime is introduced.

## Capabilities

### New Capabilities

- `technical-blueprint`: Governs the staged technical blueprint, source-backed
  technology decisions, reserved architecture boundaries, provider decision
  gates, stage outcomes, and future implementation compliance checks.

### Modified Capabilities

- `technical-architecture-foundation`: Strengthens the accepted staged roadmap
  requirement into an execution blueprint with explicit stage gates, reserved
  ports, and deferred-provider decision rules.
- `continuous-improvement-roadmap`: Requires future autonomous waves to follow
  the technical blueprint before runtime work and to update it when evidence
  shows drift.
- `docker-deployment`: Adds public-preview restart policy guidance so the
  server preview can restart after host or Docker daemon restarts when it is
  intentionally run as a long-lived container.

## Impact

- Affected documentation:
  - `docs/architecture/technical-implementation-roadmap.md`
  - `docs/roadmap/ai-continuous-development-goal.md`
  - `docs/roadmap/autonomous-development-roadmap.md`
  - `docs/engineering/code-architecture-standards.md`
  - `apps/web/README.md`
- Affected package metadata: root `package.json` may add a long-lived preview
  helper script without changing local disposable Docker behavior.
- Affected OpenSpec specs after archive: new `technical-blueprint`, updated
  `technical-architecture-foundation`, `continuous-improvement-roadmap`, and
  `docker-deployment`.
- Affected runtime: none unless a future agent explicitly runs the documented
  Docker preview command.
- Dependencies: none.
- Verification: `openspec validate define-technical-blueprint`, markdown
  hygiene checks, package JSON parse check, and `openspec validate --all`.
  Playwright is skipped because this is architecture/documentation/tooling
  guidance with no rendered UI change.
