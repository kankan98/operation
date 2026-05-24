## ADDED Requirements

### Requirement: Knowledge lifecycle schema persists source and review entities
The system SHALL provide local PostgreSQL schema for knowledge sources, extracted claims, team knowledge notes, review decisions, published versions and conflicts using explicit tenant/team scope, audit metadata and lifecycle states.

#### Scenario: Schema includes scoped knowledge entities
- **WHEN** the knowledge lifecycle persistence migration is generated and applied
- **THEN** it creates tables for sources, claims, team notes, review decisions, published versions and conflicts with tenant/team scope and appropriate foreign keys

#### Scenario: Schema preserves authority boundaries
- **WHEN** source metadata, extracted claims, team-authored notes, review decisions and published versions are persisted
- **THEN** the schema stores them as distinct records rather than collapsing them into one generic content table

#### Scenario: Schema prevents duplicate source registration
- **WHEN** the same normalized source key is registered twice within the same tenant/team
- **THEN** the database model prevents duplicate source records

### Requirement: Knowledge lifecycle repository enforces authorization and validation
The system SHALL provide a server-only repository that validates inputs, checks `DataAccessContext` permissions and scopes every read/write to the authorized tenant/team.

#### Scenario: Authorized reviewer registers a source
- **WHEN** an actor with `review_knowledge` permission registers a valid source with source type, title, owner, trust level, retrieved time and refresh cadence
- **THEN** the repository persists the source and returns a source view with review state and downstream readiness blockers

#### Scenario: Missing permission is rejected
- **WHEN** an actor without `review_knowledge` permission attempts to register, review, publish or archive knowledge records
- **THEN** the repository rejects the operation with `FORBIDDEN_PERMISSION`

#### Scenario: Cross-team data is isolated
- **WHEN** knowledge records exist in one team
- **THEN** list/detail/review queue queries from another team in the same tenant do not return those records

#### Scenario: Invalid or sensitive input is rejected safely
- **WHEN** required fields are missing, enum values are invalid, text exceeds limits or a high-sensitive team note is requested for publication
- **THEN** the repository rejects the operation with a typed error without logging raw source or team-note content

### Requirement: Knowledge review lifecycle gates claims and team notes
The system SHALL support local review decisions that update source, claim and team-note states while preserving an audit trail.

#### Scenario: Reviewer approves a claim
- **WHEN** a reviewer records an approve decision for a pending or reviewing claim
- **THEN** the repository stores a review decision and moves the claim to approved

#### Scenario: Reviewer rejects or marks conflict
- **WHEN** a reviewer records reject or mark-conflict for a source, claim or team note
- **THEN** the repository stores the decision, updates the target state and keeps the target out of downstream readiness

#### Scenario: Invalid transition is rejected
- **WHEN** a reviewer attempts an unsupported decision for the target state or target type
- **THEN** the repository rejects the operation with `STATE_TRANSITION_INVALID`

### Requirement: Published knowledge versions are downstream readiness boundary
The system SHALL only mark local knowledge as ready for AI review, talk tracks or Q&A when a published version exists and no stale/conflict/sensitive blocker applies.

#### Scenario: Approved claim can publish a version
- **WHEN** at least one approved claim or approved team note exists for a knowledge key and no open conflict blocks it
- **THEN** the repository can publish a version and return readiness for downstream workflows

#### Scenario: Unreviewed or conflicted knowledge blocks readiness
- **WHEN** a knowledge key only has registered, pending, reviewing, rejected, stale or conflicted records
- **THEN** downstream readiness is false with explicit blocker codes

#### Scenario: Open conflict blocks publication
- **WHEN** a knowledge key has an open conflict
- **THEN** publishing a new knowledge version is rejected with `CONFLICTING_CLAIM`

### Requirement: Knowledge lifecycle verifier proves local behavior
The system SHALL provide a local rollback-style verifier for knowledge lifecycle persistence.

#### Scenario: Verifier covers primary workflow and failures
- **WHEN** the knowledge lifecycle check command runs against the local development PostgreSQL database
- **THEN** it verifies source registration, duplicate source rejection, claim/team-note creation, review decisions, publish readiness, conflict blocking, missing permission rejection, cross-team isolation and transaction rollback

#### Scenario: Existing checks continue to pass
- **WHEN** knowledge lifecycle persistence is implemented
- **THEN** existing data foundation, auth guard, product, session, lint, typecheck, build and OpenSpec validations still pass
