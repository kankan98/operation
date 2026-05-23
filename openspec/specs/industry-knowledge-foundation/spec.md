# industry-knowledge-foundation Specification

## Purpose
Define how public badminton racket and live-commerce knowledge becomes a source-backed, reviewable, refreshable, versioned product asset that can ground operator workflows and AI analysis without replacing human judgment.
## Requirements
### Requirement: Public seed knowledge is source-backed
The product SHALL seed badminton racket and live-commerce operating knowledge from public sources with source metadata, trust level, retrieval date, and review state.

#### Scenario: Public racket source is imported
- **WHEN** an official or public racket source is added to the knowledge registry
- **THEN** the system records source URL, source type, brand or platform, retrieval time, allowed collection method, extracted fields, confidence, and next refresh due time

#### Scenario: Source claim is used in operations
- **WHEN** a selling point, product comparison, or operating recommendation is shown to an operator
- **THEN** the UI can distinguish official specs, platform guidance, academic/industry research, retailer references, community signals, internal operator facts, and AI inferences

#### Scenario: Public data is incomplete
- **WHEN** a source lacks fields such as balance point, shaft stiffness, stringing advice, or player level
- **THEN** the system leaves those fields unknown or review-only instead of inventing values

### Requirement: Seed knowledge refreshes over time
The seed knowledge base SHALL support recurring updates, stale detection, conflict review, and version history instead of being maintained as a static document.

#### Scenario: Scheduled refresh finds unchanged data
- **WHEN** a refresh job checks a source and extracted fields match the published record
- **THEN** the system updates last verified time and keeps the current published version

#### Scenario: Scheduled refresh finds changed data
- **WHEN** a refresh job detects changed specifications, claims, platform rules, metrics, or source availability
- **THEN** the system creates a proposed version with a diff, marks it for human review, and does not silently overwrite the published record

#### Scenario: Source becomes stale
- **WHEN** a knowledge record passes its refresh due time without successful verification
- **THEN** the operator workspace marks the record as stale and avoids using it as a high-confidence source for new AI suggestions

### Requirement: Human review governs publishable knowledge
The product SHALL require human review before seeded public knowledge becomes publishable team knowledge for sales scripts, comparisons, or AI grounding.

#### Scenario: New source record is created
- **WHEN** ingestion creates a new racket, claim, platform rule, or operating tactic
- **THEN** the record starts as draft, needs review, or reference-only until a reviewer accepts it

#### Scenario: Conflicting sources exist
- **WHEN** two sources disagree about a racket specification, selling claim, platform metric, or operating rule
- **THEN** the system shows the conflicting values with source URLs, retrieval dates, trust levels, and reviewer resolution notes

#### Scenario: Published knowledge is corrected
- **WHEN** a reviewer edits or supersedes a published record
- **THEN** the previous version remains auditable and can be restored if the correction is wrong

### Requirement: Knowledge taxonomy preserves badminton and live-commerce meaning
The seed knowledge model SHALL preserve racket-specific and live-commerce-specific concepts rather than flattening them into generic content records.

#### Scenario: Racket knowledge is normalized
- **WHEN** a racket source is normalized
- **THEN** it supports brand, series, model, aliases, SKU, weight class, average weight, grip size, length, balance, balance point, shaft flex or stiffness, frame material, shaft material, string pattern, stringing advice or maximum tension, player level, play style, price band, selling points, and technology tags where available

#### Scenario: Live-commerce knowledge is normalized
- **WHEN** operating knowledge is normalized
- **THEN** it supports session theme, host behavior, product order, product explanation checkpoints, customer questions, objections, product-click signals, conversion signals, trust signals, short-video topics, and next-session actions where available

### Requirement: Collection avoids platform and compliance risk
The knowledge ingestion process SHALL avoid scraping, automation, or data collection practices that violate platform terms or create account risk.

#### Scenario: A source requires restricted access
- **WHEN** a public or platform source requires login, bypassing controls, or unsupported automation
- **THEN** the system records the source as manual-review or unsupported until an official API, export, feed, or permitted method is documented

#### Scenario: A source contains sensitive business data
- **WHEN** internal operator knowledge, customer comments, transcripts, pricing strategy, or campaign performance is added to the knowledge base
- **THEN** it is treated as tenant-protected business data and is not mixed into global public seed knowledge

### Requirement: Seed knowledge grounds but does not replace operator judgment
The product SHALL use seed knowledge to assist operators and AI analysis while preserving operator control.

#### Scenario: AI uses seed knowledge
- **WHEN** AI generates product explanations, question clusters, talk-track improvements, short-video topics, or next-session tasks
- **THEN** the output references the source-backed records it used and remains editable, rejectable, and regenerable by operators

#### Scenario: Operator overrides seed knowledge
- **WHEN** an operator edits a seeded fact or selling point for their team
- **THEN** the override is stored as team knowledge with reviewer metadata and does not change the global public source record without review

### Requirement: Knowledge feedback improves AI grounding over time
The knowledge lifecycle SHALL support feedback signals that help future AI
analysis become more accurate, useful, and aligned with operator workflows.

#### Scenario: AI suggestion receives operator feedback
- **WHEN** an operator accepts, edits, rejects, or regenerates an AI suggestion that used seed knowledge
- **THEN** the system can record the feedback with analysis run metadata, source snapshot references, prompt version, and reviewer context for later evaluation

#### Scenario: Feedback indicates weak knowledge
- **WHEN** repeated operator feedback shows a source-backed record is stale, ambiguous, missing, or misleading
- **THEN** the affected knowledge record is marked for refresh or review instead of silently changing published knowledge

#### Scenario: Feedback improves future prompts
- **WHEN** feedback is used to improve AI prompts, schemas, or analysis rules
- **THEN** the change is versioned and verified against representative examples before affecting operator-facing suggestions
