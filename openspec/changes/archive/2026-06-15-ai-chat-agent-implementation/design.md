## Context

The current Chat page (frontend/src/pages/Chat.tsx) implements a demo UI with hardcoded responses. The database schema already includes `chat_sessions` and `chat_messages` tables from the initial design. The backend has a mature REST API structure with services, routes, and middleware. The frontend uses React 18, Zustand for state, React Query for data fetching, and Tailwind CSS v4 with a defined design system (docs/style.md).

Stakeholders need a production AI agent to:
- Query product data conversationally ("Show me products under $50")
- Analyze price trends ("Is the AirPods price dropping?")
- Create alerts based on natural language ("Alert me when price drops below $200")
- Get insights without navigating multiple pages

Constraints:
- Must use Claude Opus 4.8 via Anthropic SDK (already in design doc)
- UI must follow design system: calm, minimal, high information density
- Streaming responses required for good UX
- Backend already has 115 passing tests - maintain test coverage
- Frontend has 19 passing tests - add tests for new components

## Goals / Non-Goals

**Goals:**
- Functional AI agent with 10+ tools for e-commerce operations
- Streaming chat responses with tool call visualization
- Persistent conversation history with session management
- Production-grade error handling and retry logic
- Clean separation: backend handles AI logic, frontend handles presentation
- Design system compliance (calm, minimal, structured)
- Comprehensive test coverage (unit + integration)

**Non-Goals:**
- RAG or vector search (use Claude's built-in knowledge + tool results)
- Multi-user authentication (single-user system)
- Voice input/output
- Custom model training or fine-tuning
- Real-time collaborative chat (single session at a time)
- Mobile app (responsive web only)

## Decisions

### Decision 1: Use Anthropic SDK's tool use API, not function calling

**Choice:** Implement tools via Claude's native tool use with structured schemas.

**Rationale:**
- Claude Opus 4.8 has best-in-class tool use accuracy
- SDK handles JSON schema validation automatically
- Built-in support for streaming with tool calls
- Easier to test (mock SDK responses)

**Alternatives considered:**
- LangChain/LlamaIndex: Too heavy for this use case (we only need tool calling, not orchestration)
- OpenAI function calling: Project uses Claude ecosystem

**Implementation:**
```typescript
const tools = [
  {
    name: "searchProducts",
    description: "Search products by keyword, platform, or price range",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        platform: { type: "string", enum: ["amazon", "walmart", "ebay"] },
        maxPrice: { type: "number" }
      },
      required: ["query"]
    }
  }
]
```

### Decision 2: Server-sent events (SSE) for streaming, not WebSocket

**Choice:** Use HTTP streaming with `text/event-stream` for real-time message updates.

**Rationale:**
- Simpler than WebSocket (no persistent connection management)
- Works with existing Express middleware
- React Query supports SSE via fetch EventSource
- Automatic reconnection on network failure
- No additional backend dependencies

**Alternatives considered:**
- WebSocket: Overkill for one-way streaming; requires socket.io or ws library
- Polling: Poor UX, wasteful bandwidth

**Example:**
```typescript
// Backend
response.setHeader('Content-Type', 'text/event-stream')
for await (const chunk of stream) {
  response.write(`data: ${JSON.stringify(chunk)}\n\n`)
}

// Frontend
const eventSource = new EventSource('/api/chat/stream')
eventSource.onmessage = (e) => setMessages(m => [...m, JSON.parse(e.data)])
```

### Decision 3: Store tool execution results in message metadata, not separate table

**Choice:** Store tool calls and results as JSON in `chat_messages.tool_calls` and `chat_messages.tool_results` columns (already in schema).

**Rationale:**
- Keeps conversation context atomic (one message = one DB row)
- Easier to replay conversations (just read messages table)
- Simpler queries (no JOINs for tool data)
- Schema already designed this way

**Alternatives considered:**
- Separate `tool_executions` table: More normalized but complicates queries and isn't needed for this scale

### Decision 4: Frontend uses markdown rendering for assistant responses

**Choice:** Use `react-markdown` with `remark-gfm` for formatting agent responses.

**Rationale:**
- Agent outputs structured responses (lists, tables, code blocks)
- Markdown is Claude's native output format
- Better readability than plain text
- Small bundle size (~150KB)

**Configuration:**
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    code: CodeBlock, // syntax highlighting
    table: StyledTable, // design system alignment
  }}
