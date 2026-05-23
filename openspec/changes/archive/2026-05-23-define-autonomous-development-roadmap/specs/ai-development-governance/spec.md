## ADDED Requirements

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
