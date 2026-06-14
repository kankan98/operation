# Frontend Tasks 7-16 Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement frontend Tasks 7-16 for Agent/Chat system with component-based architecture and complete design token system

**Architecture:** Component-based refactoring with custom hooks, responsive design via useMediaQuery, and enhanced design token system in index.css

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, react-syntax-highlighter, react-markdown

---

## 1. Architecture Overview

### Component Structure

```
frontend/src/
├── components/chat/
│   ├── ChatContainer.tsx           [NEW] Layout container
│   ├── ChatHeader.tsx              [NEW] Mobile header
│   ├── MessageList.tsx             [NEW] Message list container
│   ├── MessageBubble.tsx           [MODIFY] Enhanced rendering
│   ├── ChatInput.tsx               [NEW] Input + suggestions
│   ├── ControlBar.tsx              [NEW] Control buttons
│   ├── StatusIndicator.tsx         [NEW] Agent status
│   ├── ScrollButton.tsx            [NEW] Scroll to bottom
│   ├── ToolCallCard.tsx            [MODIFY] Add animations
│   └── ToolCardManager.tsx         [NEW] Tool card manager
│
├── hooks/
│   ├── useChatSSE.ts               [NEW] SSE event handling
│   ├── useMediaQuery.ts            [NEW] Responsive hook
│   ├── useScrollControl.ts         [NEW] Scroll control
│   └── useToolCardState.ts         [NEW] Tool card state
│
└── stores/
    └── chatStore.ts                [MODIFY] Add new state
```

### Design Token System (4-Layer)

```
Layer 1: Primitive Tokens (raw values, never used directly)
Layer 2: Semantic Tokens (role-based: canvas, surface, border, fg)
Layer 3: Component Tokens (component-specific variables)
Layer 4: Usage (actual CSS classes)
```

---

## 2. Design System Enhancement

### New Token Categories

**State Tokens** (interaction states)
```css
--state-hover-opacity: 0.08;
--state-active-opacity: 0.12;
--state-disabled-opacity: 0.38;
--state-focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.1);
```

**Spacing Tokens** (8pt system)
```css
--spacing-1: 4px;   /* 0.5 */
--spacing-2: 8px;   /* 1 */
--spacing-3: 12px;  /* 1.5 */
--spacing-4: 16px;  /* 2 */
--spacing-6: 24px;  /* 3 */
--spacing-8: 32px;  /* 4 */
--spacing-10: 40px; /* 5 */
--spacing-12: 48px; /* 6 */
```

**Typography Tokens** (6-level hierarchy)
```css
--text-display: 32px/1.2;    /* Page titles */
--text-heading: 24px/1.2;    /* Section titles */
--text-title: 18px/1.3;      /* Card titles */
--text-body: 14px/1.5;       /* Body text */
--text-caption: 12px/1.4;    /* Helper text */
--text-label: 11px/1.4;      /* Labels */
```

**Component Tokens**
```css
/* Tool Card */
--tool-card-border-width: 2px;
--tool-card-padding: var(--spacing-3);
--tool-card-gap: var(--spacing-2);

/* Status Indicator */
--status-dot-size: 8px;
--status-animation-duration: 200ms;

/* Scroll Button */
--scroll-button-size: 40px;
--scroll-button-offset: 24px;
```

---

## 3. Component Specifications

### ChatContainer.tsx

**Responsibility:** Layout container with sidebar and main content area

**Props:**
```typescript
interface ChatContainerProps {
  children: React.ReactNode;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}
```

**Layout:**
- Desktop (≥1024px): Grid layout, fixed sidebar
- Tablet (768-1023px): Collapsible sidebar
- Mobile (<768px): Overlay sidebar

---

### ChatHeader.tsx

**Responsibility:** Mobile-only header with menu button

**Props:**
```typescript
interface ChatHeaderProps {
  onOpenSidebar: () => void;
  title: string;
}
```

**Visibility:** Only shown on `< md` breakpoint

---

### MessageList.tsx

**Responsibility:** Message list container with scroll monitoring

**Props:**
```typescript
interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  isReconnecting: boolean;
  onScroll: (event: React.UIEvent) => void;
}
```

**Features:**
- Virtualization for >50 messages
- Empty state display
- Loading skeleton

---

### ChatInput.tsx

**Responsibility:** Input field with suggestions and send button

**Props:**
```typescript
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
```

