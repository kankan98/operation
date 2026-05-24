# technical-architecture-foundation Specification

## Purpose
Define the accepted technical foundation for future implementation, including the web stack, runtime portability, data architecture, AI validation boundary, security posture, auditability, and verification baseline.
## Requirements
### Requirement: Initial web stack is defined
The project SHALL use pnpm, Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui, and lucide-icon based web stack for the first application unless a future OpenSpec change replaces this decision.

#### Scenario: Application scaffold is introduced
- **WHEN** the first application code is added
- **THEN** it is placed under `apps/web` and uses the selected stack with root-level governance and OpenSpec files preserved

#### Scenario: UI primitives are selected
- **WHEN** new operational UI is implemented
- **THEN** it uses accessible component primitives and icon buttons from the selected UI stack rather than ad hoc controls or emoji icons

#### Scenario: Package manager is introduced
- **WHEN** project package metadata is added
- **THEN** pnpm is configured as the package manager and install scripts are documented for future agents

### Requirement: Runtime remains portable
The application architecture SHALL remain deployable to a standard Node.js hosting environment with PostgreSQL and S3-compatible object storage, with Vercel allowed for previews or production only when a deployment change accepts that provider.

#### Scenario: Provider-specific service is proposed
- **WHEN** a feature depends on a Vercel-only, Supabase-only, or other provider-specific service
- **THEN** the OpenSpec design records why the provider is needed, what portable boundary is used, and how rollback or replacement would work

### Requirement: PostgreSQL is the authoritative data store
The project SHALL use PostgreSQL with Drizzle ORM migrations as the authoritative relational store for users, teams, racket products, seed knowledge sources, source versions, review states, live sessions, analysis runs, talk tracks, and next-session tasks.

#### Scenario: Data model is introduced
- **WHEN** a future change adds persistent data
- **THEN** it defines Drizzle schema, migration strategy, tenant ownership, timestamps, and Zod validation for persisted records

#### Scenario: Domain record is queried
- **WHEN** the application reads protected business data
- **THEN** the query enforces tenant/team access on the server side and does not rely only on hidden UI controls

#### Scenario: Public seed knowledge is stored
- **WHEN** a future change adds seed knowledge persistence
- **THEN** it defines schemas for source registry, extracted records, source trust level, review status, published version, stale status, and reviewer audit metadata

### Requirement: Architecture boundaries are explicit
The implementation SHALL separate UI, domain, data, AI, and integration responsibilities.

#### Scenario: Feature module is implemented
- **WHEN** a feature touches rendering, persistence, AI generation, and external services
- **THEN** the implementation keeps those concerns in separate files or modules with explicit interfaces

#### Scenario: Knowledge ingestion is implemented
- **WHEN** a feature fetches, imports, normalizes, reviews, or refreshes public knowledge
- **THEN** source collection, normalization, review workflow, persistence, and operator UI are implemented as separate boundaries

#### Scenario: File grows across boundaries
- **WHEN** a file starts handling multiple architectural layers
- **THEN** the implementation splits it before the behavior is considered complete

### Requirement: AI layer validates structured output
AI features SHALL use a dedicated AI layer with versioned prompts, provider adapter calls, structured output schemas, retries or failure states, and Zod validation before rendering or saving output.

#### Scenario: AI analysis is run
- **WHEN** the system sends source input to an AI provider
- **THEN** it sends only the minimum necessary data and stores analysis metadata including source snapshot reference, prompt version, model/provider identifier, run status, and created time

#### Scenario: AI SDK is used
- **WHEN** Vercel AI SDK or another provider library is used for a model call
- **THEN** it is wrapped behind the project AI adapter instead of being called directly from UI components or data repositories

#### Scenario: AI output is malformed
- **WHEN** an AI provider returns malformed JSON, a schema mismatch, refusal, timeout, rate limit, or partial generation
- **THEN** the system records a non-success run state and shows an actionable operator-facing error without saving the output as accepted content

