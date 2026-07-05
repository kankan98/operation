# opportunity-research-workspace Specification

## Purpose
TBD - created by archiving change opportunity-research-workspace. Update Purpose after archive.
## Requirements
### Requirement: Persist opportunity research entries
The system SHALL persist product-scoped opportunity research entries independently from opportunity score calculations.

#### Scenario: Create shortlist entry
- **WHEN** a client adds a product to the opportunity research workspace
- **THEN** the system SHALL create or update a research entry with product ID, status, priority, tags, notes, archived flag, created timestamp, and updated timestamp

#### Scenario: Keep one active entry per product
- **WHEN** a client adds the same product to the workspace more than once
- **THEN** the system SHALL update the existing entry instead of creating duplicate active entries for the product

#### Scenario: Delete product cleanup
- **WHEN** a product is deleted
- **THEN** the system SHALL delete or detach its opportunity research entry so orphaned workspace rows are not returned

### Requirement: Manage research status, tags, and notes
The system SHALL let clients update research workflow metadata for shortlisted opportunities.

#### Scenario: Update research status
- **WHEN** a client updates a research entry status
- **THEN** the system SHALL persist one of the supported statuses and update the modified timestamp

#### Scenario: Normalize tags
- **WHEN** a client saves tags with repeated values, whitespace, or mixed case
- **THEN** the system SHALL return a bounded normalized tag list without duplicates

#### Scenario: Save notes
- **WHEN** a client saves notes for a research entry
- **THEN** the system SHALL persist bounded notes text without changing the product score

### Requirement: Compare researched opportunities
The system SHALL provide a bounded comparison read model for selected product opportunities.

#### Scenario: Compare selected products
- **WHEN** a client requests comparison for selected product IDs
- **THEN** the system SHALL return opportunity score, confidence, recommendation, price, acquisition health, market signals, business signals, research metadata, and missing signals for each selected product

#### Scenario: Enforce comparison limit
- **WHEN** a comparison request includes more than the configured maximum number of products
- **THEN** the system SHALL reject the request with validation feedback instead of generating an oversized comparison

#### Scenario: Preserve score determinism
- **WHEN** comparison results include research metadata
- **THEN** the system SHALL NOT change opportunity score or factor contributions because of shortlist status, notes, tags, or priority

### Requirement: Export researched opportunities
The system SHALL export selected or filtered opportunities in machine-readable formats.

#### Scenario: Export selected opportunities as CSV
- **WHEN** a client requests CSV export for selected researched products
- **THEN** the system SHALL return rows containing product identity, platform, price, score, confidence, recommendation, research status, priority, tags, top reasons, missing signals, and caveats

#### Scenario: Export selected opportunities as JSON
- **WHEN** a client requests JSON export for selected researched products
- **THEN** the system SHALL return structured export rows with the same fields as CSV export

#### Scenario: Include caveats in export
- **WHEN** export rows include market signals or business metrics
- **THEN** each row SHALL include caveats that proxy trends and merchant assumptions are not verified sales, demand, margin, ROI, or profitability facts

### Requirement: Keep research workspace observable and bounded
The system SHALL keep research workspace operations safe, bounded, and testable.

#### Scenario: Validate unsupported product
- **WHEN** a client creates research metadata for a missing product ID
- **THEN** the system SHALL return a product-not-found error

#### Scenario: Bound export size
- **WHEN** a client requests export using filters that match more than the maximum export limit
- **THEN** the system SHALL cap or reject the export according to the documented limit

#### Scenario: Test without external network
- **WHEN** research workspace tests run
- **THEN** they SHALL use local fixtures and database state without requiring live marketplace or provider network calls

### Requirement: Record manual reading from opportunity workspace
The opportunity research workspace SHALL allow users to record a manual price reading for the selected candidate while preserving the current comparison and filtering context.

#### Scenario: Open quick reading dialog from selected opportunity
- **WHEN** a user is reviewing a selected opportunity candidate
- **THEN** the workspace SHALL expose a record-reading action that opens a dialog scoped to that candidate's product

#### Scenario: Save manual reading from opportunity workspace
- **WHEN** the user submits a valid reading from the opportunity workspace
- **THEN** the frontend SHALL create a price snapshot with `source: 'manual'`, the selected product currency, and the entered fields

#### Scenario: Refresh opportunity context after manual reading
- **WHEN** the manual reading is saved successfully
- **THEN** the opportunity list and selected candidate detail SHALL refresh so score, recommendation, missing-signal context, current price, and freshness indicators can reflect the new data

#### Scenario: Keep manual entry distinct from provider acquisition
- **WHEN** the workspace recommends `check_data` or shows missing signals
- **THEN** the manual reading action SHALL be available as a user-entered data path and SHALL NOT be presented as an automated provider check

### Requirement: Display recommendation gate context
The opportunity research workspace SHALL display recommendation gate context so users understand why a candidate is ready to investigate, should only be watched, or needs more data.

#### Scenario: Show blocked recommendation gate
- **WHEN** the selected opportunity has a `recommendationGate.status` of `blocked`
- **THEN** the workspace SHALL show a visible warning that the recommendation is gated and list the gate reasons and next actions

#### Scenario: Show caution recommendation gate
- **WHEN** the selected opportunity has a `recommendationGate.status` of `caution`
- **THEN** the workspace SHALL show a caution state explaining why the recommendation should be treated as lower confidence

#### Scenario: Do not recompute gate in frontend
- **WHEN** the workspace renders recommendation gate context
- **THEN** it SHALL use the backend-provided `recommendationGate` fields rather than duplicating gate threshold logic in frontend code

### Requirement: Record opportunity decision trace
The opportunity research workspace SHALL persist one current product-scoped decision trace for a researched opportunity without changing opportunity score calculations.

#### Scenario: Save go decision with evidence snapshot
- **WHEN** a client records a `go` decision for a researched product
- **THEN** the system SHALL persist the decision, bounded reason, bounded next action, decided timestamp, and a backend-generated evidence snapshot containing score, confidence, recommendation, recommendation gate, key reasons, missing signals, business summary, and market summary

#### Scenario: Save hold or no-go decision
- **WHEN** a client records a `hold` or `no_go` decision for a researched product
- **THEN** the system SHALL replace the current decision trace for that product and update the decision timestamp

#### Scenario: Clear current decision
- **WHEN** a client clears the current decision for a researched product
- **THEN** the system SHALL remove the current decision fields while preserving research status, priority, tags, notes, archived flag, and product score inputs

#### Scenario: Decision does not affect score
- **WHEN** a client saves, updates, or clears a decision trace
- **THEN** the product's opportunity score, confidence, factor contributions, recommendation, and recommendation gate SHALL remain determined only by scoring inputs

### Requirement: Expose decision trace in research read models
The opportunity research workspace SHALL expose the current decision trace wherever research metadata is returned.

#### Scenario: Read researched opportunity decision
- **WHEN** a client reads a product's opportunity research metadata
- **THEN** the response SHALL include the current decision trace when present and `null` when no decision has been recorded

#### Scenario: List and explain opportunities with decision
- **WHEN** a product opportunity list or explanation response includes research metadata
- **THEN** the research metadata SHALL include the current decision trace without recomputing decision state in the frontend

#### Scenario: Compare opportunities with decision
- **WHEN** a client compares selected researched opportunities
- **THEN** each compared opportunity SHALL include the current decision trace in its research metadata when present

#### Scenario: Export opportunities with decision fields
- **WHEN** a client exports researched opportunities as CSV or JSON
- **THEN** each export row SHALL include decision status, reason, next action, decided timestamp, and decision snapshot score and recommendation fields

### Requirement: Validate decision trace inputs
The opportunity research workspace SHALL validate decision trace writes so stored decisions stay bounded and product-scoped.

#### Scenario: Reject unsupported decision status
- **WHEN** a client records a decision status other than `go`, `hold`, or `no_go`
- **THEN** the system SHALL reject the request with validation feedback

#### Scenario: Bound decision text
- **WHEN** a client records a decision reason or next action that exceeds the configured text limit
- **THEN** the system SHALL reject the request with validation feedback instead of truncating silently

#### Scenario: Require existing product
- **WHEN** a client records or clears a decision for a missing product ID
- **THEN** the system SHALL return a product-not-found error

### Requirement: Manage decision from selected opportunity detail
The opportunity research workspace UI SHALL let the user save and clear the current decision from the selected candidate detail without presenting the decision as an automated recommendation.

#### Scenario: Display selected opportunity decision state
- **WHEN** the selected opportunity has a current decision trace
- **THEN** the detail panel SHALL show the decision status, reason, next action, decided timestamp, and captured score or recommendation snapshot

#### Scenario: Save decision from selected opportunity
- **WHEN** the user chooses `go`, `hold`, or `no-go` and enters decision notes from the selected opportunity
- **THEN** the frontend SHALL call the decision write API for that product and refresh opportunity list, selected explanation, and research metadata queries

#### Scenario: Clear decision from selected opportunity
- **WHEN** the user clears the current selected opportunity decision
- **THEN** the frontend SHALL call the clear decision API and refresh the same opportunity context

### Requirement: Expose decision review metadata
The opportunity research workspace SHALL expose derived decision review metadata for each research entry without changing opportunity scoring.

#### Scenario: Decision with next action
- **WHEN** a research entry has a current decision with a next action
- **THEN** the response SHALL include review metadata indicating the decision exists, its status, decided timestamp, days since decision, and that a next action is present

#### Scenario: Go or hold decision missing next action
- **WHEN** a `go` or `hold` decision has no next action
- **THEN** the response SHALL mark the decision as needing a next action

