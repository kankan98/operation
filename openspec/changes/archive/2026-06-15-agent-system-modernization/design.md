## Context

The current Agent/Chat system was added to an existing e-commerce price monitoring platform. While the basic conversation flow works, the streaming implementation has critical bugs that make tool calling non-functional in streaming mode, and the user experience lacks essential features present in modern AI chat products (ChatGPT, Claude, Cursor).

**Current State:**
- Backend uses `AnthropicProvider` (default) and `OpenAIProvider` with a unified `AIProvider` interface
- Streaming uses `better-sse` library for SSE transport
- Frontend uses React 19, Zustand for state, React Query for data fetching, and EventSource for SSE consumption
- Design system ("Agent Purple") enforces specific animation constraints: fade/skeleton allowed, bounce prohibited, 150-250ms timing cap
- No code highlighting library installed; no animation library (framer-motion) installed

**Constraints:**
- Must maintain backward compatibility with existing chat sessions and messages in SQLite DB
- Must work with both Anthropic and OpenAI protocols (DeepSeek supports both)
- Must respect Agent Purple design system's motion rules (no bounce, timing ≤250ms)
- Frontend bundle size should not increase significantly (prefer lightweight solutions)
- Backend is Node.js/Express with TypeScript; frontend is Vite/React with TypeScript

**Stakeholders:**
- End users experiencing broken tool calling and poor UX
- Developers maintaining the codebase (need clear patterns for future AI provider additions)

## Goals / Non-Goals

**Goals:**
- Fix P0 blocker: streaming tool calls must receive complete parameters
- Fix P0 blocker: context messages must serialize correctly per Anthropic/OpenAI protocols
- Fix P0 blocker: context retrieval must fetch most recent N messages, not oldest
- Implement Agent Loop (multi-turn tool execution up to 5 iterations)
- Extend SSE protocol to support 8+ granular event types for real-time visualization
- Add user controls: Abort, Regenerate, Scroll-to-bottom with new message indicator
- Add visual feedback: agent status indicators, real-time tool card updates
- Add syntax highlighting for code blocks in assistant messages
- Add smooth animations for tool cards and status transitions (within design system constraints)
- Clean up dead code (useSSEStream hook, ChatExample component)
- Ensure both AnthropicProvider and OpenAIProvider follow consistent patterns

**Non-Goals:**
- Not implementing Fork/Branch conversation capabilities (future work)
- Not adding user authentication or multi-user support (separate feature)
- Not adding prompt caching or Claude Extended Thinking (can be added later without protocol changes)
- Not redesigning the entire message storage schema (current schema is sufficient)
- Not implementing persistent AbortController across page refreshes
- Not adding voice input/output capabilities
- Not implementing real-time collaborative editing of conversations

## Decisions

### Decision 1: Fix streaming tool calls via parameter accumulation map

**Choice:** Use a `Map<blockIndex, ToolInProgress>` to accumulate `input_json_delta` events in AnthropicProvider's `streamMessage`.

**Rationale:**
- Anthropic SDK streams tool parameters incrementally as `input_json_delta` events with `partial_json` strings
- Current code ignores these deltas (commented out at line 72-75) and emits `input: {}` at `content_block_start`
- OpenAIProvider already handles this correctly by accumulating `tool_calls[].function.arguments` deltas
- Map keyed by block index handles multiple concurrent tool calls

**Alternatives considered:**
- **Single accumulator:** Fails for multiple tool calls in one turn
- **Emit partial JSON on each delta:** Would require frontend to parse incomplete JSON (fragile)
- **Buffer entire stream then parse:** Loses real-time feedback advantage

**Implementation:**
```typescript
const toolCallsInProgress = new Map<number, {
  id: string;
  name: string;
  inputJson: string;
}>();

// On content_block_start
toolCallsInProgress.set(event.index, {
  id: event.content_block.id,
  name: event.content_block.name,
  inputJson: '',
});

// On content_block_delta with input_json_delta
const tool = toolCallsInProgress.get(event.index);
if (tool) tool.inputJson += event.delta.partial_json;

// On content_block_stop
const tool = toolCallsInProgress.get(event.index);
if (tool) {
  yield {
    type: 'tool_call',
    toolCall: {
      id: tool.id,
      name: tool.name,
      input: JSON.parse(tool.inputJson),
    },
  };
  toolCallsInProgress.delete(event.index);
}
```

