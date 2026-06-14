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
