import { ToolCall, ToolResult } from '../../backend/src/types/chat';

/**
 * Granular SSE event types for real-time agent streaming
 *
 * Used for:
 * - Real-time tool execution visualization
 * - Agent status indicators (thinking/tool_calling/writing)
 * - Token usage tracking
 * - Error handling
 */
export type SSEEvent =
  | { type: 'message_start'; message_id: string; timestamp: number }
  | { type: 'status'; status: 'thinking' | 'tool_calling' | 'writing' }
  | { type: 'text_delta'; text: string }
  | { type: 'tool_call_start'; tool_call: { id: string; name: string } }
  | { type: 'tool_call_end'; tool_call: ToolCall }
  | { type: 'tool_result'; tool_result: ToolResult }
  | { type: 'usage'; usage: { input_tokens: number; output_tokens: number; cache_read_tokens?: number } }
  | { type: 'message_done'; message_id: string }
  | { type: 'error'; error: { code: string; message: string } };

/**
 * Legacy StreamChunk type for backward compatibility
 *
 * @deprecated Use SSEEvent instead for new implementations
 */
export type LegacyStreamChunk = {
  type: 'text' | 'tool_call' | 'tool_result' | 'usage' | 'done' | 'error' | 'processing';
  text?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
};
