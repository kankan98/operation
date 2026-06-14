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
 * Handles 9 SSE event types: message_start, status, text_delta,
 * tool_call_start, tool_call_end, tool_result, usage, message_done, error
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
    updateToolCardState,
    setCurrentMessageId,
    updateTokenUsage,
    setCleanup,
  } = useChatStore();

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    // Create user message
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    // Initialize assistant message
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      toolCalls: [],
    };
    addMessage(assistantMessage);
    setCurrentMessageId(assistantMessage.id);

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
          onMessageStart: (messageId: string) => {
            setCurrentMessageId(messageId);
          },

          // Event: status
          onStatus: (status: 'thinking' | 'tool_calling' | 'writing') => {
            setAgentStatus(status);
          },

          // Event: text_delta
          onTextDelta: (delta: string) => {
            appendToLastMessage(delta);
          },

          // Event: tool_call_start
          onToolCallStart: (toolCall: ToolCall) => {
            updateLastMessage({
              toolCalls: [...(messages[messages.length - 1]?.toolCalls || []), toolCall],
            });
            updateToolCardState(toolCall.id, {
              id: toolCall.id,
              status: 'running',
              startTime: Date.now(),
            });
          },

          // Event: tool_call_end
          onToolCallEnd: (toolCallId: string, params: unknown) => {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.toolCalls) {
              const updatedToolCalls = lastMsg.toolCalls.map((tc) =>
                tc.id === toolCallId ? { ...tc, input: params as Record<string, any> } : tc
              );
              updateLastMessage({ toolCalls: updatedToolCalls });
            }
          },

          // Event: tool_result
          onToolResult: (result: ToolResult) => {
            updateToolCardState(result.toolCallId, {
              id: result.toolCallId,
              status: result.isError ? 'error' : 'success',
              endTime: Date.now(),
            });
          },

          // Event: usage
          onUsage: (usage: { inputTokens: number; outputTokens: number; cacheReadTokens?: number }) => {
            updateTokenUsage(usage);
          },

          // Event: message_done
          onMessageDone: () => {
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },

          // Event: error
          onError: (errorMsg: string) => {
            setError(errorMsg);
            setIsStreaming(false);
            setAgentStatus('idle');
            setCurrentMessageId(null);
            abortControllerRef.current = null;
          },
        }
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
    updateToolCardState,
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
