# Frontend Tasks 5-6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement useToolCardState hook and fix Zustand store immutability issues

**Architecture:** Custom hook for tool card lifecycle management + Zustand store extensions with immutable updates

**Tech Stack:** React 19, TypeScript, Zustand

---

## Task 5: Create useToolCardState Hook

**Files:**
- Create: `frontend/src/hooks/useToolCardState.ts`

- [ ] **Step 1: Define types**

```typescript
import { useState, useCallback } from 'react';

export interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}

interface UseToolCardStateReturn {
  toolCardStates: Map<string, ToolCardState>;
  createToolCard: (id: string) => void;
  updateToolCard: (id: string, update: Partial<ToolCardState>) => void;
  getToolCardStatus: (id: string) => ToolCardState['status'] | null;
  clearToolCards: () => void;
}
```

- [ ] **Step 2: Implement hook with immutable Map updates**

```typescript
/**
 * Hook for managing tool card lifecycle states
 * - Tracks status: running → success/error
 * - Records timing information
 * - Immutable Map updates
 */
export function useToolCardState(): UseToolCardStateReturn {
  const [toolCardStates, setToolCardStates] = useState<Map<string, ToolCardState>>(
    new Map()
  );

  const createToolCard = useCallback((id: string) => {
    setToolCardStates((prev) => {
      const next = new Map(prev);
      next.set(id, {
        id,
        status: 'running',
        startTime: Date.now(),
      });
      return next;
    });
  }, []);

  const updateToolCard = useCallback((id: string, update: Partial<ToolCardState>) => {
    setToolCardStates((prev) => {
      const next = new Map(prev);
      const existing = next.get(id);
      
      if (existing) {
        next.set(id, { ...existing, ...update });
      }
      
      return next;
    });
  }, []);

  const getToolCardStatus = useCallback(
    (id: string): ToolCardState['status'] | null => {
      return toolCardStates.get(id)?.status ?? null;
    },
    [toolCardStates]
  );

  const clearToolCards = useCallback(() => {
    setToolCardStates(new Map());
  }, []);

  return {
    toolCardStates,
    createToolCard,
    updateToolCard,
    getToolCardStatus,
    clearToolCards,
  };
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd frontend
npx tsc --noEmit
```

Expected: No TypeScript errors

- [ ] **Step 4: Commit**

```bash
git add frontend/src/hooks/useToolCardState.ts
git commit -m "feat(hooks): add useToolCardState for tool card lifecycle

- Immutable Map state management
- CRUD operations (create/update/get/clear)
- Status transitions (running → success/error)
- Timing tracking (startTime/endTime)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Fix Zustand Store Immutability and Add New State

**Files:**
- Modify: `frontend/src/stores/chatStore.ts:70-112`

- [ ] **Step 1: Fix appendMessageContent immutability (lines 70-89)**

Replace the existing `appendMessageContent` implementation with:

```typescript
  appendMessageContent: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastIdx = messages.length - 1;

      if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
        // ✅ Create new object instead of mutating
        messages[lastIdx] = {
          ...messages[lastIdx],
          content: messages[lastIdx].content + content,
        };
      } else {
        // Create new assistant message
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

- [ ] **Step 2: Add new state fields in interface (after line 31)**

After `error: string | null;`, add:

```typescript
  agentStatus: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  toolCardStates: Map<string, any>;
  currentMessageId: string | null;
  cleanupRef: (() => void) | null;
```

- [ ] **Step 3: Add new actions in interface (after line 44)**

After `setError: (error: string | null) => void;`, add:

```typescript
  setAgentStatus: (agentStatus: ChatState['agentStatus']) => void;
  updateToolCardState: (id: string, state: any) => void;
  setCurrentMessageId: (currentMessageId: string | null) => void;
  setCleanup: (cleanupRef: (() => void) | null) => void;
```

- [ ] **Step 4: Initialize new state fields (after line 56)**

After `error: null,`, add:

```typescript
  agentStatus: 'idle',
  toolCardStates: new Map(),
  currentMessageId: null,
  cleanupRef: null,
```

- [ ] **Step 5: Implement new actions (after line 99)**

After `setError: (error) => set({ error }),`, add:

```typescript
  setAgentStatus: (agentStatus) => set({ agentStatus }),

  updateToolCardState: (id, state) =>
    set((prev) => {
      const next = new Map(prev.toolCardStates);
      next.set(id, state);
      return { toolCardStates: next };
    }),

  setCurrentMessageId: (currentMessageId) => set({ currentMessageId }),

  setCleanup: (cleanupRef) => set({ cleanupRef }),
```

- [ ] **Step 6: Update reset action (lines 101-112)**

Replace the existing `reset` action with:

```typescript
  reset: () =>
    set({
      sessions: [],
      currentSessionId: null,
      messages: [],
      isStreaming: false,
      isReconnecting: false,
      loadingSessions: false,
      loadingMessages: false,
      error: null,
      agentStatus: 'idle',
      toolCardStates: new Map(),
      currentMessageId: null,
      cleanupRef: null,
    }),
```

- [ ] **Step 7: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add frontend/src/stores/chatStore.ts
git commit -m "fix(store): fix immutability and add new state fields

- Fix appendMessageContent to create new objects (no mutation)
- Add agentStatus for agent state tracking
- Add toolCardStates Map for tool card states
- Add currentMessageId and cleanupRef
- Update reset action to clear all new fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Summary

**Task 5:** Created useToolCardState hook for managing tool card lifecycle with immutable Map updates.

**Task 6:** Fixed Zustand store immutability issues and added 4 new state fields (agentStatus, toolCardStates, currentMessageId, cleanupRef) with corresponding actions.

Both tasks are now ready for execution!
