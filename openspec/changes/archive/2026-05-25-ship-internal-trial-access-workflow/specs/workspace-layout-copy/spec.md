## ADDED Requirements

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