### Requirement: AI improvement signals are auditable
The architecture SHALL treat operator feedback, prompt revisions, evaluation
examples, and knowledge snapshot usage as auditable records rather than hidden
self-modifying behavior.

#### Scenario: Operator feedback is captured
- **WHEN** an operator accepts, edits, rejects, or regenerates an AI output
- **THEN** the system records feedback type, source analysis run, selected knowledge snapshot, prompt version, reviewer or operator identity, and timestamp where persistence is available

#### Scenario: Prompt or analysis rule changes
- **WHEN** feedback leads to a changed prompt, output schema, evaluation example, or analysis rule
- **THEN** the change is versioned and verified before it is used for future operator-facing analysis

#### Scenario: Knowledge grounding changes
- **WHEN** source refreshes or review decisions change which knowledge records are eligible for AI grounding
- **THEN** future analysis runs reference the new eligible snapshot without rewriting historical analysis metadata

### Requirement: Public knowledge ingestion is governed
Public knowledge ingestion SHALL use explicit source adapters, allowed collection methods, refresh jobs, review queues, and versioned records.

#### Scenario: Refresh job runs
- **WHEN** a scheduled or manual refresh job checks public sources
- **THEN** it records success, failure, unavailable source, changed fields, stale records, and proposed versions without leaking sensitive internal data to logs

#### Scenario: Unsupported source is requested
- **WHEN** a requested source requires prohibited scraping, login bypass, or unclear platform permission
- **THEN** the integration is blocked until a separate OpenSpec change documents an allowed method, data scope, terms, and rollback path

#### Scenario: Source-backed AI grounding is implemented
- **WHEN** AI analysis uses seeded product or operating knowledge
- **THEN** the analysis input references record IDs and selected fields instead of sending unnecessary full source pages or unrelated sensitive data

### Requirement: Sensitive data is protected
The system SHALL treat live transcripts, customer comments, operational notes, GMV, conversion data, pricing strategy, supplier details, prompts, and AI outputs as sensitive business data.

#### Scenario: Sensitive data is logged
- **WHEN** server logs, screenshots, exports, prompts, or final responses are produced
- **THEN** they avoid raw secrets, full transcripts, full prompts, customer personal data, and unnecessary business-sensitive payloads

#### Scenario: User accesses another team
- **WHEN** a user attempts to access a record owned by another team or tenant
- **THEN** the server rejects the request regardless of whether the UI hides the record

### Requirement: Verification baseline is required
Every implementation change SHALL define and run verification appropriate to the affected surface.

#### Scenario: Frontend behavior is added
- **WHEN** a future change adds or changes rendered UI
- **THEN** verification includes lint/type/build checks when available plus desktop and mobile browser checks for loading, empty, error, success, saved, disabled, and text-overflow states when relevant

#### Scenario: AI behavior is added
- **WHEN** a future change adds AI analysis behavior
- **THEN** verification covers realistic input, empty input, long input, malformed model output, provider failure, and schema validation

#### Scenario: Knowledge refresh behavior is added
- **WHEN** a future change adds public-source import or refresh behavior
- **THEN** verification covers unchanged source, changed source, unavailable source, duplicate model alias, conflicting source values, stale record display, review approval, review rejection, and rollback to a previous version

### Requirement: Interface contracts precede backend implementation
Future backend, database, AI, and integration work SHALL be preceded by a
documented interface contract when the workflow has already been shaped through
static UI or product specs.

#### Scenario: Static workbench will later persist data
- **WHEN** a static workbench is expected to later create, read, update, delete,
  analyze, import, export, or review protected records
- **THEN** the relevant future change defines a draft contract covering domain
  entities, request inputs, response outputs, state transitions, validation
  errors, authorization scope, pagination or long-input behavior, and audit
  metadata before runtime API implementation

