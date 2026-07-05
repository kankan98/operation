## ADDED Requirements

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
- **THEN** the display SHALL NOT change score, confidence, recommendation, recommendation gates, market signals, business metrics, persistence, automation, reminders, alerts, scheduled actions, stale filters, streaks, training grades, AI coaching, analytics, historical tasks, or scoring inputs
