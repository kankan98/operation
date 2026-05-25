# continuous-improvement-roadmap Specification

## Purpose
Define the continuous autonomous iteration model, Now/Next/Later roadmap,
research and dependency guardrails, UX usefulness checks, public preview
expectations, and staged Q&A agent learning path for future project development.
## Requirements
### Requirement: Autonomous iteration follows a governed loop
The project SHALL use a repeatable autonomous iteration loop for future
development: observe current gaps, research unclear topics, update OpenSpec,
implement scoped changes, verify behavior, update public preview when relevant,
and fold learnings back into the roadmap.

#### Scenario: Future agent starts a development wave
- **WHEN** a future agent begins non-trivial product, frontend, AI, data, or
  integration work
- **THEN** the agent identifies the target operator workflow, relevant accepted
  specs, missing knowledge, implementation scope, verification plan, and public
  preview impact before changing production code

#### Scenario: Agent discovers a new gap while working
- **WHEN** implementation or verification reveals a missing route, unclear user
  need, weak UX state, stale documentation, missing test case, or architecture
  risk
- **THEN** the agent records it in the active OpenSpec artifacts or roadmap
  document instead of leaving hidden assumptions in code

#### Scenario: Work completes
- **WHEN** an implementation wave is complete
- **THEN** the agent verifies the affected surface, updates docs/specs/tasks,
  updates the public container when applicable, and reports remaining risks or
  next roadmap candidates

### Requirement: Roadmap is organized as Now Next Later
The project SHALL maintain a Now/Next/Later roadmap that sequences product
capabilities by operator value, dependency order, and implementation risk.

#### Scenario: Roadmap is read
- **WHEN** an agent or contributor looks for the current development route
- **THEN** the roadmap shows current routes, accepted standards, implemented
  slices, next coherent capabilities, later infrastructure and integrations, and
  explicit out-of-scope work

#### Scenario: Roadmap changes
- **WHEN** new information, verification results, or user feedback changes the
  right sequence
- **THEN** a future OpenSpec change updates the roadmap before work proceeds
  under the new assumption

### Requirement: Research improves decisions without bypassing review
The project SHALL allow agents to use current public research, official
documentation, market references, domain sources, and installed skills to reduce
uncertainty while keeping reusable product knowledge reviewable.

#### Scenario: Topic is unclear or time-sensitive
- **WHEN** an agent is unsure about a domain fact, product benchmark, library
  behavior, legal/platform rule, market practice, or current technical guidance
- **THEN** the agent researches reliable sources, prefers primary or official
  documentation where possible, records the decision basis in the relevant
  artifact, and avoids presenting unsupported claims as product truth

#### Scenario: Research produces reusable knowledge
- **WHEN** a researched fact or source should improve future AI answers, talk
  tracks, product explanations, or operations analysis
- **THEN** it is routed through the knowledge lifecycle with source metadata,
  retrieval time, trust level, review status, versioning, and refresh policy
  before it can ground future answers

### Requirement: UX usefulness is a recurring quality gate
Each roadmap wave SHALL evaluate whether the product helps Chinese badminton
racket live-commerce operators prepare sessions, answer questions, improve
talk tracks, review performance, and plan next actions.

#### Scenario: UI or workflow is added
- **WHEN** a future change adds a page, component, form, dashboard, or agent
  interaction
- **THEN** the design and verification cover operator-facing Chinese labels,
  loading/empty/error/success/disabled states, mobile and desktop readability,
  accessibility, and whether the workflow reduces real operator effort

#### Scenario: AI capability is added
- **WHEN** a future change adds AI analysis, Q&A, recommendation, or knowledge
  learning behavior
- **THEN** verification includes representative operator questions or session
  inputs, source traceability, human review paths, feedback capture, and failure
  states for insufficient knowledge or provider errors

### Requirement: Q&A agent is delivered in sequenced stages
The future Q&A agent SHALL be implemented through separate governed stages that
move from reviewed knowledge answers to feedback learning and permitted web
source discovery.