#### Scenario: Stale decision
- **WHEN** a decision is older than the configured review threshold
- **THEN** the response SHALL mark the decision as stale so the user can revisit the judgment

#### Scenario: Review metadata stays non-scoring
- **WHEN** decision review metadata changes because time has passed or a next action is edited
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of review metadata

### Requirement: Filter opportunities for decision review
The opportunity research workspace SHALL let clients filter opportunity lists by decision review state.

#### Scenario: Filter by decision status
- **WHEN** a client requests opportunities with a decision status filter
- **THEN** the list SHALL include only opportunities whose current decision has that status

#### Scenario: Filter decisions needing action
- **WHEN** a client requests opportunities needing decision action
- **THEN** the list SHALL include only decided opportunities whose review metadata indicates a missing next action

#### Scenario: Filter stale decisions
- **WHEN** a client requests stale decisions
- **THEN** the list SHALL include only decided opportunities whose decision age meets or exceeds the review threshold

#### Scenario: Filter undecided opportunities
- **WHEN** a client requests undecided opportunities
- **THEN** the list SHALL include only opportunities that do not have a current decision trace

### Requirement: Surface decision review in opportunity workspace UI
The opportunity research workspace UI SHALL provide a review mode for decision follow-up without replacing the score discovery workflow.

#### Scenario: Switch to decision review mode
- **WHEN** the user chooses decision review mode
- **THEN** the workspace SHALL expose decision review filters and show counts based on the filtered opportunity list

#### Scenario: Show review badges on opportunities
- **WHEN** an opportunity has a decision review state such as stale or needs action
- **THEN** the opportunity row and selected detail SHALL show a concise badge or summary of that state

#### Scenario: Keep decision controls explicit
- **WHEN** the user edits or clears a decision from the review mode
- **THEN** the UI SHALL continue to use the explicit decision form and SHALL NOT silently change decisions or score inputs

### Requirement: Show decision next action on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level summary of saved decision next actions for researched opportunities.

#### Scenario: Display saved next action on researched row
- **WHEN** an opportunity row has research metadata with a current decision that includes `nextAction`
- **THEN** the row SHALL show the saved next action text as neutral workflow follow-up metadata

#### Scenario: Preserve missing next action badge behavior
- **WHEN** an opportunity row has a current decision without `nextAction`
- **THEN** the row SHALL continue to rely on existing decision review metadata and SHALL NOT invent or infer a next action summary

#### Scenario: Keep row next action display-only
- **WHEN** a row-level next action summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision next action in opportunity comparison
The opportunity research workspace UI SHALL show saved decision next action evidence in the opportunity comparison table when it exists.

#### Scenario: Display comparison decision next action
- **WHEN** a compared opportunity has research metadata with a current decision that includes `nextAction`
- **THEN** the comparison table decision column SHALL show the saved next action with a neutral `下一步 · ...` label

#### Scenario: Preserve missing comparison next action state
- **WHEN** a compared opportunity has no current decision or its current decision has no `nextAction`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill a next action from score, recommendation, recommendation gates, market signals, business metrics, notes, action outcomes, review metadata, or daily action plan metadata

#### Scenario: Keep comparison next action display-only
- **WHEN** a comparison table decision next action is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot score and recommendation evidence in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot summary
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot
- **THEN** the comparison table decision column SHALL show the saved snapshot score and recommendation with a neutral snapshot label

#### Scenario: Preserve comparison snapshot source
- **WHEN** the saved decision snapshot score or recommendation differs from the current opportunity score or recommendation
- **THEN** the comparison table decision column SHALL use the saved decision snapshot score and recommendation for the snapshot display

#### Scenario: Avoid inferred comparison snapshot summary
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill a decision snapshot summary from current score, current recommendation, gates, market signals, business metrics, notes, action outcomes, review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot display-only
- **WHEN** a comparison table decision snapshot summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot confidence in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot confidence in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot confidence
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot confidence
- **THEN** the comparison table decision column SHALL show the saved snapshot confidence with a neutral `快照置信度` label

#### Scenario: Preserve comparison snapshot confidence source
- **WHEN** the saved decision snapshot confidence differs from the current opportunity confidence
- **THEN** the comparison table decision column SHALL use the saved decision snapshot confidence for the `快照置信度` display

#### Scenario: Avoid inferred comparison snapshot confidence
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot confidence from current confidence, score, recommendation, gates, market signals, business metrics, notes, action outcomes, review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot confidence display-only
- **WHEN** a comparison table decision snapshot confidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot capture time in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot capture time in the opportunity comparison table when a current decision exists.

#### Scenario: Display comparison decision snapshot capture time
- **WHEN** a compared opportunity has research metadata with a current decision and saved decision snapshot capture time
- **THEN** the comparison table decision column SHALL show the saved snapshot capture time with a neutral `快照时间` label

#### Scenario: Preserve comparison snapshot capture time source
- **WHEN** the saved decision snapshot capture time differs from the decision record time, decision update time, current opportunity data, or render time
- **THEN** the comparison table decision column SHALL use the saved decision snapshot capture time for the `快照时间` display

#### Scenario: Avoid inferred comparison snapshot capture time
- **WHEN** a compared opportunity has no current decision
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot capture time from decision review metadata, decision record time, decision update time, current opportunity data, current render time, score, recommendation, gates, market signals, business metrics, notes, action outcomes, or daily action plan metadata

#### Scenario: Keep comparison decision snapshot capture time display-only
- **WHEN** a comparison table decision snapshot capture time is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot gate context in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate context in the opportunity comparison table when a current decision exists and the saved snapshot includes gate evidence.

#### Scenario: Display comparison decision snapshot gate status
- **WHEN** a compared opportunity has a current decision whose saved snapshot recommendation gate was applied, blocked, caution, or contains gate evidence
- **THEN** the comparison table decision column SHALL show the saved snapshot gate status with a neutral `快照门控` label

#### Scenario: Display comparison decision snapshot gate transition
- **WHEN** the saved decision snapshot recommendation gate was applied and contains original and final recommendations
- **THEN** the comparison table decision column SHALL show the saved recommendation transition as saved snapshot gate context

#### Scenario: Preserve comparison clear snapshot gate state
- **WHEN** a compared opportunity's saved decision snapshot recommendation gate is clear and contains no applied state, reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot gate context from the current opportunity recommendation gate, score, current recommendation, missing signals, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot gate display-only
- **WHEN** comparison table decision snapshot gate context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot gate details in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate detail evidence in the opportunity comparison table when a current decision exists and the saved snapshot recommendation gate contains detail context.

#### Scenario: Display comparison decision snapshot gate details
- **WHEN** a compared opportunity has a current decision whose saved `decision.snapshot.recommendationGate` contains one or more non-empty reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL show saved gate reasons, signals, and next actions with neutral `快照门控原因`, `快照门控信号`, and `快照门控下一步` labels

#### Scenario: Preserve comparison clear snapshot gate detail state
- **WHEN** a compared opportunity has no current decision, the saved snapshot recommendation gate is clear, or the saved snapshot recommendation gate contains no non-empty reasons, signals, or next actions
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot gate details from current opportunity recommendation gates, current score, current recommendation, current missing signals, market signals, market factors, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Preserve comparison snapshot gate detail source
- **WHEN** current opportunity recommendation gate details differ from saved `decision.snapshot.recommendationGate` details
- **THEN** the comparison table decision column SHALL use only the saved snapshot recommendation gate reasons, signals, and next actions for `快照门控原因`, `快照门控信号`, and `快照门控下一步` display

#### Scenario: Keep comparison decision snapshot gate details display-only
- **WHEN** comparison table decision snapshot gate details are displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Show decision snapshot evidence in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot reasons and gaps in the opportunity comparison table when a current decision exists and the saved snapshot contains evidence.

#### Scenario: Display comparison decision snapshot reasons
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains one or more `keyReasons`
- **THEN** the comparison table decision column SHALL show saved snapshot reasons with a neutral `快照依据 · ...` label

#### Scenario: Display comparison decision snapshot gaps
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains one or more `missingSignals`
- **THEN** the comparison table decision column SHALL show saved snapshot gaps with a neutral `快照缺口 · ...` label

#### Scenario: Preserve comparison snapshot evidence source
- **WHEN** saved decision snapshot reasons or gaps differ from current opportunity key reasons, current missing signals, score factors, recommendation gates, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time
- **THEN** the comparison table decision column SHALL use only the saved decision snapshot `keyReasons` and `missingSignals` for `快照依据` and `快照缺口`

#### Scenario: Avoid inferred comparison snapshot evidence
- **WHEN** a compared opportunity has no current decision or its saved snapshot evidence arrays are empty
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot reasons or gaps from current opportunity key reasons, current missing signals, score factors, recommendation gates, market signals, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot evidence display-only
- **WHEN** comparison table decision snapshot evidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot business summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot business completeness and missing business signals in the opportunity comparison table when a current decision exists and the saved snapshot contains business signal context.

#### Scenario: Display comparison decision snapshot business completeness
- **WHEN** a compared opportunity has a current decision with saved `decision.snapshot.businessSignals.completeness`
- **THEN** the comparison table decision column SHALL show the saved completeness with a neutral `快照业务完整度` label

#### Scenario: Display comparison decision snapshot business gaps
- **WHEN** a compared opportunity has a current decision with saved non-empty `decision.snapshot.businessSignals.missingSignals`
- **THEN** the comparison table decision column SHALL show the saved missing business signals with a neutral `快照业务缺口` label

