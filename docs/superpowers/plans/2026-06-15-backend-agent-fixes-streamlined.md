# Backend Agent Fixes - Streamlined Implementation Plan

> **For agentic workers:** Use this plan with superpowers:subagent-driven-development or superpowers:executing-plans. This is a streamlined version focused on TDD execution.

**Reference:** Full design specification at `docs/superpowers/specs/2026-06-15-backend-agent-fixes-design.md`

**Reference:** Detailed task breakdown at `openspec/changes/agent-system-modernization/tasks.md`

---

## Quick Start: TDD Cycle Template

Each task follows this pattern:

1. **Write test** → 2. **Run (expect FAIL)** → 3. **Implement** → 4. **Run (expect PASS)** → 5. **Manual verify** → 6. **Commit**

---

## Task 1: Fix Streaming Tool Call Parameters

**Goal:** Accumulate `input_json_delta` events so tool calls have complete parameters.

**Implementation Summary:**
- Add `Map<number, ToolInProgress>` to track tool calls by block index
- On `content_block_start`: initialize tracking entry
- On `input_json_delta`: append to inputJson buffer  
- On `content_block_stop`: parse JSON and yield complete toolCall

**Test File:** `backend/tests/unit/anthropicProvider.test.ts`  
**Code File:** `backend/src/services/anthropicProvider.ts:50-103`

**Commit Message:**
```
fix(agent): accumulate tool call parameters during streaming

- Add Map to track tool calls by block index
- Accumulate input_json_delta events
- Parse complete JSON on content_block_stop
- Handle JSON parse errors gracefully

Fixes P0 blocker where streaming tool calls had empty input: {}
```

---

## Task 2: Fix Message Conversion Protocol

**Goal:** Add `tool_use` blocks for assistant toolCalls, omit empty text blocks.

**Implementation Summary:**
- Check `msg.content` before adding text block
- For assistant: add `tool_use` blocks from `msg.toolCalls`
- For user: add `tool_result` blocks from `msg.toolResults`

**Test File:** `backend/tests/unit/anthropicProvider.test.ts` (add to existing)  
**Code File:** `backend/src/services/anthropicProvider.ts:105-126`

**Commit Message:**
```
fix(agent): properly serialize toolCalls in message conversion

- Conditionally add text blocks (avoid empty blocks)
- Add tool_use blocks for assistant toolCalls
- Add tool_result blocks for user toolResults

Fixes P0 blocker where context was missing tool call history
```

---

## Task 3: Fix Context Retrieval

**Goal:** Fetch most recent N messages, not oldest N.

**Implementation Summary:**
- Change query to `orderBy(desc(chatMessages.timestamp))`
- Add `.reverse()` before returning to restore chronological order

**Test File:** `backend/tests/unit/chatService.test.ts`  
**Code File:** `backend/src/services/chatService.ts:349-373`

**Commit Message:**
```
fix(agent): retrieve most recent N messages for context

- Query with DESC order, then reverse to chronological
- Ensures context window slides correctly as conversation grows

Fixes P0 blocker where long conversations used stale context
```

---

## Task 4: Extend SSE Event Schema

**Goal:** Define granular event types (message_start, status, text_delta, tool_call_start, etc.)

**Implementation Summary:**
- Create `shared/schemas/chat-events.ts` with SSEEvent union type
- Update `backend/src/services/aiProvider.ts` to reference SSEEvent
- Update `backend/src/types/chat.ts` if needed

**New File:** `shared/schemas/chat-events.ts`  
**Modified Files:** `backend/src/services/aiProvider.ts:44-54`

**Commit Message:**
```
feat(agent): define granular SSE event types

- Add message_start, status, text_delta, tool_call_start/end, etc.
- Discriminated union for type safety
- Backward compatible (type field discrimination)

Prepares for real-time tool visualization in frontend
```

---

## Task 5: Implement Agent Loop

**Goal:** Allow up to 5 iterations of tool execution in one user request.

**Implementation Summary:**
- Wrap streaming logic in `for (let iteration = 0; iteration < 5; iteration++)`
- After each iteration: check `if (toolCalls.length === 0) break;`
- Update context: `[...context, {assistant with toolCalls}, {user with toolResults}]`
- Accumulate tokens across iterations

**Test File:** `backend/tests/unit/chatService.test.ts` (add to existing)  
**Code File:** `backend/src/services/chatService.ts:129-258`

**Commit Message:**
```
feat(agent): implement Agent Loop for multi-turn tool execution

- Support up to 5 iterations per user message
- Break when agent returns no tool calls
- Accumulate token usage across iterations
- Update context for each iteration

Enables complex scenarios requiring multiple tool calls
```

---

## Task 6: Add Conversation Control Endpoints

**Goal:** Add DELETE message and regenerate endpoints.

**Implementation Summary:**
- `DELETE /api/chat/sessions/:id/messages/:messageId`: Delete message from DB
- `POST /api/chat/sessions/:id/messages/:messageId/regenerate`: Delete + return stream URL

**Test File:** `backend/tests/integration/chat-routes.test.ts`  
**Code File:** `backend/src/routes/chat.ts` (add new routes)

**Commit Message:**
```
feat(agent): add delete and regenerate endpoints

- DELETE /messages/:id removes message
- POST /messages/:id/regenerate deletes + returns stream URL
- Validation for assistant-only regenerate

Enables retry/regenerate UX in frontend
```

---

## Testing Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- anthropicProvider.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode during development
npm test -- --watch
```

---

## Manual Testing Checklist

After each task:
- [ ] Unit tests pass
- [ ] Start backend: `npm run dev`
- [ ] Test in Chat UI (send messages, verify behavior)
- [ ] Check browser DevTools → Network → SSE events
- [ ] No console errors
- [ ] Git commit created

---

## Implementation Order

**Must be done sequentially:**

Task 0 (Setup) → Task 1 (Tool Params) → Task 2 (Message Conversion) → Task 3 (Context) → Task 4 (Events) → Task 5 (Agent Loop) → Task 6 (Endpoints)

Each task builds on the previous fixes.

---

## Success Criteria

✅ All 6 tasks completed  
✅ All tests pass  
✅ Manual testing confirms fixes work  
✅ 6 git commits created  
✅ Zero regressions  

---

**Plan complete. Ready for execution via subagent-driven-development or executing-plans skill.**
