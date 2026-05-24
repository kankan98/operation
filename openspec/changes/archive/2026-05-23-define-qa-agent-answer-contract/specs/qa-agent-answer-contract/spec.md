## ADDED Requirements

### Requirement: Q&A answer contract exists
The project SHALL provide a `qa-agent-answer` contract draft before
implementing Q&A Agent provider calls, RAG retrieval, answer persistence,
feedback learning, web discovery, source review, or knowledge lifecycle
integration.

#### Scenario: Future agent prepares Q&A runtime work
- **WHEN** a future change proposes real Q&A answer generation, persistence,
  retrieval, feedback, web discovery, or evaluation behavior
- **THEN** the agent starts from `docs/contracts/qa-agent-answer.md` and updates
  it if runtime assumptions, shapes, states, authorization, or verification
  change

#### Scenario: Contract is read
- **WHEN** an agent opens the Q&A answer contract
- **THEN** it can identify current status, runtime boundary, use case, domain
  entities, commands, queries, request shape, response shape, state machine,
  error cases, authorization, sensitive data, audit metadata, verification, and
  open questions

### Requirement: Q&A answers use reviewed retrieval snapshots
The Q&A answer contract SHALL define reviewed, tenant-scoped retrieval snapshots
for answer grounding instead of raw pages, unreviewed web findings, full
transcripts, broad product dumps, or hidden prompt context.

#### Scenario: Operator question is prepared
- **WHEN** an operator asks a product, customer question, talk-track, objection,
  session, or operations question
- **THEN** the contract captures the question, normalized intent, tenant/team
  scope, linked domain entities, input limits, redaction state, and
  authorization requirements

#### Scenario: Retrieval snapshot is prepared
- **WHEN** evidence is selected for a Q&A answer run
- **THEN** the contract includes reviewed knowledge IDs, source IDs, source
  versions, review states, freshness, trust level, conflict state, tenant/team
  visibility, and the minimum evidence fields needed to answer

#### Scenario: Evidence is not eligible
- **WHEN** evidence is unreviewed, stale, conflicting, outside the actor's
  tenant/team, too broad, or too sensitive to send to an AI provider
- **THEN** the contract prevents it from grounding the answer and records the
  reason in retrieval or validation metadata

### Requirement: Q&A output distinguishes facts, inference, uncertainty, and gaps
The Q&A answer contract SHALL define structured answer output that separates
source-backed facts, team-approved experience, AI-generated wording,
uncertainty, and missing-knowledge signals.

#### Scenario: Answer is generated
- **WHEN** a future Q&A Agent produces an answer
- **THEN** the output includes a concise answer, cited evidence references,
  answer sections when needed, uncertainty label, assumptions or inference
  notes, recommended follow-up action, and whether the answer can be reused for
  live selling or requires review

#### Scenario: Knowledge is insufficient
- **WHEN** reviewed knowledge is missing, stale, conflicting, ambiguous, or
  outside the allowed scope
- **THEN** the answer run records an insufficient-knowledge state, explains what
  is missing in operator-facing language, and can create a missing-knowledge
  signal for review

#### Scenario: Output validation runs
- **WHEN** structured answer output is received
- **THEN** the contract requires schema validation, citation presence checks,
  grounding checks, sensitive-data checks, stale-source checks, conflict checks,
  and distinction between human-entered facts, reviewed knowledge, and AI
  wording

### Requirement: Q&A answer states and errors are explicit
The Q&A answer contract SHALL define a state machine and recoverable error
codes for validation, authorization, retrieval, provider, schema, evidence,
web-discovery, and sensitive-data failures.

#### Scenario: Answer state changes
- **WHEN** a future Q&A run moves through question receipt, classification,
  retrieval, generation, validation, answer delivery, feedback, missing
  knowledge, discovery, or archival
- **THEN** the contract defines allowed states, allowed transitions, terminal
  states, and invalid transition errors

#### Scenario: Retrieval or provider failure occurs
- **WHEN** retrieval is unavailable, the provider times out, refuses, rate
  limits, returns partial output, returns malformed structured data, or becomes
  unavailable
