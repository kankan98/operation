# Frontend Tasks 7-16 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement frontend Tasks 7-16 with component-based architecture, enhanced design token system, and full SSE event handling

**Architecture:** Component refactoring with 12 components + 4 custom hooks, responsive design via useMediaQuery, 4-layer design token system in index.css

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind v4, react-syntax-highlighter, react-markdown

---

## File Structure Overview

**New Files (15):**
```
frontend/src/
├── components/chat/
│   ├── ChatContainer.tsx
│   ├── ChatHeader.tsx
│   ├── MessageList.tsx
│   ├── ChatInput.tsx
│   ├── ControlBar.tsx
│   ├── StatusIndicator.tsx
│   ├── ScrollButton.tsx
│   └── ToolCardManager.tsx
│
└── hooks/
    ├── useChatSSE.ts
    ├── useMediaQuery.ts
    ├── useScrollControl.ts
    └── useToolCardState.ts
```

**Modified Files (5):**
```
frontend/src/
├── components/chat/
│   ├── MessageBubble.tsx (add syntax highlighting)
│   └── ToolCallCard.tsx (add animations)
│
├── stores/
│   └── chatStore.ts (add new state + fix immutability)
│
├── pages/
│   └── Chat.tsx (replace with new composition)
│
└── index.css (add design tokens)
```

**Deleted Files (2):**
```
frontend/src/
├── components/ChatExample.tsx
└── hooks/useSSEStream.ts
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install react-syntax-highlighter**

Run:
```bash
cd frontend
npm install react-syntax-highlighter @types/react-syntax-highlighter
```

Expected: Package installed successfully

- [ ] **Step 2: Verify installation**

Run:
```bash
npm list react-syntax-highlighter
```

Expected: Shows version ~2.15.5

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add react-syntax-highlighter for code highlighting

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: Enhance Design Token System

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Add state tokens after motion section**

After line 61 (after `--ease-out-soft` definition), add:

```css
  /* ---- State tokens (interaction states) ---- */
  --state-hover-opacity: 0.08;
  --state-active-opacity: 0.12;
  --state-disabled-opacity: 0.38;
  --state-focus-ring: 0 0 0 3px rgba(139, 92, 246, 0.1);
```

- [ ] **Step 2: Add spacing tokens**

After state tokens, add:

```css
  /* ---- Spacing tokens (8pt system) ---- */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-10: 40px;
  --spacing-12: 48px;
```

- [ ] **Step 3: Add typography tokens**

After spacing tokens, add:

```css
  /* ---- Typography scale (6-level hierarchy) ---- */
  --text-display-size: 32px;
  --text-display-line: 1.2;
  --text-heading-size: 24px;
  --text-heading-line: 1.2;
  --text-title-size: 18px;
  --text-title-line: 1.3;
  --text-body-size: 14px;
  --text-body-line: 1.5;
  --text-caption-size: 12px;
  --text-caption-line: 1.4;
  --text-label-size: 11px;
  --text-label-line: 1.4;
```

- [ ] **Step 4: Add component tokens**

After typography tokens, add:

```css
  /* ---- Component-specific tokens ---- */
  
  /* Tool Card */
  --tool-card-border-width: 2px;
  --tool-card-padding: var(--spacing-3);
  --tool-card-gap: var(--spacing-2);
  --tool-card-radius: 12px;
  
  /* Status Indicator */
  --status-dot-size: 8px;
  --status-animation-duration: 200ms;
  --status-indicator-gap: var(--spacing-2);
  
  /* Scroll Button */
  --scroll-button-size: 40px;
  --scroll-button-size-mobile: 48px;
  --scroll-button-offset: var(--spacing-6);
  --scroll-button-shadow: 0 4px 12px rgba(16, 24, 40, 0.15);
  
  /* Chat Input */
  --input-max-height: 128px;
  --input-padding: var(--spacing-3);
```

- [ ] **Step 5: Verify no syntax errors**

Run:
```bash
npm run dev
```

Expected: Dev server starts without CSS errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: enhance design token system with 4-layer architecture

- Add state tokens (hover/active/disabled/focus)
- Add spacing tokens (8pt system)
- Add typography scale (6-level hierarchy)
- Add component-specific tokens (tool card, status, scroll, input)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Create useMediaQuery Hook

**Files:**
- Create: `frontend/src/hooks/useMediaQuery.ts`

- [ ] **Step 1: Create hook file**

```typescript
import { useEffect, useState } from 'react';

/**
 * React hook for responsive breakpoint detection
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean - Whether the media query matches
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)');
 */
export function useMediaQuery(query: string): boolean {
  // SSR safety: return false on server
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    // Skip if window is not available
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Update state on mount
    setMatches(mediaQuery.matches);

    // Create event handler
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useMediaQuery.ts
git commit -m "feat(hooks): add useMediaQuery for responsive breakpoint detection

- SSR-safe implementation
- Uses window.matchMedia API
- Auto-cleanup on unmount

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Create useScrollControl Hook

**Files:**
- Create: `frontend/src/hooks/useScrollControl.ts`

- [ ] **Step 1: Create hook with scroll monitoring logic**

```typescript
import { useRef, useState, useCallback } from 'react';

interface UseScrollControlReturn {
  scrollRef: React.RefObject<HTMLDivElement>;
  showScrollButton: boolean;
  hasNewMessage: boolean;
  scrollToBottom: () => void;
  handleScroll: () => void;
  markAsRead: () => void;
  nearBottomRef: React.MutableRefObject<boolean>;
}

export function useScrollControl(): UseScrollControlReturn {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollRafRef = useRef<number | null>(null);
  const nearBottomRef = useRef(true);

  const scrollToBottom = useCallback(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
    setHasNewMessage(false);
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = scrollRef.current;
      if (!el) return;
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      const isNearBottom = distanceFromBottom < 120;
      nearBottomRef.current = isNearBottom;
      setShowScrollButton(distanceFromBottom > 200);
      if (isNearBottom) {
        setHasNewMessage(false);
      }
    });
  }, []);

  const markAsRead = useCallback(() => {
    setHasNewMessage(false);
  }, []);

  return {
    scrollRef,
    showScrollButton,
    hasNewMessage,
    scrollToBottom,
    handleScroll,
    markAsRead,
    nearBottomRef,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useScrollControl.ts
git commit -m "feat(hooks): add useScrollControl for scroll monitoring

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

