## ADDED Requirements

### Requirement: Feedback evidence informs V0.9 readiness
The V0 trial feedback evidence summary SHALL be usable as an input to the V0.9
trial readiness cockpit without exposing unscoped or sensitive feedback content.

#### Scenario: Evidence drives readiness focus
- **WHEN** scoped feedback evidence includes a recommendation, hotspot
  workbench, hotspot issue type, low-rating counts, or real-work blocker signals
- **THEN** the readiness cockpit SHALL use those signals to choose the next
  evaluation focus and SHALL keep the recommendation deterministic

#### Scenario: Sparse evidence is not overclaimed
- **WHEN** fewer than three scoped feedback records are available
- **THEN** the readiness cockpit SHALL treat feedback evidence as insufficient
  for broad V0/V1 prioritization and SHALL recommend collecting more complete
  trial path feedback

#### Scenario: Feedback safety boundaries are preserved
- **WHEN** feedback evidence appears in the readiness cockpit
- **THEN** the workspace SHALL NOT render raw cookies, session references,
  database URLs, provider configuration, API keys, authorization headers, stack
  traces, raw transcripts, raw prompts, or cross-team feedback

