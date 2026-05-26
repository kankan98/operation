## ADDED Requirements

### Requirement: Trial MVP verifier covers workflow readiness
The trial MVP verifier SHALL cover the V0 workflow readiness model so the
overview summary and next-step recommendation remain aligned with the protected
workbench route response shapes.

#### Scenario: Readiness model handles protected list responses
- **WHEN** the local trial MVP verifier runs under a valid scoped trial session
- **THEN** it SHALL verify that the readiness model can extract safe counts from
  the sessions, racket products, knowledge sources, AI review runs, talk-track
  assets, and next-session tasks list response bodies

#### Scenario: Readiness model handles empty trial data
- **WHEN** all implemented V0 workbench list responses are empty
- **THEN** the verifier SHALL confirm the readiness model recommends the session
  capture workbench as the next useful action and does not leak sensitive
  metadata

#### Scenario: Readiness model handles partial trial data
- **WHEN** earlier workflow steps have countable records and a later step is
  empty
- **THEN** the verifier SHALL confirm the readiness model recommends the first
  empty downstream workbench