#### Scenario: First Q&A stage is planned
- **WHEN** the first Q&A agent implementation is proposed
- **THEN** it answers only from reviewed knowledge and operator-approved team
  knowledge, labels AI reasoning clearly, and avoids web search or autonomous
  knowledge publishing unless separately specified

#### Scenario: Feedback stage is planned
- **WHEN** thumbs-up, thumbs-down, edit, or reason feedback is added
- **THEN** feedback is stored as an auditable quality signal for answer
  evaluation, missing-knowledge detection, prompt improvement, and review
  prioritization

#### Scenario: Web discovery stage is planned
- **WHEN** the agent is allowed to search public web sources for missing or
  stale knowledge
- **THEN** the change defines allowed source types, citation display, source
  quality rules, failure states, review flow, and how findings become reusable
  knowledge only after approval

### Requirement: Roadmap includes contract-first transition stage
The autonomous development roadmap SHALL include an interface-contract stage
between static UI exploration and real backend/database/AI implementation.

#### Scenario: Static route becomes implementation candidate
- **WHEN** a static route or workbench is selected for real persistence,
  backend behavior, AI calls, source import, or integration
- **THEN** the roadmap or active OpenSpec change identifies the required
  contract draft before implementation begins

#### Scenario: Contract draft is completed
- **WHEN** a contract draft is written for a workflow
- **THEN** it identifies current implementation status, future runtime boundary,
  domain entities, state machine, error cases, authorization scope, data
  sensitivity, and verification needs

#### Scenario: Roadmap wave is sequenced
- **WHEN** Now/Next/Later waves are updated
- **THEN** contract drafting is sequenced before database schema, API routes,
  server actions, AI provider calls, or external platform integrations for the
  same workflow

### Requirement: Roadmap is coordinated with the continuous goal
The autonomous development roadmap SHALL reference the AI continuous
development goal as the durable objective that explains why and how future
self-directed work is selected.

#### Scenario: Roadmap is used for continuation
- **WHEN** an agent uses the roadmap to choose a next development wave
- **THEN** it cross-checks the goal document for target users, user-value
  expectations, research policy, collaboration needs, and completion evidence

#### Scenario: Roadmap receives a new durable gap
- **WHEN** implementation, verification, research, or user feedback reveals a
  durable product gap, risk, or sequencing change
- **THEN** the roadmap and goal document are updated together when both are
  affected, preserving OpenSpec-first workflow for non-trivial changes

### Requirement: Racket product contract precedes product persistence
The autonomous development roadmap SHALL treat the racket product library
contract as a prerequisite for future product-library database, API, and
AI-grounding implementation.

#### Scenario: Product library implementation is selected
- **WHEN** a future roadmap wave selects product-library persistence,
  source import, alias merge, or AI grounding
- **THEN** the wave starts from the racket product library contract and updates
  it if schema, API, authorization, state, or verification assumptions change

### Requirement: Session capture contract precedes session persistence
The autonomous development roadmap SHALL treat the session capture contract as
a prerequisite for future live-session draft saving, transcript import,
structured question capture, AI review input, and next-action handoff.

#### Scenario: Session capture implementation is selected
- **WHEN** a future roadmap wave selects session persistence, autosave,
  transcript import, customer-question structuring, AI review input, or task
  handoff
- **THEN** the wave starts from the session capture contract and updates it if
  schema, API, authorization, input limits, state, or verification assumptions
  change

### Requirement: Knowledge lifecycle contract precedes knowledge persistence
The autonomous development roadmap SHALL treat the knowledge lifecycle contract
as a prerequisite for future source registration, review workflow, refresh
jobs, conflict handling, RAG indexing, Q&A grounding, and feedback learning.

#### Scenario: Knowledge implementation is selected
- **WHEN** a future roadmap wave selects knowledge persistence, public source
  import, review queue, refresh task, conflict resolution, RAG snapshot, Q&A
  grounding, or feedback learning
