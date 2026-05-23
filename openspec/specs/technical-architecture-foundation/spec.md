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
