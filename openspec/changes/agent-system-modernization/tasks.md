## 1. Backend - Fix Streaming Tool Call Parameters (P0 Blocker)

- [ ] 1.1 Add `Map<blockIndex, ToolInProgress>` to track tool calls in `AnthropicProvider.streamMessage()`
- [ ] 1.2 Handle `content_block_start` event to initialize tool tracking entry
- [ ] 1.3 Handle `content_block_delta` with `input_json_delta` to accumulate partial JSON
- [ ] 1.4 Handle `content_block_stop` to parse complete JSON and emit `tool_call` event
- [ ] 1.5 Test streaming tool calls with `searchProducts` tool to verify parameters are received

## 2. Backend - Fix Message Conversion Protocol (P0 Blocker)

- [ ] 2.1 Update `AnthropicProvider.convertMessages()` to conditionally add text blocks (only if content non-empty)
- [ ] 2.2 Add logic to serialize assistant `toolCalls` into `tool_use` content blocks
- [ ] 2.3 Update user message handling to properly serialize `toolResults` into `tool_result` blocks
- [ ] 2.4 Verify `OpenAIProvider.convertMessages()` follows same pattern for consistency
- [ ] 2.5 Test with multi-turn conversation including tool calls to verify protocol correctness

## 3. Backend - Fix Context Retrieval (P0 Blocker)

- [ ] 3.1 Update `ChatService.getMessages()` to use `orderBy(desc(chatMessages.timestamp))`
- [ ] 3.2 Add `.reverse()` after query to return messages in chronological order (oldest → newest)
- [ ] 3.3 Test with session containing 50+ messages to verify most recent 20 are included
- [ ] 3.4 Verify context window slides correctly as conversation grows

## 4. Backend - Extend SSE Event Schema

- [ ] 4.1 Create `shared/schemas/chat-events.ts` with discriminated union type for SSE events
- [ ] 4.2 Update `backend/src/types/chat.ts` to import and use new event types
- [ ] 4.3 Add event types: `message_start`, `status`, `text_delta`, `tool_call_start`, `tool_call_end`, `tool_result`, `usage`, `message_done`, `error`
- [ ] 4.4 Update `AnthropicProvider.streamMessage()` to emit granular events instead of generic chunks
- [ ] 4.5 Update `OpenAIProvider.streamMessage()` to emit granular events for consistency
- [ ] 4.6 Test that all event types are emitted correctly during streaming

## 5. Backend - Implement Agent Loop

- [ ] 5.1 Add loop structure in `ChatService.streamMessage()` with `MAX_ITERATIONS = 5`
- [ ] 5.2 Accumulate `toolCalls` array during each iteration
- [ ] 5.3 Check if `toolCalls.length > 0` to continue loop or break
- [ ] 5.4 Execute tools and yield `tool_result` events after each tool execution
- [ ] 5.5 Update context with assistant message (toolCalls) + user message (toolResults) for next iteration
- [ ] 5.6 Store final message only after loop completes
- [ ] 5.7 Test multi-turn scenario requiring 2-3 tool calls in sequence
- [ ] 5.8 Test that loop terminates after 5 iterations if agent keeps requesting tools

## 6. Backend - Add Conversation Control Endpoints

- [ ] 6.1 Add `DELETE /api/chat/sessions/:id/messages/:messageId` endpoint
- [ ] 6.2 Add validation to check message exists before deletion
- [ ] 6.3 Add `POST /api/chat/sessions/:id/messages/:messageId/regenerate` endpoint
- [ ] 6.4 Implement regenerate logic: validate message is assistant role, find preceding user message, delete assistant message, return stream URL
- [ ] 6.5 Add error handling for edge cases (no user message, message not found)
- [ ] 6.6 Test delete endpoint with valid and invalid message IDs
- [ ] 6.7 Test regenerate endpoint with valid assistant message
- [ ] 6.8 Test regenerate error cases (user message, no prior user message)

## 7. Frontend - Install Dependencies

- [ ] 7.1 Install `react-syntax-highlighter` and `@types/react-syntax-highlighter`
- [ ] 7.2 Verify bundle size impact is acceptable (<100KB increase)