#### Scenario: Preserve comparison decision snapshot business source
- **WHEN** current opportunity business signals differ from saved `decision.snapshot.businessSignals`
- **THEN** the comparison table decision column SHALL use only the saved snapshot business signals for `快照业务完整度` and `快照业务缺口`

#### Scenario: Avoid inferred comparison decision snapshot business summary
- **WHEN** a compared opportunity has no current decision or the saved decision snapshot has null or missing `businessSignals`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, or backfill snapshot business summary from current business signals, current business metrics, current score, current recommendation, score factors, recommendation gates, market signals, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot business summary display-only
- **WHEN** comparison table decision snapshot business summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot business metrics in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot business metric values in the opportunity comparison table when a current decision exists and the saved snapshot business signals contain metrics.

#### Scenario: Display comparison decision snapshot business metrics
- **WHEN** a compared opportunity has a current decision whose saved `decision.snapshot.businessSignals.metrics` contains net margin, ROI, breakeven sell price, or contribution profit per unit values
- **THEN** the comparison table decision column SHALL show the available saved assumption-based metric values with neutral `快照业务指标` labels

#### Scenario: Preserve comparison null snapshot business metrics state
- **WHEN** a compared opportunity has a current decision whose saved snapshot business signals have `metrics` set to `null` or missing
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot business metrics from current opportunity business signals, current business metrics, score factors, recommendation gates, market signals, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Preserve comparison snapshot business metric source
- **WHEN** current opportunity business metric values differ from saved `decision.snapshot.businessSignals.metrics`
- **THEN** the comparison table decision column SHALL use only the saved snapshot metric values for `快照业务指标` display

#### Scenario: Keep comparison decision snapshot business metrics display-only
- **WHEN** comparison table decision snapshot business metrics are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot market summary in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot market summary in the opportunity comparison table when a current decision exists and the saved snapshot contains market signal context.

#### Scenario: Display comparison decision snapshot market status
- **WHEN** a compared opportunity has a current decision whose saved snapshot contains `marketSignals`
- **THEN** the comparison table decision column SHALL show the saved market status with a neutral `快照市场状态` label

#### Scenario: Display comparison decision snapshot market provenance
- **WHEN** a compared opportunity has a current decision whose saved snapshot market signals contain provider, source, confidence, freshness, or missing signal values
- **THEN** the comparison table decision column SHALL show the available saved market provenance values with neutral `快照市场来源`, `快照市场置信度`, `快照市场新鲜度`, and `快照市场缺口` labels

#### Scenario: Preserve comparison decision snapshot market source
- **WHEN** current opportunity market signals differ from saved `decision.snapshot.marketSignals`
- **THEN** the comparison table decision column SHALL use only the saved snapshot market signals for `快照市场...` display

#### Scenario: Avoid inferred comparison decision snapshot market summary
- **WHEN** a compared opportunity has no current decision or the saved decision snapshot has null or missing `marketSignals`
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot market summary from current market signals, current market factors, current score, current recommendation, score factors, recommendation gates, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Keep comparison decision snapshot market summary display-only
- **WHEN** comparison table decision snapshot market summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show decision snapshot market factors in opportunity comparison
The opportunity research workspace UI SHALL show saved decision snapshot market factor evidence in the opportunity comparison table when a current decision exists and the saved snapshot market signals contain factors.

#### Scenario: Display comparison decision snapshot market factors
- **WHEN** a compared opportunity has a current decision whose saved `decision.snapshot.marketSignals.factors` contains one or more factor entries
- **THEN** the comparison table decision column SHALL show saved factor labels, raw values, and explanations with neutral `快照市场因子` labels

#### Scenario: Preserve comparison null snapshot market factor state
- **WHEN** a compared opportunity has no current decision, saved snapshot market signals are null, or saved snapshot market factors are empty
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill snapshot market factors from current opportunity market signals, current market factors, current score, current recommendation, score factors, recommendation gates, business metrics, notes, action outcomes, decision review metadata, daily action plan metadata, or render time

#### Scenario: Preserve comparison snapshot market factor source
- **WHEN** current opportunity market factors differ from saved `decision.snapshot.marketSignals.factors`
- **THEN** the comparison table decision column SHALL use only the saved snapshot market factors for `快照市场因子` display

#### Scenario: Keep comparison decision snapshot market factors display-only
- **WHEN** comparison table decision snapshot market factors are displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Show decision review context in opportunity comparison
The opportunity research workspace UI SHALL show current decision review workflow context in the opportunity comparison table when a compared opportunity has current decision review metadata.

#### Scenario: Display comparison decision review badges
- **WHEN** a compared opportunity has current `research.decisionReview` metadata with `needsNextAction` or `stale` set
- **THEN** the comparison table decision column SHALL show neutral workflow badges such as `待下一步` or `需复盘`

#### Scenario: Display comparison decision age
- **WHEN** a compared opportunity has a current decision and `research.decisionReview.daysSinceDecision` is available
- **THEN** the comparison table decision column SHALL show a neutral decision age label such as `今天决策`, `昨天决策`, or `N 天前决策`

#### Scenario: Avoid inferred comparison decision review context
- **WHEN** a compared opportunity has no current decision, no decision review metadata, or no decision age metadata
- **THEN** the comparison table decision column SHALL NOT invent, infer, generate, calculate, or backfill decision review badges or decision age from decision timestamps, saved decision snapshots, current score, current recommendation, recommendation gates, market signals, business metrics, notes, action outcomes, daily action plan metadata, practice summary counts, or render time

#### Scenario: Keep comparison decision review context display-only
- **WHEN** comparison table decision review context is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Show decision reason on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level summary of saved decision reasons for researched opportunities.

#### Scenario: Display saved decision reason on researched row
- **WHEN** an opportunity row has research metadata with a current decision reason
- **THEN** the row SHALL show the saved decision reason text as neutral user-authored workflow evidence

#### Scenario: Avoid inferred decision reasons
- **WHEN** an opportunity row has no current decision
- **THEN** the row SHALL NOT invent, infer, generate, or score a decision reason from opportunity score, recommendation, gates, market signals, business metrics, notes, or action outcomes

#### Scenario: Keep row decision reason display-only
- **WHEN** a row-level decision reason summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Label decision evidence in selected opportunity detail
The opportunity research workspace UI SHALL show neutral labels for saved decision evidence in the selected opportunity decision detail.

#### Scenario: Display selected detail decision reason label
- **WHEN** the selected opportunity has a current decision reason
- **THEN** the decision detail SHALL show the saved reason with a neutral `决策依据 · ...` label

#### Scenario: Display selected detail next action label
- **WHEN** the selected opportunity has a current decision next action
- **THEN** the decision detail SHALL show the saved next action with a neutral `下一步 · ...` label

#### Scenario: Preserve absent next action state
- **WHEN** the selected opportunity has a current decision without a next action
- **THEN** the decision detail SHALL NOT invent or infer a next action label

#### Scenario: Keep selected detail decision evidence display-only
- **WHEN** selected detail decision evidence labels are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot evidence in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot evidence in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot reasons
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains one or more `keyReasons`
- **THEN** the decision detail SHALL show the saved snapshot reasons with a neutral `快照依据 · ...` label

#### Scenario: Display selected detail snapshot gaps
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains one or more `missingSignals`
- **THEN** the decision detail SHALL show the saved snapshot gaps with a neutral `快照缺口 · ...` label

#### Scenario: Preserve empty snapshot evidence state
- **WHEN** the selected opportunity decision snapshot has empty `keyReasons` or `missingSignals`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot evidence from current opportunity key reasons, current missing signals, recommendation gates, market signals, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot evidence display-only
- **WHEN** selected detail snapshot evidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot confidence in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot confidence in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot confidence
- **WHEN** the selected opportunity has a current decision with saved snapshot confidence
- **THEN** the decision detail SHALL show the saved snapshot confidence with a neutral `快照置信度` label

#### Scenario: Preserve snapshot confidence source
- **WHEN** current opportunity confidence differs from the saved decision snapshot confidence
- **THEN** the decision detail SHALL use the saved snapshot confidence for the `快照置信度` value

#### Scenario: Keep selected detail snapshot confidence display-only
- **WHEN** selected detail snapshot confidence is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot capture time in selected opportunity detail
The opportunity research workspace UI SHALL show the saved decision snapshot capture time in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot capture time
- **WHEN** the selected opportunity has a current decision with a saved snapshot `capturedAt` timestamp
- **THEN** the decision detail SHALL show that saved timestamp with a neutral `快照时间 · ...` label

#### Scenario: Preserve snapshot capture time source
- **WHEN** the saved snapshot `capturedAt` differs from decision `decidedAt`, decision `updatedAt`, current opportunity timestamps, or the current render time
- **THEN** the decision detail SHALL use the saved snapshot `capturedAt` value for the `快照时间` display

#### Scenario: Keep selected detail snapshot capture time display-only
- **WHEN** selected detail snapshot capture time is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot business summary in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot business summary context in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot business completeness
- **WHEN** the selected opportunity has a current decision with saved snapshot business signals
- **THEN** the decision detail SHALL show the saved business completeness with a neutral `快照业务完整度` label

#### Scenario: Display selected detail snapshot business gaps
- **WHEN** the selected opportunity decision snapshot business signals contain missing signals
- **THEN** the decision detail SHALL show those saved missing business signals with a neutral `快照业务缺口` label

