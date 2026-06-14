# Backend Agent System Fixes - Design Specification

**Date**: 2026-06-15  
**Scope**: Tasks 1-6 (Backend fixes for Agent system)  
**Approach**: Test-Driven Development with strict sequential execution

---

## Executive Summary

This specification details the test-driven implementation approach for fixing critical backend issues in the Agent/Chat system (Tasks 1-6). We will write comprehensive unit and integration tests first, then implement fixes under test protection, ensuring each Task is completed and verified before moving to the next.

**Key Decisions**:
- TDD approach: Write tests → Implement → Refactor → Manual verify → Commit
- Mock Anthropic SDK for unit tests to avoid external dependencies
- Use in-memory database for integration tests
- Strict sequential execution: Task 1 → 2 → 3 → 4 → 5 → 6
- Each Task gets its own git commit as a checkpoint

---

## Architecture Overview

### Current State
- **AnthropicProvider**: Handles Anthropic API streaming (BROKEN - tool params lost)
- **ChatService**: Orchestrates conversation flow (BROKEN - wrong context order)
- **Database**: SQLite with Drizzle ORM (working, no schema changes needed)
- **Testing**: Vitest configured but limited coverage

### Target State
- **AnthropicProvider**: Fixed streaming with complete tool parameters
- **ChatService**: Agent Loop (max 5 iterations), correct context retrieval
- **Routes**: New DELETE and regenerate endpoints
- **Events**: Granular SSE event types (8+ types)
- **Tests**: >90% unit coverage, >80% integration coverage for critical paths

---

## Phase 1: Test Infrastructure Setup

### 1.1 Test File Structure

```
backend/tests/
├── unit/
│   ├── anthropicProvider.test.ts    # AnthropicProvider unit tests
│   └── chatService.test.ts          # ChatService unit tests
├── integration/
│   ├── streaming-tool-calls.test.ts # End-to-end streaming tests
│   └── chat-routes.test.ts          # API endpoint tests
└── fixtures/
    ├── anthropic-events.ts          # Mock Anthropic event streams
    └── test-db.ts                   # In-memory DB setup
```

### 1.2 Mock Strategy

**Anthropic SDK Mock**:
```typescript
// tests/fixtures/anthropic-events.ts
export const mockToolCallStream = [
  { type: 'content_block_start', index: 0, content_block: { 
    type: 'tool_use', id: 'call_123', name: 'searchProducts' 
  }},
  { type: 'content_block_delta', index: 0, delta: { 
    type: 'input_json_delta', partial_json: '{"query":'
  }},
  { type: 'content_block_delta', index: 0, delta: { 
    type: 'input_json_delta', partial_json: '"iPhone"}'
  }},
  { type: 'content_block_stop', index: 0 },
  { type: 'message_stop' },
];
```

**Database Mock**: Use in-memory SQLite to avoid test pollution.

---

## Task 1: Fix Streaming Tool Call Parameters (P0 Blocker)

### Problem
`AnthropicProvider.streamMessage()` emits tool calls with `input: {}` because it ignores `input_json_delta` events.

### Test Cases
```typescript
describe('Task 1: Streaming Tool Parameters', () => {
  it('should accumulate input_json_delta into complete parameters');
  it('should handle multiple tool calls with separate parameters');
  it('should parse JSON and yield complete toolCall on block_stop');
  it('should handle JSON parse errors gracefully');
});
```

### Implementation
Add `Map<number, ToolInProgress>` to track parameter accumulation per block index.

**Key code changes**:
- Line 65+: Initialize `toolCallsInProgress` Map before event loop
- Line 76-86: On `content_block_start`, create tracking entry
- Line 72-75: On `input_json_delta`, append to `inputJson` buffer
- Line 87-95: On `content_block_stop`, parse JSON and yield complete tool_call

### Verification
- Run: `npm test -- anthropicProvider.test.ts`
- Manual: Send "搜索 iPhone 产品" in Chat UI, verify tool receives `{query: "iPhone"}`

---

## Task 2: Fix Message Conversion Protocol (P0 Blocker)

