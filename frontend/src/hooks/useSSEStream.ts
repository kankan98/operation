import { useEffect, useRef, useState, useCallback } from 'react';

interface StreamMessage {
  type: 'start' | 'text' | 'done' | 'error' | 'processing';
  text?: string;
  error?: string;
}

interface UseSSEStreamOptions {
  onMessage?: (message: StreamMessage) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

export function useSSEStream(sessionId: string, options: UseSSEStreamOptions = {}) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startStream = useCallback(
    (content: string) => {
      if (isStreaming) {
        console.warn('Stream already in progress');
        return;
      }

      setIsStreaming(true);
      setError(null);
      setMessages([]);

      // Build URL with query parameter
      const url = new URL(
        `/api/chat/sessions/${sessionId}/stream`,
        window.location.origin
      );
      url.searchParams.set('content', content);

      // Create EventSource connection
      const eventSource = new EventSource(url.toString());
      eventSourceRef.current = eventSource;

      // Handle 'message' event (default event type)
      eventSource.addEventListener('message', (event) => {
        try {
          const data: StreamMessage = JSON.parse(event.data);

          // Call custom handler if provided
          options.onMessage?.(data);

          // Handle different message types
          switch (data.type) {
            case 'start':
              console.log('[SSE] Stream started');
              break;

            case 'text':
              if (data.text) {
                setMessages((prev) => [...prev, data.text!]);
              }
              break;

            case 'done':
              console.log('[SSE] Stream completed');
              setIsStreaming(false);
              eventSource.close();
              options.onComplete?.();
              break;

            case 'error':
              const err = new Error(data.error || 'Stream error');
              setError(err);
              setIsStreaming(false);
              eventSource.close();
              options.onError?.(err);
              break;

            case 'processing':
              console.log('[SSE] Processing...');
              break;

            default:
              console.warn('[SSE] Unknown message type:', data.type);
          }
        } catch (parseError) {
          console.error('[SSE] Failed to parse message:', parseError);
        }
      });

      // Handle error event
      eventSource.addEventListener('error', (event) => {
        console.error('[SSE] Connection error:', event);
        const err = new Error('SSE connection failed');
        setError(err);
        setIsStreaming(false);
        eventSource.close();
        options.onError?.(err);
      });

      // Handle custom 'error' event type
      eventSource.addEventListener('error', (event) => {
        try {
          const data: StreamMessage = JSON.parse((event as MessageEvent).data);
          const err = new Error(data.error || 'Server error');
          setError(err);
          setIsStreaming(false);
          eventSource.close();
          options.onError?.(err);
        } catch {
          // Already handled by generic error handler above
        }
      });
    },
    [sessionId, isStreaming, options]
  );

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      console.log('[SSE] Manually stopping stream');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    messages,
    isStreaming,
    error,
    startStream,
    stopStream,
  };
}
