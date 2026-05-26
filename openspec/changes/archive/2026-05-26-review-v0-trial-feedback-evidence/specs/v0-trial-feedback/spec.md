## ADDED Requirements

### Requirement: V0 trial feedback evidence is summarized
The V0 trial feedback workflow SHALL provide a tenant/team-scoped evidence
summary that helps evaluators and team leads decide the next V0 prioritization
focus.

#### Scenario: Feedback evidence summary is returned
- **WHEN** a verified evaluator lists V0 trial feedback for an authorized
  tenant/team
- **THEN** the response SHALL include a no-store evidence summary with total
  scoped feedback count, included feedback count, low-usefulness count,
  low-clarity count, real-work signal distribution, top issue types, top
  workbenches, hotspot groups, recent representative notes, and a deterministic
  next-focus recommendation

#### Scenario: Sparse feedback recommends more evidence
- **WHEN** fewer than three scoped feedback records are available for evidence
  review
- **THEN** the summary SHALL explicitly recommend collecting more complete trial
  path feedback before making broad V0/V1 prioritization decisions

#### Scenario: Feedback evidence remains scoped
- **WHEN** feedback exists for another tenant or team
- **THEN** the evidence summary SHALL NOT include cross-tenant or cross-team
  counts, notes, hotspots, signals, or recommendations

### Requirement: V0 trial feedback cockpit shows evidence review
The trial and overview cockpit SHALL show compact scoped feedback evidence after
the V0 trial session is verified.

#### Scenario: Evidence panel is ready
- **WHEN** a verified trial session has loaded feedback evidence
- **THEN** the cockpit SHALL show Chinese operator-facing metrics, top friction
  categories, recent notes, and the recommended next focus without requiring a
  page refresh

#### Scenario: Evidence panel has no data
- **WHEN** no scoped feedback has been collected
- **THEN** the cockpit SHALL show an empty evidence state that asks evaluators to
  complete trial paths and submit concise feedback

#### Scenario: Evidence panel updates after submission
- **WHEN** an evaluator submits valid feedback successfully
- **THEN** the evidence panel SHALL refresh or update so the latest counts,
  recent note, and next-focus recommendation reflect the submitted feedback

#### Scenario: Evidence panel remains restrained
- **WHEN** the cockpit renders on desktop or mobile
- **THEN** the evidence panel SHALL use the existing workspace design language,
  stable dimensions, accessible labels, and concise copy without marketing-style
  hero content, decorative charts, or incoherent text overflow

### Requirement: V0 trial feedback evidence guides roadmap decisions
The project SHALL treat the summarized trial evidence as the immediate decision
input for V0 usable-version acceleration.

#### Scenario: Roadmap records evidence review status
- **WHEN** this change is completed
- **THEN** roadmap documentation SHALL state that V0 feedback evidence review is
  the current gate for choosing between experience polish, sample data, AI
  quality, source trust, downstream workflow, production auth/readiness, or
  collecting more feedback

#### Scenario: Evidence review is verified before archive
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local feedback
  summary checks, affected trial/auth checks, lint, typecheck, build, and
  Playwright desktop/mobile checks for evidence rendering, update-after-submit,
  console health, and no incoherent text overflow
