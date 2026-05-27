# ai-review-quality-triage Specification

## Purpose
TBD - created by archiving change improve-ai-review-quality-triage. Update Purpose after archive.
## Requirements
### Requirement: AI review quality triage summarizes run repair priority
The system SHALL derive a deterministic quality triage summary for a selected AI review run using existing safe run detail fields, including generated sections, validation results, confidence, source references, human review state, feedback signals, and downstream eligibility.

#### Scenario: Run has blocking validation
- **WHEN** a selected AI review run has failed or blocked validation results
- **THEN** the quality triage summary SHALL mark the run as blocked, prioritize validation repair, and SHALL NOT mark downstream reuse as ready

#### Scenario: Run has feedback repair hotspot
- **WHEN** a selected AI review run has missing-knowledge, wrong-source, or evidence-weak feedback signals
- **THEN** the quality triage summary SHALL surface the highest-priority hotspot and route the repair to knowledge review, source review, prompt review, or evaluation review without changing authoritative records

#### Scenario: Run is accepted and downstream eligible
- **WHEN** a selected AI review run has accepted or edited downstream-capable sections and no higher-priority blocker
- **THEN** the quality triage summary SHALL mark the run as downstream-ready and still identify that downstream artifacts remain draft or reviewable

#### Scenario: Run has no generated output
- **WHEN** a selected AI review run has no generated sections
- **THEN** the quality triage summary SHALL show a not-generated state and direct the operator to generate suggestions before quality triage can judge reuse readiness

### Requirement: AI review quality triage explains section repair paths
The system SHALL derive section-level repair guidance that explains why each generated section is ready for review, needs evidence repair, needs knowledge/source repair, requires human review, or can continue to a downstream draft.

#### Scenario: Section lacks source or confidence
- **WHEN** a generated section has no source references, low confidence, unknown confidence, or run-level validation warnings
- **THEN** the section triage SHALL show concise repair reasons and SHALL NOT imply that the section is safe for downstream reuse without human review

#### Scenario: Section has knowledge or source feedback
- **WHEN** a generated section has missing-knowledge or wrong-source feedback
- **THEN** the section triage SHALL route the repair toward knowledge or source review and SHALL keep downstream guidance in a needs-review state even if the section was previously accepted

#### Scenario: Section is accepted and clean
- **WHEN** a generated section maps to a downstream artifact, has accepted or edited human review state, and has no higher-priority repair issue
- **THEN** the section triage SHALL mark it ready for downstream draft creation while keeping publication and task completion human-gated

### Requirement: AI review quality triage is safe and review-only
Quality triage SHALL be derived from already-protected AI review run detail and SHALL NOT expose sensitive metadata or mutate knowledge, source trust, prompt versions, provider configuration, downstream publication, or task completion.

#### Scenario: Triage renders safe data
- **WHEN** a quality triage summary or section repair path is shown in the browser
- **THEN** it SHALL NOT expose raw cookies, auth references, provider keys, full prompts, provider payloads, database URLs, full transcripts, customer personal data, or protected cross-team data

#### Scenario: Triage routes repair without mutation
- **WHEN** triage identifies a knowledge, source, prompt, validation, or evaluation repair route
- **THEN** it SHALL remain a review signal and SHALL NOT automatically publish knowledge, edit sources, change prompt versions, publish talk tracks, or complete next-session tasks

### Requirement: AI review quality triage is verifiable without live provider calls
The project SHALL provide repeatable local verification for quality triage without calling live DeepSeek or any external provider by default.

#### Scenario: Local V0 check validates triage
- **WHEN** the focused AI review V0 verifier runs against local PostgreSQL
- **THEN** it SHALL verify blocker priority, feedback repair routing, section-level repair reasons, downstream gating, and sensitive-data redaction using deterministic run detail
