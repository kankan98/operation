# Frontend Tasks 12-18 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement ChatInput, MessageList, ControlBar, ChatContainer components and enhance MessageBubble with syntax highlighting, ToolCallCard with animations, and refactor Chat.tsx

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, react-syntax-highlighter

---

## Task 12: Create ChatInput Component

**Files:**
- Create: `frontend/src/components/chat/ChatInput.tsx`

- [ ] **Step 1: Create component file with props interface**

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  disabled: boolean;
  showSuggestions: boolean;
  suggestions: string[];
  error: string | null;
  onRetry?: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  showSuggestions,
  suggestions,
  error,
  onRetry,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

// __CONTINUE_HERE__
```

- [ ] **Step 2: Add keyboard event handler**

Expected: Enter sends, Shift+Enter creates newline

- [ ] **Step 3: Add auto-resize logic (max 128px)**

Expected: Textarea grows with content, capped at --input-max-height

- [ ] **Step 4: Add suggestion chips rendering**

Expected: Shows when showSuggestions is true and value is empty

- [ ] **Step 5: Add error state UI**

Expected: Red border + error message + retry button

- [ ] **Step 6: Verify TypeScript**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/chat/ChatInput.tsx
git commit -m "feat(chat): add ChatInput component

- Enter to send, Shift+Enter for newline
- Auto-resize textarea (max 128px)
- Suggestion chips on empty state
- Error handling with retry button

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 13: Create MessageList Component

**Files:**
- Create: `frontend/src/components/chat/MessageList.tsx`

- [ ] **Step 1: Create component with props**

```typescript
import React from 'react';
import { MessageBubble } from './MessageBubble';
import type { ChatMessage } from '../../stores/chatStore';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isReconnecting: boolean;
  onScroll: (event: React.UIEvent) => void;
}

