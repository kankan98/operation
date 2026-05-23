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
