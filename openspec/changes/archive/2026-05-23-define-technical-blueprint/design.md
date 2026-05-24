## Context

The project is currently a governed Next.js App Router workspace with static
operator flows and contract drafts for product library, session capture,
knowledge lifecycle, AI review runs, Q&A answers, and auth/team/tenant. The
next high-risk work is no longer visual layout; it is selecting runtime
infrastructure in a way that will affect every future protected workflow.

The existing roadmap already defines stages 0-9, but the user now explicitly
wants the whole technical outline discussed and fixed before continuing. This
change turns the roadmap into an execution blueprint: it locks high-confidence
technology choices, defines provider gates where premature selection would
create risk, and records what each stage must enable for operators and
engineering.

Research and skill exploration affected the design:

- Next.js official docs confirmed the current app should keep BFF/API behavior
  inside App Router conventions. Route Handlers are the reusable HTTP boundary;
  Server Actions can be used later only as thin UI mutation wrappers.
- PostgreSQL official docs and the Supabase/Postgres best-practices skill
  reinforced that tenant/team ownership, constraints, transactions, indexes,
  and security policy must be part of schema design, not later cleanup.
- Drizzle and Zod official docs support the planned combination of typed
  schema/migration management plus explicit input/output validation.
- OpenAI Responses API and structured-output docs reinforce using
  `AiProviderPort`, prompt/schema versions, structured output, and validation
  instead of UI-level model calls.
- NIST AI RMF and OWASP LLM guidance reinforce source traceability, sensitive
  data minimization, prompt injection defense, and human review for AI outputs.
- Docker official restart policy docs confirmed that long-lived preview
  containers need a restart policy such as `unless-stopped`; disposable local
  runs can continue using `--rm`.

## Goals / Non-Goals

**Goals:**

- Convert the technical roadmap into a stage-by-stage implementation blueprint.
- Classify technologies as accepted, default direction, or deferred decision.
- Define reserved ports/adapters so later provider or SDK choices do not leak
  into UI/domain/data/AI code.
- Define stage gates and forbidden early work to prevent auth, database, AI,
  RAG, queues, storage, integrations, or deployment from being introduced out
  of order.
- Make the public preview deployment resilient to server restarts when it is
  intentionally run as a long-lived Docker container.
- Update roadmap, standards, and docs so future agents know how to follow the
  blueprint before runtime work.

**Non-Goals:**

- No runtime implementation of authentication, database schema, API routes,
  Server Actions, AI provider calls, RAG, source discovery, queues, object
  storage, external platform integrations, analytics, or production hosting.
- No dependency installation.
- No final provider choice for auth, queue, object storage, production hosting,
  analytics, observability, or commerce integrations; each remains gated until
  the stage OpenSpec records alternatives, data flow, failure modes, security
  impact, rollback, and verification.
- No claim that the public preview is production infrastructure.

## Decisions

### Decision 1: Keep Next.js App Router as the Web/BFF boundary

Future UI and BFF work remains inside `apps/web` with Next.js App Router.
Route Handlers are the reusable HTTP/API boundary for future protected
commands and queries. Server Actions may be introduced later only as thin UI
mutation wrappers that call domain services or route-level use cases.

Alternatives considered:

- Add a separate backend service now: useful later if scaling or integration
  pressure proves it, but premature while the product still needs domain and
  contract validation.
- Put business logic directly in Server Actions: fast for demos, but it risks
  mixing UI, authorization, transactions, and domain rules.

### Decision 2: Lock PostgreSQL + Drizzle + Zod + repository as the data baseline

PostgreSQL remains the authoritative relational store. Drizzle manages schema
and migrations. Zod or an equivalent schema library validates API inputs,
AI outputs, and shared persisted shapes. Repository modules isolate SQL/ORM
details from UI and domain code.

Alternatives considered:

- SQLite: simpler locally, but weaker fit for multi-user tenant/team data,
  future RAG with pgvector, and production concurrency.
- Prisma: mature and productive, but the accepted roadmap already selected
  Drizzle migrations; changing now would require a separate provider/dependency
  decision.
- External vector database first: likely unnecessary before the reviewed
  knowledge corpus, retrieval filters, and evaluation set are real.

### Decision 3: Auth provider remains deferred, but the `AuthPort` boundary is fixed

Stage 2 must select an auth provider or session implementation through a
separate OpenSpec. The fixed decision now is that UI, domain, repository, AI,
and integration code consume a project-owned `AuthContext` and guard result,
not provider SDK objects.

