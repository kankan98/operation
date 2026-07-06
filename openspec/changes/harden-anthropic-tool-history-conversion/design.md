## Context

The chat backend persists completed assistant messages with `toolCalls` and `toolResults` on the same database row. `ChatService.buildContext()` expands that stored shape into Anthropic's required sequence before calling the provider, but the Anthropic provider's own conversion layer only maps one input message to one Anthropic message. Production logs previously showed Anthropic rejecting a follow-up request because `tool_use` blocks were replayed without immediately following `tool_result` blocks.

OpenAI conversion already handles the database-shaped message by splitting it into assistant tool calls, tool results, and final assistant text. Anthropic needs the same boundary protection because provider conversion is the last place that can guarantee wire-format validity.

## Goals / Non-Goals

**Goals:**

- Ensure Anthropic conversion emits valid `tool_use` / `tool_result` adjacency for stored assistant messages that contain both tool calls and tool results.
- Keep existing chat persistence, agent loop, SSE events, and UI rendering unchanged.
- Add regression tests that fail if database-shaped tool history is sent to Anthropic as a single assistant message.

**Non-Goals:**

- Change the database schema or split stored assistant messages into multiple rows.
- Change how tools execute, how SSE cards render, or how chat sessions are displayed.
- Rewrite historical messages or delete old sessions.

## Decisions

1. **Harden at the Anthropic provider boundary.**
   - The provider is responsible for Anthropic wire-format validity.
   - Keeping the fix there protects all future callers, including any path that might bypass `ChatService.buildContext()`.
   - Alternative considered: rely only on `ChatService.buildContext()`. Rejected because the production failure mode is a protocol-boundary failure, and one upstream caller should not be the only defense.

2. **Mirror OpenAI's database-shape split.**
   - Input assistant message with both `toolCalls` and `toolResults` becomes:
     1. assistant message containing text, if any, and `tool_use` blocks
     2. user message containing corresponding `tool_result` blocks
     3. assistant message containing final text, when needed to preserve answer content after results
   - For Anthropic, when final answer content exists on the same stored assistant row, the tool-use message uses only tool-use blocks and the final text is emitted as a following assistant turn after results.

3. **Filter truly orphaned tool calls instead of sending invalid history.**
   - If a historical assistant message has `toolCalls` but no matching result anywhere in the converted context, the provider must not send those orphaned `tool_use` blocks to Anthropic.
   - Unknown or partial in-progress tool calls are still observable through warning logs.

## Risks / Trade-offs

- **Risk: hiding a malformed historical tool call** -> The warning log remains, and dropping an orphaned `tool_use` is safer than blocking the whole conversation with a 400.
- **Risk: changing provider conversion order** -> Regression tests will assert the exact Anthropic message sequence for stored tool history.
- **Risk: duplicate protection with `ChatService.buildContext()`** -> Acceptable. Provider-level validation is defense in depth for a strict external protocol.
