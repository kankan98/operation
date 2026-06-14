// Chat-related type definitions

export interface ToolCall {
  id: string;
  name: string;
  input?: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  output?: any;
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
