## ADDED Requirements

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