#### Scenario: Preserve snapshot business source
- **WHEN** current opportunity business signals differ from the saved decision snapshot business signals
- **THEN** the decision detail SHALL use the saved snapshot business signals for the `快照业务完整度` and `快照业务缺口` values

#### Scenario: Keep selected detail snapshot business summary display-only
- **WHEN** selected detail snapshot business summary context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot business metrics in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot business metric values in the selected opportunity decision detail without recomputing or inferring them from current opportunity data.

#### Scenario: Display selected detail snapshot business metrics
- **WHEN** the selected opportunity has a current decision whose saved snapshot business signals contain metrics
- **THEN** the decision detail SHALL show saved assumption-based business metric values with neutral `快照业务指标` labels

#### Scenario: Preserve null snapshot business metrics state
- **WHEN** the selected opportunity decision snapshot business signals have `metrics` set to `null`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot business metrics from current opportunity business signals, current business metrics, score factors, recommendation gates, market signals, notes, action outcomes, or decision review metadata

#### Scenario: Preserve snapshot business metric source
- **WHEN** current opportunity business metric values differ from the saved decision snapshot business metric values
- **THEN** the decision detail SHALL use the saved snapshot metric values for the `快照业务指标` display

#### Scenario: Keep selected detail snapshot business metrics display-only
- **WHEN** selected detail snapshot business metrics are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot market summary in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot market summary in the selected opportunity decision detail without recomputing or inferring it from current opportunity data.

#### Scenario: Display selected detail snapshot market status
- **WHEN** the selected opportunity has a current decision whose saved snapshot contains `marketSignals`
- **THEN** the decision detail SHALL show the saved snapshot market status with a neutral `快照市场状态 · ...` label

#### Scenario: Display selected detail snapshot market context
- **WHEN** the selected opportunity decision snapshot contains market provider, source, confidence, freshness, or missing-signal context
- **THEN** the decision detail SHALL show those saved snapshot market fields as neutral historical evidence labels

#### Scenario: Preserve null snapshot market state
- **WHEN** the selected opportunity decision snapshot has `marketSignals` set to `null`
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot market context from current opportunity market signals, current missing signals, recommendation gates, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot market summary display-only
- **WHEN** selected detail snapshot market summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot market factors in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot market factors in the selected opportunity decision detail without recomputing or inferring them from current opportunity data.

#### Scenario: Display selected detail snapshot market factors
- **WHEN** the selected opportunity has a current decision whose saved snapshot market signals contain one or more factors
- **THEN** the decision detail SHALL show saved factor labels, values, and explanations with neutral `快照市场因子` labels

#### Scenario: Preserve empty snapshot market factors state
- **WHEN** the selected opportunity decision snapshot market signals are `null` or contain an empty `factors` array
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot market factors from current opportunity market signals, current score factors, recommendation gates, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Preserve snapshot market factor source
- **WHEN** current opportunity market factors differ from the saved decision snapshot market factors
- **THEN** the decision detail SHALL use the saved snapshot market factors for the `快照市场因子` display

#### Scenario: Keep selected detail snapshot market factors display-only
- **WHEN** selected detail snapshot market factors are displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision snapshot gate context in selected opportunity detail
The opportunity research workspace UI SHALL show saved decision snapshot recommendation gate context in the selected opportunity decision detail when that saved snapshot includes gate evidence.

#### Scenario: Display selected detail snapshot gate status
- **WHEN** the selected opportunity has a current decision whose saved snapshot recommendation gate was applied, blocked, caution, or contains gate evidence
- **THEN** the decision detail SHALL show the saved snapshot gate status with a neutral `快照门控` label

#### Scenario: Display selected detail snapshot gate evidence
- **WHEN** the selected opportunity decision snapshot recommendation gate contains reasons, signals, or next actions
- **THEN** the decision detail SHALL show those saved gate reasons, signals, or next actions as saved snapshot gate context

#### Scenario: Preserve clear snapshot gate state
- **WHEN** the selected opportunity decision snapshot recommendation gate is clear and contains no applied state, reasons, signals, or next actions
- **THEN** the decision detail SHALL NOT invent, infer, generate, or backfill snapshot gate context from the current opportunity recommendation gate, score, missing signals, market signals, business metrics, notes, action outcomes, or decision review metadata

#### Scenario: Keep selected detail snapshot gate display-only
- **WHEN** selected detail snapshot gate context is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show next-action gap in selected decision detail
The opportunity research workspace UI SHALL show a neutral selected-detail next-action gap indicator when current decision review metadata says the decision needs a next action.

#### Scenario: Display selected detail next-action gap
- **WHEN** the selected opportunity has a current decision and `decisionReview.needsNextAction` is true
- **THEN** the decision detail SHALL show a neutral `待补下一步` indicator near the saved decision evidence

#### Scenario: Preserve saved next action detail
- **WHEN** the selected opportunity has a current decision next action
- **THEN** the decision detail SHALL continue to show the saved `下一步 · ...` text instead of the next-action gap indicator

#### Scenario: Avoid inferred next-action gaps
- **WHEN** the selected opportunity has no current decision, a no-go decision that does not need a next action, or no decision review metadata
- **THEN** the decision detail SHALL NOT invent or infer a next-action gap indicator

#### Scenario: Keep selected detail next-action gap display-only
- **WHEN** the selected detail next-action gap indicator is displayed
- **THEN** the UI SHALL NOT generate next action text, change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show decision age on opportunity rows
The opportunity research workspace UI SHALL show a concise row-level decision age summary for researched opportunities with current decision review metadata.

#### Scenario: Display row decision age
- **WHEN** an opportunity row has research metadata with a current decision and `decisionReview.daysSinceDecision`
- **THEN** the row SHALL show a neutral decision age label such as `今天决策`, `昨天决策`, or `N 天前决策`

#### Scenario: Avoid age for undecided rows
- **WHEN** an opportunity row has no current decision or no decision age metadata
- **THEN** the row SHALL NOT invent or infer a decision age summary

#### Scenario: Keep row decision age display-only
- **WHEN** a row-level decision age summary is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show neutral decision age in selected opportunity detail
The opportunity research workspace UI SHALL show neutral day-level decision age labels in the selected opportunity decision detail when current decision review metadata is available.

#### Scenario: Display selected detail decision age
- **WHEN** the selected opportunity has a current decision and `decisionReview.daysSinceDecision`
- **THEN** the decision detail SHALL show a neutral label such as `今天决策`, `昨天决策`, or `N 天前决策`

#### Scenario: Preserve selected detail no-decision state
- **WHEN** the selected opportunity has no current decision or no decision age metadata
- **THEN** the decision detail SHALL continue to show the no-current-decision state instead of inventing a decision age

#### Scenario: Keep selected detail decision age display-only
- **WHEN** the selected detail decision age label is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Expose opportunity review summary
The opportunity research workspace SHALL expose a derived summary of active research and decision review workload without changing opportunity scoring.

#### Scenario: Summarize active research queue
- **WHEN** a client requests the opportunity review summary
- **THEN** the response SHALL include counts for total active research entries, decided entries, undecided entries, entries needing a next action, and stale decisions

#### Scenario: Summarize status and priority buckets
- **WHEN** a client requests the opportunity review summary
- **THEN** the response SHALL include counts grouped by research status and research priority

#### Scenario: Summary excludes archived entries by default
- **WHEN** archived research entries exist
- **THEN** the default opportunity review summary SHALL count only active non-archived research entries

#### Scenario: Summary remains non-scoring
- **WHEN** opportunity review summary counts change because workflow metadata changes
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of summary metadata

### Requirement: Surface review summary in opportunity workspace UI
The opportunity research workspace UI SHALL show a compact review summary so the user can see current operating workload before selecting filters.

#### Scenario: Display queue summary cards
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show summary counts for active research entries, undecided entries, decisions needing next action, and stale decisions

#### Scenario: Keep summary scoped to workflow state
- **WHEN** summary cards are displayed
- **THEN** the UI SHALL label them as review/workflow queue counts and SHALL NOT present them as sales, demand, margin, ROI, or score evidence

### Requirement: Show review summary generated time
The opportunity research workspace UI SHALL show the returned review summary generation time when review summary data is loaded.

#### Scenario: Display loaded review summary generated time
- **WHEN** the review summary cards have loaded summary data with `generatedAt`
- **THEN** the cards SHALL show the saved generated time with a neutral `汇总时间` label

#### Scenario: Preserve missing review summary generated time state
- **WHEN** the review summary is loading, missing, or has no saved `generatedAt`
- **THEN** the cards SHALL NOT invent, infer, generate, calculate, or backfill review summary generated time from render time, daily action plan metadata, practice summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep review summary generated time display-only
- **WHEN** review summary generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Apply review filters from summary cards
The opportunity research workspace UI SHALL let the user navigate from review summary cards to existing review-filtered candidate lists.

#### Scenario: Apply active research summary filter
- **WHEN** the user selects the active research summary card
- **THEN** the workspace SHALL show researched active candidates using existing review filter state without changing opportunity scoring

#### Scenario: Apply undecided summary filter
- **WHEN** the user selects the undecided summary card
- **THEN** the workspace SHALL show candidates using the existing undecided decision review filter

#### Scenario: Apply needs-action summary filter
- **WHEN** the user selects the needs-next-action summary card
- **THEN** the workspace SHALL show candidates using the existing needs-action decision review filter

#### Scenario: Apply stale summary filter
- **WHEN** the user selects the stale review summary card
- **THEN** the workspace SHALL show candidates using the existing stale decision review filter

