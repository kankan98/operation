## ADDED Requirements

### Requirement: Product roadmap optimizes for operator usefulness
The product roadmap SHALL prioritize capabilities that help Chinese badminton
racket live-commerce operators do real work faster, more accurately, and with
better reusable selling assets.

#### Scenario: Future capability is prioritized
- **WHEN** a future OpenSpec change proposes a product capability
- **THEN** the proposal explains which operator workflow it improves, such as
  session preparation, racket explanation, customer Q&A, objection handling,
  AI review, talk-track reuse, short-video topic planning, or next-session task
  execution

#### Scenario: Capability is only visually impressive
- **WHEN** a proposed capability improves appearance or novelty without a clear
  operator workflow benefit
- **THEN** it remains lower priority than capabilities that reduce operator
  effort, improve answer quality, preserve source traceability, or make repeated
  live-commerce work easier

### Requirement: Product learning updates the roadmap
The product SHALL use verification results, operator feedback, AI answer
quality, and knowledge gaps to update the development route over time.

#### Scenario: Feedback reveals a missing capability
- **WHEN** operators repeatedly reject AI suggestions, ask unsupported
  questions, edit the same talk-track pattern, or work around a missing state
- **THEN** the roadmap captures the gap as a candidate OpenSpec change with
  source context, target workflow, and verification criteria

#### Scenario: Roadmap wave is completed
- **WHEN** a roadmap wave is implemented and verified
- **THEN** the product docs identify what became available, what remains
  intentionally out of scope, and which next wave is now unblocked

### Requirement: Q&A agent roadmap remains staged
The Q&A agent roadmap SHALL remain staged so answer quality, source grounding,
feedback learning, and web discovery are validated before they affect operator
decisions.

#### Scenario: Q&A agent is expanded
- **WHEN** a future change expands the Q&A agent from static or reviewed
  knowledge into feedback learning, web search, or autonomous knowledge updates
- **THEN** it defines the stage boundary, data captured, review requirements,
  source display, evaluation set, and rollback path before implementation
