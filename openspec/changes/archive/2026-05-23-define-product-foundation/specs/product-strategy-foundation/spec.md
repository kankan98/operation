## ADDED Requirements

### Requirement: Chinese operator workspace
The product SHALL provide a Chinese-language internal workspace for badminton racket live-commerce operators, with the working tool as the first screen rather than a public marketing landing page.

#### Scenario: Operator starts work
- **WHEN** an authenticated operator opens the application
- **THEN** the operator sees operational navigation and work surfaces for sessions, racket products, AI reviews, talk tracks, and next-session tasks

#### Scenario: Operator-facing labels
- **WHEN** the product renders primary workflow labels, states, and actions
- **THEN** the labels use clear Chinese operator-facing language unless a later spec explicitly defines another locale

### Requirement: MVP uses manual session capture
The MVP SHALL support manual capture of live-commerce session source material before any direct Douyin or commerce-platform integration is introduced.

#### Scenario: Session source is captured
- **WHEN** an operator records a live session
- **THEN** the system captures session theme, host, session date, product order, notes or transcript text, customer questions, objections, and optional performance notes

#### Scenario: Integration is requested before MVP validation
- **WHEN** a future request asks for direct Douyin, commerce, analytics, or scraping integration
- **THEN** the request requires a separate OpenSpec change that verifies official API access, terms, rate limits, data scope, failure modes, and account risk

### Requirement: Badminton racket domain language is preserved
The product SHALL model badminton racket selling workflows with domain-specific fields rather than generic item/content fields.

#### Scenario: Racket product is recorded
- **WHEN** an operator creates or edits a racket product
- **THEN** the product supports racket model, aliases, weight class, balance point, shaft stiffness, recommended string tension, player level, play style, price band, and selling points

#### Scenario: Product appears in session workflow
- **WHEN** a product is referenced in a live-session product order or analysis result
- **THEN** the UI and data model preserve the racket-specific fields needed for explanation and recommendation

### Requirement: AI output produces operational artifacts
AI-assisted features SHALL produce editable operational artifacts, not only summaries.

#### Scenario: Session analysis completes
- **WHEN** the system analyzes a live session
- **THEN** it produces a live recap, product explanation diagnosis, customer question clusters, objection patterns, talk-track improvements, short-video topic ideas, and next-session tasks when supported by source input

#### Scenario: AI suggestion is displayed
- **WHEN** an AI-generated suggestion is shown to an operator
- **THEN** the UI distinguishes it from human-entered facts and allows the operator to edit, accept, reject, or regenerate it where the workflow uses it downstream

### Requirement: Roadmap is implemented in waves
The product SHALL be developed through separately specified implementation waves so the project can validate scope and quality incrementally.

#### Scenario: First implementation change is planned
- **WHEN** implementation begins after this foundation change
- **THEN** the next OpenSpec change targets application bootstrap, package manager, baseline UI shell, lint/type/build verification, and no product-specific business logic

#### Scenario: Feature implementation is planned
- **WHEN** a new feature wave is requested
- **THEN** the change targets one coherent capability such as team access, racket product library, seed knowledge lifecycle, live-session capture, AI analysis, next-session planning, exports, or external integrations

### Requirement: Foundation artifacts guide iteration progress
The product SHALL use this OpenSpec foundation as the durable development route, architecture reference, and progress indicator for future waves.

#### Scenario: Future development begins
- **WHEN** a future implementation wave is proposed
- **THEN** the proposal references the relevant foundation decisions, updates them if they are wrong, and defines wave-specific verification before code is introduced

#### Scenario: Scope changes during development
- **WHEN** implementation reveals that the product route, architecture, public-data approach, or wave order is wrong
- **THEN** the active OpenSpec artifacts are updated before hidden assumptions are added to code

### Requirement: Product improves through a governed knowledge and AI feedback loop
The product SHALL treat continuous learning from source-backed professional data,
reviewed team knowledge, and operator feedback as a core long-term objective.

#### Scenario: Professional public data improves the knowledge base
- **WHEN** allowed public sources provide racket specifications, platform rules, live-commerce tactics, metrics, or research findings
- **THEN** the system can add them to the knowledge lifecycle with source metadata, trust level, retrieval time, review status, version history, and refresh policy

#### Scenario: AI analysis uses current knowledge
- **WHEN** AI analyzes live-session source material or proposes talk-track improvements
- **THEN** it uses selected reviewed knowledge snapshots and distinguishes source-backed facts, operator-entered facts, and AI inferences

#### Scenario: Operator feedback improves future analysis
- **WHEN** an operator edits, accepts, rejects, or regenerates an AI suggestion
- **THEN** the feedback is captured as an auditable signal for future prompt versions, evaluation examples, source-priority decisions, and analysis-rule improvements without automatically overwriting authoritative knowledge

#### Scenario: Operational usefulness is evaluated
- **WHEN** future waves add knowledge refresh or AI analysis behavior
- **THEN** verification includes whether outputs help operators prepare product explanations, answer customer questions, improve talk tracks, create short-video topics, and plan next-session tasks

### Requirement: Seed knowledge is a living product asset
The product SHALL treat public racket and live-commerce knowledge as a living, reviewable product asset rather than a one-time document.

#### Scenario: Operator opens a seeded racket record
- **WHEN** an operator views a racket product seeded from public data
- **THEN** the record shows source freshness, confidence, review status, and editable team-specific notes

#### Scenario: Knowledge refresh affects sales material
- **WHEN** a refreshed source changes a field used by talk tracks or AI suggestions
- **THEN** affected content is marked for review before operators reuse it in future sessions

### Requirement: MVP excludes public commerce and payments
The MVP SHALL exclude public shopping, checkout, payment, inventory settlement, customer account management, and public marketing pages unless a later OpenSpec change explicitly adds them.

#### Scenario: Feature request expands into commerce
- **WHEN** a requested feature includes checkout, payment, public storefront, or customer account behavior
- **THEN** the request is treated as outside MVP scope and requires a separate product and security design