>
  {message.text}
</ReactMarkdown>
```

**Alternatives considered:**
- Plain text: Poor formatting for complex responses
- Custom DSL: Reinventing markdown, unnecessary complexity

### Decision 5: Session management with auto-title generation

**Choice:** Generate session titles using Claude after 2-3 messages (e.g., "Amazon AirPods Price Analysis").

**Rationale:**
- Better than "New Chat #47" - helps users find conversations
- Async generation doesn't block chat (fire-and-forget)
- Claude is good at summarization

**Implementation:**
```typescript
if (session.messages.length === 3 && !session.title) {
  const title = await generateTitle(session.messages)
  await updateSession(session.id, { title })
}
```

**Alternatives considered:**
- Manual titles: Extra friction for users
- First user message: Often vague ("hi", "help me")

### Decision 6: Tool execution timeout of 10 seconds with fallback

**Choice:** Each tool call has 10s timeout; on timeout, return partial results or error to Claude.

**Rationale:**
- Scraper calls can hang (network issues, anti-bot)
- User shouldn't wait indefinitely
- Claude can handle "Tool timed out" and suggest alternatives

**Example:**
```typescript
const result = await Promise.race([
  executeToolWithParams(toolName, params),
  timeout(10000, 'Tool execution timeout')
])
```

### Decision 7: System prompt with structured output format

**Choice:** Inject system prompt that enforces structured response format (现状/洞察/建议/风险) from design doc.

**Rationale:**
- Consistent response structure aids readability
- Matches user expectations set by design doc
- Easy to parse for UI styling (bold section headers)

**System prompt excerpt:**
```
You are an e-commerce operations AI assistant.

When providing analysis, use this format:
**现状**: Current situation
**洞察**: Insights from data
**建议**: Actionable recommendations
**风险**: Uncertainties to consider
```

### Decision 8: Conversation context window limit of 20 messages

**Choice:** Include only last 20 messages in Claude API call context.

**Rationale:**
- Claude Opus has 1M token limit, but cost grows with context
- 20 messages ≈ 10 turns ≈ enough for coherent conversation
- Older context usually irrelevant ("what was the first product I asked about?")
- Can implement "summarize and continue" later if needed

**Alternatives considered:**
- Unlimited context: Cost scales poorly
- 10 messages: Too short for complex analysis
- Summarization: Adds latency, not needed for MVP

### Decision 9: Frontend chat UI follows "comfortable" density from style.md

**Choice:** Use 24-32px padding, large whitespace, 1-2 hierarchy levels (not compact).

**Rationale:**
- Chat is conversational, not data-dense
- Matches "comfortable" density profile: Forms, Conversations, Documentation
- Easier to read long agent responses
- Aligns with existing Chat.tsx spacing

**Visual hierarchy:**
```
┌─────────────────────────────────────┐
│  [Avatar] Assistant                 │  ← 24px padding
│  Message content with comfortable   │
│  line-height and spacing            │
│                                     │  ← 32px vertical gap
│           User [Avatar]             │
│           User message              │
└─────────────────────────────────────┘
```

### Decision 10: Tool visualization with collapsible detail view

**Choice:** Show tool calls as collapsible cards: "🔧 Searching products..." → expand to see parameters and results.

**Rationale:**
- Users want transparency (what is the agent doing?)
- Full details are noisy; collapse by default
- Debugging aid for power users

**UI:**
```
┌──────────────────────────────────────┐
│ 🔧 searchProducts                    │ ← Collapsed
│    Searched 3 products               │
└──────────────────────────────────────┘
        ↓ click
