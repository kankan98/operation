## ADDED Requirements

### Requirement: AI review workbench shows evidence confidence for the selected run
The `/ai-review` workbench SHALL summarize evidence confidence for the selected
AI review run using existing run detail fields without requiring a new API,
database table, provider call, RAG retrieval, or external analytics.

#### Scenario: Selected run has generated output
- **WHEN** an authenticated V0 operator selects an AI review run with output,
  sections, validation results, decisions, and feedback signals
- **THEN** the workbench SHALL show a compact Chinese evidence confidence panel
  with overall confidence, source coverage, validation warning or blocker count,
  review progress, feedback hotspot summary, and the next recommended review
  action

#### Scenario: Selected run is prepared but not generated
- **WHEN** the selected run is input-ready and has no generated sections
- **THEN** the workbench SHALL show an evidence confidence empty state that
  tells the operator to generate suggestions before judging reuse readiness

#### Scenario: Evidence confidence uses safe data only
- **WHEN** the evidence confidence panel renders
- **THEN** it SHALL NOT expose raw cookies, auth references, provider keys, full
  prompts, provider payloads, database URLs, full transcripts, customer personal
  data, or protected cross-team data

### Requirement: AI review section cards explain evidence and reuse readiness
Generated AI review section cards SHALL explain whether each section is ready
for human review or downstream draft use by showing source coverage, confidence,
review state, feedback issues, and concise next-action guidance.

#### Scenario: Section has weak evidence signals
- **WHEN** a generated section has no source refs, low or unknown confidence,
  wrong-source feedback, missing-knowledge feedback, evidence-weak feedback, or
  run-level validation warnings
- **THEN** the section card SHALL display operator-facing guidance that the
  section needs evidence review before reuse

#### Scenario: Section is accepted and downstream eligible
- **WHEN** a generated section maps to a downstream artifact and its review
  state is accepted or edited
- **THEN** the section card SHALL keep the downstream action visible while still
  showing evidence and feedback guidance that may require later review

#### Scenario: Section is not reviewed
- **WHEN** a generated section is still pending, rejected, or marked for
  regeneration
- **THEN** the section card SHALL NOT imply that the suggestion is safe to reuse
  downstream and SHALL keep existing downstream gates intact

### Requirement: AI review evidence confidence remains usable on desktop and mobile
The evidence confidence panel and section guidance SHALL fit the existing
operational workbench layout on desktop and mobile.

#### Scenario: Responsive evidence cockpit
- **WHEN** `/ai-review` renders with the evidence confidence panel on desktop
  and mobile viewport sizes
- **THEN** status labels, counts, guidance text, and review controls SHALL remain
  readable without horizontal overflow, incoherent overlap, or unstable control
  resizing
