import axios from 'axios';
import type { ToolCall, ToolResult, TokenUsage } from '../types/chat';
import type { ChatMessage } from '../stores/chatStore';
import type {
  SSEEvent,
  StartStreamRequest,
  StartStreamResponse,
  MessageStartEvent,
  StatusChangeEvent,
  ContentDeltaEvent,
  ToolStartEvent,
  ToolCompleteEvent,
  UsageCompleteEvent,
  ErrorOccurredEvent,
} from '../../../shared/types/sse-protocol';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface CreateSessionRequest {
  title?: string;
  userId?: string;
}

export interface CreateSessionResponse {
  id: string;
  title: string | null;
  userId: string | null;
  createdAt: number;
}

export interface GetSessionsResponse {
  sessions: Array<{
    id: string;
    title: string | null;
    userId: string | null;
    messageCount: number;
    createdAt: number;
    updatedAt: number | null;
  }>;
  page: number;
  limit: number;
}

export interface GetSessionResponse {
  id: string;
  title: string | null;
  userId: string | null;
  contextSummary: string | null;
  messageCount: number;
  createdAt: number;
  updatedAt: number | null;
}

export interface GetMessagesResponse {
  messages: Array<{
    id: string;
    sessionId: string;
    role: 'user' | 'assistant';
    content: string;
    toolCalls?: Array<{
      id: string;
      name: string;
      input: Record<string, unknown>;
    }>;
    toolResults?: Array<{
      toolCallId: string;
      output: unknown;
      isError: boolean;
    }>;
    tokensUsed: number | null;
    timestamp: number;
  }>;
}

export interface SendMessageResponse {
  // 非流式响应：返回完整消息
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  tokensUsed: number | null;
  timestamp: number;
}

export interface SendMessageStreamResponse {
  // 流式响应：返回 messageId 和 sessionId
  messageId: string;
  sessionId: string;
}

export interface RegenerateMessageResponse {
  stream_url: string;
  user_message_content: string;
}

export interface SendMessageRequest {
  content: string;
  stream?: boolean;
}

export interface SSEEventHandlers {
  onMessageStart?: (messageId: string, sessionId?: string, timestamp?: number, model?: string) => void;
  onStatus?: (status: 'idle' | 'thinking' | 'tool_calling' | 'writing', context?: string) => void;
  onTextDelta?: (delta: string) => void;
  onToolCallStart?: (toolCall: ToolCall) => void;
  onToolCallEnd?: (toolCallId: string, params: unknown) => void;
  onToolResult?: (result: ToolResult) => void;
  onUsage?: (usage: TokenUsage) => void;
  onMessageDone?: () => void;
  onError?: (error: string) => void;
}

