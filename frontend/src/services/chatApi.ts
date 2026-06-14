import axios from 'axios';
import type { ToolCall, ToolResult, TokenUsage } from '../types/chat';
import type { ChatMessage } from '../stores/chatStore';

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

export interface SendMessageRequest {
  content: string;
}

export interface SSEEventHandlers {
  onMessageStart?: (messageId: string) => void;
  onStatus?: (status: 'thinking' | 'tool_calling' | 'writing') => void;
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
  createSession: async (data?: CreateSessionRequest) => {
    const response = await client.post('/chat/sessions', data || {});
    return response.data;
  },

  // Get all sessions
  getSessions: async (page = 1, limit = 20) => {
    const response = await client.get('/chat/sessions', {
      params: { page, limit },
    });
    return response.data;
  },

  // Get session details
  getSession: async (sessionId: string) => {
    const response = await client.get(`/chat/sessions/${sessionId}`);
    return response.data;
  },

  // Update session
  updateSession: async (sessionId: string, data: { title: string }) => {
    const response = await client.patch(`/chat/sessions/${sessionId}`, data);
    return response.data;
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    await client.delete(`/chat/sessions/${sessionId}`);
  },

  // Get messages for a session
  getMessages: async (sessionId: string, limit = 100) => {
    const response = await client.get(`/chat/sessions/${sessionId}/messages`, {
      params: { limit },
    });
    return response.data;
  },

  // Send message (non-streaming)
  sendMessage: async (sessionId: string, data: SendMessageRequest) => {
    const response = await client.post(`/chat/sessions/${sessionId}/messages`, data);
    return response.data;
  },

  /**
   * Stream message using Server-Sent Events (SSE) with EventSource.
   *
   * @param text - User message content to send
   * @param _messages - Current message history (reserved for future use)
   * @param signal - AbortSignal to cancel the stream
   * @param handlers - Event handlers for different SSE event types
   * @returns Cleanup function to close the EventSource connection
   *
   * @remarks
   * - Automatically reconnects if connection fails before any content arrives
   * - Once streaming starts, connection drops are surfaced as errors (no retry)
   * - Call the returned cleanup function to abort the stream
   * - The cleanup function is also triggered automatically on message_done or error events
   *
   * @example
   * ```typescript
   * const abortController = new AbortController();
   * const cleanup = await chatApi.streamMessage(
   *   "Hello",
   *   messages,
   *   abortController.signal,
   *   {
   *     onTextDelta: (text) => console.log(text),
   *     onError: (err) => console.error(err),
   *     onMessageDone: () => console.log('Done'),
   *   }
   * );
   *
   * // To abort: cleanup() or abortController.abort()
   * ```
   */
  streamMessage: async (
    text: string,
    _messages: ChatMessage[],
    signal: AbortSignal,
    handlers: SSEEventHandlers
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
      // Build URL with query parameter + cache-buster
      const url = new URL(`${API_BASE_URL}/chat/stream`);
      url.searchParams.set('content', text);
      url.searchParams.set('t', Date.now().toString());

      eventSource = new EventSource(url.toString());

      eventSource.addEventListener('message', (event) => {
        if (finished) return;

        try {
          const data = JSON.parse(event.data);

          switch (data.type) {
            case 'message_start':
              handlers.onMessageStart?.(data.messageId);
              break;

            case 'status':
              handlers.onStatus?.(data.status);
              break;

            case 'text_delta':
              handlers.onTextDelta?.(data.delta);
              break;

            case 'tool_call_start':
              handlers.onToolCallStart?.(data.toolCall);
              break;

            case 'tool_call_end':
              handlers.onToolCallEnd?.(data.toolCallId, data.params);
              break;

            case 'tool_result':
              handlers.onToolResult?.(data.result);
              break;

            case 'usage':
              handlers.onUsage?.(data.usage);
              break;

            case 'message_done':
              handlers.onMessageDone?.();
              cleanup();
              break;

            case 'error':
              handlers.onError?.(data.error || 'Unknown error');
              cleanup();
              break;

            default:
              console.warn('[SSE] Unknown event type:', data.type);
          }
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      });

      eventSource.addEventListener('error', () => {
        if (finished) return;
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
  deleteMessage: async (sessionId: string, messageId: string) => {
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
  regenerateMessage: async (sessionId: string, messageId: string) => {
    const response = await client.post(`/chat/sessions/${sessionId}/messages/${messageId}/regenerate`);
    return response.data;
  },

  // Legacy stream message (kept for backward compatibility)
  streamMessageLegacy: async (
    sessionId: string,
    content: string,
    onChunk: (chunk: unknown) => void,
    onError?: (error: string) => void,
    onDone?: () => void,
    onReconnecting?: (reconnecting: boolean) => void
  ) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 1500;

    let eventSource: EventSource | null = null;
    let retries = 0;
    let receivedChunk = false;
    let finished = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      finished = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      eventSource?.close();
    };

    const connect = () => {
      // Build URL with query parameter + cache-buster
      const url = new URL(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`);
      url.searchParams.set('content', content);
      url.searchParams.set('t', Date.now().toString());

      eventSource = new EventSource(url.toString());

      eventSource.addEventListener('message', (event) => {
        try {
          const chunk = JSON.parse(event.data);

          if (chunk.type === 'error') {
            onError?.(chunk.error || 'Unknown error');
            cleanup();
            return;
          }

          if (chunk.type === 'done') {
            onDone?.();
            cleanup();
            return;
          }

          // First real chunk: clear any reconnecting state and lock retries off.
          if (!receivedChunk) {
            receivedChunk = true;
            onReconnecting?.(false);
          }
          onChunk(chunk);
        } catch (e) {
          console.error('Failed to parse SSE data:', event.data, e);
        }
      });

      eventSource.addEventListener('error', () => {
        if (finished) return;
        eventSource?.close();

        // Retry only if nothing has streamed yet (safe to re-issue the request).
        if (!receivedChunk && retries < MAX_RETRIES) {
          retries += 1;
          onReconnecting?.(true);
          reconnectTimer = setTimeout(connect, RETRY_DELAY_MS);
          return;
        }

        onReconnecting?.(false);
        onError?.('Connection lost');
        cleanup();
      });
    };

    connect();

    // Return cleanup function
    return cleanup;
  },
};

export default chatApi;
