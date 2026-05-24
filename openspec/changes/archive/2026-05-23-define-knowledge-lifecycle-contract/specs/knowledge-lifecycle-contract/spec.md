## ADDED Requirements

### Requirement: Knowledge lifecycle contract exists
The project SHALL provide a knowledge lifecycle contract document before any
backend, database, API, Server Action, source import, web discovery, RAG
indexing, AI grounding, refresh job, or persistence implementation for the
knowledge system is introduced.

#### Scenario: Contributor plans knowledge persistence
- **WHEN** a future change proposes saving, importing, reviewing, refreshing,
  publishing, retrieving, indexing, or grounding knowledge
- **THEN** it uses `docs/contracts/knowledge-lifecycle.md` as required context
  and updates the contract when the runtime boundary changes

#### Scenario: Contract is read
- **WHEN** a contributor opens the contract
- **THEN** it clearly states that the runtime is not implemented and does not
  imply existing API, database, crawler, web discovery, RAG, AI, scheduled job,
  or persistence behavior

### Requirement: Contract separates source authority and review state
The contract SHALL define source, claim, review, version, conflict, refresh,
feedback, and AI-ready snapshot entities instead of collapsing them into generic
content records.

#### Scenario: Domain entities are described
- **WHEN** the contract describes future knowledge data
- **THEN** it includes knowledge source, extracted claim, team knowledge note,
  review decision, published knowledge version, conflict record, refresh job,
  feedback signal, and downstream readiness

#### Scenario: Authority differs by field
- **WHEN** the contract describes public sources, team notes, extracted claims,
  AI findings, feedback signals, or RAG-ready snapshots
- **THEN** it separates source facts, team-authored experience, generated or
  derived suggestions, review decisions, and published knowledge versions

### Requirement: Contract defines future operations and lifecycle
The contract SHALL describe future commands, queries, request/response shapes,
lifecycle states, refresh and conflict rules, error cases, authorization,
sensitive data, audit metadata, and verification requirements.

#### Scenario: Commands and queries are specified
- **WHEN** the contract describes future runtime boundaries
- **THEN** it identifies register-source/extract-claim/review/publish/refresh/
  mark-conflict/archive commands and list/detail/search/review-queue/snapshot
  queries without implementing them

#### Scenario: Lifecycle is specified
- **WHEN** the contract describes source and knowledge state
- **THEN** it includes draft, registered, extracted, reviewing, approved,
  published, stale, conflict, superseded, rejected, failed, and archived states
  with allowed downstream use

#### Scenario: Refresh and conflict behavior are specified
- **WHEN** the contract describes source freshness or conflicting facts
- **THEN** it covers refresh cadence, retrieved time, source trust level,
  stale-source detection, conflict records, reviewer decisions, and publication
  blocking rules

#### Scenario: Error and security requirements are specified
- **WHEN** the contract describes failure and access rules
- **THEN** it covers validation, missing source, duplicate source, stale source,
  conflicting claim, unauthorized tenant/team access, forbidden role, fetch
  failure, provider failure placeholders, schema mismatch, sensitive source
  content handling, and audit metadata

### Requirement: Contract index references knowledge lifecycle status
The contract index SHALL list the knowledge lifecycle contract with its draft
status and future implementation boundary.

#### Scenario: Contributor opens contract index
- **WHEN** a contributor opens `docs/contracts/README.md`
- **THEN** it links to the knowledge lifecycle contract and shows that the
  contract is drafted while runtime implementation is not yet available
