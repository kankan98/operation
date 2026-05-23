## ADDED Requirements

### Requirement: Roadmap is coordinated with the continuous goal
The autonomous development roadmap SHALL reference the AI continuous
development goal as the durable objective that explains why and how future
self-directed work is selected.

#### Scenario: Roadmap is used for continuation
- **WHEN** an agent uses the roadmap to choose a next development wave
- **THEN** it cross-checks the goal document for target users, user-value
  expectations, research policy, collaboration needs, and completion evidence

#### Scenario: Roadmap receives a new durable gap
- **WHEN** implementation, verification, research, or user feedback reveals a
  durable product gap, risk, or sequencing change
- **THEN** the roadmap and goal document are updated together when both are
  affected, preserving OpenSpec-first workflow for non-trivial changes
