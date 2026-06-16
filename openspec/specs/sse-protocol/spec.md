# SSE Protocol

## Purpose

This capability defines the Server-Sent Events (SSE) protocol for streaming agent responses, including event types, payload structures, and frontend consumption patterns for real-time chat updates.

## Requirements

### Requirement: SSE event types
The system SHALL emit granular event types for different streaming phases.

**Previous behavior:** System emitted all chunks as single 'message' event type with internal type discrimination.

**New behavior:** System SHALL use dedicated event types for each streaming phase:

#### Scenario: Message lifecycle events
- **WHEN** streaming begins
- **THEN** system emits `message_start` event with message_id and timestamp

#### Scenario: Status change events
- **WHEN** agent transitions between processing states
- **THEN** system emits `status` event with status value (thinking/tool_calling/writing)

#### Scenario: Text streaming events
- **WHEN** agent generates text content
- **THEN** system emits `text_delta` event with incremental text chunk

#### Scenario: Tool call lifecycle events
- **WHEN** tool call begins
- **THEN** system emits `tool_call_start` event with tool id and name
- **WHEN** tool call parameters are complete
- **THEN** system emits `tool_call_end` event with full ToolCall object

#### Scenario: Tool execution result events
- **WHEN** tool execution completes
- **THEN** system emits `tool_result` event with ToolResult object including output and error status

#### Scenario: Token usage events
- **WHEN** model returns usage statistics
- **THEN** system emits `usage` event with input_tokens, output_tokens, and optional cache_read_tokens

#### Scenario: Stream completion events
- **WHEN** streaming completes successfully
- **THEN** system emits `message_done` event with final message_id

#### Scenario: Error events
- **WHEN** streaming encounters error
- **THEN** system emits `error` event with error code and message

### Requirement: Event payload structure
The system SHALL use consistent typed payload structure for all SSE events.

#### Scenario: Type-discriminated union
- **WHEN** any SSE event is emitted
- **THEN** event data contains `type` field for discrimination and type-specific fields

#### Scenario: Backward compatibility
- **WHEN** client receives SSE event
- **THEN** client can safely check `type` field and ignore unknown event types without breaking

### Requirement: Frontend event consumption
The system SHALL process all SSE event types for real-time UI updates.

#### Scenario: Text delta consumption
- **WHEN** frontend receives `text_delta` event
- **THEN** system appends text to current assistant message and triggers re-render

#### Scenario: Tool call visualization
- **WHEN** frontend receives `tool_call_start` event
- **THEN** system creates tool card in "running" state
- **WHEN** frontend receives `tool_call_end` event
- **THEN** system updates tool card with parameters
- **WHEN** frontend receives `tool_result` event
- **THEN** system updates tool card with result and success/error status

#### Scenario: Status indicator update
- **WHEN** frontend receives `status` event
- **THEN** system updates visible status indicator to match new state

#### Scenario: Usage tracking
- **WHEN** frontend receives `usage` event
- **THEN** system updates token usage display or stores for analytics
