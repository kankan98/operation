# Unified Event Protocol

## Purpose

定义统一的 SSE 事件协议，包括标准化的事件命名规范、事件类型和事件结构，确保前后端对事件的理解一致。

## Requirements

### Requirement: Event naming convention
The system SHALL use consistent event naming with standardized suffixes.

#### Scenario: Event type suffixes
- **WHEN** any SSE event is emitted
- **THEN** event type SHALL use one of these suffixes: _start, _change, _delta, _complete, _occurred

#### Scenario: Lifecycle events
- **WHEN** message lifecycle events are emitted
- **THEN** system SHALL use "message_start" and "message_complete" as event types

#### Scenario: Incremental events
- **WHEN** incremental content is emitted
- **THEN** system SHALL use "content_delta" as event type

#### Scenario: State events
- **WHEN** agent status changes
- **THEN** system SHALL use "status_change" as event type

### Requirement: Message start event
The system SHALL emit message_start as the first event in the stream.

#### Scenario: Message start structure
- **WHEN** streaming begins
- **THEN** system SHALL emit message_start event with fields: type, messageId, sessionId, timestamp, model, streamId

#### Scenario: Message start timing
- **WHEN** SSE connection is established
- **THEN** message_start event SHALL be the first event sent

### Requirement: Status change event
The system SHALL emit status_change events when agent state transitions.

#### Scenario: Status values
- **WHEN** status_change event is emitted
- **THEN** status field SHALL be one of: "idle", "thinking", "tool_calling", "writing"

#### Scenario: Status with context
- **WHEN** status is "tool_calling"
- **THEN** event MAY include optional "context" field with tool name

### Requirement: Content delta event
The system SHALL emit content_delta events for incremental text generation.

#### Scenario: Content delta structure
- **WHEN** AI generates text
- **THEN** system SHALL emit content_delta event with fields: type, delta (string), timestamp

#### Scenario: Multiple deltas
- **WHEN** AI generates long text
- **THEN** system SHALL emit multiple content_delta events with text fragments

### Requirement: Tool start event
The system SHALL emit tool_start when tool execution begins.

#### Scenario: Tool start structure
- **WHEN** tool execution begins
- **THEN** system SHALL emit tool_start event with fields: type, tool (object with id, name, params), timestamp

#### Scenario: Complete parameters
- **WHEN** tool_start is emitted
- **THEN** tool.params field SHALL contain the complete parameter object (not streamed)

### Requirement: Tool complete event
The system SHALL emit tool_complete when tool execution finishes.

#### Scenario: Tool complete structure
- **WHEN** tool execution finishes
- **THEN** system SHALL emit tool_complete event with fields: type, toolId, result (object with output, isError), timing (object), timestamp

#### Scenario: Timing metadata
- **WHEN** tool_complete is emitted
- **THEN** timing object SHALL contain startTime, endTime, and durationMs fields

### Requirement: Usage complete event
The system SHALL emit usage_complete with token statistics.

#### Scenario: Usage structure
- **WHEN** message processing completes
- **THEN** system SHALL emit usage_complete event with usage object containing inputTokens, outputTokens, totalTokens

#### Scenario: Optional cache tokens
- **WHEN** cached tokens are used
- **THEN** usage object MAY include optional cacheReadTokens field

### Requirement: Message complete event
The system SHALL emit message_complete as the final event.

#### Scenario: Message complete structure
- **WHEN** streaming completes successfully
- **THEN** system SHALL emit message_complete event with fields: type, messageId, timestamp, metadata (object)

#### Scenario: Metadata content
- **WHEN** message_complete is emitted
- **THEN** metadata object SHALL contain totalTokens, toolCallsCount, and durationMs

#### Scenario: Connection closure
- **WHEN** message_complete is emitted
- **THEN** SSE connection SHALL close after this event

### Requirement: Error occurred event
The system SHALL emit error_occurred when any error happens.

#### Scenario: Error structure
- **WHEN** an error occurs
- **THEN** system SHALL emit error_occurred event with fields: type, error (object with code, message, retryable), timestamp

#### Scenario: Retryable errors
- **WHEN** error is retryable (e.g., RATE_LIMIT_EXCEEDED)
- **THEN** error object SHALL include retryable: true and optional retryAfter field (seconds)

#### Scenario: Error codes
- **WHEN** error_occurred is emitted
- **THEN** error.code SHALL be one of the standardized StreamErrorCode values

#### Scenario: Connection closure on error
- **WHEN** error_occurred is emitted
- **THEN** SSE connection SHALL close after this event (no message_complete)