- **THEN** the wave starts from the knowledge lifecycle contract and updates it
  if schema, API, authorization, source trust, state, or verification
  assumptions change

### Requirement: AI review run contract precedes AI review runtime
The autonomous development roadmap SHALL treat the AI review run contract as a
prerequisite for future AI review provider calls, prompt execution, structured
output persistence, human review decisions, feedback learning, talk-track
handoff, short-video topic generation, and next-session task creation.

#### Scenario: AI review runtime implementation is selected
- **WHEN** a future roadmap wave selects real AI review generation, persistence,
  provider integration, prompt execution, review queues, feedback capture, or
  downstream artifact creation
- **THEN** the wave starts from the AI review run contract and updates it if
  schema, prompt version, provider metadata, state, authorization, sensitive
  data, or verification assumptions change

#### Scenario: AI review contract is completed
- **WHEN** the AI review run contract draft is written
- **THEN** the roadmap treats it as the governing input for the next AI review
  MVP rather than allowing UI components to call a provider or persist AI output
  directly

### Requirement: Q&A answer contract precedes Q&A runtime
The autonomous development roadmap SHALL treat the `qa-agent-answer` contract
as a prerequisite for future Q&A Agent provider calls, RAG retrieval, answer
persistence, feedback learning, missing-knowledge routing, web discovery, and
knowledge lifecycle integration.

#### Scenario: Q&A runtime implementation is selected
- **WHEN** a future roadmap wave selects real Q&A answer generation, retrieval,
  persistence, feedback capture, web discovery, evaluation, or source review
- **THEN** the wave starts from `docs/contracts/qa-agent-answer.md` and updates
  it if schema, prompt version, provider metadata, retrieval snapshot,
  authorization, sensitive data, feedback, discovery, or verification
  assumptions change

#### Scenario: Q&A contract is completed
- **WHEN** the Q&A answer contract draft is written
- **THEN** the roadmap treats it as the governing input for the later Q&A Agent
  runtime rather than allowing UI components to call providers, vector stores,
  databases, or public search directly

#### Scenario: Q&A roadmap is sequenced
- **WHEN** the roadmap orders future Q&A work
- **THEN** reviewed-knowledge-only answers, feedback capture,
  missing-knowledge detection, web discovery review-only findings, knowledge
  lifecycle promotion, and evaluation are sequenced as governed stages rather
  than one autonomous self-learning release

### Requirement: Auth team tenant contract precedes protected runtime
The autonomous development roadmap SHALL treat the `auth-team-tenant` contract
as a prerequisite for future authentication provider adoption, protected
routes, protected API routes, protected Server Actions, tenant-scoped
repositories, team management, role checks, and persistent protected business
records.

#### Scenario: Auth runtime implementation is selected
- **WHEN** a future roadmap wave selects login, logout, provider SDK,
  middleware, team membership, invitations, RBAC, protected route handlers,
  server actions, repositories, AI/RAG runs, or exports
- **THEN** the wave starts from `docs/contracts/auth-team-tenant.md` and updates
  it if provider, schema, role, session, invitation, authorization, sensitive
  data, audit, or verification assumptions change

#### Scenario: Protected data implementation is selected
- **WHEN** a future roadmap wave selects product, session, knowledge, AI
  review, Q&A, talk-track, task, source, feedback, or export persistence
- **THEN** it verifies that tenant/team authorization requirements from the
  auth team tenant contract are satisfied before saving or returning protected
  business records

#### Scenario: Roadmap is sequenced
- **WHEN** the roadmap orders future runtime work
- **THEN** authentication, team membership, tenant ownership, role checks, and
  audit are sequenced before database-backed protected workflows and later
  AI/RAG runtime behavior

### Requirement: Autonomous runtime waves follow the technical blueprint
The autonomous development roadmap SHALL require future backend, auth,
database, AI, RAG, source discovery, queue, storage, external integration,
deployment, analytics, observability, or protected-data waves to begin from the
technical blueprint before implementation.

