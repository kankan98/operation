// Chat-related type definitions

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output?: unknown;
  isError?: boolean;
}

export interface ToolCardState {
  id: string;
  status: 'running' | 'success' | 'error';
  startTime: number;
  endTime?: number;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
}