---

### Decision 2: Fix convertMessages to properly serialize tool_use blocks

**Choice:** Conditionally add content blocks based on message role and presence of toolCalls/toolResults.

**Rationale:**
- Anthropic protocol requires assistant messages with tool calls to include `tool_use` content blocks with `id`, `name`, `input`
- Current code only handles `toolResults` (user messages) and always adds a text block even when content is empty
- OpenAIProvider correctly handles this by checking `msg.toolCalls` and creating proper `tool_calls` array

**Alternatives considered:**
- **Always include empty text block:** Violates Anthropic protocol (rejected by API in some scenarios)
- **Separate converter per role:** More code duplication
- **Use SDK's built-in converter:** Anthropic SDK doesn't provide one for our internal Message type

**Implementation:**
```typescript
private convertMessages(messages: Message[]): any[] {
  return messages.map(msg => {
    const content: any[] = [];
    
    // Add text content if non-empty
    if (msg.content) {
      content.push({ type: 'text', text: msg.content });
    }
    
    // Assistant: add tool_use blocks
    if (msg.role === 'assistant' && msg.toolCalls) {
      msg.toolCalls.forEach(tc => {
        content.push({
          type: 'tool_use',
          id: tc.id,
          name: tc.name,
          input: tc.input,
        });
      });
    }
    
    // User: add tool_result blocks
    if (msg.role === 'user' && msg.toolResults) {
      msg.toolResults.forEach(result => {
        content.push({
          type: 'tool_result',
          tool_use_id: result.toolCallId,
          content: JSON.stringify(result.output),
          is_error: result.isError || false,
        });
      });
    }
    
    return { role: msg.role, content };
  });
}
```

---

### Decision 3: Agent Loop with max 5 iterations

**Choice:** Implement loop in `ChatService.streamMessage()` that continues while `toolCalls.length > 0` and `iteration < 5`.

**Rationale:**
- Current implementation only does one round: user → agent with tools → execute tools → agent final response
- Claude/GPT can request tools multiple times in sequence (e.g., search → read first result → search again)
- 5 iterations is industry standard (Anthropic SDK default, OpenAI Swarm pattern)
- Loop must happen in streaming context to provide real-time updates

**Alternatives considered:**
- **Unlimited loop:** Risk of infinite loops, runaway costs
- **Loop in AI provider:** Loses granular control over streaming events between iterations
- **Separate endpoint for multi-turn:** More complex API surface

**Implementation:**
```typescript
async *streamMessage(sessionId: string, content: string) {
  let context = await this.buildContext(sessionId);
  const MAX_ITERATIONS = 5;
  
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const generator = aiProvider.streamMessage({
      messages: context,
      tools: AGENT_TOOLS,
      systemPrompt: SYSTEM_PROMPT,
    });
    
    let accumulatedContent = '';
    const toolCalls: ToolCall[] = [];
    let totalUsage = { inputTokens: 0, outputTokens: 0 };
    
    for await (const chunk of generator) {
      yield chunk; // Pass through to frontend
      
      if (chunk.type === 'text') accumulatedContent += chunk.text;
      if (chunk.type === 'tool_call') toolCalls.push(chunk.toolCall);
      if (chunk.type === 'usage') {
        totalUsage.inputTokens += chunk.usage.inputTokens;
        totalUsage.outputTokens += chunk.usage.outputTokens;
      }
    }
    
    if (toolCalls.length === 0) break; // No more tools, exit loop
    
    // Execute tools
    const toolResults = await this.executeTools(toolCalls);
    for (const result of toolResults) {
      yield { type: 'tool_result', toolResult: result };
    }
    
    // Update context for next iteration
    context = [
      ...context,
      { role: 'assistant', content: accumulatedContent, toolCalls },
      { role: 'user', content: '', toolResults },
    ];
  }
  
  // Store final message after loop completes
  await this.storeMessage({...});
}
```

---

