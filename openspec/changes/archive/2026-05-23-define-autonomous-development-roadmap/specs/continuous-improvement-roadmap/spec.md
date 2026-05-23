## ADDED Requirements

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
