# technical-blueprint Specification

## Purpose
Define the staged technical blueprint that governs future runtime work,
technology decision status, project-owned boundaries, source-backed provider
gates, stage outcomes, and verification before backend, auth, data, AI, RAG,
queue, storage, integrations, deployment, analytics, or observability are
implemented.
## Requirements
### Requirement: Technical blueprint defines staged technology decisions
The project SHALL maintain a technical blueprint that defines each runtime
stage, accepted technologies, default directions, deferred provider decisions,
stage outcomes, forbidden early work, and verification expectations before
backend, auth, data, AI, RAG, storage, queue, integration, deployment, analytics,
or observability work proceeds.

#### Scenario: Contributor selects a runtime stage
- **WHEN** a future OpenSpec change proposes runtime infrastructure or protected
  business behavior
- **THEN** the proposal identifies the matching technical blueprint stage, the
  accepted technology choices for that stage, and the stage outcome it will
  enable

#### Scenario: Technology is not locked yet
- **WHEN** the blueprint marks a provider or infrastructure choice as deferred
- **THEN** implementation waits for a source-backed OpenSpec design that
  compares alternatives, records data flow, security impact, failure modes,
  rollback path, and verification before adopting the provider

#### Scenario: Stage outcome is unclear
- **WHEN** a proposed technical task only installs packages, creates folders, or
  adds infrastructure without a clear operator or engineering outcome
- **THEN** the task is not considered implementation-ready until the outcome and
  verification are recorded

### Requirement: Technical blueprint preserves project-owned boundaries
The project SHALL define project-owned boundaries for auth, domain services,
repositories, AI providers, retrieval, source discovery, queueing, object
storage, observability, and external integrations so UI and domain code do not
depend directly on provider SDKs or infrastructure details.

#### Scenario: Provider SDK is introduced
- **WHEN** a future change introduces an auth, AI, database, queue, storage,
  source discovery, observability, deployment, or external platform SDK
- **THEN** the design wraps that SDK behind the relevant project-owned boundary
  and prevents UI/domain code from consuming provider-native objects directly

#### Scenario: Boundary is missing
- **WHEN** a future implementation cannot identify the boundary responsible for
  a provider call, transaction, prompt, retrieval, file operation, or external
  API request
- **THEN** the implementation updates the blueprint, contract, or OpenSpec
  design before writing runtime code

### Requirement: Technical blueprint includes source and skill evidence
The technical blueprint SHALL record reliable source checks and relevant
skill-backed value exploration when technology choices affect scope, risk,
security, data handling, AI behavior, verification, or future maintenance.

#### Scenario: Blueprint is updated
- **WHEN** a future change updates staged technology choices or provider gates
- **THEN** the change records the official, professional, standards-body, or
  primary sources checked and explains how those sources affected scope, risk,
  verification, or sequencing

#### Scenario: Skill exploration affects scope
- **WHEN** a relevant skill changes the technical scope, user-value framing,
  risk model, or verification approach
- **THEN** the durable conclusion is recorded in the active OpenSpec artifact or
  blueprint documentation

### Requirement: Technical blueprint governs follow-on development
Future autonomous development SHALL follow the technical blueprint before
implementing runtime code and SHALL update the blueprint first when evidence
shows the current stage guidance is wrong.

#### Scenario: Future agent starts backend or AI work
- **WHEN** a future agent starts auth, database, API, Server Action, AI, RAG,
  source discovery, queue, storage, external integration, deployment,
  observability, analytics, or protected data work
- **THEN** the agent reads the technical blueprint, checks prerequisites, and
  records whether the work follows the current stage or requires a blueprint
  update

#### Scenario: Evidence shows drift
- **WHEN** implementation, verification, source research, user feedback, or
  business review shows the blueprint conflicts with operator needs, security,
  accepted specs, or the actual codebase
- **THEN** the blueprint and affected OpenSpec artifacts are updated before the
  implementation proceeds under the new assumption

### Requirement: Stage 3 data foundation follows contract gate
The technical blueprint SHALL treat stage 3 data foundation as contract-gated
work that must define PostgreSQL, Drizzle migration, validation, repository,
tenant/team ownership, transaction, idempotency, and audit requirements before
runtime implementation.

#### Scenario: Stage 3 starts
- **WHEN** a future change begins stage 3 implementation
- **THEN** it checks `docs/contracts/data-foundation.md`, the
  `auth-team-tenant` contract, relevant workflow contracts, and accepted
  technical architecture specs before adding database runtime code

#### Scenario: Stage 3 implementation changes scope
- **WHEN** implementation evidence shows a different migration, validation,
  repository, authorization, or audit strategy is needed
- **THEN** the data foundation contract and technical blueprint are updated
  before code proceeds under the changed strategy

#### Scenario: Later stage needs stable records
- **WHEN** future AI, RAG, feedback, source discovery, queue, storage, export,
  or external integration work needs persisted business records
- **THEN** the work depends on stage 3 data foundation or explicitly updates
  the blueprint to explain why a narrower data boundary is safe