**Features:**
- Enter to send, Shift+Enter for newline
- Auto-resize (max 128px height)
- Suggestion chips on empty state

---

### ControlBar.tsx

**Responsibility:** Action buttons (Abort, Regenerate, Scroll)

**Props:**
```typescript
interface ControlBarProps {
  isStreaming: boolean;
  canRegenerate: boolean;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  onAbort: () => void;
  onRegenerate: () => void;
  onScrollToBottom: () => void;
}
```

**Layout:**
- Abort: Inline with input (streaming only)
- Regenerate: Message hover action
- Scroll: Fixed bottom-right

---

### StatusIndicator.tsx

**Responsibility:** Visual feedback for agent states

**Props:**
```typescript
interface StatusIndicatorProps {
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  isReconnecting: boolean;
}
```

**Visual States:**
- `thinking`: Pulsing 3-dot animation
- `tool_calling`: Tool icon + "调用工具中..."
- `writing`: Typing animation
- `reconnecting`: Spin icon + "重新连接..."

**Transitions:** Fade 200ms between states

---

### ToolCardManager.tsx

**Responsibility:** Manage all tool card states and rendering

**Props:**
```typescript
interface ToolCardManagerProps {
  toolCalls: ToolCall[];
  toolResults: ToolResult[];
  toolCardStates: Map<string, ToolCardState>;
}
```

**State:**
```typescript
interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}
```

---

## 4. Custom Hooks Design

### useChatSSE.ts

**Purpose:** Centralized SSE event handling

**Return Type:**
```typescript
interface UseChatSSEReturn {
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
  status: AgentStatus;
  error: string | null;
}
```

**Event Handlers:**
- `message_start` → Initialize message
- `status` → Update agentStatus
- `text_delta` → Append to message content
- `tool_call_start` → Create tool card (running)
- `tool_call_end` → Update tool card params
- `tool_result` → Update tool card result + status
- `usage` → Record token usage
- `message_done` → Cleanup
- `error` → Set error state

---

### useMediaQuery.ts

**Purpose:** Responsive breakpoint detection

**Usage:**
```typescript
const isMobile = useMediaQuery('(max-width: 767px)');
const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
const isDesktop = useMediaQuery('(min-width: 1024px)');
```

**Implementation:** window.matchMedia() with SSR safety

---

### useScrollControl.ts

**Purpose:** Scroll position monitoring and auto-scroll control

**Return Type:**
```typescript
interface UseScrollControlReturn {
  scrollRef: RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  scrollToBottom: () => void;
  handleScroll: () => void;
}
```

**Logic:**
- < 120px from bottom → auto-scroll
- > 200px from bottom → show scroll button
- New content + scrolled up → show new message indicator

---

### useToolCardState.ts

**Purpose:** Tool card state management

**Return Type:**
```typescript
interface UseToolCardStateReturn {
  toolCardStates: Map<string, ToolCardState>;
  createToolCard: (id: string, name: string) => void;
  updateToolCard: (id: string, update: Partial<ToolCardState>) => void;
  getToolCardStatus: (id: string) => ToolCardStatus;
  clearToolCards: () => void;
}
```

---

## 5. Responsive Design Strategy

### Breakpoints

| Breakpoint | Range | Description |
|------------|-------|-------------|
| Mobile | < 768px | Single column, overlay sidebar |
| Tablet | 768-1023px | Collapsible sidebar |
| Desktop | ≥ 1024px | Fixed sidebar, expanded tools |

### Component Adaptations

| Component | Mobile | Tablet | Desktop |
|-----------|--------|--------|---------|
| Sidebar | Overlay | Collapsible | Fixed |
| Tool Cards | Collapsed | Collapsed | Expanded |
| Status Indicator | Above input | Top of list | Top of list |
| Scroll Button | 48x48px | 44x44px | 40x40px |
| Message Width | 90% | 85% | 80% |

---

## 6. Zustand Store Extensions

### New State Fields

```typescript
interface ChatState {
  // Existing fields remain...
  
  // New fields
  agentStatus: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  toolCardStates: Map<string, ToolCardState>;
  currentMessageId: string | null;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens?: number;
  };
  cleanupRef: (() => void) | null;
  
  // New actions
  setAgentStatus: (status: AgentStatus) => void;
  updateToolCardState: (id: string, state: ToolCardState) => void;
  setCurrentMessageId: (id: string | null) => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  setCleanup: (cleanup: (() => void) | null) => void;
}
```

