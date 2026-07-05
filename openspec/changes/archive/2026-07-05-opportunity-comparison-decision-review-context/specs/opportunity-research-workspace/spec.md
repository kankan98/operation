## ADDED Requirements

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
