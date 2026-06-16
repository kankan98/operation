## ADDED Requirements

### Requirement: Display agent processing status
The system SHALL show visual indicators for different agent states during response generation.

#### Scenario: Thinking state indicator
- **WHEN** agent is generating initial response before any output
- **THEN** system displays "AI is thinking..." with animated pulse dots

#### Scenario: Tool calling state indicator
- **WHEN** agent emits tool_call events
- **THEN** system displays "Calling tools..." status with tool execution visualization

#### Scenario: Writing state indicator
- **WHEN** agent is streaming text after tool execution
- **THEN** system displays "Writing response..." or continues showing streaming indicator

#### Scenario: Reconnecting state indicator
- **WHEN** SSE connection drops and system attempts reconnection
- **THEN** system displays "Reconnecting..." with spinner icon

### Requirement: Tool execution status in tool cards
The system SHALL display real-time status for each tool call.

#### Scenario: Tool card in running state
- **WHEN** tool_call_end event received but no tool_result yet
- **THEN** system displays tool card with blue border, "Executing..." status, and spinner

#### Scenario: Tool card in success state
- **WHEN** tool_result event received with isError=false
- **THEN** system updates tool card to green border, "Completed" status, and shows result

#### Scenario: Tool card in error state
- **WHEN** tool_result event received with isError=true
- **THEN** system updates tool card to red border, "Failed" status, and shows error message

### Requirement: Smooth status transitions
The system SHALL animate status indicator changes to avoid jarring visual updates.

#### Scenario: Status indicator fade transition
- **WHEN** agent status changes from one state to another
- **THEN** system fades out old indicator and fades in new indicator over 200ms

#### Scenario: Tool card status update animation
- **WHEN** tool card transitions from running to success/error
- **THEN** system animates border color change over 200ms using ease-out-soft timing
