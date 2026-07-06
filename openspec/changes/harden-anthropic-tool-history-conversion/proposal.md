## Why

Production chat logs previously showed Anthropic rejecting a follow-up request because historical `tool_use` blocks were replayed without immediately following `tool_result` blocks. Current `ChatService` expands stored tool calls/results before provider calls, but the Anthropic provider itself lacks a regression contract for database-shaped tool history, leaving the protocol boundary fragile.

## What Changes

- Harden Anthropic message conversion so stored assistant messages that contain both `toolCalls` and `toolResults` serialize as Anthropic-valid adjacent assistant/user/assistant messages.
- Preserve current chat persistence, tool execution, SSE event flow, and UI rendering behavior.
- Add regression coverage for Anthropic tool history conversion and current production-style follow-up context.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `streaming-tool-execution`: Anthropic tool history conversion must preserve required `tool_use` / `tool_result` adjacency even when the input message is stored in database shape.

## Impact

- Backend Anthropic provider conversion logic and tests.
- No API, database, frontend, or deployment contract changes.