### Immutability Fix

**Problem (Line 73-76):**
```typescript
// ❌ Direct mutation
lastMessage.content += content;
```

**Solution:**
```typescript
// ✅ Create new object
messages[lastIdx] = {
  ...messages[lastIdx],
  content: messages[lastIdx].content + content,
};
```

---

## 7. Animation Specifications

### Allowed Animations (Agent Purple constraints)

**Fade:** 200ms ease-out-soft
**Scale:** 98% → 100% over 200ms
**Slide:** 8px translateY over 250ms
**Skeleton:** 1.5s linear infinite

**Prohibited:** Bounce, elastic, spin, parallax

### Component Animations

**Tool Card Expand/Collapse:**
```css
transition: max-height 200ms ease-out-soft,
            opacity 200ms ease-out-soft;
```

**Status Indicator Transition:**
```css
transition: opacity 200ms ease-out-soft;
```

**Scroll Button Appearance:**
```css
animation: slideUp 250ms ease-out-soft;
```

---

## 8. Syntax Highlighting Setup

**Library:** react-syntax-highlighter (Prism)
**Theme:** oneDark
**Bundle Size:** ~50KB gzipped

**Implementation:**
```typescript
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// In MessageBubble.tsx
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

## 9. Implementation Dependencies

### New Dependencies
- `react-syntax-highlighter` + `@types/react-syntax-highlighter`

### Existing Dependencies (reuse)
- `react-markdown` + `remark-gfm`
- `lucide-react` (icons)
- `zustand` (state)
- `react-window` (virtualization)

---

## 10. Migration Strategy

**Phase 1:** Design System Enhancement
- Update index.css with new tokens
- Add utility classes
- Test in Storybook (optional)

**Phase 2:** Custom Hooks
- Implement 4 hooks independently
- Unit test each hook
- Integration test with mock data

**Phase 3:** Component Refactoring
- Create new components one by one
- Test each component in isolation
- Integrate with existing Chat.tsx

**Phase 4:** Page Integration
- Replace old Chat.tsx with new composition
- Connect all hooks and components
- End-to-end testing

**Phase 5:** Cleanup
- Remove old Chat.tsx code
- Delete ChatExample.tsx
- Delete useSSEStream.ts
- Update documentation

---

## 11. Testing Checklist

- [ ] All 9 SSE event types handled correctly
- [ ] Tool cards update in real-time (running → success/error)
- [ ] Status indicator transitions smoothly
- [ ] Abort stops streaming immediately
- [ ] Regenerate deletes message and re-streams
- [ ] Scroll button appears when scrolled up
- [ ] New message indicator shows/clears correctly
- [ ] Syntax highlighting works for JS/TS/Python/JSON
- [ ] Tool card expand/collapse animation smooth
- [ ] Responsive layout works on mobile/tablet/desktop
- [ ] State immutability maintained (no direct mutations)
- [ ] useMediaQuery handles SSR safely
- [ ] All animations ≤ 250ms timing

---

## 12. Performance Considerations

**Bundle Size:**
- Syntax highlighter: ~50KB (code-split if needed)
- No additional animation library (pure CSS)

**Runtime Performance:**
- Virtualization for >50 messages
- RAF throttling for scroll events
- Memoize expensive computations

**Accessibility:**
- Focus management for modal/overlay
- Keyboard shortcuts (Ctrl+N, /)
- ARIA labels for icon buttons
- 44px minimum touch targets (mobile)

---

## 13. Open Questions

1. Should tool cards remain expanded after user manually expands them? (Sticky state)
2. Should we add keyboard shortcut (Esc) to abort streaming?
3. Should token usage be displayed in UI or just tracked internally?
4. Should we persist agentStatus across page refreshes?
5. Should regenerate show a confirmation dialog or execute immediately?

---

## 14. Success Metrics

**Functional Completeness:**
- All 10 task groups (7-16) implemented
- All SSE events processed correctly
- All user controls functional

**Code Quality:**
- Component lines < 200 (average)
- Hook complexity < 15 cyclomatic
- Test coverage > 80%

**Performance:**
- First paint < 1.5s
- Interaction latency < 100ms
- Bundle size increase < 100KB

**Design Consistency:**
- All animations within 150-250ms
- All spacing follows 8pt system
- All colors use semantic tokens
