# ai-development-governance Specification

## Purpose
Define the repository governance rules for AI-assisted development, including OpenSpec-first workflow, bounded exploration, implementation quality, security, verification, and collaboration expectations.
## Requirements
### Requirement: Rules directory exists
The repository SHALL provide a `.codex/rules/` directory that contains the canonical AI development rules for this project.

#### Scenario: Future agent looks for guidance
- **WHEN** an AI agent starts a development task in this repository
- **THEN** the agent can find an index file under `.codex/rules/` that explains which rule files to read

### Requirement: OpenSpec governs non-trivial changes
The rules SHALL require OpenSpec proposal, design, specs, and tasks for non-trivial product, architecture, data, API, frontend, or AI behavior changes.

#### Scenario: Agent starts a feature
- **WHEN** a feature or behavior change is requested
- **THEN** the rules direct the agent to create or update an OpenSpec change before implementation unless the change is explicitly classified as tiny maintenance

### Requirement: Vibe coding is bounded
The rules SHALL allow AI-assisted rapid exploration only when the agent records intent, scope, assumptions, and verification before treating the result as production-ready.

#### Scenario: Agent prototypes quickly
- **WHEN** an agent uses exploratory vibe-coding style implementation
- **THEN** the agent must convert the outcome into reviewed, tested, and maintainable code before completion

### Requirement: Verification is mandatory
The rules SHALL require relevant verification before an agent claims a task is complete.

#### Scenario: Agent finishes implementation
- **WHEN** an agent reports completion
- **THEN** the report includes the tests, linting, type checks, builds, or manual checks that were run, or clearly states why verification was not possible

### Requirement: Security and data handling are explicit
The rules SHALL define AI-safe handling of secrets, credentials, user data, business data, prompts, transcripts, and generated outputs.

#### Scenario: Agent touches sensitive data
- **WHEN** an agent implements or modifies code that handles sensitive, commercial, or user-provided data
- **THEN** the agent follows repository security and data rules before storing, logging, sending, or exposing that data

### Requirement: Autonomous research is bounded and recorded
AI-assisted development SHALL allow agents to research unclear, current, or
specialized topics while recording durable decisions in OpenSpec artifacts or
project documentation.

#### Scenario: Agent needs current external information
- **WHEN** an agent needs current technical documentation, domain references,
  market examples, platform rules, legal guidance, or source quality evidence
- **THEN** the agent may search the web or use installed research skills,
  prefers primary sources when possible, records the decision basis, and cites
  or summarizes sources without copying excessive copyrighted content

#### Scenario: Research affects product behavior
- **WHEN** research changes product behavior, AI behavior, data handling,
  dependencies, or integration assumptions
- **THEN** the active OpenSpec change is updated before implementation relies on
  the new assumption

### Requirement: Skill and dependency additions require justification
AI-assisted development SHALL permit installing skills, tools, or npm
dependencies only when the active work justifies their value, scope, and risk.

#### Scenario: New skill or tool is needed
- **WHEN** an agent needs a skill or local tool to perform research, design,
  verification, deployment, or implementation
- **THEN** the agent may install or use it if it is relevant to the active task
  and the final report or artifact explains why it was needed when the choice
  affects future maintenance

#### Scenario: New runtime dependency is proposed
- **WHEN** an agent proposes adding a runtime or build dependency
- **THEN** the active OpenSpec design records the problem solved, alternatives
  considered, license or maintenance concern, bundle/runtime impact, failure
  mode, rollback path, and verification command before the dependency is used

### Requirement: Documentation stays aligned with implementation
AI-assisted development SHALL keep route docs, standards, roadmap notes, and
verification instructions aligned with implemented behavior.

#### Scenario: Route or workflow changes
- **WHEN** a route, workbench slice, AI behavior, knowledge lifecycle, theme
  standard, motion standard, deployment process, or verification command changes
- **THEN** the relevant README, roadmap, OpenSpec spec, or project rule is
  updated in the same change before completion

#### Scenario: Agent finishes a development wave
- **WHEN** an agent reports completion of a non-trivial wave
- **THEN** the report identifies changed files, verification results, skipped
  checks, public preview status when relevant, and remaining risks or next
  roadmap items

### Requirement: Autonomous goal context is a required first-class input
AI-assisted development SHALL treat the AI continuous development goal document
as required context for self-directed project continuation, alongside
`AGENTS.md`, repository rules, active OpenSpec artifacts, accepted specs, and
nearby code.

#### Scenario: Agent begins autonomous continuation
- **WHEN** the user asks an agent to continue improving the project without a
  narrow implementation request
- **THEN** the agent reads the goal document and uses it to identify the next
  operator-useful gap, required OpenSpec work, research needs, verification
  scope, and public preview impact

#### Scenario: Agent discovers a collaboration blocker
- **WHEN** an external-state blocker requires user action, such as GitHub
  credentials, production secrets, official account permission, or business
  truth that cannot be inferred
- **THEN** the agent records the blocker or collaboration need in the relevant
  final report or planning document while continuing independent work that is
  not blocked

