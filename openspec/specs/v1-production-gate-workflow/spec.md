# v1-production-gate-workflow Specification

## Purpose
Define the deterministic V1 production gate workflow that separates internal V0
trial readiness from controlled real-data trial prerequisites.
## Requirements
### Requirement: V1 production gate assessment is deterministic
The system SHALL derive a V1 production gate assessment from accepted project
status and the existing V0 trial cockpit state without calling external
providers, reading secrets, or creating new persistence.

#### Scenario: Gate assessment is available after trial verification
- **WHEN** a verified trial evaluator has a V0 readiness cockpit available
- **THEN** the system SHALL return a V1 production gate assessment with an
  overall stage, headline, summary, bounded gate list, current blockers, and next
  recommended OpenSpec wave

#### Scenario: Strong V0 evidence does not imply production readiness
- **WHEN** the V0 cockpit stage is `prepare_production_gate`
- **THEN** the V1 gate assessment SHALL mark internal V0 as frozen or ready for
  handoff while keeping controlled real trial blocked until production access,
  HTTPS/domain, backup/restore, sensitive-data, AI/RAG evaluation, and
  observability gates are resolved

#### Scenario: Sparse V0 evidence keeps V1 blocked
- **WHEN** the V0 cockpit stage is `collect_evidence` or `fix_blockers`
- **THEN** the V1 gate assessment SHALL keep the next recommendation on V0
  evidence collection or V0 blocker repair rather than production work

### Requirement: V1 production gates cover real-trial prerequisites
The V1 production gate workflow SHALL expose concise gate items for the
minimum prerequisites needed before real or sensitive operational data is used.

#### Scenario: Required gate groups are present
- **WHEN** the V1 gate assessment is built
- **THEN** it SHALL include gate groups for production access, HTTPS/domain,
  backup/restore, sensitive-data governance, AI/RAG evaluation, and
  observability/log redaction

#### Scenario: Gate statuses are conservative
- **WHEN** a production provider, policy, or runtime has not been accepted by
  OpenSpec and verified
- **THEN** the related gate SHALL be marked blocked or deferred and SHALL NOT be
  shown as passed only because internal V0 preview works

#### Scenario: Supporting preview evidence remains bounded
- **WHEN** Docker preview restart policy or V0 trial evidence is available
- **THEN** the gate workflow MAY show it as supporting evidence while clearly
  stating it does not replace production login, HTTPS, backups, sensitive-data
  governance, AI evaluation, or observability

### Requirement: V1 production gate UI is compact and safe
The overview and `/trial` cockpit SHALL render the V1 production gate in a
compact internal status panel when a verified trial session is available.

#### Scenario: Gate panel renders on trial surfaces
- **WHEN** a verified evaluator opens the overview or `/trial` readiness cockpit
- **THEN** the UI SHALL show a compact V1 gate panel with overall status, next
  wave, gate cards, and current blockers using existing workspace styles

#### Scenario: Gate panel avoids sensitive data
- **WHEN** the V1 gate panel renders
- **THEN** it SHALL NOT render API keys, cookies, session references, database
  URLs, provider payloads, raw prompts, raw transcripts, customer private data,
  stack traces, or raw protected records

#### Scenario: Gate panel remains usable on desktop and mobile
- **WHEN** the V1 gate panel renders in desktop or mobile viewport
- **THEN** it SHALL use concise Chinese labels, accessible status text, stable
  cards, no marketing-style hero content, and no incoherent horizontal overflow

### Requirement: V1 production gate verification is local and provider-free
The project SHALL verify the V1 production gate workflow locally without
requiring live providers, production credentials, or real customer data.

#### Scenario: Local model check covers gate behavior
- **WHEN** the V1 production gate check runs
- **THEN** it SHALL verify gate order, conservative statuses, V0 handoff
  behavior, blocker prioritization, redaction boundaries, and the recommended
  next OpenSpec wave

#### Scenario: Browser verification occurs before archive
- **WHEN** this change is ready to archive
- **THEN** verification SHALL include OpenSpec validation, local gate checks,
  lint/type/build checks, and Playwright desktop/mobile checks of the rendered
  overview or `/trial` gate surface before archiving

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