#### Scenario: Contract is not implemented yet
- **WHEN** a contract document exists before backend implementation
- **THEN** it is clearly marked as draft or planned and SHALL NOT imply that an
  endpoint, database table, server action, AI call, search integration, or mock
  server is already available

#### Scenario: Backend implementation starts
- **WHEN** a future change implements real API routes, server actions,
  repository methods, migrations, AI calls, or external integrations
- **THEN** the implementation either follows the existing contract draft or
  updates the contract and OpenSpec design before coding against a different
  boundary

### Requirement: Contract drafts preserve architectural boundaries
Interface contracts SHALL preserve the project boundaries between UI, domain,
data, AI, and integration layers.

#### Scenario: Contract covers AI behavior
- **WHEN** a future contract describes AI analysis, Q&A, feedback learning, or
  knowledge grounding
- **THEN** it separates operator-entered facts, reviewed knowledge references,
  prompt/version metadata, model output schema, run status, feedback signals,
  and human review state

#### Scenario: Contract covers knowledge ingestion
- **WHEN** a future contract describes public source import, refresh, or review
- **THEN** it separates source collection, normalization, trust level, review
  decision, published version, stale status, and rollback behavior

### Requirement: Staged technical implementation roadmap governs runtime work
The project SHALL maintain a staged technical implementation roadmap that
defines technology choices, deferred decisions, expected outcomes, and phase
gates before future backend, auth, database, AI, RAG, queue, storage,
integration, deployment, or observability work proceeds.

#### Scenario: Future runtime stage is selected
- **WHEN** a future OpenSpec change proposes auth, persistence, API routes,
  Server Actions, AI provider calls, RAG, queues, object storage, external
  integrations, deployment infrastructure, analytics, or observability
- **THEN** the agent checks the staged technical roadmap and either follows the
  relevant phase guidance or updates it before implementation if evidence shows
  the guidance is wrong

#### Scenario: Technology is accepted for a stage
- **WHEN** a stage has an accepted technology choice such as Next.js App Router,
  Route Handlers, PostgreSQL, Drizzle migrations, pgvector, or an
  `AiProviderPort`-wrapped provider
- **THEN** future work uses that technology boundary unless a new OpenSpec
  change records the reason, alternatives, risks, rollback path, and
  verification for changing it

#### Scenario: Technology is not yet selected
- **WHEN** a future stage needs a provider that is still deferred, such as auth,
  queue, object storage, analytics, observability, production hosting, or an
  external commerce platform
- **THEN** the implementation MUST create or update an OpenSpec design with
  source-backed provider comparison, data flow, failure modes, security impact,
  rollback path, and verification before adopting that provider

#### Scenario: Stage outcome is evaluated
- **WHEN** a technical phase is implemented
- **THEN** completion evidence includes the operator or engineering outcome the
  phase enables, not only installed packages or created directories

#### Scenario: Future agent finds drift
- **WHEN** implementation evidence shows the staged roadmap conflicts with
  business needs, user expectations, accepted specs, security requirements, or
  the actual codebase
- **THEN** the agent updates the roadmap and affected OpenSpec artifacts before
  coding against a different architecture

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

### Requirement: Technical blueprint classifies technology decisions
The technical architecture SHALL classify future stage technologies as
accepted, default direction, or deferred decision, and each classification SHALL
define whether implementation may proceed or must first create a provider
comparison OpenSpec.

#### Scenario: Accepted technology is used
- **WHEN** a future stage uses an accepted technology such as Next.js App
  Router, Route Handlers, PostgreSQL, Drizzle migrations, Zod validation,
  repository layer, `AiProviderPort`, PostgreSQL full-text search, or pgvector
- **THEN** the implementation follows the accepted boundary unless a new
  OpenSpec change records why the technology should change

#### Scenario: Deferred provider is needed
- **WHEN** a future stage needs auth provider, managed PostgreSQL hosting,
  queue, object storage, production hosting, analytics, observability, source
  discovery vendor, or external commerce platform
