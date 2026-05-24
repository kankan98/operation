## ADDED Requirements

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
