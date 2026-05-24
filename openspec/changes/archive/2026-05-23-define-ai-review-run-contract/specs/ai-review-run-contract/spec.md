## ADDED Requirements

### Requirement: AI review run contract exists
The project SHALL provide an `ai-review-run` contract draft before implementing
AI review provider calls, prompt execution, persistence, review queues, feedback
learning, talk-track handoff, or next-session task creation.

#### Scenario: Future agent prepares AI review runtime work
- **WHEN** a future change proposes real AI review execution or persistence
- **THEN** the agent starts from `docs/contracts/ai-review-run.md` and updates
  it if runtime assumptions, shapes, states, authorization, or verification
  change

#### Scenario: Contract is read
- **WHEN** an agent opens the AI review run contract
- **THEN** it can identify current status, runtime boundary, use case, domain
  entities, commands, queries, request shape, response shape, state machine,
  error cases, authorization, sensitive data, audit metadata, verification, and
  open questions

### Requirement: AI review run uses bounded input and knowledge snapshots
The AI review run contract SHALL define bounded, tenant-scoped, redacted
snapshots for session facts and reviewed knowledge instead of raw full
transcripts or broad knowledge dumps.

#### Scenario: Session snapshot is prepared
- **WHEN** a session is prepared for AI review
- **THEN** the contract identifies the minimum session fields needed for recap,
  product diagnosis, question clustering, objection analysis, talk-track
  candidates, short-video topics, and next-session task drafts

#### Scenario: Knowledge snapshot is prepared
- **WHEN** reviewed knowledge is selected for an AI review run
- **THEN** the contract includes source IDs, knowledge version IDs, review
  states, freshness, conflicts, and intended use without treating unreviewed
  findings as authoritative input

#### Scenario: Sensitive input is detected
- **WHEN** customer personal data, private messages, orders, phone numbers,
  addresses, full transcripts, or sensitive business strategy appear in the
  candidate snapshot
- **THEN** the contract requires redaction, reviewer handling, or a blocked run
  state before provider execution

### Requirement: AI review run produces structured validated outputs
The AI review run contract SHALL define structured output sections and
validation results before AI suggestions can be displayed as reviewable
artifacts or reused downstream.

#### Scenario: Structured output is generated
- **WHEN** a future AI review provider returns output
- **THEN** the output is represented as structured sections for live recap,
  product explanation diagnosis, customer question clusters, objection patterns,
  talk-track candidates, short-video topic ideas, and next-session action drafts

#### Scenario: Output validation runs
- **WHEN** structured output is received
- **THEN** the contract requires schema validation, source-grounding checks,
  empty-section checks, stale-source checks, sensitive-data checks, and
  distinction between human facts, reviewed knowledge, and AI suggestions

#### Scenario: Output is invalid
- **WHEN** output is malformed, incomplete, unsafe, unsupported by evidence, or
  inconsistent with reviewed knowledge
- **THEN** the contract records a validation failure and prevents downstream
  reuse until regenerated or handled by a reviewer

### Requirement: AI review run has explicit states and errors
The AI review run contract SHALL define a state machine and recoverable error
codes for validation, provider, schema, evidence, authorization, and sensitive
data failures.

#### Scenario: Run state changes
- **WHEN** a future AI review run moves through preparation, generation,
  validation, review, feedback, or downstream handoff
- **THEN** the contract defines allowed state transitions and invalid
  transition errors

#### Scenario: Provider or model failure occurs
- **WHEN** the provider times out, refuses, rate-limits, returns partial output,
  returns malformed structured data, or becomes unavailable
- **THEN** the contract records a non-success state, error code, recoverability,
  and retry or regeneration guidance

#### Scenario: Evidence is insufficient
- **WHEN** session facts, product facts, or reviewed knowledge are missing,
  stale, conflicting, or too weak for reliable suggestions
- **THEN** the contract requires an insufficient-evidence state rather than
  inventing unsupported recommendations

### Requirement: Human review controls feedback and downstream reuse
The AI review run contract SHALL require human review decisions before AI
suggestions become reusable talk tracks, short-video topics, next-session tasks,
knowledge feedback, or evaluation signals.

#### Scenario: Operator reviews a suggestion
- **WHEN** an operator or reviewer accepts, edits, rejects, or regenerates an AI
  suggestion
- **THEN** the contract records the actor, decision, reason, source suggestion,
  edited output when applicable, and audit timestamp

#### Scenario: Suggestion becomes downstream artifact
- **WHEN** a suggestion is used for talk tracks, short-video topics, or
  next-session tasks
- **THEN** the contract requires a reviewed or accepted state and links the
  downstream artifact to the originating run and suggestion ID

#### Scenario: Feedback reveals knowledge gap
- **WHEN** feedback indicates missing knowledge, wrong source, weak evidence, or
  repeated rejection
- **THEN** the contract routes the signal to a reviewable feedback or knowledge
  lifecycle queue rather than directly changing authoritative knowledge

### Requirement: AI review run enforces authorization, audit, and verification
The AI review run contract SHALL define authorization boundaries, sensitive data
handling, audit metadata, and verification expectations before runtime work.

#### Scenario: Actor requests an AI review run
- **WHEN** an actor creates, reads, reviews, regenerates, or exports an AI review
  run
- **THEN** the contract requires tenant/team authorization, role checks, and
  server-side enforcement

#### Scenario: Run is audited
- **WHEN** an AI review run, validation result, review decision, feedback signal,
  or downstream handoff is recorded
- **THEN** the contract includes actor, timestamps, request ID, idempotency key,
  session snapshot ID, knowledge snapshot ID, prompt version, provider metadata,
  parent run when regenerated, and related downstream IDs

#### Scenario: Runtime implementation is proposed
- **WHEN** future code implements the AI review run contract
- **THEN** verification covers schema validation, long and empty input, sensitive
  data redaction, stale or conflicting knowledge, provider timeout, refusal,
  rate limit, malformed output, authorization, audit metadata, and browser
  states when UI changes
