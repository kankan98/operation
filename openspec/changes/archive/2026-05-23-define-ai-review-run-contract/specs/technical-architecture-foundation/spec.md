## ADDED Requirements

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