- **THEN** the design compares providers with reliable sources before adding
  runtime code, dependencies, accounts, credentials, or deployment assumptions

### Requirement: Reserved ports gate infrastructure SDK usage
The technical architecture SHALL reserve project-owned ports or adapter
boundaries for provider-backed capabilities before runtime SDKs are adopted.

#### Scenario: Runtime infrastructure is introduced
- **WHEN** a future change introduces auth, AI, retrieval, source discovery,
  queueing, object storage, observability, or commerce platform infrastructure
- **THEN** the implementation exposes project-owned interfaces such as
  `AuthPort`, `AiProviderPort`, `RetrievalPort`, `SourceDiscoveryPort`,
  `QueuePort`, `ObjectStoragePort`, `ObservabilityPort`, or an equivalent
  boundary before provider-specific code is called by application modules

#### Scenario: UI attempts direct provider access
- **WHEN** UI or page code needs data, AI output, retrieval results, source
  discovery, files, queues, or external platform data
- **THEN** it calls application-owned actions, route handlers, services, or view
  models rather than provider SDKs, SQL clients, vector clients, or LLM APIs
  directly

### Requirement: Runtime work has stage gate evidence
The technical architecture SHALL require stage gate evidence before future
runtime work is considered implementation-ready.

#### Scenario: Stage gate is checked
- **WHEN** a future change proposes runtime code
- **THEN** its design records stage number, prerequisite contracts, selected
  technology or deferred-provider decision, boundary ownership, sensitive data
  handling, rollback path, and verification commands

#### Scenario: Runtime work crosses stages
- **WHEN** a future change intentionally pulls work from a later stage into an
  earlier stage
- **THEN** the design records why the order is changing, what risk is bypassed,
  how rollback works, and how verification will prove the boundary remains safe

### Requirement: Data foundation contract gates database architecture
The technical architecture SHALL require a `data-foundation` contract before
PostgreSQL services, Drizzle schema, migrations, repositories, protected
persistent records, API persistence, or Server Action persistence are
implemented.

#### Scenario: Database schema is proposed
- **WHEN** a future OpenSpec change proposes Drizzle schema, database
  migrations, PostgreSQL extensions, indexes, constraints, or persistent
  domain tables
- **THEN** the design starts from `docs/contracts/data-foundation.md`, records
  tenant/team ownership, validation, migration, transaction, audit, rollback,
  and verification requirements before adding runtime code

#### Scenario: Repository boundary is proposed
- **WHEN** a future change proposes repository methods for protected business
  data
- **THEN** the implementation receives project-owned auth context and validated
  input, enforces tenant/team scope server-side, and hides SQL/ORM details from
  UI and domain rendering code

#### Scenario: Database dependency is introduced
- **WHEN** a future change installs Drizzle, Zod, PostgreSQL drivers, migration
  tools, or related database dependencies
- **THEN** the OpenSpec design records dependency rationale, alternatives,
  maintenance and license risk, runtime impact, failure modes, rollback path,
  and verification commands

### Requirement: Talk track asset contract gates talk-track architecture
The technical architecture SHALL require a `talk-track-asset` contract before
talk-track persistence, versioned talk-track records, AI-generated talk-track
publishing, Q&A/RAG grounding from talk tracks, or feedback learning from
talk-track usage is implemented.

#### Scenario: Talk-track runtime is proposed
- **WHEN** a future OpenSpec change proposes talk-track APIs, repositories,
  database tables, Server Actions, AI downstream creation, Q&A grounding, or
  feedback records
- **THEN** the design starts from `docs/contracts/talk-track-asset.md`, records
  source grounding, versioning, review state, authorization, sensitive data,
  audit, rollback, and verification before adding runtime code

#### Scenario: AI output is reused as talk track
- **WHEN** a future AI review output is proposed for reuse as a talk-track
  asset
