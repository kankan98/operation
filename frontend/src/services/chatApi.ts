import axios from 'axios';

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

  // Stream message (SSE with EventSource).
  // Auto-reconnects (with backoff) if the connection fails *before* any content
  // arrives — reconnecting mid-stream would re-trigger generation server-side,
  // so a drop after the first chunk is surfaced as an error instead.
  streamMessage: async (
    sessionId: string,
    content: string,
    onChunk: (chunk: any) => void,
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