Default direction for evaluation: prefer a Next.js-compatible solution with a
PostgreSQL adapter or durable server-side session model, because future
authorization depends on application-owned tenant/team/membership records.

Alternatives considered:

- Choose a hosted provider now: fast, but may create data residency, cost,
  vendor lock-in, or tenant-model mismatch before real account requirements are
  known.
- Build fully custom auth now: maximum control, but high security maintenance
  risk before protected data and production requirements are available.

### Decision 4: AI and RAG are staged, auditable workflows, not a generic chatbot

Stage 5 introduces AI review through `AiProviderPort`, structured outputs,
prompt/schema versions, validation, failure states, and human review. Stage 6
introduces Q&A/RAG using reviewed knowledge snapshots, PostgreSQL + pgvector,
PostgreSQL full-text search, metadata filters, and `RetrievalPort`.

Alternatives considered:

- Build Q&A before data/auth: attractive visually, but unsafe because answers
  would lack protected team context, reviewed knowledge, feedback history, and
  audit metadata.
- Allow web search directly in answers: useful later, but it must remain a
  review-only finding first so unsupported public claims do not become product
  truth.

### Decision 5: Queues, storage, observability, and production hosting stay behind ports

Stage 9 is the first normal stage for queue provider, object storage provider,
production deployment provider, analytics, and observability selection unless
an earlier OpenSpec proves a hard need. The blueprint reserves
`QueuePort`, `ObjectStoragePort`, `ObservabilityPort`, and integration ports so
domain code can be written without provider leakage.

Alternatives considered:

- Add Redis/S3/Sentry/hosted deploy now: would create running-cost and
  maintenance surface before there is real asynchronous work, file persistence,
  production traffic, or operational alerting.
- Ignore these concerns until production: risky; the blueprint records
  boundaries now without installing infrastructure.

### Decision 6: Public preview containers should use restart policy when long-lived

Local `pnpm docker:run` remains disposable. Public preview guidance changes to
long-lived named containers using Docker restart policy, such as
`--restart unless-stopped`, and host setup must ensure the Docker daemon starts
on boot.

Alternatives considered:

- Keep `--rm` for public preview: simple but the container is not suitable for
  automatic restart after a host reboot.
- Move directly to a production orchestrator: overbuilt before deployment
  provider, domain, SSL, backup, monitoring, and production requirements are
  accepted.

## Risks / Trade-offs

- Provider decisions remain deferred in some stages -> The blueprint fixes the
  project-owned boundary and requires source-backed provider comparison before
  adoption, which prevents premature lock-in while still preventing drift.
- More architecture documentation can slow visible feature delivery -> The next
  runtime stages touch protected business data and AI behavior, so this cost is
  lower than later rework or unsafe data handling.
- PostgreSQL + pgvector may not be enough for future high-scale retrieval ->
  Keep `RetrievalPort` and evaluation gates so an external vector store can be
  introduced later with a measured reason.
- Auth provider requirements may change with real customer deployment -> Keep
  `AuthPort`, app-owned membership records, and provider comparison before
  runtime implementation.
- Docker restart policy does not replace production deployment -> Mark it as
  public-preview reliability only; production hosting remains a separate
  provider decision.

## Migration Plan

1. Create OpenSpec specs for the technical blueprint and delta requirements.
2. Expand `docs/architecture/technical-implementation-roadmap.md` with:
   accepted/default/deferred technology status, boundary map, reserved ports,
   stage gates, and preview restart guidance.
3. Update goal, roadmap, engineering standards, Docker docs, and package
   metadata so future agents know how to follow the blueprint.
4. Validate OpenSpec and markdown/package hygiene.
5. Archive the completed documentation/governance change.

Rollback is documentation/tooling-only: revert the roadmap/spec/doc/script
changes. No data, provider account, dependency, migration, API, AI call, or
public runtime behavior is created by this change.

## Open Questions

- Which auth provider or session strategy best fits the first real protected
  deployment.
- Which managed PostgreSQL service, backup strategy, and connection pooling
  approach will be used when database runtime begins.
- Whether the first production deployment should stay Docker-on-server or move
  to a managed platform after domain/SSL/monitoring requirements are known.
- Which public badminton/product sources are approved by the business for the
  first source discovery allowlist.
- Which representative operator questions and session examples should form the
  first AI/RAG evaluation set.
