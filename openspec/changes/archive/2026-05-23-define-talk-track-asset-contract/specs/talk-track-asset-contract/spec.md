## ADDED Requirements

### Requirement: Talk track asset contract exists
The project SHALL provide a `talk-track-asset` contract draft before
implementing talk-track persistence, API routes, Server Actions, AI review
downstream publishing, Q&A grounding, feedback learning, or reuse in
short-video/topic workflows.

#### Scenario: Future talk-track runtime work is proposed
- **WHEN** a future change proposes saving, publishing, searching, versioning,
  reviewing, generating, or reusing talk tracks
- **THEN** the agent starts from `docs/contracts/talk-track-asset.md` and
  updates it if asset, version, source, review, authorization, persistence,
  AI, RAG, feedback, or sensitive-data assumptions change

#### Scenario: Contract is read
- **WHEN** an agent opens the talk-track asset contract
- **THEN** it can identify current status, runtime boundary, use case, domain
  entities, commands, queries, request/response shapes, state machines, error
  cases, authorization, sensitive data, audit metadata, verification, and open
  questions

### Requirement: Talk tracks are versioned reviewed assets
The talk-track asset contract SHALL model reusable talk tracks as versioned
assets with draft, review, published, deprecated, archived, and rejected states
instead of untracked free-form text.

#### Scenario: Talk track is published
- **WHEN** a future runtime publishes a talk-track version for team reuse
- **THEN** the version records reviewer, source grounding, scenario fit, asset
  owner, review time, and whether AI suggestions or session examples informed
  the wording

#### Scenario: Talk track is edited after publish
- **WHEN** a future runtime edits a published talk track
- **THEN** it creates a new version or revision record rather than overwriting
  historical approved wording without audit

### Requirement: Talk tracks preserve source grounding and scenario fit
The talk-track asset contract SHALL require reusable talk tracks to identify
the product, audience, live scene, objection, source references, and usage
constraints needed to prevent unsupported or misplaced selling claims.

#### Scenario: Asset references product claims
- **WHEN** a talk track includes racket specifications, player fit, price-band
  comparison, material claims, recommended string tension, or other product
  facts
- **THEN** it references reviewed product or knowledge versions and marks
  unsupported claims as blocked until reviewed

#### Scenario: Asset is matched for reuse
- **WHEN** a future UI, AI review, or Q&A flow suggests a talk track for reuse
- **THEN** it matches by scenario metadata such as product, player level, play
  style, live-session scene, objection type, host role, and review state rather
  than returning arbitrary draft text

### Requirement: AI-generated talk tracks require human approval
The talk-track asset contract SHALL treat AI-generated talk-track candidates as
drafts that require human review before publication or use as Q&A/RAG grounding.

#### Scenario: AI review creates a candidate
- **WHEN** a future AI review run produces a `talk_track_candidate`
- **THEN** the downstream artifact records AI run ID, section ID, prompt
  version, source references, validation result, and review state before it can
  become a talk-track asset version

#### Scenario: Candidate is rejected
- **WHEN** a reviewer rejects an AI-generated talk-track candidate
- **THEN** the rejection reason is recorded as feedback and the candidate is
  excluded from published reuse and grounding

### Requirement: Talk track verification covers reuse safety
The talk-track asset contract SHALL define verification requirements for future
runtime work that prove talk tracks are reviewable, scoped, reusable, and safe
for sensitive business data.

#### Scenario: Runtime implementation is proposed
- **WHEN** future code implements talk-track create, edit, review, publish,
  archive, search, AI downstream creation, feedback, or Q&A/RAG reuse
- **THEN** verification covers tenant/team isolation, role permissions,
  source-grounding validation, AI draft blocking, version history, stale or
  deprecated source handling, sensitive log redaction, mobile/desktop states
  when UI changes, and representative product/objection examples