#### Scenario: Keep review summary filters non-scoring
- **WHEN** a review summary card applies a filter
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

#### Scenario: Clear detached action context
- **WHEN** a review summary card applies a filter after a daily action or practice bucket selected transient action context
- **THEN** the UI SHALL clear that transient action context instead of carrying it into the newly filtered candidate set

### Requirement: Show active review summary filter state
The opportunity research workspace UI SHALL show which review summary card matches the current review-summary queue filter.

#### Scenario: Display active review summary card
- **WHEN** the current opportunity workspace filter state matches a review summary card's existing queue filter
- **THEN** that card SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive review summary cards unpressed
- **WHEN** a review summary card does not match the current opportunity workspace filter state
- **THEN** that card SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed views
- **WHEN** additional discovery, research, decision-status, or practice filters narrow the candidate list beyond the review summary card's queue filter
- **THEN** the review summary cards SHALL NOT claim active state for that narrowed view

#### Scenario: Keep active state display-only
- **WHEN** review summary active state is displayed
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Expose daily opportunity action plan
The opportunity research workspace SHALL expose a derived daily action plan for active research entries without changing opportunity scoring.

#### Scenario: Return ordered action items
- **WHEN** a client requests the daily opportunity action plan
- **THEN** the response SHALL include workflow action items with stable identifiers, labels, priority, counts, reasons, suggested filter state, generated timestamp, deterministic playbook guidance, and a non-scoring caveat

#### Scenario: Return playbook guidance
- **WHEN** the daily opportunity action plan contains an action item
- **THEN** each action item SHALL include a learning goal, bounded execution steps, and bounded completion criteria for that action type

#### Scenario: Prioritize review discipline
- **WHEN** multiple action categories have matching active entries
- **THEN** the action plan SHALL order missing-next-action decisions before stale decisions, stale decisions before undecided candidates, and undecided candidates before general research continuation

#### Scenario: Omit empty actions
- **WHEN** an action category has zero matching active entries
- **THEN** the action plan SHALL omit that action item from the returned list

#### Scenario: Action plan excludes archived entries
- **WHEN** archived research entries exist
- **THEN** the daily action plan SHALL count only active non-archived research entries

#### Scenario: Action plan remains non-scoring
- **WHEN** action plan counts or playbook guidance change because workflow metadata changes
- **THEN** opportunity score, confidence, recommendation, recommendation gate, and factor contributions SHALL NOT change because of action plan metadata

### Requirement: Surface daily action plan in opportunity workspace UI
The opportunity research workspace UI SHALL show a compact daily action plan so the user can start review work from explicit workflow actions.

#### Scenario: Display workflow action list
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show daily action items with labels, counts, workflow reasons, learning goals, execution steps, and completion criteria near the review summary

#### Scenario: Apply suggested review filters
- **WHEN** the user selects a daily action item
- **THEN** the workspace SHALL apply that action item's suggested review filter state using the existing opportunity list filters

#### Scenario: Keep action plan scoped to workflow practice
- **WHEN** daily action items are displayed
- **THEN** the UI SHALL label them as workflow or review actions and SHALL NOT present them as sales, demand, margin, ROI, or score evidence

### Requirement: Expose daily action plan active state
The opportunity research workspace UI SHALL expose a display-only active state for daily action plan items when the current UI state exactly represents the selected daily action queue.

#### Scenario: Mark selected daily action item active
- **WHEN** the user selects a daily action plan item and the current UI filters exactly match that item
- **THEN** that daily action item SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive daily action items unpressed
- **WHEN** a daily action item does not match the current selected daily action context and exact UI filters
- **THEN** that daily action item SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed daily action views
- **WHEN** extra discovery, research, review, practice, shortlist, operations, or decision-status filters narrow a daily action view beyond the selected action item's filters
- **THEN** daily action plan items SHALL NOT claim active state for that narrowed view

#### Scenario: Keep daily action active state display-only
- **WHEN** daily action active state is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action plan counts, persisted research state, reminders, alerts, schedules, analytics, or training grades

### Requirement: Show daily action plan generated time
The opportunity research workspace UI SHALL show the returned daily action plan generation time when a daily action plan is loaded.

#### Scenario: Display loaded daily action plan generated time
- **WHEN** the daily action plan panel has a loaded plan with `generatedAt`
- **THEN** the panel SHALL show the saved generated time with a neutral `计划时间` label

#### Scenario: Preserve missing daily action plan generated time state
- **WHEN** the daily action plan is loading, missing, or has no saved `generatedAt`
- **THEN** the panel SHALL NOT invent, infer, generate, calculate, or backfill daily action plan generated time from render time, review summary metadata, practice summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep daily action plan generated time display-only
- **WHEN** daily action plan generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Record daily action outcome
The opportunity research workspace SHALL let clients record the latest completed daily action outcome for a product-scoped research entry.

#### Scenario: Save action outcome
- **WHEN** a client records an action outcome for an existing researched product
- **THEN** the system SHALL persist the daily action id, bounded outcome text, completion timestamp, and update timestamp on that research entry

#### Scenario: Validate action outcome
- **WHEN** a client records an action outcome with an unsupported action id or oversized outcome text
- **THEN** the system SHALL reject the request with validation feedback instead of storing partial outcome metadata

#### Scenario: Clear action outcome
- **WHEN** a client clears the action outcome for a researched product
- **THEN** the system SHALL remove the latest action outcome fields while preserving research status, priority, tags, notes, archived flag, decisions, and product score inputs

#### Scenario: Require existing product for outcome writes
- **WHEN** a client records or clears an action outcome for a missing product ID
- **THEN** the system SHALL return a product-not-found error

### Requirement: Expose daily action outcomes in research read models
The opportunity research workspace SHALL expose latest daily action outcome metadata wherever research metadata is returned.

#### Scenario: Read research entry outcome
- **WHEN** a client reads a product's opportunity research metadata
- **THEN** the response SHALL include the latest action outcome when present and `null` when no outcome has been recorded

#### Scenario: Include outcome in opportunity lists and comparisons
- **WHEN** a product opportunity list or comparison response includes research metadata
- **THEN** the research metadata SHALL include latest action outcome metadata without recomputing outcome state in the frontend

#### Scenario: Export outcome fields
- **WHEN** a client exports researched opportunities as CSV or JSON
- **THEN** each export row SHALL include latest action id, latest action outcome, and latest action completion timestamp fields

#### Scenario: Outcome metadata remains non-scoring
- **WHEN** action outcome metadata is saved, cleared, or exported
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of outcome metadata

### Requirement: Surface daily action outcomes in opportunity workspace UI
The opportunity research workspace UI SHALL let the user record and inspect latest action outcomes from the review flow.

#### Scenario: Show latest outcome on selected opportunity
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the detail panel SHALL show the action label, outcome text, and completion timestamp as workflow practice evidence

#### Scenario: Record outcome from selected opportunity
- **WHEN** the user records a daily action outcome from the selected opportunity
- **THEN** the frontend SHALL call the action outcome write API and refresh opportunity list, selected explanation, comparison, and research metadata queries

#### Scenario: Clear outcome from selected opportunity
- **WHEN** the user clears the latest action outcome
- **THEN** the frontend SHALL call the clear API and refresh the same opportunity context

#### Scenario: Keep outcomes scoped to workflow practice
- **WHEN** action outcome metadata is displayed
- **THEN** the UI SHALL label it as workflow or review practice evidence and SHALL NOT present it as sales, demand, margin, ROI, score, or market evidence

### Requirement: Show latest action outcome in opportunity comparison
The opportunity research workspace UI SHALL show saved latest action outcome evidence in the opportunity comparison table when it exists.

#### Scenario: Display comparison latest action outcome
- **WHEN** a compared opportunity has research metadata with a saved `lastActionOutcome`
- **THEN** the comparison table SHALL show the saved action label, completion recency, and outcome text as neutral workflow practice evidence

#### Scenario: Preserve missing comparison outcome state
- **WHEN** a compared opportunity has no research metadata or has no saved `lastActionOutcome`
- **THEN** the comparison table SHALL NOT invent, infer, generate, or backfill an action outcome from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep comparison action outcome display-only
- **WHEN** a comparison table latest action outcome is displayed
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, or scoring input

### Requirement: Show action outcome completion time in opportunity comparison
The opportunity research workspace UI SHALL show saved latest action outcome completion time in the opportunity comparison table when a compared opportunity has a saved latest action outcome.

#### Scenario: Display comparison latest action outcome completion time
- **WHEN** a compared opportunity has research metadata with a saved `lastActionOutcome.completedAt`
- **THEN** the comparison table action outcome column SHALL show the saved completion time with a neutral `完成时间` label

#### Scenario: Preserve missing comparison outcome completion time state
- **WHEN** a compared opportunity has no research metadata, no saved `lastActionOutcome`, or no saved `lastActionOutcome.completedAt`
- **THEN** the comparison table SHALL NOT invent, infer, generate, calculate, or backfill action outcome completion time from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, business metrics, action outcome update time, or render time

#### Scenario: Keep comparison action outcome completion time display-only
- **WHEN** comparison table latest action outcome completion time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Set action outcome completion date in opportunity workspace UI
The opportunity research workspace UI SHALL let the user set the latest daily action outcome completion date when recording workflow practice evidence.

#### Scenario: Default new action outcome completion date
- **WHEN** the selected opportunity has no saved latest action outcome
- **THEN** the action outcome form SHALL default the completion date control to the user's current local date