### Decision 4: Extend StreamChunk to 8+ event types

**Choice:** Define discriminated union type in `shared/schemas/chat-events.ts` with specific event types for each phase.

**Rationale:**
- Current single `type` field in StreamChunk is insufficient for real-time UX
- Frontend can't distinguish "tool starting" vs "tool result arrived" without separate event types
- Need to support: message_start, status, text_delta, tool_call_start, tool_call_end, tool_result, usage, message_done, error
- Discriminated union provides type safety and clear contract

**Alternatives considered:**
- **Sub-type field:** `{ type: 'tool', subtype: 'start' }` - more nested, harder to discriminate in TypeScript
- **Separate SSE event names:** `better-sse` supports named events but adds transport complexity
- **Single event with nullable fields:** Loses type safety, error-prone

**Implementation:**
```typescript
// shared/schemas/chat-events.ts
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

---

### Decision 5: Abort via EventSource.close()

**Choice:** Store cleanup function returned by `chatApi.streamMessage()` in a ref, call it on Stop button click.

**Rationale:**
- EventSource has built-in `close()` method that terminates connection
- Current `chatApi.streamMessage()` already returns cleanup function
- No need for server-side abort tracking (connection drop is sufficient)
- AbortController not needed because we're not using fetch (EventSource handles reconnection)

**Alternatives considered:**
- **Server-side abort registry:** Over-engineered, requires tracking active streams by session
- **WebSocket for bidirectional control:** Heavier, overkill for this use case
- **Polling for abort flag:** Wasteful, adds latency

**Implementation:**
```typescript
const cleanupRef = useRef<(() => void) | null>(null);

const sendMessage = async (text: string) => {
  cleanupRef.current = await chatApi.streamMessage(...);
};

const handleStop = () => {
  cleanupRef.current?.();
  cleanupRef.current = null;
  setStreaming(false);
};
```

---

### Decision 6: Regenerate via DELETE + re-stream

**Choice:** Add `DELETE /api/chat/sessions/:id/messages/:messageId` and `POST /regenerate` endpoints.

**Rationale:**
- Simplest implementation: delete old message, retrieve original user content, trigger new stream
- Keeps message IDs unique (no versioning needed)
- Allows future enhancement to keep deleted messages for history/debugging

**Alternatives considered:**
- **In-place update with version counter:** More complex, requires schema change
- **Keep deleted messages with `deleted: true` flag:** Adds query complexity for active messages
- **Retry without deleting:** Would create duplicate messages in DB

**Implementation:**
```typescript
// Backend route
router.post('/sessions/:id/messages/:messageId/regenerate', async (req, res) => {
  const { id: sessionId, messageId } = req.params;
  
  // Get the message to regenerate
  const message = await getMessageById(messageId);
  if (!message || message.role !== 'assistant') {
    throw new AppError(400, 'Can only regenerate assistant messages');
  }
  
  // Find the preceding user message
  const userMessage = await getPrecedingUserMessage(sessionId, message.timestamp);
  if (!userMessage) {
    throw new AppError(400, 'No user message found before assistant message');
  }
  
  // Delete the assistant message
  await deleteMessage(messageId);
  
  // Return stream URL (frontend initiates SSE)
  res.json({
    stream_url: `/api/chat/sessions/${sessionId}/stream?content=${encodeURIComponent(userMessage.content)}`,
  });
});
```

---

### Decision 7: Syntax highlighting with react-syntax-highlighter

**Choice:** Use `react-syntax-highlighter` with Prism highlighter and `oneDark` theme.

**Rationale:**
- Lightweight (~50KB gzipped with tree-shaking)
- Works with ReactMarkdown components prop
- Prism supports 200+ languages
- oneDark theme matches Agent Purple design system's dark aesthetic

**Alternatives considered:**
- **highlight.js:** Requires manual DOM manipulation (not React-friendly)
- **Shiki:** Larger bundle size (~200KB), overkill for this use case
- **Monaco Editor:** Way too heavy (used for code editors, not inline highlighting)
- **Manual CSS classes:** Would require language detection and custom styling for each language

**Implementation:**
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// In ReactMarkdown components
code: ({ className, children }) => {
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  
  return lang ? (
    <SyntaxHighlighter language={lang} style={oneDark}>
      {String(children).replace(/\n$/, '')}
    </SyntaxHighlighter>
  ) : (
    <code className="inline-code">{children}</code>
  );
}
```

