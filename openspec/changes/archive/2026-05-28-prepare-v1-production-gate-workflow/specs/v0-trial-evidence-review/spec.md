## ADDED Requirements

### Requirement: V0 trial evidence review hands off to V1 production gate workflow
The V0 trial evidence review SHALL hand off strong internal V0 evidence to the
dedicated V1 production gate workflow rather than treating the internal V0
cockpit as production readiness.

#### Scenario: Strong V0 evidence recommends V1 gate review
- **WHEN** the V0 trial evidence review stage is `prepare_production_gate`
- **THEN** the review action SHALL point to V1 production gate planning as the
  next workflow and SHALL preserve the message that internal V0 completion does
  not equal production readiness

#### Scenario: Weak V0 evidence does not recommend V1 gate review
- **WHEN** the V0 trial evidence review is missing complete-path evidence,
  missing feedback evidence, or contains blocker evidence
- **THEN** the review action SHALL continue to prioritize V0 evidence collection
  or blocker repair before V1 production gate planning

#### Scenario: Gate handoff avoids provider claims
- **WHEN** the V0 evidence review lists or links production gates
- **THEN** it SHALL NOT claim that production login, HTTPS/domain, backup/restore,
  observability, production AI/RAG evaluation, or real-data handling has been
  implemented unless the dedicated V1 gate workflow reports those gates as
  accepted and verified