┌──────────────────────────────────────┐
│ 🔧 searchProducts                  ▼ │ ← Expanded
│ Parameters:                          │
│   query: "AirPods"                   │
│   maxPrice: 300                      │
│ Results: [...]                       │
└──────────────────────────────────────┘
```

## Risks / Trade-offs

### Risk: Claude API cost escalation with heavy usage

**Mitigation:**
- Log token usage per message in `chat_messages.tokens_used`
- Display usage stats in Settings page
- Add optional daily spending cap in config
- Use Claude Haiku for simple queries (future optimization)

### Risk: Tool execution failures break conversation flow

**Mitigation:**
- Wrap each tool in try-catch with descriptive error messages
- Return errors to Claude as tool results (it can explain to user)
- Log all tool failures for monitoring

### Risk: Streaming interruption on network issues

**Mitigation:**
- Frontend auto-reconnects EventSource on disconnect
- Backend stores partial messages (insert on first chunk)
- Show "Reconnecting..." indicator in UI

### Risk: Design system divergence (Chat UI looks inconsistent)

**Mitigation:**
- Use existing Tailwind tokens (bg-surface, text-fg, etc.)
- Match Dashboard's card styling (soft corners, subtle elevation)
- Code review checklist: "Does this follow style.md?"

### Trade-off: SSE vs WebSocket

**Downside:** SSE is one-way (server → client); can't cancel a running stream from frontend.

**Impact:** User must wait for full response even if they realize the question was wrong.

**Acceptable because:** Most queries complete in <5 seconds; forced wait is minor UX issue.

### Trade-off: 20-message context limit

**Downside:** Agent "forgets" older parts of conversation.

**Impact:** User may need to repeat information ("I mentioned Product X earlier...").

**Acceptable because:** Most sessions are task-focused (5-10 turns); rare to reference 30 messages back.

### Trade-off: Session title generation adds latency

**Downside:** Title appears 2-3 seconds after 3rd message (async).

**Impact:** User sees "New Chat" briefly, then title updates.

**Acceptable because:** Not a critical path; user is focused on response content, not sidebar.

## Migration Plan

### Phase 1: Backend foundation (Day 1)
1. Install @anthropic-ai/sdk
2. Create `backend/src/services/chatService.ts` with basic Claude integration
3. Implement 3 tools: searchProducts, getProductDetails, analyzePriceTrend
4. Add `/api/chat/sessions` CRUD routes
5. Add `/api/chat/sessions/:id/messages` POST route (non-streaming)
6. Verify with curl: create session → send message → get response

### Phase 2: Streaming + tool execution (Day 2)
1. Add `/api/chat/sessions/:id/stream` SSE endpoint
2. Implement tool executor service
3. Add remaining 7 tools
4. Test tool chaining (agent calls multiple tools)
5. Verify streaming with curl or HTTPie

### Phase 3: Frontend integration (Day 3)
1. Create chatStore (Zustand) for session state
2. Implement chatApi service with fetch-based SSE
3. Refactor Chat.tsx: replace demo logic with real API calls
4. Add MessageBubble component with markdown
5. Manual test: send message, see streaming response

### Phase 4: UI refinement (Day 4)
1. Add SessionSidebar with conversation list
2. Implement tool visualization (collapsible cards)
3. Add loading states and error handling
4. Polish styling per design system

### Phase 5: Testing (Day 5)
1. Backend unit tests: chatService, tool execution
2. Backend integration test: full conversation flow
3. Frontend component tests: MessageBubble, SessionSidebar
4. E2E test: create session, send message, verify response

### Rollback Strategy

If deployment fails:
1. Revert frontend: restore demo Chat.tsx from git (frontend still works, backend ignored)
2. Revert backend: remove chat routes from route index (API returns 404, frontend shows error)
3. No data loss: chat_sessions table is append-only

If API costs spike unexpectedly:
1. Add ANTHROPIC_API_ENABLED=false env var check
2. Return "AI agent temporarily disabled" message
3. Investigate usage logs, adjust rate limits

## Open Questions

1. **Should we support file uploads (e.g., CSV of products)?**
   - Defer to Phase 2 - focus on text conversation for MVP

2. **Do we need conversation search/filtering in sidebar?**
   - Decision: Add if >20 sessions exist; otherwise, chronological list is enough

3. **Should tool results be visible by default or collapsed?**
   - Decision: Collapsed by default; power users can expand