## 8. Frontend - Handle All SSE Event Types

- [ ] 8.1 Update `chatApi.streamMessage()` to pass through all event types (remove type filtering)
- [ ] 8.2 Update `Chat.tsx` onChunk handler to switch on `chunk.type`
- [ ] 8.3 Add handler for `text_delta`: append to message content
- [ ] 8.4 Add handler for `status`: update agent status state
- [ ] 8.5 Add handler for `tool_call_start`: create tool card in running state
- [ ] 8.6 Add handler for `tool_call_end`: update tool card with parameters
- [ ] 8.7 Add handler for `tool_result`: update tool card with result and success/error status
- [ ] 8.8 Add handler for `usage`: store token usage stats
- [ ] 8.9 Test that all event types trigger appropriate UI updates

## 9. Frontend - Add Agent Status Indicators

- [ ] 9.1 Create `StatusIndicator.tsx` component with props for status type
- [ ] 9.2 Add state to `Chat.tsx` for current agent status (thinking/tool_calling/writing)
- [ ] 9.3 Render StatusIndicator based on current status
- [ ] 9.4 Add fade transition between status changes (200ms duration)
- [ ] 9.5 Update StreamingIndicator to show appropriate message per status
- [ ] 9.6 Test status transitions during streaming lifecycle

## 10. Frontend - Implement Abort Control

- [ ] 10.1 Add `cleanupRef` to store EventSource cleanup function
- [ ] 10.2 Add Stop button to Chat.tsx (visible when `isStreaming`)
- [ ] 10.3 Implement `handleStop()` to call cleanup function and reset streaming state
- [ ] 10.4 Style Stop button with red accent and square icon
- [ ] 10.5 Test abort during text streaming
- [ ] 10.6 Test abort during tool execution
- [ ] 10.7 Verify input field re-enables after abort

## 11. Frontend - Implement Regenerate Control

- [ ] 11.1 Add `chatApi.regenerateMessage(sessionId, messageId)` method
- [ ] 11.2 Add regenerate button to message actions (visible on hover for assistant messages)
- [ ] 11.3 Track original user message content for each assistant message
- [ ] 11.4 Implement `handleRegenerate()` to call API and start new stream
- [ ] 11.5 Add loading state during regenerate
- [ ] 11.6 Style regenerate button with icon (RefreshCw from lucide-react)
- [ ] 11.7 Test regenerate on assistant message with tool calls
- [ ] 11.8 Test regenerate on assistant message without tool calls

## 12. Frontend - Add Scroll Controls

- [ ] 12.1 Add `showScrollButton` state based on scroll position
- [ ] 12.2 Add `hasNewMessage` state to show indicator dot
- [ ] 12.3 Create scroll-to-bottom button component (floating, bottom-right)
- [ ] 12.4 Implement `scrollToBottom()` with smooth scroll behavior
- [ ] 12.5 Update `handleScroll()` to set `showScrollButton` when >200px from bottom
- [ ] 12.6 Set `hasNewMessage=true` when content arrives while scrolled up
- [ ] 12.7 Clear `hasNewMessage` when user scrolls to bottom or clicks button
- [ ] 12.8 Style button with ArrowDown icon and red dot indicator
- [ ] 12.9 Add slide-up animation when button appears
- [ ] 12.10 Test on desktop and mobile viewports
- [ ] 12.11 Verify button doesn't cover important content

## 13. Frontend - Implement Real-Time Tool Card Updates

- [ ] 13.1 Update `chatStore` to track tool cards state separately from messages
- [ ] 13.2 Add `addToolCard(toolCall)` action to create card in running state
- [ ] 13.3 Add `updateToolCard(toolCallId, update)` action to update status/result
- [ ] 13.4 Update `MessageBubble` to render tool cards from store state (not just from message data)
- [ ] 13.5 Update `ToolCallCard` status colors: blue (running), green (success), red (error)
- [ ] 13.6 Test tool card updates in real-time during streaming
- [ ] 13.7 Test tool card persistence after stream completes

## 14. Frontend - Add Syntax Highlighting