---

### Decision 8: CSS transitions for animations (no framer-motion)

**Choice:** Use Tailwind's `transition-*` utilities and CSS keyframes for all animations.

**Rationale:**
- Design system explicitly caps animation timing at 250ms and allows only fade/scale/slide
- framer-motion adds 50KB+ to bundle for features we can't use (spring physics, gestures)
- Pure CSS transitions are performant (GPU-accelerated) and meet all requirements
- Tailwind v4 has built-in animation utilities

**Alternatives considered:**
- **framer-motion:** Over-engineered for our constrained animation needs
- **react-spring:** Similar to framer-motion, too heavy
- **GSAP:** Commercial licensing issues, overkill

**Implementation:**
```tsx
// Tool card expand/collapse
<div className={cn(
  'overflow-hidden transition-all duration-200',
  expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
)}>
  {/* content */}
</div>

// Status indicator fade
<div className="animate-fade-in">
  {status === 'thinking' && <ThinkingIndicator />}
</div>

// Scroll button slide-up
<button className="animate-slide-up">
  <ArrowDown />
</button>
```

---

### Decision 9: Fix context retrieval with DESC + reverse

**Choice:** Query with `orderBy(desc(chatMessages.timestamp)).limit(N)`, then `.reverse()` the array.

**Rationale:**
- Current code uses `orderBy(chatMessages.timestamp)` which sorts ascending (oldest first)
- With `.limit(20)`, this fetches the *oldest* 20 messages, not the most recent
- SQL DESC + array reverse is more efficient than fetching all and slicing in JS

**Alternatives considered:**
- **Fetch all, sort in JS:** Wasteful for sessions with 100+ messages
- **Offset-based pagination from end:** More complex query, prone to off-by-one errors
- **Keep messages in DESC order:** Would require reversing throughout codebase

**Implementation:**
```typescript
private async getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]> {
  const query = db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.timestamp)); // Most recent first
  
  let rows = limit ? await query.limit(limit) : await query;
  
  // Reverse to chronological order (oldest → newest) for LLM context
  return rows.reverse().map(row => ({...}));
}
```

---

### Decision 10: Immutable state updates in Zustand

**Choice:** Always create new objects when updating nested state (spread existing, modify copy).

**Rationale:**
- Zustand relies on reference equality for change detection
- Current `appendMessageContent` mutates `lastMessage.content` directly
- React may skip re-renders if object reference doesn't change

**Alternatives considered:**
- **Use immer middleware:** Adds dependency, Zustand's shallow approach is sufficient
- **Fully normalize state (messages by ID):** Over-engineered for current scale

**Implementation:**
```typescript
appendMessageContent: (content) =>
  set((state) => {
    const messages = [...state.messages];
    const lastIdx = messages.length - 1;
    
    if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
      // Create new object (don't mutate)
      messages[lastIdx] = {
        ...messages[lastIdx],
        content: messages[lastIdx].content + content,
      };
    } else {
      messages.push({
        id: `temp-${Date.now()}`,
        sessionId: state.currentSessionId || '',
        role: 'assistant',
        content,
        timestamp: Date.now(),
      });
    }
    
    return { messages };
  }),
```

## Risks / Trade-offs

### [Risk] Agent Loop could cause long wait times for users
- **Mitigation:** Show real-time status updates for each tool call; users see progress instead of staring at spinner. Add iteration counter ("Tool call 2 of 5") if needed.

### [Risk] Syntax highlighter increases bundle size
- **Mitigation:** Use dynamic import for SyntaxHighlighter to code-split it. Most users don't see code blocks immediately, so lazy-load on first code block render.

### [Risk] EventSource doesn't support custom headers (can't send auth tokens easily)
- **Mitigation:** For future auth implementation, switch to fetch-based streaming or pass token as query param (less secure but workable). Current system has no auth, so not blocking.

