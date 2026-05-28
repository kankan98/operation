## ADDED Requirements

### Requirement: V1 gate delegates access and HTTPS planning
The V1 production gate workflow SHALL integrate the production access transport
gate once that detailed gate is accepted, while keeping controlled real trial
blocked until runtime implementation and verification pass.

#### Scenario: Access and HTTPS are planned but not passed
- **WHEN** V0 evidence is strong enough to enter V1 gate planning
- **THEN** the V1 gate SHALL show production access and HTTPS/domain as planned
  through the detailed production access transport gate and SHALL NOT mark them
  as passed

#### Scenario: Next wave moves beyond generic gate planning
- **WHEN** the detailed production access transport gate has been accepted
- **THEN** the V1 gate SHALL recommend a concrete production auth and HTTPS
  implementation wave rather than the earlier generic access/transport planning
  wave

#### Scenario: Real trial remains blocked
- **WHEN** production access and HTTPS planning detail is available but provider
  login, public routes, invitation/team access, domain, TLS, secure production
  origin, and verification are not implemented
- **THEN** the V1 gate SHALL keep controlled real trial unavailable and SHALL
  continue surfacing remaining blockers
