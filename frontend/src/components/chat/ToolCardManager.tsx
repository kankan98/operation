import { ToolCallCard } from './ToolCallCard';

interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, any>;
}

interface ToolResult {
  toolCallId: string;
  content?: any;
  isError?: boolean;
}

interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}

interface ToolCardManagerProps {
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  toolCardStates: Map<string, ToolCardState>;
}

/**
 * Manages rendering of all tool cards with state tracking
 * Matches toolCalls with toolResults and toolCardStates
 *
 * Design System: Agent Purple
 * - Gap-2 spacing between cards (8px)
 * - Smooth animations ≤250ms
 * - Responsive mobile/tablet/desktop
 */
export function ToolCardManager({
  toolCalls = [],
  toolResults = [],
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
            toolName={toolCall.name}
            parameters={toolCall.input}
            result={result?.content}
            status={state?.status || 'running'}
          />
        );
      })}
    </div>
  );
}
