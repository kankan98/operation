## ADDED Requirements

### Requirement: Preserve Anthropic tool history adjacency
The system SHALL serialize stored tool-call history into Anthropic-valid adjacent `tool_use` and `tool_result` messages before sending conversation context to Anthropic.

#### Scenario: Stored assistant row has tool calls and results
- **WHEN** AnthropicProvider converts a historical assistant message that contains both `toolCalls` and matching `toolResults`
- **THEN** the Anthropic request SHALL contain an assistant message with the tool_use blocks immediately followed by a user message with the corresponding tool_result blocks
- **AND** any final assistant answer text from the stored row SHALL remain in the conversation after the tool_result message

#### Scenario: Historical tool call has no matching result
- **WHEN** AnthropicProvider converts historical context containing a tool call with no matching tool result
- **THEN** the provider SHALL NOT send an orphaned `tool_use` block to Anthropic
- **AND** the provider SHALL log enough context to diagnose the malformed history