#### Scenario: Preserve saved action outcome completion date
- **WHEN** the selected opportunity has a saved latest action outcome
- **THEN** the action outcome form SHALL initialize the completion date control from the saved `completedAt` timestamp

#### Scenario: Save selected action completion date
- **WHEN** the user saves an action outcome with a selected completion date
- **THEN** the frontend SHALL send `completedAt` using the selected date through the existing action outcome write API

#### Scenario: Keep completion date scoped to workflow evidence
- **WHEN** action outcome completion dates are displayed or saved
- **THEN** the UI SHALL label them as workflow practice evidence and SHALL NOT present them as sales, demand, margin, ROI, score, market evidence, a reminder, a streak, or a training grade

### Requirement: Guard action outcome completion dates
The opportunity research workspace SHALL prevent future completion dates from being saved as latest daily action outcome evidence.

#### Scenario: Reject future action outcome completion timestamp
- **WHEN** a client records an action outcome with `completedAt` later than the current server time
- **THEN** the system SHALL reject the request with validation feedback instead of storing the future-dated outcome

#### Scenario: Allow present and past action outcome completion dates
- **WHEN** a client records an action outcome with `completedAt` at or before the current server time
- **THEN** the system SHALL accept the completion timestamp if the rest of the request is valid

#### Scenario: Prevent future completion date selection in workspace UI
- **WHEN** the user records an action outcome from the opportunity workspace
- **THEN** the completion date control SHALL prevent dates after the user's current local date and SHALL NOT submit future-dated completion evidence

#### Scenario: Keep date guard scoped to workflow evidence
- **WHEN** a future completion date is blocked
- **THEN** the system SHALL NOT create reminders, scheduled actions, streaks, training grades, AI coaching, or scoring changes from the blocked date

### Requirement: Expose opportunity practice summary
The opportunity research workspace SHALL expose a derived practice summary for active research entries without changing opportunity scoring.

#### Scenario: Summarize action outcome coverage
- **WHEN** a client requests the opportunity practice summary
- **THEN** the response SHALL include total active research entries, entries with a latest action outcome, entries without a latest action outcome, counts by daily action id, latest completion timestamp, generated timestamp, and a non-scoring caveat

#### Scenario: Practice summary excludes archived entries
- **WHEN** archived research entries exist
- **THEN** the practice summary SHALL count only active non-archived research entries

#### Scenario: Practice summary uses stable action buckets
- **WHEN** no entries have outcomes for one or more known daily action ids
- **THEN** the response SHALL still include zero counts for those action ids

#### Scenario: Practice summary remains non-scoring
- **WHEN** latest action outcomes are saved, cleared, or summarized
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of practice summary metadata

### Requirement: Surface practice summary in opportunity workspace UI
The opportunity research workspace UI SHALL show compact practice coverage so the user can see whether action guidance is turning into recorded execution.

#### Scenario: Display practice coverage cards
- **WHEN** the opportunity workspace loads
- **THEN** the UI SHALL show active count, with-outcome count, without-outcome count, and latest completion timestamp near the review summary and daily action plan

#### Scenario: Display action bucket counts
- **WHEN** the practice summary includes counts by action id
- **THEN** the UI SHALL show the known daily action labels with their recorded outcome counts

#### Scenario: Keep practice summary scoped to workflow evidence
- **WHEN** practice summary metadata is displayed
- **THEN** the UI SHALL label it as workflow or practice coverage and SHALL NOT present it as sales, demand, margin, ROI, score, market evidence, or a training grade

### Requirement: Show practice summary generated time
The opportunity research workspace UI SHALL show the returned practice summary generation time when practice summary data is loaded.

#### Scenario: Display loaded practice summary generated time
- **WHEN** the practice summary strip has loaded summary data with `generatedAt`
- **THEN** the strip SHALL show the saved generated time with a neutral `汇总时间` label

#### Scenario: Preserve missing practice summary generated time state
- **WHEN** the practice summary is loading, missing, or has no saved `generatedAt`
- **THEN** the strip SHALL NOT invent, infer, generate, calculate, or backfill practice summary generated time from render time, daily action plan metadata, review summary metadata, action outcome metadata, decision metadata, score, recommendation, recommendation gates, market signals, or business metrics

#### Scenario: Keep practice summary generated time display-only
- **WHEN** practice summary generated time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Show practice summary latest completion recency
The opportunity research workspace UI SHALL show a display-only recency label for the practice summary latest completion timestamp.

#### Scenario: Display practice summary latest recency
- **WHEN** the practice summary has a latest action completion timestamp
- **THEN** the practice summary latest completion card SHALL show a day-level recency label as the primary value and keep the absolute completion time visible as secondary detail

#### Scenario: Preserve empty latest completion state
- **WHEN** the practice summary has no latest action completion timestamp
- **THEN** the practice summary latest completion card SHALL continue to show an empty state instead of a recency label

#### Scenario: Keep summary recency neutral
- **WHEN** the practice summary latest completion recency label is displayed
- **THEN** the UI SHALL present it as neutral workflow evidence metadata and SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence

### Requirement: Filter opportunities by practice outcome metadata
The opportunity research workspace SHALL let clients filter opportunity and research lists by latest daily action outcome coverage without changing opportunity scoring.

#### Scenario: Filter entries with recorded action outcomes
- **WHEN** a client requests opportunity or research lists with the practice outcome filter set to recorded outcomes
- **THEN** the response SHALL include only non-archived researched entries that have a latest action outcome

#### Scenario: Filter entries missing action outcomes
- **WHEN** a client requests opportunity or research lists with the practice outcome filter set to missing outcomes
- **THEN** the response SHALL include only non-archived researched entries that do not have a latest action outcome

#### Scenario: Filter entries by latest action id
- **WHEN** a client requests opportunity or research lists with a known daily action id filter
- **THEN** the response SHALL include only entries whose latest action outcome uses that action id

#### Scenario: Practice filters remain non-scoring
- **WHEN** practice outcome filters are applied or latest action outcomes are saved or cleared
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of practice filter metadata

### Requirement: Apply practice filters from opportunity workspace UI
The opportunity research workspace UI SHALL let the user navigate from practice coverage summary controls to the filtered candidate list.

#### Scenario: Apply missing outcome filter
- **WHEN** the user selects the missing-outcome control from the practice summary area
- **THEN** the workspace SHALL show researched candidates without latest action outcomes using the existing opportunity list surface

#### Scenario: Apply action bucket filter
- **WHEN** the user selects a known daily action bucket from the practice summary area
- **THEN** the workspace SHALL show researched candidates whose latest action outcome uses that action id

#### Scenario: Keep practice filter labels scoped to workflow evidence
- **WHEN** practice filters are displayed or applied
- **THEN** the UI SHALL label them as workflow practice evidence filters and SHALL NOT present them as sales, demand, margin, ROI, score, market evidence, or a training grade

### Requirement: Show active practice summary filter state
The opportunity research workspace UI SHALL show which practice summary control matches the current practice coverage filter.

#### Scenario: Display active action-outcome coverage control
- **WHEN** the current opportunity workspace filter state matches a practice summary action-outcome coverage filter
- **THEN** that practice summary control SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Display active action bucket control
- **WHEN** the current opportunity workspace filter state matches a practice summary action bucket filter
- **THEN** that action bucket control SHALL show visual active state and expose `aria-pressed=true`

#### Scenario: Keep inactive practice summary controls unpressed
- **WHEN** a practice summary control does not match the current opportunity workspace filter state
- **THEN** that control SHALL expose `aria-pressed=false`

#### Scenario: Avoid active state for narrowed practice views
- **WHEN** additional discovery, research, review, shortlist, or operational filters narrow the candidate list beyond the practice summary control's filter
- **THEN** the practice summary controls SHALL NOT claim active state for that narrowed view

#### Scenario: Keep practice active state display-only
- **WHEN** practice summary active state is displayed
- **THEN** the UI SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale thresholds, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Export opportunities with practice filters
The opportunity research workspace SHALL let filtered exports preserve latest daily action outcome filter context without changing opportunity scoring.

#### Scenario: Export entries with recorded action outcomes
- **WHEN** a client requests an opportunity research export using `filters.actionOutcome=with`
- **THEN** the export SHALL include only non-archived researched entries that have a latest action outcome

#### Scenario: Export entries missing action outcomes
- **WHEN** a client requests an opportunity research export using `filters.actionOutcome=without`
- **THEN** the export SHALL include only non-archived researched entries that do not have a latest action outcome

#### Scenario: Export entries by latest action id
- **WHEN** a client requests an opportunity research export using `filters.actionId` set to a known daily action id
- **THEN** the export SHALL include only entries whose latest action outcome uses that action id

#### Scenario: Export current practice view from workspace
- **WHEN** the opportunity workspace has an active practice filter and the user exports by filters rather than selected product IDs
- **THEN** the frontend SHALL include the active practice filter fields in the export request

#### Scenario: Practice export filters remain non-scoring
- **WHEN** practice outcome filters are used for export
- **THEN** opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, and factor contributions SHALL NOT change because of the export filter metadata

### Requirement: Carry selected action context into outcome recording
The opportunity research workspace UI SHALL preserve the selected workflow action context long enough to help the user record the matching latest action outcome.

#### Scenario: Prefill outcome action from daily action
- **WHEN** the user selects a daily action item and opens a candidate without an existing latest action outcome
- **THEN** the action outcome form SHALL default to that daily action id

#### Scenario: Prefill outcome action from practice bucket
- **WHEN** the user selects a practice summary action bucket and opens a candidate without an existing latest action outcome
- **THEN** the action outcome form SHALL default to that bucket action id