### Problem
`convertMessages()` omits assistant `toolCalls` (no `tool_use` blocks) and always adds empty `text` blocks.

### Test Cases
```typescript
describe('Task 2: Message Conversion', () => {
  it('should add tool_use blocks for assistant toolCalls');
  it('should omit text block when content is empty');
  it('should add tool_result blocks for user toolResults');
  it('should handle messages with both text and tools');
});
```

### Implementation
Rewrite `convertMessages()` to conditionally add content blocks based on role and data presence.

**Key code changes**:
- Line 105-126: Replace entire method
- Check `msg.content` before adding text block
- Check `msg.toolCalls` for assistant, add `tool_use` blocks
- Check `msg.toolResults` for user, add `tool_result` blocks

### Verification
- Run: `npm test -- anthropicProvider.test.ts`
- Manual: Multi-turn tool conversation, check Network panel for correct message format

---

## Task 3: Fix Context Retrieval (P0 Blocker)

### Problem
`getMessages()` uses ascending order + limit, fetching oldest 20 messages instead of most recent.

### Test Cases
```typescript
describe('Task 3: Context Retrieval', () => {
  it('should return most recent N messages when session has more');
  it('should return messages in chronological order (oldest first)');
  it('should handle sessions with fewer than N messages');
});
```

### Implementation
Change query to `orderBy(desc(...))`, then reverse array before returning.

**Key code changes**:
- Line 354: Replace `orderBy(chatMessages.timestamp)` with `orderBy(desc(chatMessages.timestamp))`
- Line 361+: Add `.reverse()` before mapping to ChatMessage objects

### Verification
- Run: `npm test -- chatService.test.ts`
- Manual: Create 30-message conversation, verify context includes last 20 messages

---

## Task 4: Extend SSE Event Schema

### Problem
Current `StreamChunk` only has `text | tool_call | tool_result | usage | done | error`. Frontend needs granular events for real-time UX.

### Test Cases
```typescript
describe('Task 4: SSE Events', () => {
  it('should define all 8+ event types in SSEEvent union');
  it('should emit message_start with message_id');
  it('should emit status events for state transitions');
  it('should emit tool_call_start and tool_call_end separately');
});
```

### Implementation
Create `shared/schemas/chat-events.ts` with discriminated union, update `StreamChunk` type.

**New file**: `shared/schemas/chat-events.ts`
```typescript
export type SSEEvent =
  | { type: 'message_start'; message_id: string; timestamp: number }
  | { type: 'status'; status: 'thinking' | 'tool_calling' | 'writing' }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; tool_call: { id: string; name: string } }
  | { type: 'tool_call_end'; tool_call: ToolCall }
  | { type: 'tool_result'; tool_result: ToolResult }
  | { type: 'usage'; usage: { input_tokens: number; output_tokens: number } }
  | { type: 'message_done'; message_id: string }
  | { type: 'error'; error: { code: string; message: string } };
```

**Update**: `backend/src/types/chat.ts` - change `StreamChunk` to reference `SSEEvent`

### Verification
- Run: `npm test -- chat-events.test.ts`
- Manual: Check TypeScript compilation, verify type safety

---

## Task 5: Implement Agent Loop

### Problem
Current implementation only does one tool execution round. Agent cannot request tools multiple times.

### Test Cases
```typescript
describe('Task 5: Agent Loop', () => {
  it('should execute tools and continue if agent requests more');
  it('should stop after 5 iterations (max)');
  it('should stop when agent returns no tool calls');
  it('should accumulate token usage across iterations');
});
```

### Implementation
Wrap streaming logic in `for` loop (max 5 iterations), check `toolCalls.length` after each iteration.

**Key code changes**:
- Line 129+: Add `for (let iteration = 0; iteration < 5; iteration++)`
- After tool execution: Check `if (toolCalls.length === 0) break;`
- Update context: `[...context, {assistant}, {user with toolResults}]`
- Accumulate tokens across iterations

### Verification
- Run: `npm test -- chatService.test.ts`
- Manual: Design scenario requiring 2-3 tool calls (search → analyze → recommend)

---

## Task 6: Add Conversation Control Endpoints

