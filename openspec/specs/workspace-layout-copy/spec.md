# workspace-layout-copy Specification

## Purpose
Define workspace layout and operator-facing copy requirements so the web app
uses an operational-width shell, avoids development-facing UI text, preserves
mobile readability, and keeps roadmap documentation aligned with rendered
workspace behavior.
## Requirements
### Requirement: Workspace shell uses operational display width
The web workspace SHALL use a full-width application shell on desktop displays
while preserving readable text constraints inside content panels.

#### Scenario: Wide desktop route renders
- **WHEN** an operator opens a workspace route on a 1920px or wider viewport
- **THEN** the sidebar starts at the viewport edge and the main content area uses
  the available width instead of centering the whole app in a narrow container

#### Scenario: Long text renders
- **WHEN** a panel contains explanatory prose
- **THEN** the text remains constrained with local max-width or grid structure so
  it does not span the full viewport width

### Requirement: UI copy is operator-facing
The web workspace SHALL avoid development-facing copy in normal product UI and
use concise operator-facing task, state, and next-action language.

#### Scenario: Capability is not yet usable
- **WHEN** a page, card, badge, or disabled action represents unavailable
  behavior
- **THEN** it uses product language such as "暂不能保存", "暂无数据", "待审核", or
  "需要权限" rather than OpenSpec, backend, database, AI provider, or internal
  implementation wording

#### Scenario: Development boundary is needed
- **WHEN** implementation boundary details are needed for contributors
- **THEN** those details are documented in README, contracts, roadmap, or
  OpenSpec rather than normal operator-facing UI

### Requirement: UI copy is easy to understand
The web workspace SHALL keep normal interface copy simple, short, and easy to
act on.

#### Scenario: Operator reads a workbench page
- **WHEN** an operator opens a workspace page
- **THEN** visible headings, helper text, badges, empty states, and disabled
  action text explain only what the user can do, what the state means, or what
  to do next

#### Scenario: Internal workflow detail is available
- **WHEN** detailed architecture, AI learning loop, or future implementation
  sequencing is needed
- **THEN** it is kept in project documentation instead of normal user-facing UI

### Requirement: Workspace copy exposes internal trial status without implementation detail
The workspace SHALL show internal V0 trial status, entry, ready, refresh, leave, and next-step copy in concise operator-facing language without exposing OpenSpec, provider, database, cookie, or implementation details in normal UI.

#### Scenario: Trial session is ready
- **WHEN** an evaluator has a verified internal trial session
- **THEN** the workspace SHALL show the demo team and actor using short labels such as "内部试用" or "已进入团队" and provide direct actions that support the next operator workflow

#### Scenario: Trial session is unavailable
- **WHEN** the internal trial entry cannot be used because the environment is disabled, session verification fails, or logout completes
- **THEN** the workspace SHALL show a short actionable state such as "进入内部试用" or "重新进入" rather than architecture, provider, database, or OpenSpec wording

#### Scenario: Trial workflow guidance is displayed
- **WHEN** the overview lists the recommended V0 path
- **THEN** it SHALL use live-commerce operator tasks such as recording a session, reviewing product sources, publishing knowledge, generating a recap, organizing talk tracks, and assigning next-session actions