- [ ] 14.1 Import Prism highlighter and oneDark theme from react-syntax-highlighter
- [ ] 14.2 Update `MessageBubble` ReactMarkdown code component
- [ ] 14.3 Detect language from className (e.g., `language-typescript`)
- [ ] 14.4 Render SyntaxHighlighter for block code, plain code for inline
- [ ] 14.5 Set custom styles: borderRadius 8px, fontSize 13px
- [ ] 14.6 Test with common languages: JavaScript, TypeScript, Python, JSON, bash
- [ ] 14.7 Test fallback behavior for unsupported languages
- [ ] 14.8 Verify syntax highlighting doesn't break markdown rendering

## 15. Frontend - Add Tool Card Animations

- [ ] 15.1 Update `ToolCallCard` to use controlled expand/collapse state
- [ ] 15.2 Add CSS transitions: max-height and opacity over 200ms
- [ ] 15.3 Use `transition-all duration-200` Tailwind utility
- [ ] 15.4 Add conditional classes for expanded/collapsed states
- [ ] 15.5 Test expand animation smoothness
- [ ] 15.6 Test collapse animation smoothness
- [ ] 15.7 Verify animations respect 250ms timing cap from design system

## 16. Frontend - Fix Zustand State Immutability

- [ ] 16.1 Update `appendMessageContent` to create new message object instead of mutating
- [ ] 16.2 Update `addMessage` to ensure immutability
- [ ] 16.3 Update `setMessages` to replace entire array
- [ ] 16.4 Add type checks to ensure no accidental mutations
- [ ] 16.5 Test that message updates trigger re-renders correctly

## 17. Cleanup and Documentation

- [ ] 17.1 Delete `frontend/src/hooks/useSSEStream.ts` (dead code)
- [ ] 17.2 Delete `frontend/src/components/ChatExample.tsx` (dead code)
- [ ] 17.3 Update `backend/README.md` with new API endpoints (regenerate, delete message)
- [ ] 17.4 Update `shared/schemas/README.md` with SSE event types documentation
- [ ] 17.5 Add JSDoc comments to new functions in AnthropicProvider and ChatService
- [ ] 17.6 Update `frontend/src/services/chatApi.ts` JSDoc with regenerate/abort documentation

## 18. End-to-End Testing

- [ ] 18.1 Test complete flow: user message → tool call → tool result → final response
- [ ] 18.2 Test multi-turn scenario: 3 tool calls in sequence
- [ ] 18.3 Test abort during each phase (thinking, tool_calling, writing)
- [ ] 18.4 Test regenerate with and without tool calls
- [ ] 18.5 Test scroll-to-bottom appears and works correctly
- [ ] 18.6 Test syntax highlighting for 5+ languages
- [ ] 18.7 Test tool card animations and status updates
- [ ] 18.8 Test agent status indicator transitions
- [ ] 18.9 Test with both AnthropicProvider and OpenAIProvider (switch via env var)
- [ ] 18.10 Test long conversation (50+ messages) to verify context retrieval
- [ ] 18.11 Verify no console errors or warnings
- [ ] 18.12 Run existing backend tests to ensure no regressions
- [ ] 18.13 Run existing frontend tests to ensure no regressions

## 19. Performance Verification

- [ ] 19.1 Measure bundle size increase (should be <100KB)
- [ ] 19.2 Test streaming latency (first token time)
- [ ] 19.3 Test tool execution responsiveness
- [ ] 19.4 Verify animations run at 60fps (use Chrome DevTools)
- [ ] 19.5 Test on mobile device or emulator for performance
- [ ] 19.6 Profile memory usage during long streaming session

## 20. Browser Compatibility Testing

- [ ] 20.1 Test on Chrome (latest)
- [ ] 20.2 Test on Firefox (latest)
- [ ] 20.3 Test on Safari (latest)
- [ ] 20.4 Test on Edge (latest)
- [ ] 20.5 Test on mobile Safari (iOS)
- [ ] 20.6 Test on mobile Chrome (Android)
- [ ] 20.7 Verify EventSource works on all browsers
- [ ] 20.8 Verify syntax highlighting renders correctly on all browsers
