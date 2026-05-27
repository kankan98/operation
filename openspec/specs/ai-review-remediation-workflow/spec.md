# ai-review-remediation-workflow Specification

## Purpose
TBD - created by archiving change improve-ai-review-remediation-workflow. Update Purpose after archive.
## Requirements
### Requirement: AI review remediation plan prioritizes repair actions
The system SHALL derive a deterministic remediation plan for a selected AI
review run from existing safe run detail, evidence confidence, quality triage,
validation results, feedback signals, review state, confidence, source refs, and
downstream eligibility.

#### Scenario: Validation blockers take first priority
- **WHEN** a selected AI review run has failed or blocked validation results
- **THEN** the remediation plan SHALL place validation repair first, mark
  downstream reuse as blocked, name affected sections when known, and direct the
  operator to resolve validation before reuse

#### Scenario: Feedback repair routes are prioritized
- **WHEN** a selected AI review run has missing-knowledge, wrong-source, or
  evidence-weak feedback signals
- **THEN** the remediation plan SHALL create ordered repair actions for
  knowledge review, source review, or prompt/evidence review without changing
  authoritative knowledge, source trust, or prompt versions

#### Scenario: Human review is required before downstream reuse
- **WHEN** generated sections remain pending human review
- **THEN** the remediation plan SHALL include human review as an action before
  downstream draft guidance and SHALL keep downstream state blocked for those
  sections

#### Scenario: Clean accepted sections can continue to drafts
- **WHEN** accepted or edited downstream-capable sections have no higher-priority
  remediation issue
- **THEN** the remediation plan SHALL surface downstream draft creation as a
  permissible next action while keeping publication and task completion
  human-gated

### Requirement: AI review remediation plan is operator-facing and explainable
The `/ai-review` workbench SHALL show a compact remediation panel that helps an
operator understand what to fix first, why it matters, which sections are
affected, and what to check next.

#### Scenario: Remediation panel renders clear action cards
- **WHEN** an authenticated V0 operator loads a generated AI review run
- **THEN** the browser workflow SHALL display Chinese action labels, priority,
  route label, affected section count, downstream block state, and next check
  guidance for the current remediation plan

#### Scenario: No generated output stays actionable
- **WHEN** a selected AI review run has no generated sections
- **THEN** the remediation panel SHALL direct the operator to generate review
  suggestions before judging repair priority

#### Scenario: Panel remains dense on mobile
- **WHEN** the remediation panel is viewed on a mobile-width viewport
- **THEN** action labels, badges, section names, and guidance SHALL wrap without
  horizontal page overflow or incoherent text overlap

### Requirement: AI review remediation remains review-only and safe
Remediation guidance SHALL be derived from already-protected AI review detail
and SHALL NOT mutate knowledge, source trust, prompt versions, provider
configuration, downstream publication, or task completion.

#### Scenario: Remediation does not mutate protected records
- **WHEN** remediation identifies knowledge, source, prompt, validation, human
  review, downstream draft, or evaluation repair
- **THEN** the system SHALL show review guidance only and SHALL NOT publish
  knowledge, edit sources, change prompt versions, publish talk tracks, complete
  tasks, or call a live provider

#### Scenario: Remediation data is redacted
- **WHEN** remediation plan data is computed, verified, or rendered
- **THEN** it SHALL NOT expose raw cookies, auth references, provider keys, full
  prompts, provider payloads, database URLs, full transcripts, customer personal
  data, stack traces, or protected cross-team data

### Requirement: AI review remediation is verifiable without live provider calls
The project SHALL provide repeatable local verification for remediation planning
without calling live DeepSeek or any external provider by default.

#### Scenario: Local V0 check validates remediation plan
- **WHEN** `pnpm ai-review:v0-check` runs against local PostgreSQL
- **THEN** it SHALL verify remediation priority ordering, repair route labels,
  affected section counts, downstream gating, next-check guidance, and sensitive
  data redaction using deterministic fake-provider run detail

