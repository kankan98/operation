# ai-continuous-development-goal Specification

## Purpose
Define the durable AI continuous development goal for the project, including
target users, autonomous iteration responsibilities, research and dependency
guardrails, user-value checks, collaboration boundaries, and completion
evidence.

## Requirements
### Requirement: Project goal document governs autonomous continuation
The project SHALL provide a durable AI continuous development goal document that
summarizes the target product, target users, development lanes, autonomous
iteration loop, research policy, UX quality gate, collaboration needs, and
evidence required for wave completion.

#### Scenario: Agent receives a generic continue request
- **WHEN** a future agent is asked to continue project development without a
  narrower task
- **THEN** it reads the goal document, accepted OpenSpec specs, current roadmap,
  project rules, current worktree, and public preview state before choosing the
  next coherent development wave

#### Scenario: Goal document is updated
- **WHEN** durable product direction, roadmap sequencing, collaboration needs,
  research policy, UX expectations, or verification gates change
- **THEN** the goal document is updated in the same OpenSpec-governed change
  unless the update is a tiny documentation clarification

### Requirement: Autonomous work remains user-value driven
Autonomous development SHALL prioritize capabilities that help Chinese
badminton racket live-commerce operators prepare sessions, explain products,
answer customer questions, improve talk tracks, review live performance, and
plan next-session actions.

#### Scenario: Next work item is selected
- **WHEN** an agent chooses a self-directed development wave
- **THEN** it identifies the operator role helped, the live-commerce job being
  improved, the workflow friction reduced, the accepted spec or contract that
  governs the work, and the verification evidence needed

#### Scenario: Work does not improve operator value
- **WHEN** a proposed change is mostly decorative, speculative, or unrelated to
  the target operator workflows
- **THEN** it is deferred unless it directly supports accessibility, stability,
  maintainability, security, or a prerequisite documented in the roadmap

### Requirement: Research and learning are governed
The project SHALL allow agents to research unclear topics, use installed skills,
install justified skills or tools, and propose dependencies when needed, while
requiring durable decisions to be documented and verified.

#### Scenario: Agent finds unclear or time-sensitive information
- **WHEN** a domain fact, library behavior, AI provider capability, platform
  rule, market pattern, or UX benchmark is unclear or likely to be stale
- **THEN** the agent researches reliable sources, prefers primary or official
  sources when possible, records the decision basis, and routes reusable product
  knowledge through source metadata and review before using it as answer truth

#### Scenario: Agent needs a new tool or dependency
- **WHEN** a skill, local tool, npm dependency, or runtime service is needed to
  make progress
- **THEN** the active OpenSpec design records the problem solved, alternatives,
  maintenance or license risk, runtime impact, failure mode, rollback path, and
  verification before the project depends on it

### Requirement: Completion requires evidence not intent
Autonomous development SHALL distinguish the long-running project goal from
individual implementation wave completion, and completion claims MUST be backed
by current evidence.

#### Scenario: Agent reports wave completion
- **WHEN** a future agent claims a development wave is complete
- **THEN** the report identifies files changed, specs or tasks completed,
  verification commands and observed results, skipped checks with reasons,
  public preview status when relevant, and remaining risks or next candidates

#### Scenario: Goal completion is evaluated
- **WHEN** an agent considers marking the long-running project goal complete
- **THEN** it audits every explicit requirement in the goal against current
  authoritative evidence and keeps the goal active unless the full requested
  end state is proven
