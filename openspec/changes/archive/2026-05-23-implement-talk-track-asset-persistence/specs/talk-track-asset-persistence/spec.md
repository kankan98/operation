## ADDED Requirements

### Requirement: Talk track assets persist as tenant-scoped versioned records
The system SHALL provide a local-only server repository and PostgreSQL schema
that stores talk-track assets, versions, scenario fit, ordered segments,
objection patterns, source grounding, review decisions, candidates, and usage
signals under tenant/team ownership.

#### Scenario: Asset with version is created
- **WHEN** an authorized actor creates a talk-track asset with an initial
  version, scenario, segments, and source grounding
- **THEN** the repository persists all records with the actor's tenant/team,
  audit fields, draft/review state, and returns a typed asset view

#### Scenario: Cross-team asset is requested
- **WHEN** an actor requests an asset that belongs to another team or tenant
- **THEN** the repository returns a not-found style error without exposing the
  asset contents

### Requirement: Talk track repository enforces role and permission boundaries
The system SHALL require server-side permissions for creating, editing,
submitting, reviewing, publishing, archiving, restoring, and recording usage
signals for talk-track assets.

#### Scenario: Viewer tries to create an asset
- **WHEN** a viewer or actor without talk-track permission creates an asset
- **THEN** the repository rejects the operation with a forbidden permission
  error

#### Scenario: Host tries to publish
- **WHEN** a host with talk-track management permission attempts to publish a
  version without an eligible reviewer/product-owner/admin role
- **THEN** the repository rejects the operation with a forbidden permission
  error

### Requirement: Talk track publication requires safe review and source grounding
The system SHALL block publication when required source grounding is missing,
stale-blocked, conflicted, sensitive-data-blocked, or when the target originated
from an AI candidate that has not been accepted or edited by human review.

#### Scenario: Required evidence is missing
- **WHEN** a version contains a required-evidence segment but has no current,
  non-conflicted source grounding
- **THEN** publishing is rejected with a source-required or source-state error

#### Scenario: AI candidate is pending review
- **WHEN** a version is linked to an AI-generated candidate whose review state
  is pending or rejected
- **THEN** publishing is rejected and the version remains unpublished

#### Scenario: Reviewed version is published
- **WHEN** an eligible reviewer records an approving review decision for a
  source-grounded version with accepted or edited AI candidate state
- **THEN** the repository marks the version and asset as published and records
  the review decision linkage

### Requirement: Talk track repository preserves scenario fit and duplicate guards
The system SHALL preserve product, player-level, play-style, price-band,
live-scene, host-role, and objection scenario metadata and SHALL prevent active
duplicate published scenarios for the same asset type and use case.

#### Scenario: Duplicate active scenario is created
- **WHEN** an actor creates a second active talk-track asset for the same
  asset type, scenario key, and team while the existing one is not archived or
  rejected
- **THEN** the repository rejects the operation with a duplicate scenario error

#### Scenario: Scenario readiness is returned
- **WHEN** an actor reads a talk-track asset
- **THEN** the response includes readiness blockers such as not published,
  missing source, stale source, conflict, or AI candidate not reviewed

### Requirement: Talk track candidates and usage signals are review-only quality inputs
The system SHALL store manual/session/AI/Q&A talk-track candidates and reuse
signals as quality inputs that do not automatically publish or rewrite
authoritative talk-track versions.

#### Scenario: Candidate is created from AI review
- **WHEN** an authorized actor creates an AI review candidate
- **THEN** the repository records AI run ID, section ID, prompt version, source
  references, validation state, review state, and proposed body without
  publishing it

#### Scenario: Usage signal is recorded
- **WHEN** an authorized actor records that a published talk track was used,
  edited before use, rejected in use, reported wrong, or needs update
- **THEN** the repository stores the signal with actor, workflow, reason, and
  timestamp without changing the published version body

### Requirement: Talk track persistence verification runs locally and rolls back
The system SHALL provide a local verification command that exercises talk-track
repository behavior against the development PostgreSQL database and rolls back
all seeded records.

#### Scenario: Local verifier succeeds
- **WHEN** `pnpm talk-tracks:check` is run with a valid local `DATABASE_URL`
- **THEN** it verifies creation, permission denial, source/publish blockers,
  review publish, duplicate scenario rejection, cross-team isolation, usage
  signal recording, and transaction rollback
