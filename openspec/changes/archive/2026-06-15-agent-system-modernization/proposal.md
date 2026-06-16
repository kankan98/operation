## Why

The current Agent/Chat system has critical architectural flaws that prevent it from matching industry-standard conversational AI products (ChatGPT, Claude, Cursor). Most severely, streaming tool calls lose all parameters due to incomplete event handling, making the feature non-functional. Additionally, the system lacks essential capabilities like abort/regenerate, multi-turn tool execution (Agent Loop), proper SSE event typing, and real-time tool visualization. These gaps create a poor user experience and block the system from being production-ready.

## What Changes

- **Fix streaming tool call parameter loss** in AnthropicProvider (P0 blocker - tool calls currently receive empty `input: {}`)
- **Fix context message conversion** to properly serialize assistant tool_use blocks and avoid empty text blocks
- **Fix context retrieval** to fetch the most recent N messages instead of the oldest N messages
- **Implement Agent Loop** for multi-turn tool execution (up to 5 iterations)
- **Extend SSE event schema** to support granular events (message_start, status, text_delta, tool_call_start/end, tool_result, usage, error)
- **Add Abort capability** to stop streaming mid-generation
- **Add Regenerate capability** to retry assistant responses
- **Add real-time tool call visualization** with status indicators (running/success/error)
- **Add syntax highlighting** for code blocks in assistant messages
- **Add scroll-to-bottom button** with new message indicator
- **Add smooth expand/collapse animations** for tool cards
- **Add agent status indicators** (thinking/tool_calling/writing)
- **Implement proper state immutability** in Zustand store
- **Clean up dead code** (useSSEStream hook, ChatExample component)

## Capabilities

### New Capabilities

- `streaming-tool-execution`: Full streaming support for tool calls with parameter accumulation, real-time visualization, and multi-turn Agent Loop
- `conversation-controls`: User controls for abort, regenerate, and scroll management
- `agent-status-indicators`: Visual feedback for agent states (thinking, tool execution, writing)
- `enhanced-message-rendering`: Syntax highlighting, markdown formatting, and smooth animations

### Modified Capabilities

- `chat-session-management`: Add message deletion endpoint for regenerate support
- `sse-protocol`: Extend event schema from single `message` type to 8+ granular event types

## Impact

**Backend:**
- `backend/src/services/anthropicProvider.ts`: Complete rewrite of streaming logic (~120 lines)
- `backend/src/services/openaiProvider.ts`: Minor updates to align with new StreamChunk types (~20 lines)
- `backend/src/services/chatService.ts`: Agent Loop implementation, context fix (~80 lines)
- `backend/src/types/chat.ts`: Extend StreamChunk union type (~30 lines)
- `backend/src/routes/chat.ts`: Add regenerate/delete endpoints (~40 lines)
- `shared/schemas/chat-events.ts`: New file for SSE event types (~30 lines)

**Frontend:**
- `frontend/src/pages/Chat.tsx`: Handle all SSE events, add abort/scroll controls (~100 lines)
- `frontend/src/stores/chatStore.ts`: Fix immutability, add tool card state (~50 lines)
- `frontend/src/components/chat/MessageBubble.tsx`: Add syntax highlighting (~40 lines)
- `frontend/src/components/chat/ToolCallCard.tsx`: Add animations (~15 lines)
- `frontend/src/components/chat/StatusIndicator.tsx`: New component for agent states (~60 lines)
- `frontend/src/services/chatApi.ts`: Add regenerate/delete methods (~20 lines)

**Dependencies:**
- Add: `react-syntax-highlighter` + `@types/react-syntax-highlighter` (frontend)

**APIs:**
- New: `POST /api/chat/sessions/:id/messages/:messageId/regenerate`
- New: `DELETE /api/chat/sessions/:id/messages/:messageId`
- Modified: SSE event payload structure (backward compatible via type field)

**Database:**
- No schema changes required (existing columns support all features)
