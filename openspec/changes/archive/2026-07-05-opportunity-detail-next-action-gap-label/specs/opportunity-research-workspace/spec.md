## ADDED Requirements

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