### Problem
No DELETE endpoint for messages, no regenerate capability.

### Test Cases
```typescript
describe('Task 6: Control Endpoints', () => {
  it('DELETE /messages/:id should remove message from DB');
  it('DELETE should return 404 for non-existent message');
  it('POST /regenerate should delete old message and return stream URL');
  it('POST /regenerate should fail for user messages');
  it('POST /regenerate should fail when no prior user message exists');
});
```

### Implementation
Add two new routes in `backend/src/routes/chat.ts`.

**New endpoints**:
1. `DELETE /api/chat/sessions/:id/messages/:messageId`
   - Validate message exists
   - Delete from DB
   - Return 204 No Content

2. `POST /api/chat/sessions/:id/messages/:messageId/regenerate`
   - Validate message is assistant role
   - Find preceding user message
   - Delete assistant message
   - Return `{ stream_url: '/sessions/:id/stream?content=...' }`

### Verification
- Run: `npm test -- chat-routes.test.ts`
- Manual: Use curl to test endpoints
  ```bash
  curl -X DELETE http://localhost:3001/api/chat/sessions/:id/messages/:msgId
  curl -X POST http://localhost:3001/api/chat/sessions/:id/messages/:msgId/regenerate
  ```

---

## Testing Strategy Details

### Unit Test Coverage Targets
- **AnthropicProvider.streamMessage**: 95% (all event types, error paths)
- **AnthropicProvider.convertMessages**: 100% (all message types)
- **ChatService.streamMessage**: 90% (main flow, tool execution, loop)
- **ChatService.getMessages**: 100% (simple query logic)

### Integration Test Scenarios
1. **End-to-end tool call**: User message → tool call → tool result → final response
2. **Multi-turn loop**: User message → tool 1 → tool 2 → tool 3 → final response
3. **Context window**: 50-message session, verify correct 20 messages used
4. **Regenerate flow**: Create message → delete → regenerate → verify new message

### Manual Testing Checklist
Each Task completion requires:
- [ ] All unit tests pass
- [ ] Integration tests pass (if applicable)
- [ ] Manual test in Chat UI works as expected
- [ ] No console errors in browser or terminal
- [ ] Git commit created with descriptive message

---

## Implementation Timeline

**Task 1**: Write tests (45m) + Implement (30m) + Verify (15m) = 90 minutes  
**Task 2**: Write tests (40m) + Implement (25m) + Verify (15m) = 80 minutes  
**Task 3**: Write tests (30m) + Implement (20m) + Verify (10m) = 60 minutes  
**Task 4**: Write tests (40m) + Implement (30m) + Verify (15m) = 85 minutes  
**Task 5**: Write tests (50m) + Implement (40m) + Verify (20m) = 110 minutes  
**Task 6**: Write tests (45m) + Implement (35m) + Verify (15m) = 95 minutes  

**Total**: ~8.5 hours (with buffer for debugging)

---

## Risk Mitigation

### Risk: Mock diverges from real Anthropic SDK behavior
**Mitigation**: Keep mock events in sync with official SDK docs, add integration test with real API (env flag).

### Risk: Test passes but real scenario fails
**Mitigation**: Mandatory manual testing after each Task, comprehensive integration tests.

### Risk: Refactoring breaks untested code
**Mitigation**: Run full test suite after each change, use TypeScript strict mode to catch type errors.

### Risk: Time overruns on complex mocking
**Mitigation**: Start with simple mocks, add complexity only as needed. Use fixtures for common scenarios.

---

## Success Criteria

✅ All 6 Tasks completed sequentially  
✅ Unit test coverage >90% for modified files  
✅ Integration tests cover all P0 flows  
✅ All manual tests pass in real environment  
✅ Zero regressions in existing functionality  
✅ Each Task has its own git commit  
✅ Code passes TypeScript strict checks  
✅ No console errors in production build  

---

## Next Steps After This Design

1. User reviews and approves this spec
2. Invoke `writing-plans` skill to create detailed implementation plan
3. Begin Task 1 implementation following TDD cycle

---

**End of Design Specification**
