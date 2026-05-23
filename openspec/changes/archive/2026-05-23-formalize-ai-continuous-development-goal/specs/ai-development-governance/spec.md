## ADDED Requirements

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
