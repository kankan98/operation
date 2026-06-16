# Streaming Tool Execution

## Purpose

This capability provides the backend implementation for streaming tool calls during agent execution, including parameter accumulation, Anthropic protocol conversion, multi-turn agent loops, and real-time tool execution visualization.

## Requirements

### Requirement: Stream tool call parameters during execution
The system SHALL accumulate tool call parameters during streaming and emit complete tool calls when parameter streaming finishes.

#### Scenario: Tool call parameter accumulation
- **WHEN** AnthropicProvider receives `content_block_start` with `tool_use` type
- **THEN** system creates a tracking entry with tool ID and name

#### Scenario: Parameter delta streaming
- **WHEN** AnthropicProvider receives `content_block_delta` with `input_json_delta` type
- **THEN** system appends `partial_json` to the tracking entry's input buffer

#### Scenario: Tool call completion
- **WHEN** AnthropicProvider receives `content_block_stop` for a tool_use block
- **THEN** system parses accumulated JSON input and yields complete `tool_call` event with parsed parameters

#### Scenario: Multiple tool calls in sequence
- **WHEN** multiple tool calls are requested in a single turn
- **THEN** system tracks each by block index and emits them in order when complete

### Requirement: Convert assistant tool calls to Anthropic protocol
The system SHALL properly serialize assistant messages with tool calls into Anthropic `tool_use` content blocks.

#### Scenario: Assistant message with tool calls
- **WHEN** converting an assistant message that has toolCalls array
- **THEN** system adds `tool_use` content blocks with id, name, and input for each tool call

#### Scenario: Empty content with tool calls
- **WHEN** assistant message content is empty but has tool calls
- **THEN** system omits the text content block and only includes tool_use blocks

#### Scenario: Tool results in user message
- **WHEN** converting a user message with toolResults array
- **THEN** system adds `tool_result` content blocks with tool_use_id, content, and is_error flag

### Requirement: Multi-turn Agent Loop for tool execution
The system SHALL support up to 5 iterations of tool execution in a single user request.

#### Scenario: Single tool execution turn
- **WHEN** agent generates tool calls and receives results
- **THEN** system sends tool results back to agent for final response

#### Scenario: Multiple tool execution turns
- **WHEN** agent requests tools after receiving previous tool results
- **THEN** system continues loop up to 5 iterations or until no tools requested

#### Scenario: Loop termination on max iterations
- **WHEN** agent requests tools on the 5th iteration
- **THEN** system executes tools, sends results, and accepts final response without further tool calls

#### Scenario: Loop termination on no tool calls
- **WHEN** agent generates text response without tool calls
- **THEN** system terminates loop and stores final message

### Requirement: Retrieve most recent context messages
The system SHALL fetch the N most recent messages when building conversation context.

#### Scenario: Context window with limit
- **WHEN** building context with limit of 20 messages
- **THEN** system queries messages ordered by timestamp descending, takes first 20, and reverses to chronological order

#### Scenario: Long conversation beyond context window
- **WHEN** session has 50 messages and context limit is 20
- **THEN** system includes only the most recent 20 messages in ascending timestamp order

### Requirement: Real-time tool execution visualization
The system SHALL emit streaming events for tool call lifecycle (start, progress, completion).

#### Scenario: Tool call start event
- **WHEN** tool call parameters are fully received
- **THEN** system emits `tool_call_end` event with complete tool call object

#### Scenario: Tool execution result event
- **WHEN** tool execution completes
- **THEN** system emits `tool_result` event with output and error status

#### Scenario: Tool execution error
- **WHEN** tool execution fails or times out
- **THEN** system emits `tool_result` event with isError=true and error message in output
