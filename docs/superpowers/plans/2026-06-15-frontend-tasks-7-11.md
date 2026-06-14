# Frontend Tasks 7-11 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement core chat hooks and components (useChatSSE, StatusIndicator, ScrollButton, ToolCardManager, ChatHeader)

**Architecture:** Custom hooks for SSE handling + presentational components with animations

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, lucide-react

---

## Task 7: Create useChatSSE Hook (Complex SSE Event Handling)

**Files:**
- Create: `frontend/src/hooks/useChatSSE.ts`

- [ ] **Step 1: Create hook with type definitions**

```typescript
import { useRef, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatApi } from '../api/chat';

interface UseChatSSEReturn {
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  error: string | null;
}

/**
 * Custom hook for managing SSE chat streaming
 * Handles 9 SSE event types: message_start, status, text_delta,
 * tool_call_start, tool_call_end, tool_result, usage, message_done, error
 */
export function useChatSSE(): UseChatSSEReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    messages,
    agentStatus,
    error,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    updateToolCardState,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
  } = useChatStore();

  // __CONTINUE_HERE__
```

Expected: File created with imports and hook signature

- [ ] **Step 2: Add sendMessage function with event handlers**

Replace `// __CONTINUE_HERE__` with:

```typescript
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // Initialize assistant message
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    };
    addMessage(assistantMessage);
    setCurrentMessageId(assistantMessage.id);

    // Start streaming
    setIsStreaming(true);
    setError(null);
    setAgentStatus('thinking');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const cleanup = await chatApi.streamMessage(
        text,
        messages,
        abortController.signal,
        {
          // Event: message_start
          onMessageStart: (messageId: string) => {
            setCurrentMessageId(messageId);
          },

          // Event: status
          onStatus: (status: 'thinking' | 'tool_calling' | 'writing') => {
            setAgentStatus(status);
          },

          // Event: text_delta
          onTextDelta: (delta: string) => {
            appendToLastMessage(delta);
          },

          // Event: tool_call_start
          onToolCallStart: (toolCall: ToolCall) => {
            updateLastMessage({
              toolCalls: [...(messages[messages.length - 1]?.toolCalls || []), toolCall],
            });
            updateToolCardState(toolCall.id, {
              id: toolCall.id,
              status: 'running',
              startTime: Date.now(),
            });
          },

          // Event: tool_call_end
          onToolCallEnd: (toolCallId: string, params: unknown) => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.toolCalls) {
              const updatedToolCalls = lastMsg.toolCalls.map((tc) =>
                tc.id === toolCallId ? { ...tc, input: params } : tc
              );
              updateLastMessage({ toolCalls: updatedToolCalls });
            }
          },

          // Event: tool_result
          onToolResult: (result: ToolResult) => {
            updateToolCardState(result.toolCallId, {
              status: result.isError ? 'error' : 'success',
              endTime: Date.now(),
            });
          },

          // Event: usage
          onUsage: (usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number }) => {
            updateTokenUsage(usage);
          },

          // Event: message_done
          onMessageDone: () => {
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },

          // Event: error
          onError: (errorMsg: string) => {
            setError(errorMsg);
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },
        }
      );

      setCleanup(cleanup);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [
    messages,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    updateToolCardState,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
  ]);

  // __CONTINUE_HERE__
```

- [ ] **Step 3: Add abort function and return statement**

Replace `// __CONTINUE_HERE__` with:

```typescript
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [setIsStreaming, setAgentStatus, setCurrentMessageId]);

  return {
    sendMessage,
    abort,
    status: agentStatus,
    error,
  };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useChatSSE.ts
git commit -m "feat(hooks): add useChatSSE for SSE event handling

- Handle 9 SSE event types (message_start, status, text_delta, etc.)
- Integrate with chatApi.streamMessage
- Manage agentStatus and toolCardStates
- Provide sendMessage and abort methods

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Create StatusIndicator Component

**Files:**
- Create: `frontend/src/components/chat/StatusIndicator.tsx`

- [ ] **Step 1: Create component with type definitions**

```typescript
import { Loader2, Wrench, PenLine } from 'lucide-react';