#### Scenario: Runtime wave is selected
- **WHEN** an agent selects a future runtime wave
- **THEN** the agent identifies the technical blueprint stage, prerequisite
  contracts, target operator workflow, expected user or engineering outcome,
  reliable source checks, relevant skill exploration, and verification plan
  before changing runtime code

#### Scenario: Roadmap sequence changes
- **WHEN** user feedback, implementation evidence, verification results, or
  source research shows the current roadmap sequence conflicts with the
  technical blueprint or operator value
- **THEN** the roadmap and blueprint are updated together through OpenSpec
  before the wave proceeds

### Requirement: Data foundation follows technical blueprint sequencing
The autonomous development roadmap SHALL treat data foundation work as the next
runtime-enabling wave only after auth/team/tenant contract boundaries and the
technical blueprint have been checked.

#### Scenario: Data foundation implementation is proposed
- **WHEN** a future change proposes PostgreSQL schema, Drizzle migrations,
  Zod validation, repositories, transactions, audit fields, or tenant/team
  ownership
- **THEN** the design starts from the technical blueprint, the auth/team/tenant
  contract, and the relevant workflow contracts before creating database code

#### Scenario: Data foundation tries to skip authorization scope
- **WHEN** a future data model omits tenant/team ownership, actor audit fields,
  repository boundaries, or authorization assumptions for protected records
- **THEN** the change is not implementation-ready until those requirements are
  added or the blueprint explicitly explains why the record is public

### Requirement: Data foundation contract precedes database runtime
The autonomous development roadmap SHALL treat the `data-foundation` contract
as a prerequisite before future PostgreSQL services, Drizzle schema,
migrations, repositories, tenant-scoped persistence, API persistence, or
Server Action persistence.

#### Scenario: Database runtime wave is selected
- **WHEN** a future roadmap wave selects persistent products, sessions,
  knowledge, AI review runs, Q&A answers, talk tracks, next-session tasks,
  feedback, exports, source reviews, or audit records
- **THEN** the wave starts from `docs/contracts/data-foundation.md`,
  `docs/contracts/auth-team-tenant.md`, the technical blueprint, and the
  relevant workflow contract before creating runtime database code

#### Scenario: Roadmap orders persistence
- **WHEN** the roadmap orders future runtime work
- **THEN** data foundation is sequenced before workflow persistence, AI/RAG
  runtime, feedback learning, exports, and external integrations that need
  stable protected record IDs

### Requirement: Talk track asset contract precedes talk-track runtime
The autonomous development roadmap SHALL treat the `talk-track-asset` contract
as a prerequisite before future talk-track persistence, AI review downstream
publishing, Q&A grounding, feedback learning, short-video reuse, or talk-track
review workflows.

#### Scenario: Talk-track implementation is selected
- **WHEN** a future roadmap wave selects talk-track create, edit, review,
  publish, versioning, search, AI downstream creation, Q&A grounding, or
  feedback learning
- **THEN** the wave starts from `docs/contracts/talk-track-asset.md`,
  `docs/contracts/ai-review-run.md`, `docs/contracts/data-foundation.md`, and
  the relevant product/session/knowledge contracts before runtime code

#### Scenario: Roadmap orders talk-track work
- **WHEN** the roadmap orders future AI review, Q&A, feedback, or short-video
  reuse work
- **THEN** talk-track assets are sequenced as reviewed downstream assets rather
  than letting AI-generated suggestions become reusable selling scripts
  directly

### Requirement: Next-session task contract precedes task runtime
The autonomous development roadmap SHALL treat the `next-session-task` contract
as a prerequisite before future next-session task persistence, AI review
downstream creation, session follow-up planning, reviewer closure, feedback
learning, task reporting, export, or notification workflows.

#### Scenario: Next-session task implementation is selected
- **WHEN** a future roadmap wave selects task create, assign, checklist,
  complete, block, review, archive, search, AI downstream creation, feedback
  learning, report, export, or notification work
