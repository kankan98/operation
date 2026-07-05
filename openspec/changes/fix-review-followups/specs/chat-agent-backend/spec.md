## ADDED Requirements

### Requirement: Preserve OpenAI-compatible streamed tool arguments
The OpenAI-compatible chat provider SHALL accumulate streamed tool-call argument chunks before parsing them into a tool call.

#### Scenario: Tool arguments arrive in multiple chunks
- **WHEN** a provider streams one tool call with JSON arguments split across multiple chunks
- **THEN** the backend SHALL emit one tool call with the complete parsed argument object

#### Scenario: Multiple tool calls stream independently
- **WHEN** a provider streams multiple tool calls in one response
- **THEN** the backend SHALL track argument buffers separately and SHALL emit each tool call with its own parsed arguments

### Requirement: Reasoning-only provider content is not user-visible answer text
The OpenAI-compatible chat provider SHALL NOT expose reasoning-only fields as assistant answer text.

#### Scenario: Streaming response includes reasoning content
- **WHEN** a streamed provider delta contains `reasoning_content`
- **THEN** the backend SHALL NOT emit it as a user-visible text chunk

#### Scenario: Non-streaming response includes reasoning content
- **WHEN** a non-streaming provider response contains `reasoning_content` and final `content`
- **THEN** the backend SHALL return only the final answer content as assistant message text
