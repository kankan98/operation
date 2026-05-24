## ADDED Requirements

### Requirement: Session capture contract exists
The project SHALL provide a session capture contract document before any
backend, database, API, Server Action, transcript import, AI review input, or
persistence implementation for live-session capture is introduced.

#### Scenario: Contributor plans session persistence
- **WHEN** a future change proposes saving, editing, restoring, importing,
  retrieving, analyzing, or exporting live-session capture records
- **THEN** it uses `docs/contracts/session-capture.md` as required context and
  updates the contract when the runtime boundary changes

#### Scenario: Contract is read
- **WHEN** a contributor opens the contract
- **THEN** it clearly states that the runtime is not implemented and does not
  imply existing API, database, upload, transcript parsing, AI, or persistence
  behavior

### Requirement: Contract preserves live-session domain
The contract SHALL define badminton live-commerce session entities and fields
needed for operations instead of collapsing them into generic notes or content
records.

#### Scenario: Domain entities are described
- **WHEN** the contract describes future session data
- **THEN** it includes live session, host roles, product order, session notes,
  customer questions, objections, talk-track gaps, transcript import metadata,
  draft state, and downstream readiness

#### Scenario: Authority differs by field
- **WHEN** the contract describes session facts, operator notes, customer
  questions, imported transcript text, AI-ready input, or downstream outputs
- **THEN** it separates human-entered facts, raw/imported material, structured
  summaries, and generated or derived suggestions

### Requirement: Contract defines future operations and lifecycle
The contract SHALL describe future commands, queries, request/response shapes,
state machine, long-input rules, error cases, authorization, sensitive data,
audit metadata, and verification requirements.

#### Scenario: Commands and queries are specified
- **WHEN** the contract describes future runtime boundaries
- **THEN** it identifies create/update/autosave/submit/archive/import-transcript
  commands and list/detail/search/readiness queries without implementing them

#### Scenario: Lifecycle is specified
- **WHEN** the contract describes record state
- **THEN** it includes draft, autosaved, submitted, review ready, processing,
  failed, archived, and deleted states with allowed downstream use

#### Scenario: Long input and refresh behavior are specified
- **WHEN** the contract describes notes or transcript input
- **THEN** it covers empty input, partially saved drafts, very long notes,
  transcript chunking, refresh recovery, and re-running analysis after edits

#### Scenario: Error and security requirements are specified
- **WHEN** the contract describes failure and access rules
- **THEN** it covers validation, missing required fields, duplicate session
  labels, unauthorized tenant/team access, forbidden role, stale draft conflict,
  transcript import failure, network timeout, provider failure placeholders,
  sensitive customer data handling, and audit metadata

### Requirement: Contract index references session capture status
The contract index SHALL list the session capture contract with its draft status
and future implementation boundary.

#### Scenario: Contributor opens contract index
- **WHEN** a contributor opens `docs/contracts/README.md`
- **THEN** it links to the session capture contract and shows that the contract
  is drafted while runtime implementation is not yet available
