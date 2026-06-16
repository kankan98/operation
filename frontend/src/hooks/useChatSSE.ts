import { useRef, useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { chatApi } from '../services/chatApi';
import type { ChatMessage } from '../stores/chatStore';
import type { ToolCall, ToolResult } from '../types/chat';

interface UseChatSSEReturn {
  sendMessage: (text: string) => Promise<void>;
  abort: () => void;
  status: 'idle' | 'thinking' | 'tool_calling' | 'writing';
  error: string | null;
}

/**
 * Custom hook for managing SSE chat streaming
 * SSE Protocol v2.0 - 简化版本，无需前端推断状态或计算时序
 */
export function useChatSSE(): UseChatSSEReturn {
  const abortControllerRef = useRef<AbortController | null>(null);
  const {
    messages,
    agentStatus,
    error,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
  } = useChatStore();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Clean up any existing connection before starting a new one
    const oldCleanup = useChatStore.getState().cleanupRef;
    if (oldCleanup) {
      console.log('[useChatSSE] Cleaning up previous connection');
      oldCleanup();
      setCleanup(null);
    }

    // Get session ID from store (may be undefined for new conversations)
    const sessionId = useChatStore.getState().currentSessionId;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      sessionId: sessionId || undefined,
    };
    addMessage(userMessage);

    // Start streaming
    setIsStreaming(true);
    setError(null);
    setAgentStatus('thinking');

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const cleanup = await chatApi.streamMessage(
        text,
        messages,
        abortController.signal,
        {
          // Event: message_start
          onMessageStart: (messageId: string, sessionId?: string) => {
            console.log('[useChatSSE] message_start:', { messageId, sessionId });

            // If sessionId is provided and we don't have one, store it
            if (sessionId && !useChatStore.getState().currentSessionId) {
              useChatStore.getState().setCurrentSession(sessionId);
            }

            // Create assistant message placeholder with backend-provided messageId
            const assistantMessage: ChatMessage = {
              id: messageId,
              role: 'assistant',
              content: '',
              timestamp: Date.now(),
              toolCalls: [],
              sessionId: sessionId || undefined,
            };
            addMessage(assistantMessage);
            setCurrentMessageId(messageId);
          },

          // Event: status_change
          onStatus: (status: 'idle' | 'thinking' | 'tool_calling' | 'writing', context?: string) => {
            console.log('[useChatSSE] status_change:', status, context);
            setAgentStatus(status);
          },

          // Event: content_delta
          onTextDelta: (delta: string) => {
            console.log('[useChatSSE] content_delta, length:', delta.length);
            appendToLastMessage(delta);
          },

          // Event: tool_start
          onToolCallStart: (toolCall: ToolCall) => {
            console.log('[useChatSSE] tool_start:', toolCall.name);

            // Add tool call to the last message
            const currentMessages = useChatStore.getState().messages;
            const lastMsg = currentMessages[currentMessages.length - 1];

            updateLastMessage({
              toolCalls: [...(lastMsg?.toolCalls || []), toolCall],
            });
          },

          // Event: tool_complete
          onToolResult: (result: ToolResult) => {
            console.log('[useChatSSE] tool_complete:', result.toolCallId, 'duration:', result.durationMs);

            // Update tool call status in store (timing is already calculated by backend)
            const currentMessages = useChatStore.getState().messages;
            const lastMsg = currentMessages[currentMessages.length - 1];

            if (lastMsg?.toolCalls) {
              const updatedToolCalls = lastMsg.toolCalls.map((tc) =>
                tc.id === result.toolCallId
                  ? {
                      ...tc,
                      result: result.output,
                      isError: result.isError,
                      endTime: result.endTime,
                      durationMs: result.durationMs,
                    }
                  : tc
              );
              updateLastMessage({ toolCalls: updatedToolCalls });
            }
          },

          // Event: usage_complete
          onUsage: (usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number }) => {
            console.log('[useChatSSE] usage_complete:', usage);
            updateTokenUsage(usage);
          },

          // Event: message_complete
          onMessageDone: () => {
            console.log('[useChatSSE] message_complete');
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },

          // Event: error_occurred
          onError: (errorMsg: string) => {
            console.error('[useChatSSE] error_occurred:', errorMsg);
            setError(errorMsg);
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },
        },
        sessionId || undefined
      );

      setCleanup(cleanup);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [
    messages,
    isStreaming,
    addMessage,
    appendToLastMessage,
    updateLastMessage,
    setAgentStatus,
    setError,
    setIsStreaming,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
  ]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
      setAgentStatus('idle');
      setCurrentMessageId(null);
    }
  }, [setIsStreaming, setAgentStatus, setCurrentMessageId]);

  return {
    sendMessage,
    abort,
    status: agentStatus,
    error,
  };
}
