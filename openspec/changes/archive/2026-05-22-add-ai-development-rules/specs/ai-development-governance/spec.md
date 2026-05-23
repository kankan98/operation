## ADDED Requirements

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
