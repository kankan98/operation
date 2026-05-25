## ADDED Requirements

### Requirement: Trial MVP copy is concise and action-oriented
The workspace SHALL describe trial MVP state, unavailable features, and recovery
actions using concise operator-facing copy.

#### Scenario: Trial feature is available
- **WHEN** an evaluator sees an implemented trial workbench or action
- **THEN** the copy SHALL name the operator task and next action, such as记录场次,
  复核资料, 生成复盘, 整理话术, or 安排任务

#### Scenario: Trial feature is unavailable
- **WHEN** a trial workbench, provider-gated mode, protected route, or downstream
  action is unavailable
- **THEN** the copy SHALL explain what the evaluator can do next and SHALL NOT
  expose OpenSpec, backend, database, provider SDK, environment variable, cookie,
  or route implementation details

#### Scenario: Trial recovery is shown
- **WHEN** retry, refresh, logout, re-enter, reload, or fallback actions are
  shown
- **THEN** labels SHALL fit their controls on mobile and desktop and SHALL be
  understandable without reading documentation

### Requirement: Trial MVP layout remains usable on desktop and mobile
The workspace SHALL keep trial MVP navigation, status panels, controls, and
workbench summaries readable without incoherent overlap or horizontal text
overflow.

#### Scenario: Desktop trial route renders
- **WHEN** an evaluator opens a trial MVP route on desktop
- **THEN** primary trial status, route navigation, and workbench action controls
  SHALL be visible, keyboard focusable, and stable during loading or error
  transitions

#### Scenario: Mobile trial route renders
- **WHEN** an evaluator opens a trial MVP route around 390px viewport width
- **THEN** text, buttons, badges, segmented controls, and route navigation SHALL
  wrap or stack without horizontal document overflow or unreadable overlap