#### Scenario: Preserve existing saved outcome
- **WHEN** the selected candidate already has a latest action outcome
- **THEN** the form SHALL show the saved action id and outcome text instead of overwriting them with transient context

#### Scenario: Keep action context scoped to workflow evidence
- **WHEN** action context is displayed or used to prefill the form
- **THEN** the UI SHALL label it as workflow action context and SHALL NOT present it as sales, demand, margin, ROI, score, market evidence, or a training grade

### Requirement: Show action context source labels
The opportunity research workspace UI SHALL show the source of transient workflow action context when that context preselects an action outcome type.

#### Scenario: Label daily action context source
- **WHEN** the action outcome form is prefilled from a selected daily action plan item
- **THEN** the form SHALL show a source label indicating the context came from a daily action plan

#### Scenario: Label practice bucket context source
- **WHEN** the action outcome form is prefilled from a selected practice summary action bucket
- **THEN** the form SHALL show a source label indicating the context came from a practice bucket

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a transient action context source label

#### Scenario: Keep context source labels display-only
- **WHEN** an action context source label is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, or training grades

### Requirement: Show manual action context overrides
The opportunity research workspace UI SHALL show when the selected action outcome type manually differs from the transient workflow action context.

#### Scenario: Display manual override from daily action context
- **WHEN** a daily action context preselects an action outcome type and the user manually chooses a different action outcome type before saving
- **THEN** the form SHALL show the original context action and the current action type that will be saved

#### Scenario: Display manual override from practice bucket context
- **WHEN** a practice bucket context preselects an action outcome type and the user manually chooses a different action outcome type before saving
- **THEN** the form SHALL show the original context action and the current action type that will be saved

#### Scenario: Keep selected action guidance current
- **WHEN** a manual action context override is displayed
- **THEN** completion criteria and evidence prompts SHALL continue to match the current selected action outcome type

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a manual transient context override indicator

#### Scenario: Keep manual override display-only
- **WHEN** a manual action context override indicator is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades

### Requirement: Expose action context semantic labels
The opportunity research workspace UI SHALL expose transient workflow action context as one semantic label when that context is displayed in the action outcome form.

#### Scenario: Label daily action context semantics
- **WHEN** the action outcome form is prefilled from a daily action context for a candidate without a saved latest action outcome
- **THEN** the displayed context SHALL expose a semantic label that includes the daily action source and the preselected action type

#### Scenario: Label practice bucket context semantics
- **WHEN** the action outcome form is prefilled from a practice bucket context for a candidate without a saved latest action outcome
- **THEN** the displayed context SHALL expose a semantic label that includes the practice bucket source and the preselected action type

#### Scenario: Label manual override semantics
- **WHEN** the user manually chooses an action outcome type that differs from the transient workflow action context before saving
- **THEN** the displayed context SHALL expose a semantic label that includes the original preselected action type and the current action type that will be saved

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT expose a transient action context semantic label

#### Scenario: Keep semantic label display-only
- **WHEN** an action context semantic label is exposed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades

### Requirement: Show selected action outcome summary
The opportunity research workspace UI SHALL show a neutral summary of the currently selected action outcome type before users save latest action outcome evidence.

#### Scenario: Display default selected action summary
- **WHEN** the selected candidate has no saved latest action outcome and no transient workflow action context
- **THEN** the action outcome form SHALL show the current selected action type that will be saved

#### Scenario: Display context-selected action summary
- **WHEN** transient workflow action context preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome form SHALL show the current selected action type alongside the transient context display

#### Scenario: Update selected action summary
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the selected action summary SHALL update to match the newly selected action type

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the form SHALL show the saved action outcome and SHALL NOT show a separate unsaved selected action summary

#### Scenario: Keep selected action summary display-only
- **WHEN** the selected action summary is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades

### Requirement: Clear stale action context after manual filter edits
The opportunity research workspace UI SHALL clear transient workflow action context when manual navigation or filter changes can detach the selected candidate set from the previously selected daily action or practice bucket.

#### Scenario: Clear daily action context after manual filter edit
- **WHEN** a daily action selection has set transient action context and the user manually changes workspace mode, list sorting, shortlist-only, discovery filters, research filters, or review filters
- **THEN** the UI SHALL clear the transient action context so a candidate without saved latest outcome falls back to the default action outcome type

#### Scenario: Preserve explicit action context selections
- **WHEN** the user selects a daily action plan item or a practice action bucket
- **THEN** the UI SHALL continue to set transient action context for that explicit workflow action selection

#### Scenario: Preserve saved outcome priority
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the action outcome form SHALL continue to show the saved action id and outcome text instead of using or clearing transient context as the source of truth

#### Scenario: Keep context clearing non-scoring
- **WHEN** transient action context is cleared
- **THEN** the UI SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, persistence, reminders, alerts, streaks, training grades, AI coaching, analytics, or action history

### Requirement: Show action outcome completion criteria
The opportunity research workspace UI SHALL show deterministic completion criteria for the selected daily action while the user records latest action outcome evidence.

#### Scenario: Display criteria for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome form SHALL display the selected action id's completion criteria near the outcome entry fields

#### Scenario: Update criteria when action type changes
- **WHEN** the user changes the selected action outcome type
- **THEN** the displayed completion criteria SHALL update to match the newly selected action id

#### Scenario: Show criteria for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome form SHALL display completion criteria for that preselected action id

#### Scenario: Keep criteria as workflow guidance
- **WHEN** completion criteria are displayed in the action outcome form
- **THEN** the UI SHALL present them as workflow practice guidance and SHALL NOT turn them into reminders, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence

### Requirement: Label action outcome completion criteria action
The opportunity research workspace UI SHALL identify which selected daily action type the action outcome completion criteria apply to.

#### Scenario: Display selected action on completion criteria
- **WHEN** the action outcome form displays completion criteria for a selected action type
- **THEN** the completion criteria panel SHALL show the selected action type label

#### Scenario: Update completion criteria action label
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the completion criteria action label SHALL update to match the newly selected action type

#### Scenario: Label transient context criteria
- **WHEN** transient workflow action context preselects an action outcome type
- **THEN** the completion criteria panel SHALL show the preselected action type label

#### Scenario: Label saved outcome criteria
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the completion criteria panel SHALL show the saved action outcome type label

#### Scenario: Keep criteria action label display-only
- **WHEN** the completion criteria action label is displayed
- **THEN** it SHALL NOT change opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, action outcome persistence, reminders, alerts, schedules, analytics, action history, AI coaching, or training grades

### Requirement: Show action outcome evidence prompts
The opportunity research workspace UI SHALL provide static evidence-writing prompts for the selected daily action while the user records latest action outcome evidence.

#### Scenario: Display prompt for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome text field SHALL expose a prompt aligned to the selected action id

#### Scenario: Update prompt when action type changes
- **WHEN** the user changes the selected action outcome type
- **THEN** the action outcome prompt SHALL update to match the newly selected action id

#### Scenario: Show prompt for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the action outcome text field SHALL expose the prompt for that preselected action id

#### Scenario: Keep prompts as manual evidence guidance
- **WHEN** action outcome prompts are displayed
- **THEN** the UI SHALL NOT use them for semantic validation, reminders, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence

### Requirement: Show visible action outcome evidence prompt
The opportunity research workspace UI SHALL show the selected action's evidence-writing prompt as visible guidance while users record latest action outcome evidence.

#### Scenario: Display visible prompt for selected action
- **WHEN** the action outcome form is shown for a selected action type
- **THEN** the form SHALL show visible evidence-writing guidance aligned to that selected action type

#### Scenario: Update visible prompt when action changes
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the visible evidence-writing guidance SHALL update to match the newly selected action type

#### Scenario: Show visible prompt for transient context
- **WHEN** transient workflow action context preselects an action outcome type
- **THEN** the visible evidence-writing guidance SHALL match the preselected action type

#### Scenario: Show visible prompt for saved outcome
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the visible evidence-writing guidance SHALL match the saved action outcome type

#### Scenario: Keep visible prompt as manual guidance
- **WHEN** visible evidence-writing guidance is displayed
- **THEN** it SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Associate action outcome evidence prompt with input
The opportunity research workspace UI SHALL associate the visible selected action evidence prompt with the action outcome input as descriptive text while users record latest action outcome evidence.

#### Scenario: Reference visible prompt from action outcome input
- **WHEN** the action outcome form is shown for a selected action type
- **THEN** the action outcome text field SHALL reference the visible evidence-writing guidance as its accessible description

#### Scenario: Keep associated prompt synchronized with action selection
- **WHEN** the selected action outcome type changes before saving
- **THEN** the action outcome text field's accessible description SHALL continue to reference the visible evidence-writing guidance for the current selected action type

#### Scenario: Keep accessible prompt as manual guidance
- **WHEN** the action outcome input references the visible evidence-writing guidance
- **THEN** the association SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Show action outcome evidence examples
The opportunity research workspace UI SHALL show action-specific evidence examples while users record latest action outcome evidence.

#### Scenario: Display examples for selected action outcome type
- **WHEN** the user records an action outcome from the selected opportunity detail
- **THEN** the action outcome form SHALL show visible evidence examples aligned to the selected action id

#### Scenario: Update examples when action type changes
- **WHEN** the user changes the selected action outcome type before saving
- **THEN** the visible evidence examples SHALL update to match the newly selected action id