### Requirement: Implementation work uses architecture standards
AI-assisted development SHALL treat the code architecture standards document and
implementation quality rules as required context before non-trivial coding.

#### Scenario: Agent starts non-trivial code work
- **WHEN** an agent starts code that changes product behavior, shared
  components, data shape, AI behavior, routing, contracts, dependencies, or
  architecture
- **THEN** it reads the implementation quality rules and code architecture
  standards, then applies the pre-coding decision gate before editing code

#### Scenario: Agent adds or rejects a dependency or abstraction
- **WHEN** an agent decides to add, avoid, or replace a dependency, abstraction,
  shared helper, service, adapter, or module boundary
- **THEN** the rationale records the need, alternative, expected benefit,
  negative impact, architecture fit, and verification scope in the active
  OpenSpec artifact or final report according to risk

### Requirement: Non-trivial proposals are source-backed
AI-assisted development SHALL require reliable pre-proposal research before
finalizing scope for non-trivial product, UX, AI, data, integration,
dependency, security, or architecture changes.

#### Scenario: Agent starts non-trivial proposal work
- **WHEN** an agent starts a non-trivial requirements or OpenSpec proposal phase
- **THEN** the agent researches relevant professional, official, primary, or
  otherwise credible sources before finalizing proposal scope

#### Scenario: Proposal uses external facts
- **WHEN** external research affects product behavior, user value, AI behavior,
  platform assumptions, security, data handling, dependencies, or verification
- **THEN** the proposal or design records the checked sources, why they are
  considered reliable, and how the findings changed scope, risk, or validation

#### Scenario: Source is not authoritative enough
- **WHEN** a source is secondary, anecdotal, promotional, stale, unverifiable, or
  otherwise weak
- **THEN** the agent MUST either avoid relying on it for proposal scope or mark
  its limitation and seek stronger supporting evidence before implementation

### Requirement: Non-trivial proposals use skill-backed value exploration
AI-assisted development SHALL use relevant discovery, product, UX, OpenSpec,
security, AI, implementation, or review skills before finalizing non-trivial
requirements or proposal scope.

#### Scenario: Agent frames a new change
- **WHEN** an agent begins non-trivial requirements or proposal work
- **THEN** it uses relevant skills to evaluate whether the idea is valuable,
  aligned with the product goal, realistic to build, likely to satisfy operator
  expectations, and worth pursuing now

#### Scenario: Skill selection varies by problem
- **WHEN** the proposal concerns UI, product workflow, AI behavior, data,
  security, dependencies, architecture, or review quality
- **THEN** the agent selects skills appropriate to that domain rather than using
  a fixed ritual skill for every change

#### Scenario: Value exploration affects scope
- **WHEN** skill-backed exploration reveals weak user value, goal drift,
  overbuilt scope, missing UX states, code-boundary risk, or a better smaller
  slice
- **THEN** the active proposal, design, specs, or tasks reflect that finding
  before implementation proceeds

### Requirement: Proposals define user value and restrained product highlights
AI-assisted development SHALL require proposals to describe the operator role,
workflow friction, expected user outcome, and any planned product highlight in
terms of user value rather than decoration.

#### Scenario: Proposal explains why the work matters
- **WHEN** a non-trivial proposal is created
- **THEN** it identifies the target operator role, the job or workflow improved,
  the friction reduced, and the result the user can achieve through the change

#### Scenario: Proposal includes a product highlight
- **WHEN** a proposal aims to exceed baseline expectations with a memorable or
  polished experience
- **THEN** the highlight MUST improve operator speed, clarity, confidence,
  reuse, accessibility, or decision quality while staying consistent with the
  operational UI and code-quality baseline

#### Scenario: Proposed work is flashy but low value
- **WHEN** a proposed change mainly adds decoration, animation, copy volume, or
  workflow complexity without improving operator outcomes
- **THEN** it is deferred or reduced unless it directly supports accessibility,
  stability, trust, or another accepted roadmap prerequisite

### Requirement: Development updates governance artifacts when evidence changes
AI-assisted development SHALL adjust active OpenSpec artifacts, contracts, rules,
roadmap notes, or task lists during development when evidence shows that the
current plan is wrong, conflicting, business-misaligned, or weak on user value.

#### Scenario: Implementation reveals goal drift
- **WHEN** coding, verification, research, UX review, or source analysis reveals
  that the active plan has drifted from badminton live-commerce operator needs
- **THEN** the agent updates the relevant durable artifact before continuing
  implementation on the corrected direction

#### Scenario: Guidance conflicts during development
- **WHEN** active OpenSpec artifacts, repository rules, contracts, roadmap notes,
  code constraints, or direct user instructions conflict in a way that affects
  product behavior, security, data handling, architecture, or user value
- **THEN** the agent resolves the conflict according to precedence, records the
  decision in the appropriate artifact, and avoids silently coding around it

#### Scenario: Better smaller path is discovered
- **WHEN** development reveals that a smaller or different slice better serves
  the operator outcome with lower complexity or risk
- **THEN** the proposal, design, specs, tasks, contract, or roadmap is updated so
  future agents can see the revised scope and rationale