// Session management
export const chatApi = {
  // Create a new chat session
  createSession: async (data?: CreateSessionRequest): Promise<CreateSessionResponse> => {
    const response = await client.post('/chat/sessions', data || {});
    return response.data;
  },

  // Get all sessions
  getSessions: async (page = 1, limit = 20): Promise<GetSessionsResponse> => {
    const response = await client.get('/chat/sessions', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get session details
  getSession: async (sessionId: string): Promise<GetSessionResponse> => {
    const response = await client.get(`/chat/sessions/${sessionId}`);
    return response.data;
  },

  // Update session
  updateSession: async (sessionId: string, data: { title: string }): Promise<GetSessionResponse> => {
    const response = await client.patch(`/chat/sessions/${sessionId}`, data);
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId: string): Promise<void> => {
    await client.delete(`/chat/sessions/${sessionId}`);
  },

  // Get messages for a session
  getMessages: async (sessionId: string, limit = 100): Promise<GetMessagesResponse> => {
    const response = await client.get(`/chat/sessions/${sessionId}/messages`, {
      params: { limit },
    });
    return response.data;
  },

  // Send message (non-streaming or streaming)
  sendMessage: async (
    sessionId: string,
    data: SendMessageRequest
  ): Promise<SendMessageResponse | SendMessageStreamResponse> => {
    const response = await client.post(`/chat/sessions/${sessionId}/messages`, data);
    return response.data;
  },

  /**
   * Stream message using Server-Sent Events (SSE) with EventSource.
   * 使用 SSE Protocol v2.0 的两步流式模式
   *
   * @param text - User message content to send
   * @param _messages - Current message history (reserved for future use)
   * @param signal - AbortSignal to cancel the stream
   * @param handlers - Event handlers for different SSE event types
   * @param sessionId - Optional session ID
   * @returns Cleanup function to close the EventSource connection
   *
   * @remarks
   * SSE Protocol v2.0:
   * 1. POST /api/chat/stream 创建流式会话，获取 streamId
   * 2. GET /api/chat/streams/:streamId 建立 SSE 连接
   * 3. 接收统一格式的 SSEEvent 事件
   */
  streamMessage: async (
    text: string,
    _messages: ChatMessage[],
    signal: AbortSignal,
    handlers: SSEEventHandlers,
    sessionId?: string
  ): Promise<() => void> => {
    let eventSource: EventSource | null = null;
    let finished = false;

    const cleanup = () => {
      finished = true;
      eventSource?.close();
    };

    // Listen for abort signal
    signal.addEventListener('abort', cleanup);

    try {
      // 步骤 1: POST /api/chat/stream 创建流式会话
      const startRequest: StartStreamRequest = {
        sessionId,
        content: text,
      };

      const startResponse = await client.post<StartStreamResponse>('/chat/stream', startRequest);
      const { streamId, messageId, sessionId: activeSessionId } = startResponse.data;

      console.log('[SSE v2] Stream 已创建:', { streamId, messageId, sessionId: activeSessionId });

      // Notify message start
      handlers.onMessageStart?.(messageId, activeSessionId);

      // 步骤 2: GET /api/chat/streams/:streamId 建立 SSE 连接
      const streamUrl = `${API_BASE_URL}/chat/streams/${streamId}`;
      console.log('[SSE v2] 建立连接到:', streamUrl);

      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('message', async (event) => {
        if (finished) return;

        try {
          // 跳过空数据（心跳）
          if (!event.data || event.data.trim() === '') {
            return;
          }

          const sseEvent = JSON.parse(event.data) as SSEEvent;

          // 处理不同类型的事件
          switch (sseEvent.type) {
            case 'message_start': {
              const e = sseEvent as MessageStartEvent;
              handlers.onMessageStart?.(e.messageId, e.sessionId, e.timestamp, e.model);
              break;
            }

            case 'status_change': {
              const e = sseEvent as StatusChangeEvent;
              handlers.onStatus?.(e.status, e.context);
              break;
            }

            case 'content_delta': {
              const e = sseEvent as ContentDeltaEvent;
              handlers.onTextDelta?.(e.delta);
              break;
            }

            case 'tool_start': {
              const e = sseEvent as ToolStartEvent;
              handlers.onToolCallStart?.({
                id: e.tool.id,
                name: e.tool.name,
                input: e.tool.params,
                startTime: e.timestamp,
              });
              break;
            }

            case 'tool_complete': {
              const e = sseEvent as ToolCompleteEvent;
              handlers.onToolResult?.({
                toolCallId: e.toolId,
                output: e.result.output,
                isError: e.result.isError,
                endTime: e.timing.endTime,
                durationMs: e.timing.durationMs,
              });
              break;
            }

            case 'usage_complete': {
              const e = sseEvent as UsageCompleteEvent;
              handlers.onUsage?.({
                inputTokens: e.usage.inputTokens,
                outputTokens: e.usage.outputTokens,
                cacheReadTokens: e.usage.cacheReadTokens,
              });
              break;
            }

            case 'message_complete': {
              handlers.onMessageDone?.();
              cleanup();
              break;
            }

            case 'error_occurred': {
              const e = sseEvent as ErrorOccurredEvent;
              handlers.onError?.(e.error.message);
              cleanup();
              break;
            }

            default:
              console.warn('[SSE v2] 未知事件类型:', sseEvent.type);
          }
        } catch (e) {
          console.error('[SSE v2] 解析事件失败:', event.data, e);
        }
      });

      eventSource.addEventListener('error', (e) => {
        if (finished) return;
        console.error('[SSE v2] EventSource 错误:', e);
        handlers.onError?.('Connection lost');
        cleanup();
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      handlers.onError?.(errorMsg);
      cleanup();
    }

    return cleanup;
  },

  /**
   * Delete a specific message from a session.
   *
   * @param sessionId - ID of the chat session
   * @param messageId - ID of the message to delete
   *
   * @remarks
   * Used internally by the regenerate flow to remove the old assistant message.
   * Can also be used to manually delete messages from the conversation history.
   */
  deleteMessage: async (sessionId: string, messageId: string): Promise<void> => {
    await client.delete(`/chat/sessions/${sessionId}/messages/${messageId}`);
  },

  /**
   * Regenerate an assistant message by deleting it and restarting the stream.
   *
   * @param sessionId - ID of the chat session
   * @param messageId - ID of the assistant message to regenerate
   * @returns Object containing the stream URL to reconnect to
   *
   * @remarks
   * This endpoint:
   * 1. Validates the message is an assistant message
   * 2. Finds the preceding user message
   * 3. Deletes the assistant message
   * 4. Returns a stream URL for the frontend to reconnect
   *
   * The frontend should call streamMessage() with the returned URL to get the new response.
   *
   * @example
   * ```typescript
   * const response = await chatApi.regenerateMessage(sessionId, messageId);
   * // Then use the stream_url to establish a new SSE connection
   * ```
   */
  regenerateMessage: async (sessionId: string, messageId: string): Promise<RegenerateMessageResponse> => {
    const response = await client.post(`/chat/sessions/${sessionId}/messages/${messageId}/regenerate`);
    return response.data;
  },

  /**
   * Update session attributes (Chat UI Redesign v2)
   *
   * @param sessionId - ID of the chat session
   * @param updates - Partial updates (isPinned, title, tags, lastMessagePreview)
   * @returns Updated session data
   */
  updateSession: async (sessionId: string, updates: {
    isPinned?: boolean;
    title?: string;
    tags?: string[];
    lastMessagePreview?: string;
  }): Promise<GetSessionResponse> => {
    const response = await client.patch(`/chat/sessions/${sessionId}`, updates);
    return response.data;
  },
};

export default chatApi;