#### Scenario: Show examples for transient action context
- **WHEN** a daily action or practice bucket preselects an action outcome type for a candidate without a saved latest action outcome
- **THEN** the visible evidence examples SHALL match the preselected action id

#### Scenario: Show examples for saved outcome
- **WHEN** the selected candidate already has a saved latest action outcome
- **THEN** the visible evidence examples SHALL match the saved action outcome type

#### Scenario: Describe action outcome input with visible examples
- **WHEN** visible evidence examples are shown beside the action outcome input
- **THEN** the action outcome text field SHALL reference those examples as part of its accessible description

#### Scenario: Keep examples as manual guidance
- **WHEN** action outcome evidence examples are displayed
- **THEN** the UI SHALL NOT treat them as required templates, perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Fill action outcome record frame
The opportunity research workspace UI SHALL allow users to fill an empty latest action outcome input with an editable static record frame for the selected action type.

#### Scenario: Fill frame for selected action
- **WHEN** the action outcome input is empty and the user activates the record-frame fill control
- **THEN** the action outcome input SHALL be populated with an editable static frame aligned to the current selected action id

#### Scenario: Update available frame when action changes
- **WHEN** the user changes the selected action outcome type before filling a frame
- **THEN** the record-frame fill control SHALL use the newly selected action id's static frame

#### Scenario: Preserve existing manual outcome text
- **WHEN** the action outcome input already contains text
- **THEN** the record-frame fill control SHALL be unavailable and SHALL NOT overwrite the existing text

#### Scenario: Keep frame fill manual before save
- **WHEN** the record-frame fill control populates the action outcome input
- **THEN** the UI SHALL NOT automatically save the action outcome

#### Scenario: Keep record frames as manual writing support
- **WHEN** action outcome record frames are displayed or filled
- **THEN** the UI SHALL NOT treat frame headings as required fields, perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Fill decision evidence frame
The opportunity research workspace UI SHALL allow users to fill an empty selected opportunity decision reason with an editable static evidence frame for the current decision status.

#### Scenario: Fill frame for selected decision status
- **WHEN** the decision reason input is empty and the user activates the decision evidence frame fill control
- **THEN** the decision reason input SHALL be populated with an editable static frame aligned to the current selected decision status

#### Scenario: Update available frame when decision status changes
- **WHEN** the user changes the selected decision status before filling a frame
- **THEN** the decision evidence frame fill control SHALL use the newly selected decision status's static frame

#### Scenario: Preserve existing manual decision evidence
- **WHEN** the decision reason input already contains text
- **THEN** the decision evidence frame fill control SHALL be unavailable and SHALL NOT overwrite the existing text

#### Scenario: Keep frame fill manual before save
- **WHEN** the decision evidence frame fill control populates the decision reason input
- **THEN** the UI SHALL NOT automatically save the opportunity decision

#### Scenario: Keep decision frames as manual writing support
- **WHEN** decision evidence frames are displayed or filled
- **THEN** the UI SHALL NOT treat frame headings as required fields, perform semantic validation, create reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, persistent task systems, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, factor contributions, or decision snapshots

### Requirement: Guide workflow evidence text length in opportunity workspace UI
The opportunity research workspace UI SHALL show bounded text length guidance for manual decision and action outcome evidence before the user saves it.

#### Scenario: Display decision text length guidance
- **WHEN** the user edits a selected opportunity decision reason or next action
- **THEN** the decision form SHALL show the current text length and configured maximum for each field near the corresponding input

#### Scenario: Display action outcome text length guidance
- **WHEN** the user edits the selected opportunity latest action outcome
- **THEN** the action outcome form SHALL show the current text length and configured maximum near the outcome input

#### Scenario: Prevent over-limit evidence submission
- **WHEN** a decision reason, decision next action, or action outcome exceeds its configured maximum length
- **THEN** the workspace SHALL disable the relevant save action instead of knowingly submitting over-limit workflow evidence

#### Scenario: Keep length guidance neutral
- **WHEN** text length guidance is displayed or used to disable saving
- **THEN** the UI SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Explain unavailable evidence saves in opportunity workspace UI
The opportunity research workspace UI SHALL show concise local save-readiness guidance when selected opportunity decision or action outcome evidence cannot currently be saved.

#### Scenario: Explain unavailable decision save
- **WHEN** the selected opportunity decision save action is unavailable because required decision evidence is missing or over the configured text limit
- **THEN** the decision form SHALL show a concise reason near the save controls

#### Scenario: Explain unavailable action outcome save
- **WHEN** the selected opportunity action outcome save action is unavailable because the research entry is missing, the outcome text is missing or over the configured text limit, or the completion date is missing, invalid, or future-dated
- **THEN** the action outcome form SHALL show a concise reason near the save controls

#### Scenario: Hide blocker when evidence can be saved
- **WHEN** the selected opportunity decision or action outcome save action is available
- **THEN** the form SHALL hide the local blocker hint for that save action

#### Scenario: Keep blocker hints neutral
- **WHEN** save blocker hints are displayed
- **THEN** the UI SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Associate action outcome save controls with visible guidance
The opportunity research workspace UI SHALL associate the action outcome save control with visible save-scope and save-readiness guidance while users record latest action outcome evidence.

#### Scenario: Reference save scope from action outcome save control
- **WHEN** the action outcome form is shown for a selected opportunity
- **THEN** the action outcome save control SHALL reference the visible save-scope guidance as its accessible description

#### Scenario: Reference unavailable-save hint from disabled action outcome save control
- **WHEN** the action outcome save control is unavailable and a local save-readiness hint is visible
- **THEN** the action outcome save control SHALL reference that visible hint as part of its accessible description

#### Scenario: Keep save guidance display-only
- **WHEN** action outcome save guidance is referenced by the save control
- **THEN** the association SHALL NOT perform semantic validation, create reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions

### Requirement: Show action outcome recency labels
The opportunity research workspace UI SHALL show display-only recency labels for latest action outcome completion timestamps so users can scan workflow evidence freshness.

#### Scenario: Display selected outcome recency
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the selected detail action outcome panel SHALL show a day-level recency label alongside the completion timestamp

#### Scenario: Display compact summary recency
- **WHEN** an opportunity research summary shows a latest action outcome
- **THEN** the summary SHALL include a day-level recency label for the latest action outcome

#### Scenario: Use neutral recency labels
- **WHEN** action outcome recency labels are displayed
- **THEN** the UI SHALL present them as neutral workflow evidence metadata and SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence

### Requirement: Show action outcome completion time on opportunity rows
The opportunity research workspace UI SHALL show saved latest action outcome completion time in opportunity list row research summaries when a row has a saved latest action outcome.

#### Scenario: Display row latest action outcome completion time
- **WHEN** an opportunity row has research metadata with a saved `lastActionOutcome.completedAt`
- **THEN** the row research summary SHALL show the saved completion time with a neutral `完成时间` label

#### Scenario: Preserve missing row outcome completion time state
- **WHEN** an opportunity row has no research metadata, no saved `lastActionOutcome`, or no saved `lastActionOutcome.completedAt`
- **THEN** the row research summary SHALL NOT invent, infer, generate, calculate, or backfill action outcome completion time from notes, decisions, decision review metadata, daily action plan metadata, practice summary counts, score, recommendation, recommendation gates, market signals, business metrics, action outcome update time, or render time

#### Scenario: Keep row action outcome completion time display-only
- **WHEN** row latest action outcome completion time is displayed
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs

### Requirement: Show missing action outcome on opportunity rows
The opportunity research workspace UI SHALL show neutral row-level workflow practice evidence when an active researched opportunity is missing a latest daily action outcome.

#### Scenario: Display missing outcome indicator on active researched row
- **WHEN** an opportunity row has an active non-archived research entry with no latest action outcome
- **THEN** the row SHALL show a neutral missing-action-outcome indicator as workflow practice evidence

#### Scenario: Preserve existing outcome row summary
- **WHEN** an opportunity row has a latest action outcome
- **THEN** the row SHALL continue to show the action label, recency label, and outcome text instead of the missing-action-outcome indicator

#### Scenario: Keep row indicator neutral
- **WHEN** the missing-action-outcome indicator is displayed
- **THEN** the UI SHALL NOT create stale filters, reminders, alerts, streaks, training grades, AI coaching, analytics, scoring inputs, or additional persistence

### Requirement: Show missing action outcome in selected opportunity detail
The opportunity research workspace UI SHALL show neutral selected-detail workflow practice evidence when an active researched opportunity is missing a latest daily action outcome.

#### Scenario: Display selected detail missing outcome indicator
- **WHEN** the selected opportunity has an active non-archived research entry with no latest action outcome
- **THEN** the selected detail action outcome panel SHALL show a neutral `待补行动结果` indicator as workflow practice evidence

#### Scenario: Preserve saved outcome detail
- **WHEN** the selected opportunity has a latest action outcome
- **THEN** the selected detail action outcome panel SHALL continue to show the action label, completion timestamp, recency label, and outcome text instead of the missing-outcome indicator

#### Scenario: Avoid inactive outcome gaps
- **WHEN** the selected opportunity is not researched or its research entry is archived
- **THEN** the selected detail action outcome panel SHALL NOT show the active missing-outcome indicator

#### Scenario: Keep selected detail indicator neutral
- **WHEN** the selected detail missing-outcome indicator is displayed
- **THEN** the UI SHALL NOT create stale filters, reminders, alerts, scheduled actions, streaks, training grades, AI coaching, analytics, action history, scoring inputs, persistence changes, or changes to opportunity score, confidence, recommendation, recommendation gate, market signals, business metrics, or factor contributions
