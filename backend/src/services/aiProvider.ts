import { ClaudeToolDefinition, ToolCall, ToolResult } from '../types/chat';

/**
 * Unified AI Provider Interface
 * Abstracts differences between Anthropic and OpenAI protocols
 */
export interface AIProvider {
  /**
   * Send a message and get a complete response
   */
  sendMessage(params: SendMessageParams): Promise<MessageResponse>;

  /**
   * Send a message and stream the response
   */
  streamMessage(params: SendMessageParams): AsyncGenerator<StreamChunk, void, unknown>;
}

export interface SendMessageParams {
  messages: Message[];
  tools?: ClaudeToolDefinition[];
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface MessageResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  stopReason: 'end_turn' | 'max_tokens' | 'tool_use';
}

export interface StreamChunk {
  type: 'text' | 'tool_call' | 'tool_result' | 'usage' | 'done' | 'error';
  text?: string;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  error?: string;
}
