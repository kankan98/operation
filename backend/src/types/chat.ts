export interface ChatSession {
  id: string;
  title?: string;
  userId?: string;
  contextSummary?: string;
  createdAt: number;
  updatedAt?: number;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokensUsed?: number;
  timestamp: number;
}

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  output: any;
  isError?: boolean;
}

export interface SendMessageRequest {
  sessionId: string;
  content: string;
}

export interface StreamEvent {
  type: 'text_delta' | 'tool_call' | 'tool_result' | 'done' | 'error';
  data?: any;
}

export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}
