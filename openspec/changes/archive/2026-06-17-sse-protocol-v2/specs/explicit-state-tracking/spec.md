## ADDED Requirements

### Requirement: Explicit status events
The system SHALL emit status_change events for all agent state transitions.

#### Scenario: Thinking state
- **WHEN** agent begins processing user input
- **THEN** system SHALL emit status_change event with status: "thinking"

#### Scenario: Tool calling state
- **WHEN** agent begins executing tools
- **THEN** system SHALL emit status_change event with status: "tool_calling"

#### Scenario: Writing state
- **WHEN** agent begins generating text response
- **THEN** system SHALL emit status_change event with status: "writing"

#### Scenario: Idle state
- **WHEN** message processing completes
- **THEN** final status SHALL be "idle" (implied by message_complete)

#### Scenario: Tool context in status
- **WHEN** status_change to "tool_calling" is emitted
- **THEN** event MAY include context field with the tool name being executed

### Requirement: Status before content
The system SHALL emit status_change before corresponding content events.

#### Scenario: Status before text
- **WHEN** agent transitions to "writing"
- **THEN** system SHALL emit status_change event BEFORE first content_delta event

#### Scenario: Status before tool
- **WHEN** agent transitions to "tool_calling"
- **THEN** system SHALL emit status_change event BEFORE tool_start event

### Requirement: No frontend state inference
The frontend SHALL NOT infer agent state from event types.

#### Scenario: Direct state consumption
- **WHEN** frontend receives status_change event
- **THEN** frontend SHALL directly update UI state without inference logic

#### Scenario: No implicit state transitions
- **WHEN** frontend receives tool_start event without prior status_change
- **THEN** this is a protocol violation (backend SHALL always send status_change first)