- **THEN** the wave starts from `docs/contracts/next-session-task.md`,
  `docs/contracts/ai-review-run.md`, `docs/contracts/session-capture.md`,
  `docs/contracts/data-foundation.md`, and the relevant product, knowledge, and
  talk-track contracts before runtime code

#### Scenario: Roadmap orders next-session work
- **WHEN** the roadmap orders future AI review, session follow-up, talk-track
  reuse, knowledge-gap handling, Q&A, feedback, or reporting work
- **THEN** next-session tasks are sequenced as owned operational records rather
  than letting AI-generated recommendations become unassigned team obligations
  directly

### Requirement: Data foundation runtime precedes workflow persistence
The autonomous development roadmap SHALL treat local stage-3 data foundation
runtime as the current prerequisite before product, session, knowledge, AI
review, Q&A, talk-track, next-session task, feedback, export, source-review, or
RAG persistence work proceeds.

#### Scenario: Workflow persistence is selected
- **WHEN** a future roadmap wave selects persistent product, session,
  knowledge, AI review, Q&A, talk-track, next-session task, feedback, export,
  source-review, or RAG snapshot work
- **THEN** the wave starts from the implemented data foundation runtime, the
  data foundation contract, the auth/team/tenant contract, and the relevant
  workflow contract before adding database tables or repository methods

#### Scenario: Roadmap is reviewed after this wave
- **WHEN** this local data foundation runtime is completed and verified
- **THEN** the roadmap marks stage-3 data foundation as partially implemented
  and keeps auth runtime, protected workflow CRUD, AI runtime, Q&A runtime, and
  production database provider selection as separate later OpenSpec work

### Requirement: Auth guard foundation precedes protected workflow persistence
The autonomous development roadmap SHALL treat provider-neutral auth guard
foundation as the current prerequisite before product, session, knowledge, AI
review, Q&A, talk-track, next-session task, feedback, export, source-review, or
RAG persistence work proceeds.

#### Scenario: Workflow persistence is selected
- **WHEN** a future roadmap wave selects persistent product, session,
  knowledge, AI review, Q&A, talk-track, next-session task, feedback, export,
  source-review, or RAG snapshot work
- **THEN** the wave starts from the implemented auth guard foundation, the data
  foundation runtime, and the relevant workflow contract before adding
  protected database tables or route handlers

#### Scenario: Roadmap is reviewed after this wave
- **WHEN** this local auth guard foundation is completed and verified
- **THEN** the roadmap marks stage-2 auth guard as partially implemented and
  keeps login provider runtime, invitation UI, protected workflow CRUD, AI
  runtime, Q&A runtime, and production auth provider selection as separate later
  OpenSpec work

### Requirement: AI review feedback learning bridges MVP and later evaluation
The continuous improvement roadmap SHALL treat AI review feedback learning as
the bridge between the current AI review MVP and later Q&A/RAG evaluation work.

#### Scenario: Feedback learning wave is selected
- **WHEN** autonomous development selects AI review feedback as the current wave
- **THEN** the wave SHALL improve existing AI review trust and evaluation data
  before adding Q&A runtime, RAG retrieval, web discovery, queues, or automatic
  knowledge updates

#### Scenario: Feedback becomes future evaluation input
- **WHEN** operators record accepted, rejected, missing-knowledge, wrong-source,
  evidence-weak, or downstream-used feedback
- **THEN** the roadmap SHALL treat those signals as future evaluation,
  knowledge review, or prompt review inputs rather than self-modifying
  production knowledge

#### Scenario: Later Q&A/RAG work is proposed
- **WHEN** a future change proposes Q&A, RAG, prompt evaluation, or knowledge
  refresh behavior
- **THEN** it SHALL consider AI review feedback signals as auditable inputs and
  SHALL still define separate retrieval, review, source, authorization, and
  verification requirements before implementation