interface StatusIndicatorProps {
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  isReconnecting: boolean;
}

/**
 * Visual feedback for agent states with animations
 * States: thinking, tool_calling, writing, reconnecting
 */
export function StatusIndicator({ status, isReconnecting }: StatusIndicatorProps) {
  if (status === 'idle' && !isReconnecting) return null;

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 text-sm text-fg-muted transition-opacity duration-200"
      style={{
        opacity: status === 'idle' && !isReconnecting ? 0 : 1,
      }}
    >
      {isReconnecting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>重新连接...</span>
        </>
      ) : status === 'thinking' ? (
        <>
          <div className="flex gap-1">
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: '0ms' }}
            />
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: '150ms' }}
            />
            <div
              className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
              style={{ animationDelay: '300ms' }}
            />
          </div>
          <span>思考中...</span>
        </>
      ) : status === 'tool_calling' ? (
        <>
          <Wrench className="w-4 h-4 text-purple-500" />
          <span>调用工具中...</span>
        </>
      ) : status === 'writing' ? (
        <>
          <PenLine className="w-4 h-4 text-purple-500" />
          <span>写作中...</span>
        </>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 3: Visual test in Storybook (optional) or dev server**

Run:
```bash
npm run dev
```

Expected: Component renders without errors (will test integration later)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/chat/StatusIndicator.tsx
git commit -m "feat(components): add StatusIndicator with animations

- Display thinking/tool_calling/writing/reconnecting states
- Pulsing 3-dot animation for thinking
- Tool and pen icons with purple accent
- 200ms fade transition

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Create ScrollButton Component

**Files:**
- Create: `frontend/src/components/chat/ScrollButton.tsx`

- [ ] **Step 1: Create component with base structure**

```typescript
import { ArrowDown } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ScrollButtonProps {
  onClick: () => void;
  hasNewMessage: boolean;
  show: boolean;
}

/**
 * Floating scroll-to-bottom button with new message indicator
 * Responsive sizes: 48px (mobile), 40px (desktop)
 */
export function ScrollButton({ onClick, hasNewMessage, show }: ScrollButtonProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!show) return null;

  return (
    <button
      onClick={onClick}
      className="fixed bottom-24 right-6 z-10 flex items-center justify-center rounded-full bg-surface-raised border border-border-subtle shadow-lg hover:bg-surface-hover active:scale-95 transition-all duration-200"
      style={{
        width: isMobile ? '48px' : '40px',
        height: isMobile ? '48px' : '40px',
        animation: 'slideUp 250ms ease-out',
      }}
      aria-label="滚动到底部"
    >
      <ArrowDown className="w-5 h-5 text-fg-default" />
      {hasNewMessage && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Add slideUp animation to index.css**

After line ~61 (motion tokens section), add:

```css
  /* ---- Keyframes ---- */
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Test dev server**

Run:
```bash
npm run dev
```

Expected: No console errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/ScrollButton.tsx frontend/src/index.css
git commit -m "feat(components): add ScrollButton with responsive sizing

- Floating bottom-right button with ArrowDown icon
- New message red dot indicator
- Responsive: 48px mobile, 40px desktop
- slideUp animation (250ms ease-out)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Create ToolCardManager Component

**Files:**
- Create: `frontend/src/components/chat/ToolCardManager.tsx`

- [ ] **Step 1: Create component with type definitions**

```typescript
import { ToolCallCard } from './ToolCallCard';
import type { ToolCall, ToolResult } from '../types/chat';

interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}

interface ToolCardManagerProps {
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  toolCardStates: Map<string, ToolCardState>;
}

/**
 * Manages rendering of all tool cards with state tracking
 * Matches toolCalls with toolResults and toolCardStates
 */
export function ToolCardManager({
  toolCalls,
  toolResults,
  toolCardStates,
}: ToolCardManagerProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {toolCalls.map((toolCall) => {
        const result = toolResults.find((r) => r.toolCallId === toolCall.id);
        const state = toolCardStates.get(toolCall.id);

        return (
          <ToolCallCard
            key={toolCall.id}
            toolCall={toolCall}
            result={result}
            status={state?.status || 'running'}
            duration={
              state?.endTime && state.startTime
                ? state.endTime - state.startTime
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Update ToolCallCard to accept status and duration props**

Read `frontend/src/components/chat/ToolCallCard.tsx` to understand current structure:

```bash
cd frontend
```

Expected: Need to verify ToolCallCard signature

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: May have type errors if ToolCallCard needs updates (will fix in Task 14)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/chat/ToolCardManager.tsx
git commit -m "feat(components): add ToolCardManager for batch tool card rendering

- Batch render all tool cards in message
- Match toolCalls with toolResults by ID
- Pass status and duration from toolCardStates
- Gap-2 spacing between cards

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Create ChatHeader Component

**Files:**
- Create: `frontend/src/components/chat/ChatHeader.tsx`

- [ ] **Step 1: Create mobile-only header component**

```typescript
import { Menu } from 'lucide-react';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface ChatHeaderProps {
  onOpenSidebar: () => void;
  title?: string;
}

/**
 * Mobile-only header with menu button
 * Only visible on < md breakpoint (< 768px)
 */
export function ChatHeader({ onOpenSidebar, title = '对话' }: ChatHeaderProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (!isMobile) return null;

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 bg-surface-default border-b border-border-subtle">
      <button
        onClick={onOpenSidebar}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-hover active:scale-95 transition-all"
        aria-label="打开侧边栏"
      >
        <Menu className="w-5 h-5 text-fg-default" />
      </button>
      <h1 className="text-lg font-semibold text-fg-default">{title}</h1>
    </header>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 3: Test responsive behavior**

Run:
```bash
npm run dev
```

Open DevTools and toggle device toolbar:
- Mobile (< 768px): Header visible
- Desktop (≥ 768px): Header hidden

Expected: Header only renders on mobile

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/chat/ChatHeader.tsx
git commit -m "feat(components): add ChatHeader for mobile navigation

- Menu button triggers sidebar
- Title display with default '对话'
- Only visible on < md breakpoint (< 768px)
- Sticky positioning with border-bottom

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7-11 Verification Checklist

After completing all tasks, verify:

- [ ] **Type Safety:**
```bash
cd frontend
npx tsc --noEmit
```
Expected: No TypeScript errors

- [ ] **Build Success:**
```bash
npm run build
```
Expected: Build completes without errors

- [ ] **Dev Server:**
```bash
npm run dev
```
Expected: No console errors, all components render

- [ ] **File Structure:**
```bash
ls -la src/hooks/
ls -la src/components/chat/
```
Expected: All 5 new files present

---

## Summary of Task 7-11

**Created Files (5):**
1. `frontend/src/hooks/useChatSSE.ts` - SSE event handling (9 event types)
2. `frontend/src/components/chat/StatusIndicator.tsx` - Agent status display
3. `frontend/src/components/chat/ScrollButton.tsx` - Scroll-to-bottom button
4. `frontend/src/components/chat/ToolCardManager.tsx` - Tool card batch renderer
5. `frontend/src/components/chat/ChatHeader.tsx` - Mobile header

**Modified Files (1):**
- `frontend/src/index.css` - Added slideUp keyframe animation

**Key Features:**
- Complete SSE event lifecycle management
- Responsive components with useMediaQuery
- Smooth animations (200-250ms)
- Mobile-first responsive design
- Type-safe with TypeScript

**Next Steps:**
- Task 12: Create useToolCardState hook
- Task 13: Create ChatInput component
- Task 14: Enhance ToolCallCard with animations
- Task 15: Create MessageList component
- Task 16: Integrate all components in Chat.tsx
