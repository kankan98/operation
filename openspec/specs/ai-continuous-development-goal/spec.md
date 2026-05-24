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

### Requirement: Autonomous continuation starts with research and value exploration
The AI continuous development goal SHALL require future autonomous development
waves to perform reliable source research and relevant skill-backed value
exploration before creating or finalizing non-trivial proposals.

#### Scenario: Agent chooses the next autonomous wave
- **WHEN** the user asks an agent to continue project development without a
  narrow implementation request
- **THEN** the agent researches reliable sources when assumptions may be
  external, current, specialized, or uncertain, and uses relevant skills to test
  user value before creating or finalizing the proposal

#### Scenario: Agent evaluates user value before proposal
- **WHEN** the agent prepares a non-trivial autonomous proposal
- **THEN** it identifies the target operator role, the live-commerce job
  improved, the friction reduced, the expected user result, and the reason the
  work is a coherent next wave

#### Scenario: Agent checks for goal drift
- **WHEN** a candidate wave appears technically interesting but weakly connected
  to badminton live-commerce operator workflows
- **THEN** the agent defers it or reframes it around a validated operator need,
  accepted contract, security requirement, verification gap, or roadmap
  prerequisite

### Requirement: Autonomous work seeks restrained above-baseline product value
The AI continuous development goal SHALL define product ambition as exceeding
operator expectations through useful workflow clarity, speed, confidence, and
reuse rather than through decorative complexity.

#### Scenario: Agent proposes a product highlight
- **WHEN** an autonomous proposal includes a feature, UX pattern, or polish item
  intended to feel like a product highlight
- **THEN** it explains how that highlight helps operators complete real work
  faster, more clearly, with more confidence, or with better team reuse

#### Scenario: Agent balances ambition and baseline quality
- **WHEN** a potential improvement could make the product feel more polished but
  may add cognitive load, implementation churn, accessibility risk, or
  maintenance burden
- **THEN** the agent chooses the smallest useful version that preserves the
  current code baseline, operational UI expectations, and verification
  standards

#### Scenario: Agent records durable learnings
- **WHEN** research or skill exploration reveals a durable product, UX,
  architecture, verification, or roadmap constraint
- **THEN** the agent records it in the goal document, roadmap, OpenSpec artifact,
  contract, rule, or accepted spec as part of the same wave

### Requirement: Autonomous development corrects course during implementation
The AI continuous development goal SHALL require agents to improve active
artifacts during implementation when the current plan no longer matches user
needs, business common sense, source evidence, or project rules.

#### Scenario: Agent finds the current task is wrong for users
- **WHEN** implementation work reveals that a selected task does not help the
  target operator, violates the original product intent, or fails to meet a
  reasonable user expectation
- **THEN** the agent adjusts the active OpenSpec change, roadmap, goal,
  contract, or task list before continuing

#### Scenario: Agent finds a conflicting or outdated rule
- **WHEN** a rule, contract, roadmap item, or spec conflicts with newer user
  instruction, reliable evidence, accepted architecture, or the actual product
  workflow
- **THEN** the agent proposes or applies a scoped artifact update through the
  OpenSpec workflow rather than treating the stale guidance as fixed