### [Risk] Regenerate deletes original message, losing tool call history
- **Mitigation:** Consider adding `deleted_at` timestamp column in future for audit trail. For now, acceptable trade-off for simplicity.

### [Risk] Multiple rapid clicks on Regenerate could create race conditions
- **Mitigation:** Disable Regenerate button while streaming is active. Add debounce to prevent double-clicks.

### [Risk] Tool execution timeout (10s) might not be enough for slow tools
- **Mitigation:** Current 10s timeout is reasonable for DB queries. If future tools need longer (e.g., web scraping), make timeout configurable per tool definition.

### [Risk] Scroll-to-bottom button might cover content on small screens
- **Mitigation:** Position button with sufficient margin from edges; use z-index layering to stay above content but below modals. Test on mobile viewports.

### [Risk] SSE event type changes break existing clients
- **Mitigation:** Event payload is additive (new types added, old 'message' type removed). If gradual migration needed, emit both old and new formats temporarily.

### [Trade-off] CSS transitions instead of framer-motion limits animation flexibility
- **Acceptance:** Design system constraints make framer-motion's advanced features unusable anyway. If future designs require complex animations, revisit this decision.

### [Trade-off] No tool call caching between regenerates
- **Acceptance:** Tools are fast (<1s typically) and regenerate implies "try again", so fresh execution is correct behavior. If caching needed, implement at tool service layer, not regenerate endpoint.

## Migration Plan

**Phase 1: Backend P0 Fixes (No Downtime)**
1. Deploy fixed `AnthropicProvider.streamMessage()` with parameter accumulation
2. Deploy fixed `convertMessages()` for proper protocol serialization
3. Deploy fixed `buildContext()` for recent messages
4. Deploy extended SSE event types (backward compatible - frontend ignores unknown types)
5. No database migration needed (schema unchanged)

**Phase 2: Backend Agent Loop (No Downtime)**
1. Deploy `ChatService.streamMessage()` with loop logic
2. No API changes (streaming endpoint signature unchanged)
3. Monitor token usage increase (multi-turn costs more)

**Phase 3: Frontend Event Handling (No Downtime)**
1. Deploy frontend with all SSE event type handlers
2. Deploy syntax highlighter (code-split)
3. Deploy tool card real-time updates
4. Deploy abort button
5. No localStorage/state migration needed

**Phase 4: Conversation Controls (No Downtime)**
1. Deploy regenerate/delete endpoints
2. Deploy scroll-to-bottom button
3. Deploy status indicators

**Phase 5: Cleanup (No Downtime)**
1. Remove `useSSEStream.ts` and `ChatExample.tsx`
2. Update documentation

**Rollback Strategy:**
- Backend changes are additive (don't break existing behavior)
- If P0 fix causes issues, revert Git commits to previous version
- If frontend breaks, revert static assets (Vite build outputs)
- No database rollback needed (no schema changes)

**Testing Checklist:**
- [ ] Streaming tool calls receive complete parameters (test with searchProducts tool)
- [ ] Multi-turn tool execution (test with scenario requiring 2+ tool calls)
- [ ] Abort stops streaming immediately
- [ ] Regenerate deletes old message and starts new stream
- [ ] Syntax highlighting renders for common languages (JS, Python, TypeScript)
- [ ] Tool cards update in real-time (running → success/error)
- [ ] Scroll-to-bottom button appears when scrolled up
- [ ] Status indicators change correctly (thinking → tool_calling → writing)
- [ ] Both Anthropic and OpenAI providers work (test with env var switch)

## Open Questions

1. **Should we add prompt caching for multi-turn conversations?** - Defer to future optimization (requires Anthropic API feature flag)

2. **Should regenerate support "edit and regenerate" (modify user message before retry)?** - No, keep simple. User can send new message if they want different input.

3. **Should we track regenerate count per message for analytics?** - Not in MVP. Add if product team requests.

4. **Should abort cancel in-flight tool executions?** - No, tools finish but results aren't sent to LLM. Canceling mid-execution (e.g., DB transaction) is risky.

5. **Should we support "regenerate from this point" in middle of conversation?** - No, only regenerate last assistant message. Branching is future work.
