import { ToolCallCard } from './ToolCallCard';
import type { ToolCall, ToolResult } from '@/types/chat';

interface ToolCardManagerProps {
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  toolExecutionState: Record<string, {
    status: 'running' | 'success' | 'error';
    startTime: number;
    endTime?: number;
    durationMs?: number;
  }>;
}

/**
 * Manages rendering of all tool cards with state tracking
 * Matches toolCalls with toolResults and toolExecutionState
 *
 * Design System: Agent Purple
 * - Gap-2 spacing between cards (8px)
 * - Smooth animations ≤250ms
 * - Responsive mobile/tablet/desktop
 */
export function ToolCardManager({
  toolCalls = [],
  toolResults = [],
  toolExecutionState,
}: ToolCardManagerProps) {
  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {toolCalls.map((toolCall) => {
        const result = toolResults.find((r) => r.toolCallId === toolCall.id);
        const executionState = toolCall.id ? toolExecutionState[toolCall.id] : undefined;

        return (
          <ToolCallCard
            key={toolCall.id}
            toolCall={toolCall}
            toolResult={result}
            executionState={executionState}
          />
        );
      })}
    </div>
  );
}
