## ADDED Requirements

### Requirement: AI review API detail exposes feedback signals safely
The AI review protected API runtime SHALL expose tenant/team-scoped feedback
signals in run detail responses for browser review workflows.

#### Scenario: Detail includes feedback signals
- **WHEN** an authorized actor reads an AI review run detail after feedback was
  recorded
- **THEN** the API SHALL include the feedback signals for that run and team,
  including signal type, reason, review priority, route, section ID, actor ID,
  and timestamp where available

#### Scenario: Cross-team detail does not expose feedback
- **WHEN** an actor from another team requests a run detail
- **THEN** the API SHALL return safe not-found or forbidden JSON and SHALL NOT
  expose feedback signals, decisions, downstream artifacts, or cross-team
  section metadata

#### Scenario: Detail response is redacted
- **WHEN** local route verification inspects AI review detail responses
- **THEN** it SHALL fail if feedback or detail JSON exposes raw cookies, session
  references, provider keys, Authorization headers, full prompts, provider
  payloads, raw transcripts, database URLs, or cross-team fixture markers

### Requirement: AI review API verifies feedback route behavior
The AI review API route verifier SHALL prove feedback route behavior as part of
the protected AI review runtime.

#### Scenario: Feedback verifier checks signal types
- **WHEN** the route verifier records accepted, rejected, missing-knowledge,
  wrong-source, evidence-weak, and downstream-used feedback
- **THEN** each stored signal SHALL preserve signal type, review priority,
  routing target, run ID, optional section ID, and tenant/team scope

#### Scenario: Feedback verifier uses fake provider
- **WHEN** feedback route verification prepares or executes an AI review run
- **THEN** it SHALL use a fake provider and SHALL NOT call live DeepSeek even if
  provider credentials exist in the environment