- **THEN** the implementation treats it as a draft candidate until a human
  review decision creates or updates an approved talk-track version

### Requirement: Next-session task contract gates task architecture
The technical architecture SHALL require a `next-session-task` contract before
next-session task persistence, task repositories, task APIs, Server Actions,
AI-generated task creation, task feedback learning, task exports, or task
reporting is implemented.

#### Scenario: Next-session task runtime is proposed
- **WHEN** a future OpenSpec change proposes task APIs, repositories, database
  tables, Server Actions, AI downstream creation, checklist records,
  dependencies, exports, reporting, or feedback records
- **THEN** the design starts from `docs/contracts/next-session-task.md`,
  records source provenance, ownership, state transitions, authorization,
  sensitive data, audit, rollback, and verification before adding runtime code

#### Scenario: AI output is reused as a task
- **WHEN** a future AI review output is proposed for reuse as a next-session
  task
- **THEN** the implementation treats it as a downstream candidate until source
  readiness, validation, authorization, duplicate detection, and acceptance
  rules create or update an owned task record

### Requirement: Data foundation runtime uses server-only database boundaries
The technical architecture SHALL require local data foundation runtime code to
keep Drizzle, PostgreSQL drivers, migrations, and repository helpers behind
server-only application modules instead of exposing database clients to UI,
page, component, AI, or integration layers.

#### Scenario: Database dependency is added
- **WHEN** `drizzle-orm`, Drizzle tooling, a PostgreSQL driver, Zod, or related
  local data verification tooling is added
- **THEN** the dependency is used only through app-owned server/data modules,
  scripts, or generated migrations and is documented with failure modes,
  rollback, and verification

#### Scenario: Component imports database module
- **WHEN** a UI component, route page, client module, AI module, or integration
  module tries to import the database client, migration utilities, or Drizzle
  schema directly
- **THEN** the implementation is not architecture-complete until the access is
  moved behind a route handler, thin Server Action, domain service, repository,
  or view-model boundary

### Requirement: Data foundation runtime does not imply production database adoption
The technical architecture SHALL keep production database provider, connection
pooling provider, backup, observability, queue, object storage, and deployment
decisions deferred until separate source-backed OpenSpec changes accept them.

#### Scenario: Local runtime exists
- **WHEN** local PostgreSQL schema, migrations, and repository primitives are
  implemented
- **THEN** the architecture still treats managed PostgreSQL hosting,
  production credentials, backups, monitoring, and public preview data
  persistence as not implemented until a later OpenSpec change defines them

### Requirement: Protected access uses provider-neutral auth guard boundaries
The technical architecture SHALL require protected route handlers, Server
Actions, domain services, and repositories to receive authorization only through
project-owned auth guard boundaries instead of depending directly on provider
SDK shapes or client-selected team state.

#### Scenario: Protected repository command is added
- **WHEN** a future protected repository command or query is introduced for a
  workflow record
- **THEN** it SHALL receive tenant/team/actor context only after the
  provider-neutral auth guard has resolved and authorized the actor's
  membership, role, permission, and target scope

#### Scenario: Provider SDK is introduced
- **WHEN** a future auth provider SDK is added
- **THEN** provider user, account, token, callback, and session details SHALL be
  mapped behind `AuthPort` or an equivalent project-owned adapter before domain,
  repository, AI, RAG, or integration layers can use authorization state

### Requirement: Auth guard foundation does not imply provider adoption
The technical architecture SHALL keep auth provider, login method, cookie/session
strategy, invitation delivery, step-up auth provider, production credentials,
and hosted identity decisions deferred until separate source-backed OpenSpec
changes accept them.

#### Scenario: Local guard runtime exists
- **WHEN** provider-neutral auth context, guard helpers, and local verification
  are implemented
- **THEN** the architecture still treats real login, middleware, provider
  callbacks, hosted auth, production secrets, and invitation delivery as not
  implemented until a later OpenSpec change defines them
