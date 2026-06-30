## ADDED Requirements

### Requirement: Backend SHALL monitor client connection lifecycle
The SSE endpoint SHALL detect client disconnection and abort processing immediately.

#### Scenario: Connection abort detection
- **WHEN** client closes connection during active stream
- **THEN** backend detects via `req.on('close')` event and aborts generator

#### Scenario: Resource cleanup on abort
- **WHEN** connection abort is detected
- **THEN** generator stops, all pending API calls are cancelled, and memory is released

### Requirement: SSE connection SHALL send periodic heartbeats
The backend SHALL send heartbeat comments every 15 seconds to prevent proxy timeouts.

#### Scenario: Heartbeat during idle periods
- **WHEN** no data events sent for 15+ seconds (long tool execution)
- **THEN** backend sends `: heartbeat\n\n` comment to keep connection alive

#### Scenario: Heartbeat cleanup on completion
- **WHEN** stream completes or errors
- **THEN** heartbeat interval is cleared

### Requirement: SSE connection SHALL have maximum duration timeout
The backend SHALL enforce maximum stream duration to prevent infinite resource consumption.

#### Scenario: Stream timeout
- **WHEN** stream exceeds 10 minutes
- **THEN** stream is aborted with timeout error event

#### Scenario: Timeout cancellation
- **WHEN** stream completes naturally before timeout
- **THEN** timeout timer is cleared

## MODIFIED Requirements

### Requirement: SSE event types
The system SHALL emit granular event types for different streaming phases.

**Previous behavior:** System emitted all chunks as single 'message' event type with internal type discrimination.

**New behavior:** System SHALL use dedicated event types for each streaming phase AND ensure connection resilience with heartbeat mechanism:

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

#### Scenario: Heartbeat events (NEW)
- **WHEN** no data events sent for 15 seconds
- **THEN** system emits `: heartbeat\n\n` SSE comment (not parsed as event)

#### Scenario: Connection abort events (NEW)
- **WHEN** client disconnects during stream
- **THEN** backend aborts generator and cleans up resources