- **THEN** the contract records a non-success state, error code,
  recoverability, retry guidance, and user-facing result shape

#### Scenario: Sensitive or malicious input is detected
- **WHEN** the question, candidate evidence, prompt context, answer output, or
  feedback contains customer personal data, raw private messages, internal
  strategy, prompt injection, unsupported instructions, or secrets
- **THEN** the contract requires redaction, blocking, reviewer handling, or a
  non-success state before provider execution or answer reuse

### Requirement: Q&A feedback and missing knowledge are auditable signals
The Q&A answer contract SHALL treat operator feedback, answer edits,
regeneration requests, and missing-knowledge reports as auditable quality
signals rather than automatic knowledge truth.

#### Scenario: Operator gives feedback
- **WHEN** an operator gives thumbs-up, thumbs-down, edit, reason, regenerate,
  or missing-knowledge feedback on an answer
- **THEN** the contract links feedback to the answer run, retrieval snapshot,
  cited evidence, prompt version, provider/model metadata, actor, timestamp,
  and optional edited text

#### Scenario: Feedback reveals a quality issue
- **WHEN** feedback indicates wrong answer, weak citation, missing source,
  outdated knowledge, confusing wording, or repeated rejection
- **THEN** the contract routes the signal to evaluation and knowledge review
  priority rather than directly mutating authoritative knowledge

#### Scenario: Feedback becomes an evaluation candidate
- **WHEN** feedback produces a representative product, session, talk-track, or
  operations question
- **THEN** the future evaluation flow can link the example to the originating
  answer run, expected behavior, failure category, and reviewed knowledge
  snapshot

### Requirement: Web discovery remains review-only
The Q&A answer contract SHALL define public-source discovery as a future
review-only finding flow that cannot ground future answers until approved
through the knowledge lifecycle.

#### Scenario: Web discovery is requested
- **WHEN** reviewed knowledge is insufficient and a future stage enables public
  source discovery
- **THEN** the discovery request goes through `SourceDiscoveryPort`, records
  source allowlist status, retrieval time, source type, cited claim, confidence
  reason, and review-only state

#### Scenario: Web finding is useful
- **WHEN** a web discovery finding appears useful for future product,
  live-commerce, talk-track, or operations answers
- **THEN** it enters the knowledge lifecycle with source metadata, trust level,
  retrieved time, reviewer decision, versioning, and refresh policy before it
  can ground future Q&A answers

#### Scenario: Source is not acceptable
- **WHEN** the requested source requires prohibited scraping, login bypass,
  unclear permission, weak credibility, unavailable content, or conflicts with
  reviewed knowledge
- **THEN** the finding is blocked or marked needs review and cannot be used as
  authoritative answer evidence

### Requirement: Q&A contract enforces authorization, audit, and verification
The Q&A answer contract SHALL define authorization boundaries, sensitive data
handling, audit metadata, and verification expectations before runtime work.

#### Scenario: Actor requests Q&A behavior
- **WHEN** an actor asks a question, reads an answer run, records feedback,
  requests regeneration, views discovery findings, or promotes a finding to
  review
- **THEN** the contract requires tenant/team authorization, role checks, and
  server-side enforcement

#### Scenario: Answer run is audited
- **WHEN** a Q&A answer run, retrieval snapshot, validation result, feedback
  signal, missing-knowledge signal, or discovery finding is recorded
- **THEN** the contract includes actor, timestamps, request ID, idempotency key,
  question hash or redacted question, retrieval snapshot ID, knowledge version
  IDs, prompt version, provider metadata where available, parent run when
  regenerated, and related review IDs

#### Scenario: Runtime implementation is proposed
- **WHEN** future code implements the Q&A answer contract
- **THEN** verification covers empty question, long question, mixed Chinese and
  English racket names, duplicate or alias models, ambiguous player levels,
  reviewed and unreviewed evidence, stale or conflicting knowledge, citation
  correctness, schema validation, prompt injection, sensitive-data redaction,
  retrieval failure, provider timeout, refusal, rate limit, malformed output,
  feedback recording, authorization, audit metadata, and browser states when UI
  changes