export function MessageList({
  messages,
  isStreaming,
  isReconnecting,
  onScroll,
}: MessageListProps) {
  // Empty state
  if (messages.length === 0 && !isStreaming) {
    return (
      <div className="flex-1 flex items-center justify-center text-fg-muted">
        <div className="text-center space-y-2">
          <p className="text-text-body-size">开始对话吧</p>
          <p className="text-text-caption-size">输入消息或选择建议开始</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      onScroll={onScroll}
    >
      <div className="space-y-4 p-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div className="text-text-caption-size text-fg-muted">
            AI 正在思考...
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add loading skeleton for initial load**

Expected: Shows 3 skeleton bubbles when messages.length === 0 && isStreaming

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/chat/MessageList.tsx
git commit -m "feat(chat): add MessageList component

- Message list container with scroll support
- Empty state display
- Loading skeleton for initial load
- Integration with MessageBubble

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 14: Create ControlBar Component

**Files:**
- Create: `frontend/src/components/chat/ControlBar.tsx`

- [ ] **Step 1: Create component with abort button**

```typescript
import React from 'react';
import { X, RotateCcw, ChevronDown } from 'lucide-react';
import { ScrollButton } from './ScrollButton';

interface ControlBarProps {
  isStreaming: boolean;
  canRegenerate: boolean;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  onAbort: () => void;
  onRegenerate: () => void;
  onScrollToBottom: () => void;
}

export function ControlBar({
  isStreaming,
  canRegenerate,
  showScrollButton,
  hasNewMessage,
  onAbort,
  onRegenerate,
  onScrollToBottom,
}: ControlBarProps) {
  return (
    <>
      {/* Abort button (inline with input when streaming) */}
      {isStreaming && (
        <button
          onClick={onAbort}
          className="absolute right-3 top-3 p-2 rounded-lg bg-surface-raised hover:bg-surface-overlay transition-colors"
          aria-label="停止生成"
        >
          <X className="w-5 h-5 text-fg-danger" />
        </button>
      )}

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <ScrollButton
          onClick={onScrollToBottom}
          hasNewMessage={hasNewMessage}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Add regenerate button (shown on message hover)**

Expected: Uses RotateCcw icon, only shows when canRegenerate is true

- [ ] **Step 3: Verify TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/chat/ControlBar.tsx
git commit -m "feat(chat): add ControlBar component

- Abort button during streaming
- Scroll to bottom button with new message indicator
- Regenerate button on message hover

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 15: Create ChatContainer Component

**Files:**
- Create: `frontend/src/components/chat/ChatContainer.tsx`

- [ ] **Step 1: Create component with responsive layout**

```typescript
import React from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ChatContainerProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ChatContainer({
  children,
  sidebarOpen,
  onToggleSidebar,
}: ChatContainerProps) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  return (
    <div className="h-screen flex">
      {/* Sidebar */}
      {(isDesktop || sidebarOpen) && (
        <aside
          className={`
            ${isMobile ? 'fixed inset-0 z-50 bg-canvas' : ''}
            ${isTablet ? 'fixed left-0 top-0 bottom-0 z-40 bg-canvas shadow-lg' : ''}
            ${isDesktop ? 'w-64 border-r border-border-subtle' : 'w-80'}
          `}
        >
          {/* Sidebar content will be passed as children */}
          <div className="h-full flex flex-col">
            {/* Placeholder for sidebar content */}
            <div className="flex-1 overflow-y-auto p-4">
              <h2 className="text-text-title-size font-semibold mb-4">对话历史</h2>
            </div>
          </div>
          
          {/* Overlay close button for mobile/tablet */}
          {!isDesktop && (
            <button
              onClick={onToggleSidebar}
              className="absolute top-4 right-4 p-2 rounded-lg bg-surface-raised"
              aria-label="关闭侧边栏"
            >
              ×
            </button>
          )}
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Overlay backdrop for mobile/tablet */}
      {!isDesktop && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onToggleSidebar}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify responsive behavior**

Expected: Desktop shows fixed sidebar, mobile/tablet show overlay

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/chat/ChatContainer.tsx
git commit -m "feat(chat): add ChatContainer with responsive layout

- Desktop: fixed sidebar (grid)
- Tablet: collapsible sidebar (overlay)
- Mobile: full-screen overlay sidebar
- Integration with useMediaQuery

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 16: Enhance MessageBubble with Syntax Highlighting

**Files:**
- Modify: `frontend/src/components/chat/MessageBubble.tsx`

- [ ] **Step 1: Import syntax highlighter**

Add at top of file:
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
```

- [ ] **Step 2: Update ReactMarkdown components prop**

Find the `<ReactMarkdown>` component and update the `components` prop:

```typescript
components={{
  code: ({ node, inline, className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    
    // Block code with syntax highlighting
    if (!inline && lang) {
      return (
        <SyntaxHighlighter
          language={lang}
          style={oneDark}
          customStyle={{
            borderRadius: '8px',
            padding: 'var(--spacing-3)',
            marginTop: 'var(--spacing-2)',
            marginBottom: 'var(--spacing-2)',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    }
    
    // Inline code
    return (
      <code
        className="px-1.5 py-0.5 rounded bg-surface-raised text-fg-accent font-mono text-sm"
        {...props}
      >
        {children}
      </code>
    );
  },
}}
```

- [ ] **Step 3: Test with sample markdown**

Create test message with code block:
````markdown
```typescript
const hello = "world";
console.log(hello);
```
````

Expected: Syntax-highlighted with oneDark theme

- [ ] **Step 4: Verify TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/chat/MessageBubble.tsx
git commit -m "feat(chat): add syntax highlighting to MessageBubble

- Integrate react-syntax-highlighter with Prism
- Use oneDark theme
- Support block code and inline code
- Support common languages (JS/TS/Python/JSON)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 17: Enhance ToolCallCard with Animations

**Files:**
- Modify: `frontend/src/components/chat/ToolCallCard.tsx`

- [ ] **Step 1: Add expand/collapse state**

Add state at top of component:
```typescript
const [isExpanded, setIsExpanded] = useState(false);
```

- [ ] **Step 2: Add animation styles**

Add CSS module or inline styles for transition:
```typescript
const contentStyle = {
  maxHeight: isExpanded ? '500px' : '0',
  opacity: isExpanded ? 1 : 0,
  overflow: 'hidden',
  transition: 'max-height 200ms var(--ease-out-soft), opacity 200ms var(--ease-out-soft)',
};
```

- [ ] **Step 3: Add expand button**

Update header to include expand/collapse button:
```typescript
<button
  onClick={() => setIsExpanded(!isExpanded)}
  className="ml-auto p-1 hover:bg-surface-overlay rounded transition-colors"
  aria-label={isExpanded ? '收起' : '展开'}
>
  <ChevronDown
    className={`w-4 h-4 transition-transform duration-200 ${
      isExpanded ? 'rotate-180' : ''
    }`}
  />
</button>
```

- [ ] **Step 4: Wrap content in animated container**

Wrap the tool result/params display:
```typescript
<div style={contentStyle}>
  {/* Existing tool result/params rendering */}
</div>
```

- [ ] **Step 5: Test animation smoothness**

Expected: Smooth 200ms transition, no janky behavior

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/chat/ToolCallCard.tsx
git commit -m "feat(chat): add expand/collapse animation to ToolCallCard

- Add expand/collapse state
- Smooth 200ms transition (max-height + opacity)
- Rotate chevron icon on toggle
- Use CSS variables for timing

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 18: Refactor Chat.tsx Page

**Files:**
- Modify: `frontend/src/pages/Chat.tsx`

- [ ] **Step 1: Import all new components and hooks**

Replace existing imports with:
```typescript
import React, { useState } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useChatSSE } from '../hooks/useChatSSE';
import { useScrollControl } from '../hooks/useScrollControl';
import { ChatContainer } from '../components/chat/ChatContainer';
import { MessageList } from '../components/chat/MessageList';
import { ChatInput } from '../components/chat/ChatInput';
import { ControlBar } from '../components/chat/ControlBar';
import { StatusIndicator } from '../components/chat/StatusIndicator';
```

- [ ] **Step 2: Replace component body with new composition**

```typescript
export function Chat() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { messages, agentStatus, error } = useChatStore();
  const { sendMessage, abort, status } = useChatSSE();
  const {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    scrollToBottom,
    handleScroll,
  } = useScrollControl();

  const [inputValue, setInputValue] = useState('');

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    await sendMessage(text);
    setInputValue('');
  };

  const suggestions = [
    '介绍一下你自己',
    '帮我写一段代码',
    '解释一下 React Hooks',
  ];

  return (
    <ChatContainer
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
    >
      <div className="flex-1 flex flex-col" ref={scrollRef} onScroll={handleScroll}>
        {/* Status Indicator */}
        <StatusIndicator
          status={agentStatus}
          isReconnecting={status === 'reconnecting'}
        />

        {/* Message List */}
        <MessageList
          messages={messages}
          isStreaming={status === 'streaming'}
          isReconnecting={status === 'reconnecting'}
          onScroll={handleScroll}
        />

        {/* Control Bar */}
        <ControlBar
          isStreaming={status === 'streaming'}
          canRegenerate={messages.length > 0}
          showScrollButton={showScrollButton}
          hasNewMessage={hasNewMessage}
          onAbort={abort}
          onRegenerate={() => {
            // TODO: Implement regenerate logic
          }}
          onScrollToBottom={scrollToBottom}
        />

        {/* Chat Input */}
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSend}
          disabled={status === 'streaming'}
          showSuggestions={messages.length === 0}
          suggestions={suggestions}
          error={error}
          onRetry={() => {
            // TODO: Implement retry logic
          }}
        />
      </div>
    </ChatContainer>
  );
}
```

- [ ] **Step 3: Remove old Chat.tsx code**

Delete all old implementation code that's been replaced

- [ ] **Step 4: Verify TypeScript**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 5: Test in browser**

Run:
```bash
npm run dev
```

Visit http://localhost:5173/chat

Expected:
- Layout renders correctly
- Can send messages
- Status indicator updates
- Scroll control works
- Responsive design adapts to viewport

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/Chat.tsx
git commit -m "refactor(chat): replace Chat.tsx with new component composition

- Replace old implementation with new components
- Integrate all hooks (useChatSSE, useScrollControl)
- Connect Zustand store
- Complete event handling flow
- Responsive layout with ChatContainer

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] All components render without errors
- [ ] TypeScript compilation succeeds
- [ ] Syntax highlighting works for code blocks
- [ ] Tool cards expand/collapse smoothly
- [ ] Scroll button appears/disappears correctly
- [ ] Chat input auto-resizes properly
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] SSE events are handled correctly
- [ ] No console errors or warnings

---

## Success Metrics

**Functional:**
- All 7 tasks (12-18) implemented
- All components integrated successfully
- All user interactions functional

**Code Quality:**
- Component lines < 200 each
- TypeScript strict mode passes
- No runtime errors

**Performance:**
- Smooth animations (200ms)
- No layout shift
- Responsive on all breakpoints
