## ADDED Requirements

### Requirement: Session capture schema persists live operations records
The system SHALL provide local PostgreSQL schema for live-session capture records using badminton live-commerce domain entities, tenant/team scope, audit metadata, draft versioning, and explicit lifecycle states.

#### Scenario: Schema includes scoped session entities
- **WHEN** the session capture persistence migration is generated and applied
- **THEN** it creates tables for live session captures, session host roles, session product order, session notes, customer questions, and customer objections with tenant/team scope and session foreign keys

#### Scenario: Schema stores long operator content safely
- **WHEN** session summary, notes, question text, answer text, objection content, or response text are persisted
- **THEN** the schema uses long-text-capable columns while repository validation enforces current business limits

#### Scenario: Schema prevents duplicate session labels
- **WHEN** two session capture records in the same tenant/team use the same normalized title on the same session date
- **THEN** the database model prevents duplicate session labels for that team/date

### Requirement: Session capture repository enforces authorization and validation
The system SHALL provide a server-only session capture repository that validates inputs, checks `DataAccessContext` permissions, and scopes every read and write to the authorized tenant/team.

#### Scenario: Authorized actor creates a session
- **WHEN** an actor with `capture_session` permission creates a valid session capture with title, session date, platform, host role, and product order
- **THEN** the repository persists the record and returns a session view with status, draft version, structured children, and downstream readiness

#### Scenario: Missing permission is rejected
- **WHEN** an actor without `capture_session` permission attempts to create, autosave, or submit a session capture
- **THEN** the repository rejects the operation with `FORBIDDEN_PERMISSION`

#### Scenario: Cross-team data is isolated
- **WHEN** a session capture exists in one team
- **THEN** list and detail queries from another team in the same tenant do not return that record

#### Scenario: Invalid input is rejected
- **WHEN** required fields are missing, enum values are invalid, structured lists exceed limits, or text exceeds current limits
- **THEN** the repository rejects the operation with a validation or long-input error without logging raw customer content

### Requirement: Session draft autosave uses optimistic versioning
The system SHALL support local draft autosave/update behavior with explicit draft version conflict detection.

#### Scenario: Matching draft version autosaves
- **WHEN** an actor autosaves a draft using the current `draftVersion`
- **THEN** the repository updates draft fields, increments `draftVersion`, records `lastAutosavedAt`, and returns the updated session view

#### Scenario: Stale draft version is rejected
- **WHEN** an actor autosaves a session using an older `draftVersion`
- **THEN** the repository rejects the operation with `STALE_DRAFT_VERSION`

#### Scenario: Autosave preserves structured notes
- **WHEN** an autosave patch includes notes, customer questions, or objections
- **THEN** the repository persists those structured records with sequence/order fields and keeps them scoped to the session tenant/team

### Requirement: Session submission derives downstream readiness
The system SHALL support submitting a session capture from draft/autosaved state and deriving downstream readiness without invoking AI, tasks, talk-track generation, or knowledge workflows.

#### Scenario: Complete session can be submitted
- **WHEN** a draft or autosaved session has title, date, at least one host role, at least one product order item, and no unresolved sensitive data review blocker
- **THEN** the repository can move it to `submitted` or `review_ready` according to the repository command and return readiness for downstream workflows

#### Scenario: Incomplete session blocks downstream workflows
- **WHEN** a session is missing required fields, product order, host role, or sensitive-redaction review
- **THEN** downstream readiness marks AI review, talk tracks, next actions, or knowledge gaps as blocked with explicit blocker codes

#### Scenario: Invalid state transition is rejected
- **WHEN** an actor tries to submit an archived, deleted, processed, or otherwise invalid session state
- **THEN** the repository rejects the operation with `STATE_TRANSITION_INVALID`

### Requirement: Session capture verifier proves local behavior
The system SHALL provide a local rollback-style verifier for session capture persistence.

#### Scenario: Verifier covers primary workflow and failures
- **WHEN** the session capture check command runs against the local development PostgreSQL database
- **THEN** it verifies create, list, detail/readiness, autosave version increment, stale draft rejection, submit readiness, duplicate label rejection, missing permission rejection, cross-team isolation, and transaction rollback

#### Scenario: Existing checks continue to pass
- **WHEN** session capture persistence is implemented
- **THEN** existing data foundation, auth guard, racket product, lint, typecheck, build, and OpenSpec validations still pass
