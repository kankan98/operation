## ADDED Requirements

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
